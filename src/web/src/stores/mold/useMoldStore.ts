/**
 * @file 模具锁定状态管理
 * @description 管理模具搜索、选择、锁定的状态和操作
 * @module stores/mold/useMoldStore
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { logger } from '@/utils/logger'
import {
  searchMoldByCode,
  listMoldCodeInfo,
  lockPressMoldCode,
  unlockPressMouldCode,
  selectLockedMouldInfo
} from '@/api/modules/mold'
import {
  type MoldSearchInfo,
  type LockedMoldInfo,
  type MoldValidationResult,
  MAX_MOLD_LOCK_COUNT,
  parseProjectCode
} from '@/types/mold'

export const useMoldStore = defineStore('mold', () => {
  /** 搜索结果列表 */
  const searchResults = ref<MoldSearchInfo[]>([])

  /** 模具号下拉选项 */
  const moldCodeOptions = ref<string[]>([])

  /** 当前选中的模具（单选） */
  const selectedMold = ref<MoldSearchInfo | null>(null)

  /** 已锁定的模具列表 */
  const lockedMolds = ref<LockedMoldInfo[]>([])

  /** 锁定面板是否可见 */
  const panelVisible = ref(false)

  /** 解锁面板是否可见 */
  const unlockPanelVisible = ref(false)

  /** 解锁面板中选中的模具 */
  const selectedUnlockMold = ref<LockedMoldInfo | null>(null)

  /** 加载状态 */
  const loading = ref(false)

  /** 搜索加载状态 */
  const searchLoading = ref(false)

  /** 当前搜索关键词 */
  const searchKeyword = ref('')

  /** 已锁定模具数量 */
  const lockedCount = computed(() => lockedMolds.value.length)

  /** 是否可以继续锁定 */
  const canLockMore = computed(() => lockedCount.value < MAX_MOLD_LOCK_COUNT)

  /** 已锁定的模具号列表 */
  const lockedMoldCodes = computed(() => lockedMolds.value.map((m) => m.mouldCode))

  /**
   * 搜索模具号（下拉列表）
   * @param keyword - 搜索关键词
   */
  async function searchMoldOptions(keyword: string) {
    if (!keyword || keyword.length < 2) {
      moldCodeOptions.value = []
      return
    }

    searchLoading.value = true
    try {
      const res = await searchMoldByCode(keyword)
      // API 返回 { code: string }[] 格式，提取 code 字段
      moldCodeOptions.value = (res.data || []).map((item) => item.code)
      logger.debug('模具号搜索完成', { keyword, count: moldCodeOptions.value.length })
    } catch (error) {
      logger.error('模具号搜索失败', error)
      moldCodeOptions.value = []
    } finally {
      searchLoading.value = false
    }
  }

  /**
   * 查询模具详细信息
   * @param mouldCode - 模具号
   * @param deviceId - 设备 ID
   */
  async function fetchMoldInfo(mouldCode: string, deviceId: string) {
    if (!mouldCode) {
      searchResults.value = []
      selectedMold.value = null
      return
    }

    loading.value = true
    // 搜索时清空选中状态，避免重新搜索后仍保持旧的选中
    selectedMold.value = null
    try {
      // 传递已锁定的模具号列表，用于后端排除（无锁定时传 null）
      const res = await listMoldCodeInfo({
        mouldCode,
        deviceId,
        mouldCodeArray: lockedMoldCodes.value.length > 0 ? lockedMoldCodes.value : undefined
      })
      searchResults.value = res.data || []
      logger.debug('模具信息查询完成', { mouldCode, count: searchResults.value.length })
    } catch (error) {
      logger.error('模具信息查询失败', error)
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择模具（单选）
   * @param mold - 选中的模具信息
   */
  function selectMold(mold: MoldSearchInfo | null) {
    selectedMold.value = mold ? { ...mold } : null
    logger.debug('选择模具', { mouldCode: mold?.mouldCode })
  }

  /**
   * 更新选中模具的工艺
   * @param craftCode - 工艺编码
   * @param craftName - 工艺名称
   */
  function updateSelectedCraft(craftCode: string, craftName: string) {
    if (selectedMold.value) {
      selectedMold.value = {
        ...selectedMold.value,
        craftCode,
        craftName
      }
    }
  }

  /**
   * 校验模具是否可锁定
   * @returns 校验结果
   */
  function validateSelection(): MoldValidationResult {
    if (!selectedMold.value) {
      return { valid: false, message: '请先选择模具' }
    }

    // 检查是否超过最大锁定数
    if (!canLockMore.value) {
      return { valid: false, message: `当前已锁定 ${MAX_MOLD_LOCK_COUNT} 套模具，已达到上限!` }
    }

    // 检查制造令号和工艺
    if (!selectedMold.value.makeOrderNumber || !selectedMold.value.craftCode) {
      return { valid: false, message: '制造令号与工艺不能为空' }
    }

    // 检查项目一致性
    if (lockedMolds.value.length > 0) {
      const newProjectCode = parseProjectCode(selectedMold.value.mouldCode)
      const existingProjectCode = parseProjectCode(lockedMolds.value[0].mouldCode)

      if (newProjectCode && existingProjectCode && newProjectCode !== existingProjectCode) {
        return {
          valid: false,
          message: `不可跨项目作业！当前设备正在作业项目 [${existingProjectCode}]`
        }
      }
    }

    return { valid: true }
  }

  /** 锁定结果类型 */
  interface LockResult {
    success: boolean
    message: string
  }

  /**
   * 确认锁定模具
   * @param userName - 操作员用户名
   * @param deviceId - 设备 ID
   * @returns 锁定结果，包含成功状态和提示消息
   */
  async function confirmLock(userName: string, deviceId: string): Promise<LockResult> {
    const validation = validateSelection()
    if (!validation.valid) {
      // 禁用 Toast，由调用方统一处理 UI 提示
      logger.warn(validation.message || '模具锁定校验失败', { toast: false })
      return { success: false, message: validation.message || '模具锁定校验失败' }
    }

    loading.value = true
    try {
      const formData = new FormData()
      formData.append('choosedRowsStr', JSON.stringify([selectedMold.value]))
      formData.append('userName', userName)
      formData.append('deviceId', deviceId)

      await lockPressMoldCode(formData)
      logger.info('模具锁定成功', { mouldCode: selectedMold.value?.mouldCode })

      // 将新锁定的模具添加到已锁定列表
      if (selectedMold.value) {
        lockedMolds.value = [
          ...lockedMolds.value,
          selectedMold.value as unknown as LockedMoldInfo
        ]
      }

      // 清空选择
      clearSelection()

      return { success: true, message: '锁定完成!' }
    } catch (error) {
      logger.error('模具锁定失败', error)
      // 返回空消息，因为 http.ts 拦截器已经弹出了错误提示
      return { success: false, message: '' }
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取已锁定的模具列表
   * @description 调用 selectLockedMouldInfo API 获取已锁定模具详细信息
   * @param deviceId - 设备 ID
   */
  async function fetchLockedMolds(deviceId: string) {
    if (!deviceId) {
      lockedMolds.value = []
      return
    }

    loading.value = true
    try {
      const res = await selectLockedMouldInfo({ deviceId })
      lockedMolds.value = (res.data || []) as unknown as LockedMoldInfo[]
      logger.debug('已锁定模具列表加载完成', { count: lockedMolds.value.length })
    } catch (error) {
      logger.error('已锁定模具列表加载失败', error)
      lockedMolds.value = []
    } finally {
      loading.value = false
    }
  }

  /** 清空选择状态 */
  function clearSelection() {
    selectedMold.value = null
    searchResults.value = []
    searchKeyword.value = ''
    moldCodeOptions.value = []
  }

  /**
   * 取消锁定模具
   * @param mouldCodes - 模具号（单个或逗号分隔的多个）
   * @param userName - 操作员用户名
   * @param deviceId - 设备 ID
   */
  async function cancelLock(
    mouldCodes: string,
    userName: string,
    deviceId: string
  ): Promise<boolean> {
    if (!mouldCodes) {
      logger.warn('取消锁定失败：未指定模具号')
      return false
    }

    loading.value = true
    try {
      const formData = new FormData()
      formData.append('mouldCodes', mouldCodes)
      formData.append('userName', userName)
      formData.append('deviceId', deviceId)

      await unlockPressMouldCode(formData)
      logger.info('模具解锁成功', { mouldCodes })

      // 从已锁定列表中移除解锁的模具
      const unlockedCodes = mouldCodes.split(',').map((s) => s.trim())
      lockedMolds.value = lockedMolds.value.filter(
        (m) => !unlockedCodes.includes(m.mouldCode)
      )

      // 清空解锁面板选择
      selectedUnlockMold.value = null

      return true
    } catch (error) {
      logger.error('模具解锁失败', error)
      return false
    } finally {
      loading.value = false
    }
  }

  /** 打开锁定面板 */
  function openPanel() {
    panelVisible.value = true
    logger.debug('打开模具锁定面板')
  }

  /** 关闭锁定面板 */
  function closePanel() {
    panelVisible.value = false
    clearSelection()
    logger.debug('关闭模具锁定面板')
  }

  /** 打开解锁面板 */
  function openUnlockPanel() {
    unlockPanelVisible.value = true
    selectedUnlockMold.value = null
    logger.debug('打开模具解锁面板')
  }

  /** 关闭解锁面板 */
  function closeUnlockPanel() {
    unlockPanelVisible.value = false
    selectedUnlockMold.value = null
    logger.debug('关闭模具解锁面板')
  }

  /**
   * 选择待解锁的模具
   * @param mold - 已锁定的模具信息
   */
  function selectUnlockMold(mold: LockedMoldInfo | null) {
    selectedUnlockMold.value = mold ? { ...mold } : null
    logger.debug('选择待解锁模具', { mouldCode: mold?.mouldCode })
  }

  /** 重置所有状态 */
  function reset() {
    searchResults.value = []
    moldCodeOptions.value = []
    selectedMold.value = null
    lockedMolds.value = []
    panelVisible.value = false
    unlockPanelVisible.value = false
    selectedUnlockMold.value = null
    loading.value = false
    searchLoading.value = false
    searchKeyword.value = ''
  }

  return {
    // 状态
    searchResults,
    moldCodeOptions,
    selectedMold,
    lockedMolds,
    panelVisible,
    unlockPanelVisible,
    selectedUnlockMold,
    loading,
    searchLoading,
    searchKeyword,
    // 计算属性
    lockedCount,
    canLockMore,
    lockedMoldCodes,
    // 方法
    searchMoldOptions,
    fetchMoldInfo,
    selectMold,
    updateSelectedCraft,
    validateSelection,
    confirmLock,
    cancelLock,
    fetchLockedMolds,
    clearSelection,
    openPanel,
    closePanel,
    openUnlockPanel,
    closeUnlockPanel,
    selectUnlockMold,
    reset
  }
})
