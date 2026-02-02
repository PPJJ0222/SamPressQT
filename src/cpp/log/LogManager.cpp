#include "LogManager.h"

#include <QDir>
#include <QDateTime>
#include <QJsonDocument>
#include <QTextStream>
#include <QDebug>

LogManager::LogManager(const QString &basePath, QObject *parent)
    : QObject(parent)
    , m_basePath(basePath)
    , m_currentHour(-1)
    , m_currentFile(nullptr)
    , m_archiveTimer(new QTimer(this))
{
    // 确保基础目录存在
    ensureDirectoryExists(m_basePath);

    // 设置归档检查定时器（每小时检查一次）
    connect(m_archiveTimer, &QTimer::timeout, this, &LogManager::checkAndArchive);
    m_archiveTimer->start(3600000); // 1小时 = 3600000毫秒
}

LogManager::~LogManager()
{
    QMutexLocker locker(&m_mutex);
    if (m_currentFile) {
        m_currentFile->close();
        delete m_currentFile;
    }
}

void LogManager::setBasePath(const QString &path)
{
    QMutexLocker locker(&m_mutex);
    m_basePath = path;
    ensureDirectoryExists(m_basePath);
}

void LogManager::writeLog(const QString &level, const QString &message, const QJsonObject &data)
{
    QMutexLocker locker(&m_mutex);

    QDateTime now = QDateTime::currentDateTime();
    QString currentDate = now.toString("yyyy-MM-dd");
    int currentHour = now.time().hour();

    // 检查是否需要切换文件
    if (currentDate != m_currentDate || currentHour != m_currentHour) {
        // 关闭旧文件
        if (m_currentFile) {
            m_currentFile->close();
            delete m_currentFile;
            m_currentFile = nullptr;
        }

        // 如果日期变化，归档前一天的日志
        if (!m_currentDate.isEmpty() && currentDate != m_currentDate) {
            locker.unlock();
            archiveDate(m_currentDate);
            locker.relock();
        }

        m_currentDate = currentDate;
        m_currentHour = currentHour;
    }

    // 打开或创建当前日志文件
    if (!m_currentFile) {
        QString filePath = getCurrentLogFilePath();
        m_currentFile = new QFile(filePath);
        if (!m_currentFile->open(QIODevice::Append | QIODevice::Text)) {
            qWarning() << "无法打开日志文件:" << filePath;
            delete m_currentFile;
            m_currentFile = nullptr;
            return;
        }
    }

    // 构建 JSON 日志条目
    QJsonObject logEntry;
    logEntry["timestamp"] = now.toString(Qt::ISODateWithMs);
    logEntry["level"] = level;
    logEntry["message"] = message;
    if (!data.isEmpty()) {
        logEntry["data"] = data;
    }

    // 写入文件
    QTextStream stream(m_currentFile);
    stream << QJsonDocument(logEntry).toJson(QJsonDocument::Compact) << "\n";
    m_currentFile->flush();
}

QString LogManager::getCurrentLogFilePath() const
{
    // 格式: pocoPress/2026-01-31_14.txt
    QString fileName = QString("%1_%2.txt")
        .arg(m_currentDate)
        .arg(m_currentHour, 2, 10, QChar('0'));
    return QDir(m_basePath).filePath(fileName);
}

void LogManager::ensureDirectoryExists(const QString &path)
{
    QDir dir(path);
    if (!dir.exists()) {
        dir.mkpath(".");
    }
}

void LogManager::archiveLogs()
{
    QMutexLocker locker(&m_mutex);
    if (!m_currentDate.isEmpty()) {
        locker.unlock();
        archiveDate(m_currentDate);
    }
}

void LogManager::checkAndArchive()
{
    QDateTime now = QDateTime::currentDateTime();
    QString currentDate = now.toString("yyyy-MM-dd");

    // 如果日期变化，归档前一天的日志
    if (!m_currentDate.isEmpty() && currentDate != m_currentDate) {
        archiveDate(m_currentDate);
    }
}

void LogManager::archiveDate(const QString &date)
{
    QDir baseDir(m_basePath);

    // 创建日期文件夹
    QString archiveDir = baseDir.filePath(date);
    ensureDirectoryExists(archiveDir);

    // 移动该日期的所有日志文件到归档文件夹
    QStringList filters;
    filters << QString("%1_*.txt").arg(date);
    QStringList files = baseDir.entryList(filters, QDir::Files);

    for (const QString &fileName : files) {
        QString srcPath = baseDir.filePath(fileName);
        QString dstPath = QDir(archiveDir).filePath(fileName);

        // 如果是当前正在写入的文件，跳过
        if (m_currentFile && srcPath == m_currentFile->fileName()) {
            continue;
        }

        QFile::rename(srcPath, dstPath);
    }

    qDebug() << "已归档日志:" << date << ", 文件数:" << files.size();
}
