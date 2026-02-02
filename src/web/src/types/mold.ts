/**
 * @file 模具锁定相关类型定义
 * @description 定义模具搜索、选择、锁定功能所需的数据接口
 * @module types/mold
 */

/**
 * 模具锁定状态枚举
 * @description 表示模具在锁定流程中的状态
 */
export enum MoldLockStatus {
  /** 未锁定 */
  UNLOCKED = 'unlocked',
  /** 已锁定 */
  LOCKED = 'locked',
  /** 锁定中 */
  LOCKING = 'locking'
}

/**
 * 模具搜索结果信息
 * @description 对应后端模具查询接口返回的数据结构
 */
export interface MoldSearchInfo {
  /** 模具号（唯一标识） */
  mouldCode: string
  /** 模具名称 */
  name?: string
  /** 制造令号 */
  makeOrderNumber: string
  /** 工序号 */
  stages: string
  /** 工艺编码（可选，需要用户选择） */
  craftCode?: string
  /** 工艺名称 */
  craftName?: string
  /** 项目号（从模具号解析，格式：项目号-序号） */
  projectCode?: string
}

/**
 * 模具锁定请求参数
 * @description 调用锁定 API 时需要的参数
 */
export interface MoldLockRequest {
  /** JSON 序列化的选中模具数据 */
  choosedRowsStr: string
  /** 操作员用户名 */
  userName: string
  /** 设备 ID */
  deviceId: string
}

/**
 * 模具校验结果
 * @description 锁定前校验的返回结果
 */
export interface MoldValidationResult {
  /** 是否校验通过 */
  valid: boolean
  /** 校验失败时的错误信息 */
  message?: string
}

/**
 * 模具搜索查询参数
 * @description 模具搜索接口的查询参数
 */
export interface MoldSearchParams {
  /** 模具号（支持模糊搜索） */
  mouldCode?: string
  /** 制造令号 */
  makeOrderNumber?: string
  /** 设备 ID */
  deviceId?: string
  /** 已锁定的模具号列表（用于排除已锁定模具） */
  mouldCodeArray?: string[]
}

/**
 * 已锁定模具信息
 * @description 当前设备已锁定的模具信息
 */
export interface LockedMoldInfo {
  /** 模具号 */
  mouldCode: string
  /** 制造令号 */
  makeOrderNumber: string
  /** 工序号 */
  stages: string
  /** 工艺编码 */
  craftCode: string
  /** 工艺名称 */
  craftName: string
  /** 工时类型 */
  workTimeType?: string
  /** 开始时间 */
  startTime?: string
  /** 作业员 */
  operator?: string
  /** 锁定时间 */
  lockTime?: string
}

/**
 * 模具锁定面板状态
 * @description 控制锁定面板的显示和交互状态
 */
export interface MoldLockPanelState {
  /** 面板是否可见 */
  visible: boolean
  /** 是否正在加载 */
  loading: boolean
  /** 搜索关键词 */
  searchKeyword: string
  /** 搜索结果列表 */
  searchResults: MoldSearchInfo[]
  /** 当前选中的模具（单选） */
  selectedMold: MoldSearchInfo | null
}

/** 单设备最大锁定模具数量 */
export const MAX_MOLD_LOCK_COUNT = 5

/**
 * 从模具号解析项目号
 * @param mouldCode - 模具号，格式如 "PRJ001-001"
 * @returns 项目号，如 "PRJ001"；解析失败返回空字符串
 */
export function parseProjectCode(mouldCode: string): string {
  if (!mouldCode) return ''
  const parts = mouldCode.split('-')
  return parts.length > 0 ? parts[0] : ''
}
