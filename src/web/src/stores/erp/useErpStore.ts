/**
 * @file ERP 数据状态管理
 * @description 管理班组、人员、工艺等 ERP 基础数据
 * @module stores/erp/useErpStore
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logger } from '@/utils/logger'
import {
  getTeamList,
  getPersonnelList,
  getProcessList,
  getMoldList,
  getPlnListByDept2,
  getQtUserInfo,
  getQtUserList2,
  getCraftByPlineIdAndDeviceType,
  getAllUserForOptions,
  getCraftList
} from '@/api/modules/erp'
import type { Team, Personnel, Process, Mold, ProductionLine, QtUserInfo, PlineCraft, DictOption, StandardCraft } from '@/types/device'

export const useErpStore = defineStore('erp', () => {
  /** 班组列表 */
  const teams = ref<Team[]>([])

  /** 人员列表 */
  const personnelList = ref<Personnel[]>([])

  /** 工艺列表 */
  const processes = ref<Process[]>([])

  /** 模具列表 */
  const molds = ref<Mold[]>([])

  /** 产线列表 */
  const productionLines = ref<ProductionLine[]>([])

  /** 当前用户信息 */
  const currentUserInfo = ref<QtUserInfo | null>(null)

  /** 产线用户列表（根据产线编码获取） */
  const plineUsers = ref<QtUserInfo[]>([])

  /** 产线工艺列表（根据产线编码获取） */
  const craftList = ref<PlineCraft[]>([])

  /** 所有用户列表（不依赖产线，用于翻译显示，格式为 dictValue/dictLabel） */
  const allUsers = ref<DictOption[]>([])

  /** 所有工艺列表（不依赖产线，用于翻译显示） */
  const allCrafts = ref<StandardCraft[]>([])
  /** 数据加载状态 */
  const loading = ref(false)

  /**
   * 根据班组 ID 过滤人员列表
   * @param teamId - 班组 ID
   * @returns 过滤后的人员列表
   */
  const getPersonnelByTeam = computed(() => {
    return (teamId: string | number | undefined) => {
      if (!teamId) return []
      return personnelList.value.filter((p) => p.teamId === teamId)
    }
  })

  /** 加载班组数据 */
  async function fetchTeams() {
    try {
      const res = await getTeamList()
      teams.value = res.data || []
      logger.debug('班组数据加载完成', { count: teams.value.length })
    } catch (error) {
      // http.ts 拦截器已统一处理错误提示和日志记录
      throw error
    }
  }

  /** 加载人员数据 */
  async function fetchPersonnel() {
    try {
      const res = await getPersonnelList()
      personnelList.value = res.data || []
      logger.debug('人员数据加载完成', { count: personnelList.value.length })
    } catch (error) {
      // http.ts 拦截器已统一处理错误提示和日志记录
      throw error
    }
  }

  /** 加载工艺数据 */
  async function fetchProcesses() {
    try {
      const res = await getProcessList()
      processes.value = res.data || []
      logger.debug('工艺数据加载完成', { count: processes.value.length })
    } catch (error) {
      // http.ts 拦截器已统一处理错误提示和日志记录
      throw error
    }
  }

  /** 加载模具数据 */
  async function fetchMolds() {
    try {
      const res = await getMoldList()
      molds.value = res.data || []
      logger.debug('模具数据加载完成', { count: molds.value.length })
    } catch (error) {
      // http.ts 拦截器已统一处理错误提示和日志记录
      throw error
    }
  }

  /** 加载产线列表 */
  async function fetchProductionLines() {
    try {
      const res = await getPlnListByDept2()
      productionLines.value = res.data || []
      logger.debug('产线数据加载完成', { count: productionLines.value.length })
    } catch (error) {
      // http.ts 拦截器已统一处理错误提示和日志记录
      throw error
    }
  }

  /** 获取当前用户信息 */
  async function fetchCurrentUserInfo() {
    try {
      const res = await getQtUserInfo()
      currentUserInfo.value = res.data || null
      logger.debug('当前用户信息加载完成', { plineCode: currentUserInfo.value?.plineCode })
      return currentUserInfo.value?.plineCode || null
    } catch (error) {
      // http.ts 拦截器已统一处理错误提示和日志记录
      throw error
    }
  }

  /**
   * 根据产线编码获取用户和工艺数据
   * @description 产线变化时的回调方法
   * @param plineCode - 产线编码
   */
  async function getQtUsers(plineCode: string) {
    if (!plineCode) {
      plineUsers.value = []
      craftList.value = []
      return
    }

    try {
      const [usersRes, craftsRes] = await Promise.all([
        getQtUserList2(plineCode),
        getCraftByPlineIdAndDeviceType(plineCode)
      ])
      plineUsers.value = usersRes.data || []
      craftList.value = craftsRes.data || []
      logger.debug('产线关联数据加载完成', {
        plineCode,
        usersCount: plineUsers.value.length,
        craftsCount: craftList.value.length
      })
    } catch (error) {
      // http.ts 拦截器已统一处理错误提示和日志记录
      throw error
    }
  }

  /**
   * 加载所有用户列表
   * @description 不依赖产线，用于翻译显示
   */
  async function fetchAllUsers() {
    try {
      const res = await getAllUserForOptions()
      allUsers.value = res.data || []
      logger.debug('所有用户数据加载完成', { count: allUsers.value.length })
    } catch (error) {
      // http.ts 拦截器已统一处理错误提示和日志记录
      throw error
    }
  }

  /**
   * 加载所有工艺列表
   * @description 不依赖产线，用于翻译显示
   */
  async function fetchAllCrafts() {
    try {
      const res = await getCraftList()
      allCrafts.value = res.data || []
      logger.debug('所有工艺数据加载完成', { count: allCrafts.value.length })
    } catch (error) {
      // http.ts 拦截器已统一处理错误提示和日志记录
      throw error
    }
  }

  /** 初始化加载所有基础数据 */
  async function initData() {
    loading.value = true
    try {
      // 并行加载产线列表、当前用户信息、所有用户列表和所有工艺列表
      const [, plineCode] = await Promise.all([
        fetchProductionLines(),
        fetchCurrentUserInfo(),
        fetchAllUsers(),
        fetchAllCrafts()
      ])

      // 根据用户的产线编码加载关联数据
      if (plineCode) {
        await getQtUsers(plineCode)
      }

      logger.info('ERP 基础数据加载完成')
    } catch {
      // http.ts 拦截器已统一处理错误提示和日志记录
    } finally {
      loading.value = false
    }
  }

  return {
    teams,
    personnelList,
    processes,
    molds,
    productionLines,
    currentUserInfo,
    plineUsers,
    craftList,
    allUsers,
    allCrafts,
    loading,
    getPersonnelByTeam,
    fetchTeams,
    fetchPersonnel,
    fetchProcesses,
    fetchMolds,
    fetchProductionLines,
    fetchCurrentUserInfo,
    fetchAllUsers,
    fetchAllCrafts,
    getQtUsers,
    initData
  }
})
