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

/** 设备参数展示配置 */
export const DEVICE_PARAMS = {
  /** 参数轮询间隔（毫秒） */
  POLL_INTERVAL: 10000,
  /** 最大展示卡片数量（3行×6列） */
  MAX_CARD_COUNT: 18,
  /** 网格列数 */
  GRID_COLUMNS: 6,
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

/**
 * 工时类型字典
 * @description 对应后端字典 mould_make_order_type
 */
export const WORK_TIME_TYPE_MAP: Record<string, string> = {
  '0': '正常工时',
  '1': '加班工时',
  '2': '返工工时',
} as const

/**
 * 根据工时类型编码获取标签
 * @param code - 工时类型编码
 * @returns 工时类型标签
 */
export function getWorkTimeTypeLabel(code: string | undefined): string {
  if (!code) return '-'
  return WORK_TIME_TYPE_MAP[code] || code
}
