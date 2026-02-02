#ifndef DEVICECONFIG_H
#define DEVICECONFIG_H

#include <QString>
#include <QVariantMap>

/**
 * @file DeviceConfig.h
 * @brief 压机设备配置数据结构
 * @description 存储从 ERP 获取的压机设备连接配置信息
 */

struct DeviceConfig
{
    /** 设备ID */
    qint64 deviceId = 0;

    /** 设备名称 */
    QString deviceName;

    /** 通信方式（0 TCP/IP, 1 串口） */
    int communicationType = 0;

    /** 设备IP地址 (TCP/IP模式) */
    QString ipAddress;

    /** 端口号 (TCP/IP模式)，默认 502 */
    int port = 502;

    /** 从站地址 */
    int slaveId = 1;

    /** 连接超时时间(毫秒) */
    int timeout = 3000;

    /** 设备状态（0正常 1停用） */
    QString status;

    /** 处理器类型 */
    QString processorType;

    /** 绑定的操作IP */
    QString operationIp;

    /**
     * @brief 检查配置是否有效
     * @return 配置有效返回 true
     */
    bool isValid() const
    {
        return deviceId > 0
            && !ipAddress.isEmpty()
            && port > 0 && port <= 65535
            && slaveId >= 1 && slaveId <= 247
            && status == "0";
    }

    /**
     * @brief 从 JSON 对象解析配置
     * @param json QVariantMap 格式的 JSON 数据
     * @return 解析后的 DeviceConfig
     */
    static DeviceConfig fromJson(const QVariantMap &json)
    {
        DeviceConfig config;
        config.deviceId = json.value("deviceId").toLongLong();
        config.deviceName = json.value("deviceName").toString();
        config.communicationType = json.value("communicationType").toInt();
        config.ipAddress = json.value("ipAddress").toString();
        config.port = json.value("port", 502).toInt();
        config.slaveId = json.value("slaveId", 1).toInt();
        config.timeout = json.value("timeout", 3000).toInt();
        config.status = json.value("status").toString();
        config.processorType = json.value("processorType").toString();
        config.operationIp = json.value("operationIp").toString();
        return config;
    }

    /**
     * @brief 转换为 QVariantMap
     * @return QVariantMap 格式数据
     */
    QVariantMap toVariantMap() const
    {
        QVariantMap map;
        map["deviceId"] = deviceId;
        map["deviceName"] = deviceName;
        map["communicationType"] = communicationType;
        map["ipAddress"] = ipAddress;
        map["port"] = port;
        map["slaveId"] = slaveId;
        map["timeout"] = timeout;
        map["status"] = status;
        map["processorType"] = processorType;
        map["operationIp"] = operationIp;
        return map;
    }
};

#endif // DEVICECONFIG_H
