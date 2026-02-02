/**
 * PLC 通信相关常量
 */

// PLC 轮询配置
export const PLC_POLLING = {
  DEFAULT_INTERVAL: 100,    // 默认轮询间隔（毫秒）
  MIN_INTERVAL: 50,         // 最小轮询间隔（毫秒）
  MAX_INTERVAL: 1000,       // 最大轮询间隔（毫秒）
} as const

// 数据节流配置
export const PLC_THROTTLE = {
  DATA_UPDATE: 100,         // 数据更新节流间隔（毫秒）
  UI_REFRESH: 200,          // UI 刷新节流间隔（毫秒）
  STATUS_CHECK: 500,        // 状态检查节流间隔（毫秒）
} as const

// 连接配置
export const PLC_CONNECTION = {
  RECONNECT_DELAY: 3000,    // 重连延迟（毫秒）
  MAX_RECONNECT: 5,         // 最大重连次数
  TIMEOUT: 5000,            // 连接超时（毫秒）
} as const

// Modbus 地址映射（根据实际 PLC 配置调整）
export const PLC_ADDRESS = {
  // 设备状态区
  DEVICE_STATUS: {
    START: 0,
    COUNT: 10,
  },
  // 传感器数据区
  SENSOR_DATA: {
    START: 100,
    COUNT: 50,
  },
  // 控制指令区
  CONTROL: {
    START: 200,
    COUNT: 20,
  },
  // 报警信息区
  ALARM: {
    START: 300,
    COUNT: 32,
  },
} as const

// 设备状态枚举
export enum DeviceStatus {
  OFFLINE = 0,      // 离线
  IDLE = 1,         // 空闲
  RUNNING = 2,      // 运行中
  PAUSED = 3,       // 暂停
  ERROR = 4,        // 故障
  MAINTENANCE = 5,  // 维护中
}

// 报警级别
export enum AlarmLevel {
  INFO = 0,         // 信息
  WARNING = 1,      // 警告
  ERROR = 2,        // 错误
  CRITICAL = 3,     // 严重
}

// PLC 处理器类型
export enum ProcessorType {
  UNKNOWN = 'unknown',
  OMRON = 'omron',       // 欧姆龙 - BCNet-CJ
  SIEMENS = 'siemens',   // 西门子 - XCNet-PN
  MITSUBISHI = 'mitsubishi', // 三菱 - XCNet-MIT
}

// 寄存器类型
export enum RegisterType {
  COILS = '1',              // 线圈（功能码 01/05/15）
  DISCRETE_INPUTS = '2',    // 离散输入（功能码 02）
  HOLDING_REGISTERS = '3',  // 保持寄存器（功能码 03/06/16）
  INPUT_REGISTERS = '4',    // 输入寄存器（功能码 04）
}

// 信号配置同步
export const SIGNAL_SYNC = {
  DEFAULT_INTERVAL: 30000,  // 默认同步间隔（毫秒）
  MIN_INTERVAL: 10000,      // 最小同步间隔（毫秒）
  MAX_INTERVAL: 300000,     // 最大同步间隔（毫秒）
} as const

/** 设备参数展示配置 */
export const DEVICE_PARAMS = {
  /** 参数轮询间隔（毫秒） */
  POLL_INTERVAL: 10000,
  /** 最大展示卡片数量（3行×4列） */
  MAX_CARD_COUNT: 12,
  /** 网格列数 */
  GRID_COLUMNS: 4,
} as const

/** MES 通信状态信号配置 */
export const MES_COMMUNICATION = {
  /** 信号名称（用于在信号列表中查找） */
  SIGNAL_NAME: 'MES通信状态',
  /** 连接时下发的值 */
  CONNECTED_VALUE: true,
  /** 下发失败时的最大重试次数 */
  MAX_RETRY: 3,
  /** 重试间隔（毫秒） */
  RETRY_DELAY: 1000,
} as const
