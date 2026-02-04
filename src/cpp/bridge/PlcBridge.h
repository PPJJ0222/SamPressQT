#ifndef PLCBRIDGE_H
#define PLCBRIDGE_H

#include <QObject>
#include <QVariantList>
#include <QVariantMap>
#include <QTimer>

class ModbusManager;
class SignalManager;
class ConfigManager;

/**
 * @file PlcBridge.h
 * @brief PLC WebChannel 桥接类
 * @description 暴露 PLC 通信接口给前端，支持信号配置管理和数据轮询
 */

class PlcBridge : public QObject
{
    Q_OBJECT
    Q_PROPERTY(bool isConnected READ isConnected NOTIFY connectionChanged)
    Q_PROPERTY(bool isPolling READ isPolling NOTIFY pollingChanged)

public:
    explicit PlcBridge(ModbusManager *modbusManager,
                      SignalManager *signalManager,
                      ConfigManager *configManager,
                      QObject *parent = nullptr);

    bool isConnected() const;
    bool isPolling() const { return m_isPolling; }

public slots:
    // ========== 原有接口 ==========
    QVariantList readData(int address, int count);
    bool writeData(int address, const QVariantList &values);

    // ========== 信号配置接口 ==========
    /** @brief 获取所有信号配置 */
    QVariantList getSignals();

    /** @brief 刷新信号配置（从 ERP 同步） */
    void refreshSignals();

    /** @brief 根据信号编码读取值 */
    QVariant readBySignalCode(const QString &signalCode);

    /** @brief 根据信号编码写入值 */
    bool writeBySignalCode(const QString &signalCode, const QVariant &value);

    /** @brief 批量读取信号值 */
    QVariantMap batchRead(const QStringList &signalCodes);

    // ========== 设备配置接口 ==========
    /** @brief 获取当前设备配置 */
    QVariantMap getDeviceConfig();

    /** @brief 前端登录成功后调用，传递 Token 并初始化设备配置 */
    void initWithToken(const QString &token);

    // ========== 轮询控制 ==========
    /** @brief 启动数据轮询 */
    void startPolling(int intervalMs = 100);

    /** @brief 停止数据轮询 */
    void stopPolling();

    // ========== 日志接口 ==========
    /** @brief 获取日志文件列表（最近 N 天） */
    QVariantList getLogFiles(int days = 3);

    /** @brief 读取指定日志文件内容 */
    QString readLogFile(const QString &filePath);

signals:
    void connectionChanged(bool connected);
    void dataReceived(const QVariantMap &data);
    void signalValuesChanged(const QVariantMap &values);
    void signalsConfigChanged(int count);
    void pollingChanged(bool polling);
    void errorOccurred(const QString &error);

private slots:
    void onPollTimer();
    void onSignalsLoaded(int count);
    void onSyncCompleted(bool success, int count);

private:
    ModbusManager *m_modbusManager;
    SignalManager *m_signalManager;
    ConfigManager *m_configManager;
    QTimer *m_pollTimer;
    bool m_isPolling;
    QVariantMap m_lastValues;  // 上次读取的值，用于变化检测
};

#endif // PLCBRIDGE_H
