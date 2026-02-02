#ifndef PLCADDRESSMAPPER_H
#define PLCADDRESSMAPPER_H

#include <QObject>
#include <QString>
#include <QMap>

/**
 * @file PlcAddressMapper.h
 * @brief PLC 地址映射器
 * @description 负责不同 PLC 类型（欧姆龙、西门子、三菱）的地址映射转换
 */

class PlcAddressMapper : public QObject
{
    Q_OBJECT

public:
    /**
     * @brief PLC 处理器类型枚举
     */
    enum ProcessorType {
        Unknown = 0,
        Omron,      // 欧姆龙 - BCNet-CJ
        Siemens,    // 西门子 - XCNet-PN
        Mitsubishi  // 三菱 - XCNet-MIT
    };
    Q_ENUM(ProcessorType)

    /**
     * @brief PLC 软元件区域类型
     */
    enum PlcAreaType {
        AreaUnknown = 0,
        // 欧姆龙区域
        CIO,    // CIO 区（输入输出继电器）
        WR,     // 工作继电器
        HR,     // 保持继电器
        AR,     // 辅助继电器
        DM,     // 数据存储器
        EM,     // 扩展数据存储器
        TIM,    // 定时器
        CNT,    // 计数器
        // 西门子区域
        I,      // 输入
        Q,      // 输出
        M,      // 标志位
        DB,     // 数据块
        // 三菱区域
        X,      // 输入
        Y,      // 输出
        MR,     // 内部继电器
        D,      // 数据寄存器
        W       // 链接寄存器
    };
    Q_ENUM(PlcAreaType)

    explicit PlcAddressMapper(QObject *parent = nullptr);

    /**
     * @brief 设置当前 PLC 处理器类型
     * @param type 处理器类型
     */
    void setProcessorType(ProcessorType type);

    /**
     * @brief 从字符串设置处理器类型
     * @param typeStr 类型字符串（omron/siemens/mitsubishi）
     */
    void setProcessorTypeFromString(const QString &typeStr);

    /**
     * @brief 获取当前处理器类型
     */
    ProcessorType processorType() const { return m_processorType; }

    /**
     * @brief 获取处理器类型字符串
     */
    QString processorTypeString() const;

    /**
     * @brief 将 PLC 内部地址转换为 Modbus 地址
     * @param areaType 软元件区域类型字符串
     * @param plcAddress PLC 内部地址
     * @return Modbus 寄存器地址，-1 表示转换失败
     */
    int plcToModbusAddress(const QString &areaType, int plcAddress);

    /**
     * @brief 将 Modbus 地址转换为 PLC 内部地址
     * @param modbusAddress Modbus 寄存器地址
     * @param areaType 输出参数，软元件区域类型
     * @return PLC 内部地址，-1 表示转换失败
     */
    int modbusToPlcAddress(int modbusAddress, QString &areaType);

    /**
     * @brief 获取指定区域的 Modbus 地址范围
     * @param areaType 软元件区域类型字符串
     * @param startAddr 输出参数，起始地址
     * @param endAddr 输出参数，结束地址
     * @return 是否成功获取
     */
    bool getModbusAddressRange(const QString &areaType, int &startAddr, int &endAddr);

    /**
     * @brief 解析区域类型字符串
     */
    static PlcAreaType parseAreaType(const QString &areaTypeStr);

    /**
     * @brief 区域类型转字符串
     */
    static QString areaTypeToString(PlcAreaType areaType);

private:
    /**
     * @brief 初始化欧姆龙地址映射表
     */
    void initOmronMapping();

    /**
     * @brief 初始化西门子地址映射表
     */
    void initSiemensMapping();

    /**
     * @brief 初始化三菱地址映射表
     */
    void initMitsubishiMapping();

    ProcessorType m_processorType;

    /**
     * @brief 地址映射结构
     */
    struct AddressRange {
        int modbusStart;    // Modbus 起始地址
        int modbusEnd;      // Modbus 结束地址
        int plcOffset;      // PLC 地址偏移量
    };

    // 区域类型 -> 地址范围映射
    QMap<PlcAreaType, AddressRange> m_addressMap;
};

#endif // PLCADDRESSMAPPER_H
