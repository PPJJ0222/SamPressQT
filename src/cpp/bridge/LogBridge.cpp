#include "LogBridge.h"
#include "log/LogManager.h"

#include <QJsonObject>

LogBridge::LogBridge(LogManager *logManager, QObject *parent)
    : QObject(parent)
    , m_logManager(logManager)
{
}

void LogBridge::writeLog(const QString &level, const QString &message, const QVariantMap &data)
{
    // 将 QVariantMap 转换为 QJsonObject
    QJsonObject jsonData = QJsonObject::fromVariantMap(data);
    m_logManager->writeLog(level, message, jsonData);
}

void LogBridge::archiveLogs()
{
    m_logManager->archiveLogs();
}
