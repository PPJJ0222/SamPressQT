#ifndef SIGNALMANAGER_H
#define SIGNALMANAGER_H

#include <QObject>
#include <QVariantMap>
#include <QVariantList>
#include <QMap>
#include <QTimer>

class ModbusManager;
class PlcAddressMapper;

/**
 * @file SignalManager.h
 * @brief 信号管理器
 * @description 负责信号配置管理、数据类型转换、批量读写优化
 */

/**
 * @brief 信号配置结构体
 */
struct ModbusSignal {
    qint64 id;                  // 信号 ID
    qint64 deviceId;            // 设备 ID
    QString signalCode;         // 信号编码
    QString signalName;         // 信号名称
    QString signalType;         // 信号类型：read/write
    QString registerType;       // 寄存器类型：1=线圈, 3=保持寄存器
    int registerAddress;        // 寄存器地址
    QString dataType;           // 数据类型：bit/word/float/double
    int registerCount;          // 寄存器数量
    int scaleFactor;            // 比例因子
    int offsetValue;            // 偏移量
    QString unit;               // 单位
    QString plcAreaType;        // PLC 软元件区域类型
    QString paramGroup;         // 参数组别
    bool isActive;              // 是否启用

    ModbusSignal()
        : id(0), deviceId(0), registerAddress(0)
        , registerCount(1), scaleFactor(1), offsetValue(0)
        , isActive(true) {}
};

class SignalManager : public QObject
{
    Q_OBJECT

public:
    explicit SignalManager(ModbusManager *modbusManager,
                          PlcAddressMapper *addressMapper,
                          QObject *parent = nullptr);

    /**
     * @brief 加载信号配置列表
     * @param signals 信号配置列表
     */
    void loadSignals(const QList<ModbusSignal> &signalList);

    /**
     * @brief 从 JSON 数组加载信号配置
     * @param jsonArray JSON 数组
     */
    void loadSignalsFromJson(const QVariantList &jsonArray);

    /**
     * @brief 获取所有信号配置
     */
    QList<ModbusSignal> allSignals() const { return m_signals.values(); }

    /**
     * @brief 根据信号编码获取信号配置
     */
    ModbusSignal getSignal(const QString &signalCode) const;

    /**
     * @brief 根据参数组别获取信号列表
     */
    QList<ModbusSignal> getSignalsByGroup(const QString &paramGroup) const;

    /**
     * @brief 清空所有信号配置
     */
    void clearSignals();

    // ========== 读取操作 ==========

    /**
     * @brief 读取单个信号值
     * @param signalCode 信号编码
     * @return 信号值（已转换）
     */
    QVariant readSignalValue(const QString &signalCode);

    /**
     * @brief 批量读取信号值
     * @param signalCodes 信号编码列表
     * @return 信号值映射 {signalCode: value}
     */
    QVariantMap readSignalValues(const QStringList &signalCodes);

    /**
     * @brief 读取所有活跃信号值
     * @return 信号值映射 {signalCode: value}
     */
    QVariantMap readAllActiveSignals();

    // ========== 写入操作 ==========

    /**
     * @brief 写入单个信号值
     * @param signalCode 信号编码
     * @param value 要写入的值
     * @return 是否写入成功
     */
    bool writeSignalValue(const QString &signalCode, const QVariant &value);

signals:
    /** @brief 信号值变化 */
    void signalValuesChanged(const QVariantMap &values);

    /** @brief 信号配置已加载 */
    void signalsLoaded(int count);

    /** @brief 错误发生 */
    void errorOccurred(const QString &error);

private:
    /** @brief 将原始寄存器值转换为实际值 */
    QVariant convertFromRaw(const ModbusSignal &signal, const QVariantList &rawValues);

    /** @brief 将实际值转换为原始寄存器值 */
    QVariantList convertToRaw(const ModbusSignal &signal, const QVariant &value);

    /** @brief 优化批量读取（按连续地址分组） */
    QVariantMap optimizedBatchRead(const QList<ModbusSignal> &signalList);

    ModbusManager *m_modbusManager;
    PlcAddressMapper *m_addressMapper;
    QMap<QString, ModbusSignal> m_signals;  // signalCode -> signal
};

#endif // SIGNALMANAGER_H
