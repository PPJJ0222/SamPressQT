/**
 * @file ERP 数据 API
 * @description 班组、人员、工艺、模具等基础数据接口
 * @module api/modules/erp
 */

import request from '../http'
import type { ApiResponse } from '../http'
import type { Team, Personnel, Process, Mold, ProductionLine, QtUserInfo, PlineCraft, DictOption, StandardCraft } from '@/types/device'

/**
 * 获取班组列表
 * @returns 班组数据数组
 */
export function getTeamList(): Promise<ApiResponse<Team[]>> {
  return request({
    url: '/erp/teams',
    method: 'get'
  })
}

/**
 * 获取人员列表
 * @param teamId - 可选的班组 ID，用于过滤
 * @returns 人员数据数组
 */
export function getPersonnelList(teamId?: string | number): Promise<ApiResponse<Personnel[]>> {
  return request({
    url: '/erp/personnel',
    method: 'get',
    params: teamId ? { teamId } : undefined
  })
}

/**
 * 获取工艺列表
 * @returns 工艺数据数组
 */
export function getProcessList(): Promise<ApiResponse<Process[]>> {
  return request({
    url: '/erp/processes',
    method: 'get'
  })
}

/**
 * 获取模具列表
 * @returns 模具数据数组
 */
export function getMoldList(): Promise<ApiResponse<Mold[]>> {
  return request({
    url: '/erp/molds',
    method: 'get'
  })
}

/**
 * 根据部门获取产线列表
 * @description 固定查询部门 ID 为 30
 * @returns 产线数据数组
 */
export function getPlnListByDept2(): Promise<ApiResponse<ProductionLine[]>> {
  return request({
    url: '/fm/pline/getPlnListByDept2/30',
    method: 'get'
  })
}

/**
 * 获取当前用户信息
 * @description 获取当前登录用户的基本信息和部门信息
 * @returns 用户信息对象
 */
export function getQtUserInfo(): Promise<ApiResponse<QtUserInfo>> {
  return request({
    url: '/rel/qtrel/getQtUserInfo',
    method: 'get'
  })
}

/**
 * 根据产线编码获取用户列表
 * @param plineCode - 产线编码
 * @returns 用户信息数组
 */
export function getQtUserList2(plineCode: string): Promise<ApiResponse<QtUserInfo[]>> {
  return request({
    url: `/rel/qtrel/getQtUserList2/${plineCode}`,
    method: 'get'
  })
}

/**
 * 根据产线编码获取工艺列表
 * @description 设备类型固定为 0
 * @param plineCode - 产线编码
 * @returns 产线工艺关联数组
 */
export function getCraftByPlineIdAndDeviceType(plineCode: string): Promise<ApiResponse<PlineCraft[]>> {
  return request({
    url: `/samMesPlineCraft/samMesPlineCraftController/getCraftByPlineIdAndDeviceType/${plineCode}/0`,
    method: 'get'
  })
}

/**
 * 获取所有用户列表（用于下拉选择）
 * @description 不依赖产线，获取系统所有用户，返回 dictValue/dictLabel 格式
 * @returns 字典选项数组
 */
export function getAllUserForOptions(): Promise<ApiResponse<DictOption[]>> {
  return request({
    url: '/system/user/getAllUserForOptions',
    method: 'get'
  })
}

/**
 * 获取所有工艺列表（用于翻译显示）
 * @description 不依赖产线，获取系统所有工艺
 * @returns 标准工艺数组
 */
export function getCraftList(): Promise<ApiResponse<StandardCraft[]>> {
  return request({
    url: '/moldStandardCraft/moldStandardCraftController/getCraftList',
    method: 'get'
  })
}
