#ifndef LOGBRIDGE_H
#define LOGBRIDGE_H

#include <QObject>
#include <QVariantMap>

class LogManager;

/**
 * @brief 日志 WebChannel 桥接类
 * @description 提供前端调用的日志写入接口
 */
class LogBridge : public QObject
{
    Q_OBJECT

public:
    explicit LogBridge(LogManager *logManager, QObject *parent = nullptr);

public slots:
    /**
     * @brief 写入日志（供前端调用）
     * @param level 日志级别
     * @param message 日志消息
     * @param data 附加数据
     */
    void writeLog(const QString &level, const QString &message, const QVariantMap &data = QVariantMap());

    /**
     * @brief 手动触发归档
     */
    void archiveLogs();

private:
    LogManager *m_logManager;
};

#endif // LOGBRIDGE_H
