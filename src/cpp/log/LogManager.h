#ifndef LOGMANAGER_H
#define LOGMANAGER_H

#include <QObject>
#include <QString>
#include <QFile>
#include <QMutex>
#include <QTimer>
#include <QJsonObject>

/**
 * @brief 日志文件管理器
 * @description 负责日志文件的写入、按小时分文件、按天归档
 */
class LogManager : public QObject
{
    Q_OBJECT

public:
    explicit LogManager(const QString &basePath = "pocoPress", QObject *parent = nullptr);
    ~LogManager();

    /**
     * @brief 写入日志
     * @param level 日志级别 (debug/info/warn/error/success)
     * @param message 日志消息
     * @param data 附加数据 (JSON 对象)
     */
    void writeLog(const QString &level, const QString &message, const QJsonObject &data = QJsonObject());

    /**
     * @brief 手动触发归档
     */
    void archiveLogs();

    /**
     * @brief 设置日志基础路径
     */
    void setBasePath(const QString &path);

private slots:
    /**
     * @brief 检查是否需要归档（每小时检查一次）
     */
    void checkAndArchive();

private:
    /**
     * @brief 获取当前日志文件路径
     */
    QString getCurrentLogFilePath() const;

    /**
     * @brief 确保日志目录存在
     */
    void ensureDirectoryExists(const QString &path);

    /**
     * @brief 归档指定日期的日志文件
     */
    void archiveDate(const QString &date);

    QString m_basePath;          // 日志基础路径
    QString m_currentDate;       // 当前日期 (YYYY-MM-DD)
    int m_currentHour;           // 当前小时 (0-23)
    QFile *m_currentFile;        // 当前日志文件
    QMutex m_mutex;              // 线程安全锁
    QTimer *m_archiveTimer;      // 归档检查定时器
};

#endif // LOGMANAGER_H
