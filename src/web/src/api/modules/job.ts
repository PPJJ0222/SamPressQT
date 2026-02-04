/**
 * @file 作业数据 API
 * @description 当前作业、历史作业相关接口
 * @module api/modules/job
 */

import request from '../http'
import type { ApiResponse } from '../http'
import type { CurrentJob, RecentJob } from '@/types/device'

/**
 * 获取当前作业列表
 * @returns 当前作业数据数组
 */
export function getCurrentJobs(): Promise<ApiResponse<CurrentJob[]>> {
  return request({
    url: '/jobs/current',
    method: 'get'
  })
}

/**
 * 获取近期作业记录
 * @param limit - 返回记录数量限制，默认 10
 * @returns 近期作业记录数组
 */
export function getRecentJobs(limit = 10): Promise<ApiResponse<RecentJob[]>> {
  return request({
    url: '/jobs/recent',
    method: 'get',
    params: { limit }
  })
}

/**
 * 更新作业预计时长
 * @param jobId - 作业 ID
 * @param duration - 预计时长（小时）
 */
export function updateJobDuration(
  jobId: string | number,
  duration: number
): Promise<ApiResponse<void>> {
  return request({
    url: `/jobs/${jobId}/duration`,
    method: 'put',
    data: { duration }
  })
}

/** 创建作业参数 */
export interface CreateJobParams {
  teamId: string | number
  personnelId: string | number
  processId: string | number
  pressDeviceId: string | number
  moldNo: string
}

/**
 * 创建新作业
 * @param data - 作业创建参数
 */
export function createJob(data: CreateJobParams): Promise<ApiResponse<CurrentJob>> {
  return request({
    url: '/jobs',
    method: 'post',
    data
  })
}

/** 压机作业信息（从 Modbus 设备获取） */
export interface ModbusPressJob {
  /** 设备 ID */
  deviceId: string
  /** 模具号（逗号分隔的多个模具号） */
  mouldCode?: string
  /** 作业状态 */
  status?: string
  /** 开始时间 */
  startTime?: string
  /** 预计时长（小时） */
  expectedDuration?: number
  /** 是否需要记录参数 */
  needParameterRecords?: boolean
}

/** Modbus 设备信息 */
export interface ModbusDevice {
  /** 设备 ID */
  deviceId: string
  /** 设备名称 */
  deviceName: string
  /** 设备类型 */
  deviceType?: string
  /** 设备状态 */
  status?: string
}

/**
 * 根据客户端 IP 获取当前压机作业信息
 * @description 后端根据请求 IP 自动识别对应的压机设备
 * @returns 压机作业信息列表
 */
export function getPressJobByHandleIp(): Promise<ApiResponse<ModbusPressJob[]>> {
  return request({
    url: '/modbus/device/getPressJobByHandleIp',
    method: 'get'
  })
}

/**
 * 获取 Modbus 设备列表
 * @returns 设备列表
 */
export function listModbusDevice(): Promise<ApiResponse<ModbusDevice[]>> {
  return request({
    url: '/modbus/device/list',
    method: 'get'
  })
}
