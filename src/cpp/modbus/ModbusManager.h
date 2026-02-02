#ifndef MODBUSMANAGER_H
#define MODBUSMANAGER_H

#include <QObject>
#include <QModbusTcpClient>
#include <QVariantList>
#include <QTimer>

/**
 * @file ModbusManager.h
 * @brief Modbus TCP 通信管理器
 * @description 负责与 PLC 设备的 Modbus TCP 通信，支持多种寄存器类型的读写操作
 */

class ModbusManager : public QObject
{
    Q_OBJECT

public:
    /**
     * @brief 寄存器类型枚举
     */
    enum RegisterType {
        Coils = 1,              // 线圈（功能码 01/05/15）
        DiscreteInputs = 2,     // 离散输入（功能码 02）
        HoldingRegisters = 3,   // 保持寄存器（功能码 03/06/16）
        InputRegisters = 4      // 输入寄存器（功能码 04）
    };
    Q_ENUM(RegisterType)

    explicit ModbusManager(QObject *parent = nullptr);
    ~ModbusManager();

    /**
     * @brief 连接到 Modbus 设备
     * @param host IP 地址
     * @param port 端口号，默认 502
     * @param slaveId 从站地址，默认 1
     * @return 是否成功发起连接
     */
    bool connectToDevice(const QString &host, int port = 502, int slaveId = 1);

    /**
     * @brief 断开连接
     */
    void disconnect();

    /**
     * @brief 检查是否已连接
     */
    bool isConnected() const;

    /**
     * @brief 获取从站地址
     */
    int slaveId() const { return m_slaveId; }

    /**
     * @brief 设置从站地址
     */
    void setSlaveId(int slaveId) { m_slaveId = slaveId; }

    /**
     * @brief 设置自动重连
     * @param enabled 是否启用
     * @param intervalMs 重连间隔（毫秒）
     */
    void setAutoReconnect(bool enabled, int intervalMs = 5000);

    // ========== 读取操作 ==========

    /**
     * @brief 读取保持寄存器（功能码 03）
     * @param address 起始地址
     * @param count 寄存器数量
     * @return 寄存器值列表
     */
    QVariantList readHoldingRegisters(int address, int count);

    /**
     * @brief 读取输入寄存器（功能码 04）
     * @param address 起始地址
     * @param count 寄存器数量
     * @return 寄存器值列表
     */
    QVariantList readInputRegisters(int address, int count);

    /**
     * @brief 读取线圈状态（功能码 01）
     * @param address 起始地址
     * @param count 线圈数量
     * @return 线圈状态列表（布尔值）
     */
    QVariantList readCoils(int address, int count);

    /**
     * @brief 读取离散输入（功能码 02）
     * @param address 起始地址
     * @param count 输入数量
     * @return 离散输入状态列表（布尔值）
     */
    QVariantList readDiscreteInputs(int address, int count);

    // ========== 写入操作 ==========

    /**
     * @brief 写入保持寄存器（功能码 06/16）
     * @param address 起始地址
     * @param values 要写入的值列表
     * @return 是否写入成功
     */
    bool writeRegisters(int address, const QVariantList &values);

    /**
     * @brief 写入单个线圈（功能码 05）
     * @param address 线圈地址
     * @param value 线圈状态
     * @return 是否写入成功
     */
    bool writeCoil(int address, bool value);

    /**
     * @brief 写入多个线圈（功能码 15）
     * @param address 起始地址
     * @param values 线圈状态列表
     * @return 是否写入成功
     */
    bool writeCoils(int address, const QVariantList &values);

    /**
     * @brief 获取最后一次错误信息
     */
    QString lastError() const { return m_lastError; }

signals:
    /** @brief 连接状态变化信号 */
    void connectionChanged(bool connected);

    /** @brief 错误发生信号 */
    void errorOccurred(const QString &error);

    /** @brief 重连尝试信号 */
    void reconnectAttempt(int attemptCount);

private slots:
    void onStateChanged(QModbusDevice::State state);
    void onErrorOccurred(QModbusDevice::Error error);
    void tryReconnect();

private:
    /**
     * @brief 通用读取方法
     * @param type 寄存器类型
     * @param address 起始地址
     * @param count 数量
     * @return 读取结果
     */
    QVariantList readRegisters(QModbusDataUnit::RegisterType type, int address, int count);

    QModbusTcpClient *m_modbusClient;   // Modbus 客户端
    int m_slaveId;                       // 从站地址
    QString m_host;                      // 主机地址
    int m_port;                          // 端口号
    QString m_lastError;                 // 最后错误信息

    // 自动重连相关
    QTimer *m_reconnectTimer;            // 重连定时器
    bool m_autoReconnect;                // 是否自动重连
    int m_reconnectInterval;             // 重连间隔
    int m_reconnectAttempts;             // 重连尝试次数
};

#endif // MODBUSMANAGER_H
