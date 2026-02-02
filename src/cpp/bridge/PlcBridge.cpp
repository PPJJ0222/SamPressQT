#include "PlcBridge.h"
#include "../modbus/ModbusManager.h"
#include "../modbus/SignalManager.h"
#include "../config/ConfigManager.h"

/**
 * @file PlcBridge.cpp
 * @brief PLC WebChannel 桥接类实现
 */

PlcBridge::PlcBridge(ModbusManager *modbusManager,
                     SignalManager *signalManager,
                     ConfigManager *configManager,
                     QObject *parent)
    : QObject(parent)
    , m_modbusManager(modbusManager)
    , m_signalManager(signalManager)
    , m_configManager(configManager)
    , m_pollTimer(new QTimer(this))
    , m_isPolling(false)
{
    // 连接状态变化
    connect(m_modbusManager, &ModbusManager::connectionChanged,
            this, &PlcBridge::connectionChanged);

    // 信号配置加载完成
    connect(m_signalManager, &SignalManager::signalsLoaded,
            this, &PlcBridge::onSignalsLoaded);

    // 配置同步完成
    connect(m_configManager, &ConfigManager::syncCompleted,
            this, &PlcBridge::onSyncCompleted);

    // 轮询定时器
    connect(m_pollTimer, &QTimer::timeout,
            this, &PlcBridge::onPollTimer);
}

bool PlcBridge::isConnected() const
{
    return m_modbusManager ? m_modbusManager->isConnected() : false;
}

QVariantList PlcBridge::readData(int address, int count)
{
    return m_modbusManager->readHoldingRegisters(address, count);
}

bool PlcBridge::writeData(int address, const QVariantList &values)
{
    return m_modbusManager->writeRegisters(address, values);
}

QVariantList PlcBridge::getSignals()
{
    QVariantList result;
    for (const ModbusSignal &signal : m_signalManager->allSignals()) {
        QVariantMap map;
        map["id"] = signal.id;
        map["signalCode"] = signal.signalCode;
        map["signalName"] = signal.signalName;
        map["signalType"] = signal.signalType;
        map["dataType"] = signal.dataType;
        map["unit"] = signal.unit;
        map["paramGroup"] = signal.paramGroup;
        map["isActive"] = signal.isActive;
        result.append(map);
    }
    return result;
}

void PlcBridge::refreshSignals()
{
    m_configManager->syncNow();
}

QVariant PlcBridge::readBySignalCode(const QString &signalCode)
{
    return m_signalManager->readSignalValue(signalCode);
}

bool PlcBridge::writeBySignalCode(const QString &signalCode, const QVariant &value)
{
    return m_signalManager->writeSignalValue(signalCode, value);
}

QVariantMap PlcBridge::batchRead(const QStringList &signalCodes)
{
    return m_signalManager->readSignalValues(signalCodes);
}

QVariantMap PlcBridge::getDeviceConfig()
{
    if (!m_configManager) {
        return QVariantMap();
    }
    return m_configManager->deviceConfig().toVariantMap();
}

void PlcBridge::startPolling(int intervalMs)
{
    if (!m_isPolling) {
        m_isPolling = true;
        m_pollTimer->start(intervalMs);
        emit pollingChanged(true);
    }
}

void PlcBridge::stopPolling()
{
    if (m_isPolling) {
        m_isPolling = false;
        m_pollTimer->stop();
        emit pollingChanged(false);
    }
}

void PlcBridge::onPollTimer()
{
    if (!m_modbusManager->isConnected()) {
        return;
    }

    QVariantMap values = m_signalManager->readAllActiveSignals();

    // 检测变化，仅在有变化时发射信号
    if (values != m_lastValues) {
        m_lastValues = values;
        emit signalValuesChanged(values);
    }
}

void PlcBridge::onSignalsLoaded(int count)
{
    emit signalsConfigChanged(count);
}

void PlcBridge::onSyncCompleted(bool success, int count)
{
    if (success) {
        emit signalsConfigChanged(count);
    }
}

void PlcBridge::initWithToken(const QString &token)
{
    m_configManager->setAuthToken(token);
    m_configManager->fetchDeviceConfig(m_configManager->erpBaseUrl());
}
