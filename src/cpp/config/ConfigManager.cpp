#include "ConfigManager.h"
#include "../modbus/SignalManager.h"
#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonArray>
#include <QJsonObject>
#include <QStandardPaths>
#include <QDir>
#include <QFile>

/**
 * @file ConfigManager.cpp
 * @brief 配置管理器实现
 */

ConfigManager::ConfigManager(SignalManager *signalManager, QObject *parent)
    : QObject(parent)
    , m_signalManager(signalManager)
    , m_networkManager(new QNetworkAccessManager(this))
    , m_syncTimer(new QTimer(this))
    , m_deviceId(0)
    , m_syncInterval(30000)
    , m_cacheInitialized(false)
    , m_deviceConfigLoaded(false)
{
    connect(m_syncTimer, &QTimer::timeout,
            this, &ConfigManager::onSyncTimerTimeout);
}

void ConfigManager::initialize(const QString &erpBaseUrl, qint64 deviceId)
{
    m_erpBaseUrl = erpBaseUrl;
    m_deviceId = deviceId;

    // 首先尝试从本地缓存加载
    loadFromCache();
}

void ConfigManager::setSyncInterval(int intervalMs)
{
    m_syncInterval = intervalMs;
    if (m_syncTimer->isActive()) {
        m_syncTimer->setInterval(intervalMs);
    }
}

void ConfigManager::startSync()
{
    if (!m_syncTimer->isActive()) {
        m_syncTimer->start(m_syncInterval);
    }
}

void ConfigManager::stopSync()
{
    m_syncTimer->stop();
}

void ConfigManager::syncNow()
{
    fetchSignalsFromErp();
}

QString ConfigManager::cacheFilePath() const
{
    QString dataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir dir(dataPath);
    if (!dir.exists()) {
        dir.mkpath(".");
    }
    return dataPath + "/signals_cache.json";
}

bool ConfigManager::loadFromCache()
{
    QFile file(cacheFilePath());
    if (!file.exists()) {
        return false;
    }

    if (!file.open(QIODevice::ReadOnly)) {
        emit errorOccurred(QStringLiteral("无法打开缓存文件"));
        return false;
    }

    QByteArray data = file.readAll();
    file.close();

    QJsonDocument doc = QJsonDocument::fromJson(data);
    if (doc.isNull() || !doc.isArray()) {
        emit errorOccurred(QStringLiteral("缓存文件格式错误"));
        return false;
    }

    QVariantList signalsData = doc.array().toVariantList();
    if (!m_signalManager) {
        emit errorOccurred(QStringLiteral("SignalManager 未初始化"));
        return false;
    }
    m_signalManager->loadSignalsFromJson(signalsData);
    m_cacheInitialized = true;

    emit cacheLoaded(true, signalsData.size());
    return true;
}

bool ConfigManager::saveToCache(const QVariantList &signalsData)
{
    QFile file(cacheFilePath());
    if (!file.open(QIODevice::WriteOnly)) {
        emit errorOccurred(QStringLiteral("无法写入缓存文件"));
        return false;
    }

    QJsonDocument doc(QJsonArray::fromVariantList(signalsData));
    file.write(doc.toJson());
    file.close();

    return true;
}

void ConfigManager::onSyncTimerTimeout()
{
    fetchSignalsFromErp();
}

void ConfigManager::fetchSignalsFromErp()
{
    if (m_erpBaseUrl.isEmpty() || m_deviceId == 0) {
        emit errorOccurred(QStringLiteral("ERP 配置未初始化"));
        return;
    }

    QString url = QString("%1/modbus/signals/byDeviceId/%2")
                      .arg(m_erpBaseUrl)
                      .arg(m_deviceId);

    QNetworkRequest request(url);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    request.setTransferTimeout(10000);  // 10 秒超时

    // 添加认证 Token
    if (!m_authToken.isEmpty()) {
        request.setRawHeader("Authorization", QString("Bearer %1").arg(m_authToken).toUtf8());
    }

    QNetworkReply *reply = m_networkManager->get(request);
    connect(reply, &QNetworkReply::finished, this, &ConfigManager::onNetworkReply);
}

