#include "mainwindow.h"
#include "bridge/PlcBridge.h"
#include "bridge/LogBridge.h"
#include "modbus/ModbusManager.h"
#include "modbus/PlcAddressMapper.h"
#include "modbus/SignalManager.h"
#include "config/ConfigManager.h"
#include "config/DeviceConfig.h"
#include "log/LogManager.h"

#include <QUrl>
#include <QFile>
#include <QWebEngineScript>
#include <QWebEngineScriptCollection>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , m_webView(new QWebEngineView(this))
    , m_webChannel(new QWebChannel(this))
    , m_modbusManager(new ModbusManager(this))
    , m_addressMapper(new PlcAddressMapper(this))
    , m_signalManager(new SignalManager(m_modbusManager, m_addressMapper, this))
    , m_configManager(new ConfigManager(m_signalManager, this))
    , m_plcBridge(new PlcBridge(m_modbusManager, m_signalManager, m_configManager, this))
    , m_logManager(new LogManager("pocoPress", this))
    , m_logBridge(new LogBridge(m_logManager, this))
    , m_erpBaseUrl("http://localhost:8080")
{
    setWindowTitle("SamPress QT");

    // 设置窗口最小尺寸限制（适配 10 英寸工控机触屏）
    setMinimumSize(1024, 768);
    resize(1024, 768);

    // 连接设备配置加载信号
    connect(m_configManager, &ConfigManager::deviceConfigLoaded,
            this, &MainWindow::onDeviceConfigLoaded);
    connect(m_configManager, &ConfigManager::deviceConfigFailed,
            this, &MainWindow::onDeviceConfigFailed);

    // 设置 ERP 基础 URL（设备配置获取由前端登录成功后触发）
    m_configManager->setErpBaseUrl(m_erpBaseUrl);

    setupWebChannel();
    setupWebEngine();

    setCentralWidget(m_webView);
}

MainWindow::~MainWindow()
{
}

void MainWindow::setupWebEngine()
{
#ifdef EMBED_WEB_RESOURCES
    // 打包模式：从资源文件加载
    m_webView->setUrl(QUrl("qrc:/web/index.html"));
#else
    // 开发模式：从本地服务器加载
    m_webView->setUrl(QUrl("http://localhost:3000"));
#endif
}

void MainWindow::setupWebChannel()
{
    // 注入 qwebchannel.js（路径与 web_resources.qrc 中定义的一致）
    QFile file(":/web/qwebchannel.js");
    if (file.open(QIODevice::ReadOnly)) {
        QString jsCode = QString::fromUtf8(file.readAll());
        file.close();

        QWebEngineScript script;
        script.setSourceCode(jsCode);
        script.setName("qwebchannel.js");
        script.setWorldId(QWebEngineScript::MainWorld);
        script.setInjectionPoint(QWebEngineScript::DocumentCreation);
        script.setRunsOnSubFrames(false);
        m_webView->page()->scripts().insert(script);
    } else {
        qWarning() << "无法加载 qwebchannel.js 资源文件";
    }

    m_webView->page()->setWebChannel(m_webChannel);
    m_webChannel->registerObject("plcBridge", m_plcBridge);
    m_webChannel->registerObject("logBridge", m_logBridge);
}

void MainWindow::onDeviceConfigLoaded(const DeviceConfig &config)
{
    // 连接 PLC 设备
    m_modbusManager->connectToDevice(
        config.ipAddress,
        config.port,
        config.slaveId
    );

    // 设置连接超时
    m_modbusManager->setAutoReconnect(true, 5000);

    // 初始化信号配置
    m_configManager->initialize(m_erpBaseUrl, config.deviceId);
}

void MainWindow::onDeviceConfigFailed(const QString &error)
{
    qWarning() << "设备配置获取失败:" << error;

    // 5秒后自动重试
    QTimer::singleShot(5000, this, [this]() {
        m_configManager->fetchDeviceConfig(m_erpBaseUrl);
    });
}
