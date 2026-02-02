#include "ModbusManager.h"
#include <QModbusDataUnit>
#include <QCoreApplication>

/**
 * @file ModbusManager.cpp
 * @brief Modbus TCP 通信管理器实现
 */

ModbusManager::ModbusManager(QObject *parent)
    : QObject(parent)
    , m_modbusClient(new QModbusTcpClient(this))
    , m_slaveId(1)
    , m_port(502)
    , m_reconnectTimer(new QTimer(this))
    , m_autoReconnect(false)
    , m_reconnectInterval(5000)
    , m_reconnectAttempts(0)
{
    // 连接状态变化信号
    connect(m_modbusClient, &QModbusClient::stateChanged,
            this, &ModbusManager::onStateChanged);

    // 连接错误信号
    connect(m_modbusClient, &QModbusClient::errorOccurred,
            this, &ModbusManager::onErrorOccurred);

    // 重连定时器
    connect(m_reconnectTimer, &QTimer::timeout,
            this, &ModbusManager::tryReconnect);
}

ModbusManager::~ModbusManager()
{
    disconnect();
}

bool ModbusManager::connectToDevice(const QString &host, int port, int slaveId)
{
    // 保存连接参数（用于重连）
    m_host = host;
    m_port = port;
    m_slaveId = slaveId;
    m_reconnectAttempts = 0;

    // 设置连接参数
    m_modbusClient->setConnectionParameter(
        QModbusDevice::NetworkAddressParameter, host);
    m_modbusClient->setConnectionParameter(
        QModbusDevice::NetworkPortParameter, port);
    m_modbusClient->setTimeout(3000);
    m_modbusClient->setNumberOfRetries(3);

    return m_modbusClient->connectDevice();
}

void ModbusManager::setAutoReconnect(bool enabled, int intervalMs)
{
    m_autoReconnect = enabled;
    m_reconnectInterval = intervalMs;

    if (!enabled && m_reconnectTimer->isActive()) {
        m_reconnectTimer->stop();
    }
}

void ModbusManager::disconnect()
{
    if (m_modbusClient->state() != QModbusDevice::UnconnectedState) {
        m_modbusClient->disconnectDevice();
    }
}

bool ModbusManager::isConnected() const
{
    return m_modbusClient->state() == QModbusDevice::ConnectedState;
}

QVariantList ModbusManager::readHoldingRegisters(int address, int count)
{
    return readRegisters(QModbusDataUnit::HoldingRegisters, address, count);
}

QVariantList ModbusManager::readInputRegisters(int address, int count)
{
    return readRegisters(QModbusDataUnit::InputRegisters, address, count);
}

QVariantList ModbusManager::readCoils(int address, int count)
{
    return readRegisters(QModbusDataUnit::Coils, address, count);
}

QVariantList ModbusManager::readDiscreteInputs(int address, int count)
{
    return readRegisters(QModbusDataUnit::DiscreteInputs, address, count);
}

QVariantList ModbusManager::readRegisters(QModbusDataUnit::RegisterType type, int address, int count)
{
    QVariantList result;
    if (!isConnected()) {
        m_lastError = QStringLiteral("未连接到设备");
        return result;
    }

    QModbusDataUnit readUnit(type, address, count);
    if (auto *reply = m_modbusClient->sendReadRequest(readUnit, m_slaveId)) {
        while (!reply->isFinished()) {
            QCoreApplication::processEvents();
        }
        if (reply->error() == QModbusDevice::NoError) {
            const QModbusDataUnit unit = reply->result();
            for (quint32 i = 0; i < unit.valueCount(); i++) {
                result.append(unit.value(i));
            }
        } else {
            m_lastError = reply->errorString();
        }
        reply->deleteLater();
    }
    return result;
}

bool ModbusManager::writeRegisters(int address, const QVariantList &values)
{
    if (!isConnected()) {
        m_lastError = QStringLiteral("未连接到设备");
        return false;
    }

    QVector<quint16> data;
    for (const QVariant &v : values) {
        data.append(static_cast<quint16>(v.toUInt()));
    }

    QModbusDataUnit writeUnit(QModbusDataUnit::HoldingRegisters, address, data);
    if (auto *reply = m_modbusClient->sendWriteRequest(writeUnit, m_slaveId)) {
        while (!reply->isFinished()) {
            QCoreApplication::processEvents();
        }
        bool success = reply->error() == QModbusDevice::NoError;
        if (!success) {
            m_lastError = reply->errorString();
        }
        reply->deleteLater();
        return success;
    }
    return false;
}

bool ModbusManager::writeCoil(int address, bool value)
{
    if (!isConnected()) {
        m_lastError = QStringLiteral("未连接到设备");
        return false;
    }

    QModbusDataUnit writeUnit(QModbusDataUnit::Coils, address, 1);
    writeUnit.setValue(0, value ? 1 : 0);

    if (auto *reply = m_modbusClient->sendWriteRequest(writeUnit, m_slaveId)) {
        while (!reply->isFinished()) {
            QCoreApplication::processEvents();
        }
        bool success = reply->error() == QModbusDevice::NoError;
        if (!success) {
            m_lastError = reply->errorString();
        }
        reply->deleteLater();
        return success;
    }
    return false;
}

bool ModbusManager::writeCoils(int address, const QVariantList &values)
{
    if (!isConnected()) {
        m_lastError = QStringLiteral("未连接到设备");
        return false;
    }

    QVector<quint16> data;
    for (const QVariant &v : values) {
        data.append(v.toBool() ? 1 : 0);
    }

    QModbusDataUnit writeUnit(QModbusDataUnit::Coils, address, data);
    if (auto *reply = m_modbusClient->sendWriteRequest(writeUnit, m_slaveId)) {
        while (!reply->isFinished()) {
            QCoreApplication::processEvents();
        }
        bool success = reply->error() == QModbusDevice::NoError;
        if (!success) {
            m_lastError = reply->errorString();
        }
        reply->deleteLater();
        return success;
    }
    return false;
}

void ModbusManager::onStateChanged(QModbusDevice::State state)
{
    bool connected = (state == QModbusDevice::ConnectedState);
    emit connectionChanged(connected);

    if (connected) {
        // 连接成功，停止重连定时器
        m_reconnectTimer->stop();
        m_reconnectAttempts = 0;
    } else if (state == QModbusDevice::UnconnectedState && m_autoReconnect) {
        // 断开连接且启用自动重连
        if (!m_reconnectTimer->isActive()) {
            m_reconnectTimer->start(m_reconnectInterval);
        }
    }
}

void ModbusManager::onErrorOccurred(QModbusDevice::Error error)
{
    if (error != QModbusDevice::NoError) {
        m_lastError = m_modbusClient->errorString();
        emit errorOccurred(m_lastError);
    }
}

void ModbusManager::tryReconnect()
{
    if (isConnected()) {
        m_reconnectTimer->stop();
        return;
    }

    m_reconnectAttempts++;
    emit reconnectAttempt(m_reconnectAttempts);

    // 尝试重新连接
    connectToDevice(m_host, m_port, m_slaveId);
}
