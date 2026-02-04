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
    // 与老项目保持一致：线圈使用 registerAddress，保持寄存器使用 offsetValue
    QVariantList rawValues;
    if (signal.registerType == "1") {
        // 线圈 - 使用 registerAddress
        rawValues = m_modbusManager->readCoils(signal.registerAddress, signal.registerCount);
    } else {
        // 保持寄存器（默认）- 使用 offsetValue 作为地址
        rawValues = m_modbusManager->readHoldingRegisters(signal.offsetValue, signal.registerCount);
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
        // 读取所有活跃信号，不再限制 signalType
        // write 类型信号虽然用于下发指令，但其当前值也需要在 UI 上显示
        if (signal.isActive) {
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
        // 线圈 - 使用 registerAddress
        return m_modbusManager->writeCoils(signal.registerAddress, rawValues);
    }
    // 保持寄存器 - 使用 offsetValue
    return m_modbusManager->writeRegisters(signal.offsetValue, rawValues);
}

QVariant SignalManager::convertFromRaw(const ModbusSignal &signal, const QVariantList &rawValues)
{
    if (rawValues.isEmpty()) {
        return QVariant();
    }

    QString dataType = signal.dataType.toLower();
    int registerCount = signal.registerCount;

    // 位类型
    if (dataType == "bit") {
        return rawValues.first().toBool();
    }

    // 与老项目保持一致：优先根据 registerCount 决定处理方式
    // registerCount == 1: 单寄存器（word/uint16）
    // registerCount == 2: 双寄存器（float）
    // registerCount == 4: 四寄存器（double）

    if (registerCount == 1) {
        // 单寄存器：16位数据
        int raw = rawValues.first().toInt() & 0xFFFF;  // 转为无符号
        if (signal.scaleFactor > 0) {
            // scaleFactor 表示小数位数，例如 scaleFactor=3 表示除以 1000
            double value = raw / std::pow(10, signal.scaleFactor);
            return value;
        }
        return raw;
    }

    if (registerCount == 2 && rawValues.size() >= 2) {
        // 双寄存器：32位浮点数
        // 与老项目保持一致：shortData[1] << 16 | shortData[0]
        quint16 low = static_cast<quint16>(rawValues[0].toUInt());
        quint16 high = static_cast<quint16>(rawValues[1].toUInt());
        quint32 combined = (static_cast<quint32>(high) << 16) | low;
        float floatVal;
        memcpy(&floatVal, &combined, sizeof(float));
        return static_cast<double>(floatVal);
    }

    if (registerCount == 4 && rawValues.size() >= 4) {
        // 四寄存器：64位数据
        if (dataType == "double") {
            qint64 longBits = (static_cast<qint64>(rawValues[0].toInt()) << 48) |
                             (static_cast<qint64>(rawValues[1].toUInt() & 0xFFFF) << 32) |
                             (static_cast<qint64>(rawValues[2].toUInt() & 0xFFFF) << 16) |
                             (rawValues[3].toUInt() & 0xFFFF);
            double doubleVal;
            memcpy(&doubleVal, &longBits, sizeof(double));
            return doubleVal;
        }
        // 64位长整数
        return (static_cast<qint64>(rawValues[0].toInt()) << 48) |
               (static_cast<qint64>(rawValues[1].toUInt() & 0xFFFF) << 32) |
               (static_cast<qint64>(rawValues[2].toUInt() & 0xFFFF) << 16) |
               (rawValues[3].toUInt() & 0xFFFF);
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
    // 与读取逻辑保持一致：scaleFactor 表示小数位数
    // 写入时需要乘以 10^scaleFactor 还原为原始值
    if (dataType == "word" || dataType == "uint16") {
        double val = value.toDouble();
        int raw;
        if (signal.scaleFactor > 0) {
            raw = static_cast<int>(val * std::pow(10, signal.scaleFactor));
        } else {
            raw = static_cast<int>(val);
        }
        result.append(raw);
        return result;
    }

    // 32位浮点数 - Little Endian word order（低位字在前）
    // 与读取保持一致：result[0] 是低位字，result[1] 是高位字
    if (dataType == "float") {
        float floatVal = static_cast<float>(value.toDouble());
        quint32 combined;
        memcpy(&combined, &floatVal, sizeof(float));
        result.append(static_cast<int>(combined & 0xFFFF));  // 低位字先添加
        result.append(static_cast<int>(combined >> 16));     // 高位字后添加
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