void ConfigManager::onNetworkReply()
{
    QNetworkReply *reply = qobject_cast<QNetworkReply*>(sender());
    if (!reply) {
        return;
    }

    reply->deleteLater();

    if (reply->error() != QNetworkReply::NoError) {
        emit errorOccurred(QStringLiteral("网络请求失败: %1").arg(reply->errorString()));
        emit syncCompleted(false, 0);
        return;
    }

    QByteArray data = reply->readAll();
    QJsonDocument doc = QJsonDocument::fromJson(data);

    if (doc.isNull()) {
        emit errorOccurred(QStringLiteral("响应数据格式错误"));
        emit syncCompleted(false, 0);
        return;
    }

    // 解析响应数据
    QVariantList signalsData;
    if (doc.isArray()) {
        signalsData = doc.array().toVariantList();
    } else if (doc.isObject()) {
        QVariantMap obj = doc.object().toVariantMap();
        signalsData = obj.value("data").toList();
    }

    // 保存到本地缓存
    saveToCache(signalsData);

    // 加载到信号管理器
    if (m_signalManager) {
        m_signalManager->loadSignalsFromJson(signalsData);
    }
    m_cacheInitialized = true;

    emit syncCompleted(true, signalsData.size());
}

void ConfigManager::fetchDeviceConfig(const QString &erpBaseUrl)
{
    m_erpBaseUrl = erpBaseUrl;
    m_deviceConfigLoaded = false;

    QString url = QString("%1/modbus/device/getPressJobByHandleIp")
                      .arg(erpBaseUrl);

    QNetworkRequest request(url);
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");
    request.setTransferTimeout(10000);  // 10 秒超时

    // 添加认证 Token
    if (!m_authToken.isEmpty()) {
        request.setRawHeader("Authorization", QString("Bearer %1").arg(m_authToken).toUtf8());
    }

    QNetworkReply *reply = m_networkManager->get(request);
    connect(reply, &QNetworkReply::finished,
            this, &ConfigManager::onDeviceConfigReply);
}

void ConfigManager::onDeviceConfigReply()
{
    QNetworkReply *reply = qobject_cast<QNetworkReply*>(sender());
    if (!reply) {
        return;
    }

    reply->deleteLater();

    if (reply->error() != QNetworkReply::NoError) {
        QString error = QStringLiteral("获取设备配置失败: %1").arg(reply->errorString());
        emit deviceConfigFailed(error);
        emit errorOccurred(error);
        return;
    }

    QByteArray data = reply->readAll();
    QJsonDocument doc = QJsonDocument::fromJson(data);

    if (doc.isNull() || !doc.isObject()) {
        QString error = QStringLiteral("设备配置响应格式错误");
        emit deviceConfigFailed(error);
        emit errorOccurred(error);
        return;
    }

    QVariantMap responseObj = doc.object().toVariantMap();
    QVariantMap configData;

    // 支持多种响应格式: 直接对象、{ data: {...} } 或 { data: [{...}] }
    if (responseObj.contains("data")) {
        QVariant dataValue = responseObj.value("data");

        // 检查 data 是数组还是对象
        if (dataValue.typeId() == QMetaType::QVariantList) {
            // data 是数组，取第一个元素
            QVariantList dataList = dataValue.toList();
            if (!dataList.isEmpty()) {
                configData = dataList.first().toMap();
            }
        } else {
            // data 是对象
            configData = dataValue.toMap();
        }
    } else {
        configData = responseObj;
    }

    // 从 modbusEntity 中提取设备配置
    QVariantMap modbusConfig;
    if (configData.contains("modbusEntity")) {
        modbusConfig = configData.value("modbusEntity").toMap();
    } else {
        modbusConfig = configData;
    }

    m_deviceConfig = DeviceConfig::fromJson(modbusConfig);
    m_deviceId = m_deviceConfig.deviceId;

    if (!m_deviceConfig.isValid()) {
        QString error = QStringLiteral("设备配置无效或设备已停用");
        emit deviceConfigFailed(error);
        emit errorOccurred(error);
        return;
    }

    m_deviceConfigLoaded = true;
    emit deviceConfigLoaded(m_deviceConfig);
}
