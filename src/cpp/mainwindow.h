#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QWebEngineView>
#include <QWebChannel>
#include "config/DeviceConfig.h"

class PlcBridge;
class ModbusManager;
class SignalManager;
class ConfigManager;
class PlcAddressMapper;
class LogManager;
class LogBridge;

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

private slots:
    void onDeviceConfigLoaded(const DeviceConfig &config);
    void onDeviceConfigFailed(const QString &error);

private:
    void setupWebEngine();
    void setupWebChannel();

    QWebEngineView *m_webView;
    QWebChannel *m_webChannel;
    ModbusManager *m_modbusManager;
    PlcAddressMapper *m_addressMapper;
    SignalManager *m_signalManager;
    ConfigManager *m_configManager;
    PlcBridge *m_plcBridge;
    LogManager *m_logManager;
    LogBridge *m_logBridge;

    QString m_erpBaseUrl;
};

#endif // MAINWINDOW_H
