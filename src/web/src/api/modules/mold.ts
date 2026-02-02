/**
 * @file 模具锁定 API
 * @description 模具搜索、校验、锁定、解锁等接口
 * @module api/modules/mold
 */

import request from '../http'
import type { ApiResponse } from '../http'
import type { MoldSearchInfo, MoldSearchParams } from '@/types/mold'

/**
 * 根据模具号搜索模具（下拉列表）
 * @param keyword - 模具号关键词
 * @returns 模具号列表
 */
export function searchMoldByCode(keyword: string): Promise<ApiResponse<{ code: string }[]>> {
  return request({
    url: `/mould/info/getMouldCodeBySelect/${keyword}`,
    method: 'get'
  })
}

/**
 * 查询模具详细信息列表
 * @param params - 查询参数
 * @returns 模具信息列表
 */
export function listMoldCodeInfo(params: MoldSearchParams): Promise<ApiResponse<MoldSearchInfo[]>> {
  return request({
    url: '/modbus/pressmouldJob/listMouldCodeInfo',
    method: 'get',
    params
  })
}

/**
 * 校验模具是否可锁定
 * @param mouldCode - 模具号
 * @param deviceId - 设备 ID
 * @returns 校验结果
 */
export function validateMoldCode(
  mouldCode: string,
  deviceId: string
): Promise<ApiResponse<{ valid: boolean; message?: string }>> {
  return request({
    url: '/samMesMouldCode/samMesMouldCodeController/validateMouldCode',
    method: 'get',
    params: { mouldCode, deviceId }
  })
}

/**
 * 锁定模具
 * @param data - 锁定请求数据（FormData 格式）
 * @returns 锁定结果
 */
export function lockPressMoldCode(data: FormData): Promise<ApiResponse<void>> {
  return request({
    url: '/modbus/pressmouldJob/lockPressMouldCode',
    method: 'post',
    data
  })
}

/**
 * 解锁模具
 * @param data - 解锁请求数据（FormData 格式：mouldCodes, userName, deviceId）
 * @returns 解锁结果
 */
export function unlockPressMouldCode(data: FormData): Promise<ApiResponse<void>> {
  return request({
    url: '/modbus/pressmouldJob/unlockPressMouldCode',
    method: 'post',
    data
  })
}

/**
 * 查询已锁定的模具列表
 * @param data - 查询参数（包含 deviceId 等）
 * @returns 已锁定模具列表
 */
export function selectLockedMouldInfo(data: {
  deviceId?: string
  mouldCode?: string
}): Promise<ApiResponse<MoldSearchInfo[]>> {
  return request({
    url: '/modbus/pressmouldJob/selectLockedMouldInfo',
    method: 'post',
    data
  })
}

