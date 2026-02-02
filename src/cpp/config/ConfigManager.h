#ifndef CONFIGMANAGER_H
#define CONFIGMANAGER_H

#include <QObject>
#include <QTimer>
#include <QNetworkAccessManager>
#include <QVariantList>
#include "DeviceConfig.h"

/**
 * @file ConfigManager.h
 * @brief 配置管理器
 * @description 负责本地配置读写、ERP API 调用、设备配置获取、信号配置缓存同步
 */

class SignalManager;

class ConfigManager : public QObject
{
    Q_OBJECT

public:
    explicit ConfigManager(SignalManager *signalManager, QObject *parent = nullptr);

    /**
     * @brief 初始化配置管理器
     * @param erpBaseUrl ERP API 基础 URL
     * @param deviceId 设备 ID
     */
    void initialize(const QString &erpBaseUrl, qint64 deviceId);

    /**
     * @brief 获取压机设备配置
     * @param erpBaseUrl ERP API 基础 URL
     * @description 调用 /modbus/device/getPressJobByHandleIp 获取设备信息
     */
    void fetchDeviceConfig(const QString &erpBaseUrl);

    /**
     * @brief 获取当前设备配置
     * @return 设备配置对象的常量引用
     */
    const DeviceConfig& deviceConfig() const { return m_deviceConfig; }

    /**
     * @brief 检查设备配置是否已加载
     */
    bool isDeviceConfigLoaded() const { return m_deviceConfigLoaded; }

    /**
     * @brief 设置同步间隔
     * @param intervalMs 间隔毫秒数，默认 30000
     */
    void setSyncInterval(int intervalMs);

    /**
     * @brief 启动定时同步
     */
    void startSync();

    /**
     * @brief 停止定时同步
     */
    void stopSync();

    /**
     * @brief 立即同步信号配置
     */
    void syncNow();

    /**
     * @brief 从本地缓存加载配置
     */
    bool loadFromCache();

    /**
     * @brief 保存配置到本地缓存
     */
    bool saveToCache(const QVariantList &signalsData);

    /**
     * @brief 获取缓存文件路径
     */
    QString cacheFilePath() const;

    /**
     * @brief 检查缓存是否已初始化
     */
    bool isCacheInitialized() const { return m_cacheInitialized; }

    /**
     * @brief 设置认证 Token
     * @param token JWT Token
     */
    void setAuthToken(const QString &token) { m_authToken = token; }

    /**
     * @brief 获取 ERP 基础 URL
     */
    QString erpBaseUrl() const { return m_erpBaseUrl; }

    /**
     * @brief 设置 ERP 基础 URL
     */
    void setErpBaseUrl(const QString &url) { m_erpBaseUrl = url; }

signals:
    /** @brief 设备配置加载完成 */
    void deviceConfigLoaded(const DeviceConfig &config);

    /** @brief 设备配置加载失败 */
    void deviceConfigFailed(const QString &error);

    /** @brief 配置同步完成 */
    void syncCompleted(bool success, int signalCount);

    /** @brief 配置从缓存加载完成 */
    void cacheLoaded(bool success, int signalCount);

    /** @brief 错误发生 */
    void errorOccurred(const QString &error);

private slots:
    void onSyncTimerTimeout();
    void onNetworkReply();
    void onDeviceConfigReply();

private:
    void fetchSignalsFromErp();

    SignalManager *m_signalManager;
    QNetworkAccessManager *m_networkManager;
    QTimer *m_syncTimer;

    QString m_erpBaseUrl;
    QString m_authToken;
    qint64 m_deviceId;
    int m_syncInterval;
    bool m_cacheInitialized;

    DeviceConfig m_deviceConfig;
    bool m_deviceConfigLoaded;
};

#endif // CONFIGMANAGER_H
