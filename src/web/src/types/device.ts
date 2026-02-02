/**
 * @file 设备页面相关类型定义
 * @description 定义设备页面所需的所有数据接口
 * @module types/device
 */

/** 班组信息 */
export interface Team {
  id: string | number
  name: string
  code?: string
}

/** 人员信息 */
export interface Personnel {
  id: string | number
  name: string
  teamId: string | number
  role?: string
}

/** 工艺信息 */
export interface Process {
  id: string | number
  name: string
  code: string
  duration?: number // 预计时长（小时）
}

/** 模具状态枚举 */
export enum MoldStatus {
  AVAILABLE = 'available', // 可用
  IN_USE = 'in_use', // 使用中
  LOCKED = 'locked', // 已锁定
  MAINTENANCE = 'maintenance' // 维护中
}

/** 模具信息 */
export interface Mold {
  id: string | number
  moldNo: string // 模具号
  name?: string
  status: MoldStatus
}

/** 设备操作状态枚举 */
export enum DeviceOperationStatus {
  IDLE = 'idle', // 待机中
  CONNECTING = 'connecting', // 连接中
  CONNECTED = 'connected', // 已连接
  PROCESSING = 'processing', // 加工中
  COMPLETED = 'completed', // 已完成
  ERROR = 'error' // 故障
}

/** 压机设备信息 */
export interface PressDevice {
  id: string | number
  name: string // 如 "1号压机"
  code: string // 设备编码
  status: DeviceOperationStatus
}

/** 当前作业信息 */
export interface CurrentJob {
  id: string | number
  pressName: string // 压机名称
  moldNo: string // 模具号
  estimatedDuration: number // 预计时长（小时）
  startTime: string // 开始时间
  status: DeviceOperationStatus // 当前状态
}

/** 近期作业记录 */
export interface RecentJob {
  id: string | number
  index: number // 序号
  pressName: string // 压机名称
  moldNo: string // 模具号
  startTime: string // 开始时间
  endTime: string // 完成时间
  duration: string // 作业时长（如 "4.5h"）
}

/** 作业选择表单数据 */
export interface JobSelectionForm {
  /** 产线编码（班组） */
  teamId: string | number | undefined
  /** 操作员用户名（userName，非 userId） */
  personnelId: string | number | undefined
  /** 工艺编码（craftCode，非 craftId） */
  processId: string | number | undefined
}

/** 状态标签映射类型 */
export type StatusLabelMap = Record<DeviceOperationStatus, string>

/**
 * 产线信息
 * @description 对应后端 FmPline 实体
 */
export interface ProductionLine {
  /** 产线 ID */
  id: string
  /** 产线编号 */
  code: string
  /** 产线名称 */
  name: string
  /** 所属部门编码 */
  sys_org_code: string
  /** 日最大工时（小时） */
  max_work_time: number | null
  /** 责任班组（部门） */
  responsible_team: string | null
  /** 是否自动 */
  is_auto: string | null
}

/**
 * 当前用户信息
 * @description 对应后端 SysUser 实体（Qt 用户信息接口返回）
 */
export interface QtUserInfo {
  /** 用户 ID */
  userId: number
  /** 部门 ID */
  deptId: number
  /** 部门名称 */
  deptName: string | null
  /** 用户账号（登录名） */
  userName: string
  /** 用户昵称 */
  nickName: string
  /** 用户邮箱 */
  email: string | null
  /** 手机号码 */
  phonenumber: string | null
  /** 用户性别（0=男, 1=女, 2=未知） */
  sex: string | null
  /** 用户头像 */
  avatar: string | null
  /** 帐号状态（0=正常, 1=停用） */
  status: string
  /** 组织 ID */
  orgId: number | null
  /** 组织名称 */
  orgName: string | null
  /** 产线编码 */
  plineCode: string | null
  /** 产线名称 */
  plineName: string | null
}

/**
 * 产线工艺关联信息
 * @description 对应后端 SamMesPlineCraft 实体
 */
export interface PlineCraft {
  /** 主键 ID */
  id: string
  /** 产线编码 */
  plineCode: string
  /** 工艺 ID */
  craftId: string
  /** 备注 */
  remark: string | null
  /** 创建人 */
  createBy: string | null
  /** 是否自动 */
  isAuto: string | null
  /** 创建时间 */
  createTime: string | null
  /** 工艺编码 */
  craftCode: string | null
  /** 工艺名称 */
  craftName: string | null
  /** 序号 */
  seq: number | null
  /** 设备类型 */
  deviceType: string | null
  /** 工单类型 */
  tecOrderType: string | null
}
