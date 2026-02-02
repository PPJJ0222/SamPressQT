#include "SignalManager.h"
#include "ModbusManager.h"
#include "PlcAddressMapper.h"
#include <QtEndian>
#include <cmath>

/**
 * @file SignalManager.cpp
 * @brief 信号管理器实现
 */

SignalManager::SignalManager(ModbusManager *modbusManager,
                             PlcAddressMapper *addressMapper,
                             QObject *parent)
    : QObject(parent)
    , m_modbusManager(modbusManager)
    , m_addressMapper(addressMapper)
{
}

void SignalManager::loadSignals(const QList<ModbusSignal> &signalList)
{
    m_signals.clear();
    for (const ModbusSignal &signal : signalList) {
        if (!signal.signalCode.isEmpty()) {
            m_signals[signal.signalCode] = signal;
        }
    }
    emit signalsLoaded(m_signals.size());
}

void SignalManager::loadSignalsFromJson(const QVariantList &jsonArray)
{
    QList<ModbusSignal> signalList;
    for (const QVariant &item : jsonArray) {
        QVariantMap map = item.toMap();
        ModbusSignal signal;
        signal.id = map.value("id").toLongLong();
        signal.deviceId = map.value("deviceId").toLongLong();
        signal.signalCode = map.value("signalCode").toString();
        signal.signalName = map.value("signalName").toString();
        signal.signalType = map.value("signalType").toString();
        signal.registerType = map.value("registerType").toString();
        signal.registerAddress = map.value("registerAddress").toInt();
        signal.dataType = map.value("dataType").toString();
        signal.registerCount = map.value("registerCount", 1).toInt();
        signal.scaleFactor = map.value("scaleFactor", 1).toInt();
        signal.offsetValue = map.value("offsetValue", 0).toInt();
        signal.unit = map.value("unit").toString();
        signal.plcAreaType = map.value("plcAreaType").toString();
        signal.paramGroup = map.value("paramGroup").toString();
        signal.isActive = map.value("isActive", true).toBool();
        signalList.append(signal);
    }
    loadSignals(signalList);
}

ModbusSignal SignalManager::getSignal(const QString &signalCode) const
{
    return m_signals.value(signalCode);
}

QList<ModbusSignal> SignalManager::getSignalsByGroup(const QString &paramGroup) const
{
    QList<ModbusSignal> result;
    for (const ModbusSignal &signal : m_signals) {
        if (signal.paramGroup == paramGroup) {
            result.append(signal);
        }
    }
    return result;
}

void SignalManager::clearSignals()
{
    m_signals.clear();
}

QVariant SignalManager::readSignalValue(const QString &signalCode)
{
    if (!m_signals.contains(signalCode)) {
        emit errorOccurred(QStringLiteral("信号不存在: %1").arg(signalCode));
        return QVariant();
    }

    const ModbusSignal &signal = m_signals[signalCode];
    if (!signal.isActive) {
        return QVariant();
    }

    // 根据寄存器类型选择读取方法
    QVariantList rawValues;
    if (signal.registerType == "1") {
        // 线圈
        rawValues = m_modbusManager->readCoils(signal.registerAddress, signal.registerCount);
    } else {
        // 保持寄存器（默认）
        rawValues = m_modbusManager->readHoldingRegisters(signal.registerAddress, signal.registerCount);
    }

    if (rawValues.isEmpty()) {
        return QVariant();
    }

    return convertFromRaw(signal, rawValues);
}

QVariantMap SignalManager::readSignalValues(const QStringList &signalCodes)
{
    QVariantMap result;
    for (const QString &code : signalCodes) {
        QVariant value = readSignalValue(code);
        if (value.isValid()) {
            result[code] = value;
        }
    }
    return result;
}

QVariantMap SignalManager::readAllActiveSignals()
{
    QList<ModbusSignal> activeSignals;
    for (const ModbusSignal &signal : m_signals) {
        if (signal.isActive && signal.signalType == "read") {
            activeSignals.append(signal);
        }
    }
    return optimizedBatchRead(activeSignals);
}

bool SignalManager::writeSignalValue(const QString &signalCode, const QVariant &value)
{
    if (!m_signals.contains(signalCode)) {
        emit errorOccurred(QStringLiteral("信号不存在: %1").arg(signalCode));
        return false;
    }

    const ModbusSignal &signal = m_signals[signalCode];
    if (signal.signalType != "write") {
        emit errorOccurred(QStringLiteral("信号不可写: %1").arg(signalCode));
        return false;
    }

    QVariantList rawValues = convertToRaw(signal, value);
    if (rawValues.isEmpty()) {
        return false;
    }

    if (signal.registerType == "1") {
        return m_modbusManager->writeCoils(signal.registerAddress, rawValues);
    }
    return m_modbusManager->writeRegisters(signal.registerAddress, rawValues);
}

QVariant SignalManager::convertFromRaw(const ModbusSignal &signal, const QVariantList &rawValues)
{
    if (rawValues.isEmpty()) {
        return QVariant();
    }

    QString dataType = signal.dataType.toLower();

    // 位类型
    if (dataType == "bit") {
        return rawValues.first().toBool();
    }

    // 16位无符号整数
    if (dataType == "word" || dataType == "uint16") {
        int raw = rawValues.first().toInt();
        double value = (raw * signal.scaleFactor) + signal.offsetValue;
        return value;
    }

    // 32位浮点数（2个寄存器）
    if (dataType == "float" && rawValues.size() >= 2) {
        quint16 high = static_cast<quint16>(rawValues[0].toUInt());
        quint16 low = static_cast<quint16>(rawValues[1].toUInt());
        quint32 combined = (static_cast<quint32>(high) << 16) | low;
        float floatVal;
        memcpy(&floatVal, &combined, sizeof(float));
        return static_cast<double>(floatVal);
    }

    // 32位整数（2个寄存器）
    if (dataType == "int32" && rawValues.size() >= 2) {
        quint16 high = static_cast<quint16>(rawValues[0].toUInt());
        quint16 low = static_cast<quint16>(rawValues[1].toUInt());
        qint32 value = static_cast<qint32>((static_cast<quint32>(high) << 16) | low);
        return value;
    }

    // 默认返回第一个值
    return rawValues.first();
}

QVariantList SignalManager::convertToRaw(const ModbusSignal &signal, const QVariant &value)
{
    QVariantList result;
    QString dataType = signal.dataType.toLower();

    // 位类型
    if (dataType == "bit") {
        result.append(value.toBool() ? 1 : 0);
        return result;
    }

    // 16位无符号整数
    if (dataType == "word" || dataType == "uint16") {
        double val = value.toDouble();
        int raw = static_cast<int>((val - signal.offsetValue) / signal.scaleFactor);
        result.append(raw);
        return result;
    }

    // 32位浮点数
    if (dataType == "float") {
        float floatVal = static_cast<float>(value.toDouble());
        quint32 combined;
        memcpy(&combined, &floatVal, sizeof(float));
        result.append(static_cast<int>(combined >> 16));
        result.append(static_cast<int>(combined & 0xFFFF));
        return result;
    }

    // 默认作为整数处理
    result.append(value.toInt());
    return result;
}

QVariantMap SignalManager::optimizedBatchRead(const QList<ModbusSignal> &signalList)
{
    QVariantMap result;

    // 简单实现：逐个读取
    // TODO: 优化为按连续地址分组批量读取
    for (const ModbusSignal &signal : signalList) {
        QVariant value = readSignalValue(signal.signalCode);
        if (value.isValid()) {
            result[signal.signalCode] = value;
        }
    }

    return result;
}
