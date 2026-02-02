#include "PlcAddressMapper.h"

/**
 * @file PlcAddressMapper.cpp
 * @brief PLC 地址映射器实现
 */

PlcAddressMapper::PlcAddressMapper(QObject *parent)
    : QObject(parent)
    , m_processorType(Unknown)
{
}

void PlcAddressMapper::setProcessorType(ProcessorType type)
{
    if (m_processorType == type) {
        return;
    }

    m_processorType = type;
    m_addressMap.clear();

    // 根据处理器类型初始化地址映射
    switch (type) {
    case Omron:
        initOmronMapping();
        break;
    case Siemens:
        initSiemensMapping();
        break;
    case Mitsubishi:
        initMitsubishiMapping();
        break;
    default:
        break;
    }
}

void PlcAddressMapper::setProcessorTypeFromString(const QString &typeStr)
{
    QString lower = typeStr.toLower().trimmed();
    if (lower == "omron" || lower == "cj") {
        setProcessorType(Omron);
    } else if (lower == "siemens" || lower == "s7") {
        setProcessorType(Siemens);
    } else if (lower == "mitsubishi" || lower == "q") {
        setProcessorType(Mitsubishi);
    } else {
        setProcessorType(Unknown);
    }
}

QString PlcAddressMapper::processorTypeString() const
{
    switch (m_processorType) {
    case Omron:
        return QStringLiteral("omron");
    case Siemens:
        return QStringLiteral("siemens");
    case Mitsubishi:
        return QStringLiteral("mitsubishi");
    default:
        return QStringLiteral("unknown");
    }
}

int PlcAddressMapper::plcToModbusAddress(const QString &areaType, int plcAddress)
{
    PlcAreaType area = parseAreaType(areaType);
    if (area == AreaUnknown || !m_addressMap.contains(area)) {
        return -1;
    }

    const AddressRange &range = m_addressMap[area];
    int modbusAddr = range.modbusStart + (plcAddress - range.plcOffset);

    // 检查是否在有效范围内
    if (modbusAddr < range.modbusStart || modbusAddr > range.modbusEnd) {
        return -1;
    }

    return modbusAddr;
}

int PlcAddressMapper::modbusToPlcAddress(int modbusAddress, QString &areaType)
{
    for (auto it = m_addressMap.constBegin(); it != m_addressMap.constEnd(); ++it) {
        const AddressRange &range = it.value();
        if (modbusAddress >= range.modbusStart && modbusAddress <= range.modbusEnd) {
            areaType = areaTypeToString(it.key());
            return range.plcOffset + (modbusAddress - range.modbusStart);
        }
    }
    areaType.clear();
    return -1;
}

bool PlcAddressMapper::getModbusAddressRange(const QString &areaType, int &startAddr, int &endAddr)
{
    PlcAreaType area = parseAreaType(areaType);
    if (area == AreaUnknown || !m_addressMap.contains(area)) {
        return false;
    }

    const AddressRange &range = m_addressMap[area];
    startAddr = range.modbusStart;
    endAddr = range.modbusEnd;
    return true;
}

PlcAddressMapper::PlcAreaType PlcAddressMapper::parseAreaType(const QString &areaTypeStr)
{
    QString upper = areaTypeStr.toUpper().trimmed();

    if (upper == "CIO") return CIO;
    if (upper == "WR") return WR;
    if (upper == "HR") return HR;
    if (upper == "AR") return AR;
    if (upper == "DM") return DM;
    if (upper == "EM") return EM;
    if (upper == "TIM") return TIM;
    if (upper == "CNT") return CNT;
    if (upper == "I") return I;
    if (upper == "Q") return Q;
    if (upper == "M") return M;
    if (upper == "DB") return DB;
    if (upper == "X") return X;
    if (upper == "Y") return Y;
    if (upper == "MR") return MR;
    if (upper == "D") return D;
    if (upper == "W") return W;

    return AreaUnknown;
}

QString PlcAddressMapper::areaTypeToString(PlcAreaType areaType)
{
    switch (areaType) {
    case CIO: return QStringLiteral("CIO");
    case WR: return QStringLiteral("WR");
    case HR: return QStringLiteral("HR");
    case AR: return QStringLiteral("AR");
    case DM: return QStringLiteral("DM");
    case EM: return QStringLiteral("EM");
    case TIM: return QStringLiteral("TIM");
    case CNT: return QStringLiteral("CNT");
    case I: return QStringLiteral("I");
    case Q: return QStringLiteral("Q");
    case M: return QStringLiteral("M");
    case DB: return QStringLiteral("DB");
    case X: return QStringLiteral("X");
    case Y: return QStringLiteral("Y");
    case MR: return QStringLiteral("MR");
    case D: return QStringLiteral("D");
    case W: return QStringLiteral("W");
    default: return QString();
    }
}

void PlcAddressMapper::initOmronMapping()
{
    // 欧姆龙 CJ 系列北辰模块地址映射
    // 基于北辰以太网通讯处理器手册
    m_addressMap[CIO] = {0, 6143, 0};       // CIO 0-6143
    m_addressMap[WR]  = {6144, 7167, 0};    // WR 0-511 -> 6144-7167
    m_addressMap[HR]  = {7168, 8191, 0};    // HR 0-511 -> 7168-8191
    m_addressMap[AR]  = {8192, 9215, 0};    // AR 0-447 -> 8192-9215
    m_addressMap[DM]  = {9216, 41983, 0};   // DM 0-32767 -> 9216-41983
    m_addressMap[EM]  = {42000, 74767, 0};  // EM 扩展区
}

void PlcAddressMapper::initSiemensMapping()
{
    // 西门子 S7 系列北辰模块地址映射
    m_addressMap[I]  = {0, 1023, 0};        // 输入 I0-I1023
    m_addressMap[Q]  = {1024, 2047, 0};     // 输出 Q0-Q1023
    m_addressMap[M]  = {2048, 4095, 0};     // 标志位 M0-M2047
    m_addressMap[DB] = {4096, 65535, 0};    // 数据块 DB
}

void PlcAddressMapper::initMitsubishiMapping()
{
    // 三菱 Q 系列北辰模块地址映射
    m_addressMap[X]  = {0, 2047, 0};        // 输入 X0-X2047
    m_addressMap[Y]  = {2048, 4095, 0};     // 输出 Y0-Y2047
    m_addressMap[MR] = {4096, 12287, 0};    // 内部继电器 M0-M8191
    m_addressMap[D]  = {12288, 45055, 0};   // 数据寄存器 D0-D32767
    m_addressMap[W]  = {45056, 53247, 0};   // 链接寄存器 W0-W8191
}
