/**
 * @file 模具锁定组合式函数
 * @description 封装模具锁定的完整业务流程
 * @module composables/useMoldLock
 */

import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMoldStore } from '@/stores/mold/useMoldStore'
import { useDeviceJobStore } from '@/stores/device/useDeviceJobStore'
import { logger } from '@/utils/logger'
import type { MoldSearchInfo, MoldValidationResult } from '@/types/mold'

/**
 * 模具锁定组合式函数配置
 */
export interface UseMoldLockOptions {
  /** 设备 ID（必填） */
  deviceId: string
}

/**
 * 模具锁定组合式函数
 * @description 提供模具锁定的完整业务逻辑封装
 * @param options - 配置选项
 */
export function useMoldLock(options: UseMoldLockOptions) {
  const moldStore = useMoldStore()
  const deviceJobStore = useDeviceJobStore()

  /** 当前设备 ID */
  const deviceId = ref(options.deviceId)

  const {
    searchResults,
    moldCodeOptions,
    selectedMold,
    lockedMolds,
    panelVisible,
    loading,
    searchLoading,
    searchKeyword,
    lockedCount,
    canLockMore
  } = storeToRefs(moldStore)

  /** 当前操作员用户名 */
  const currentUserName = computed(() => {
    // 从作业选择表单获取操作员
    const personnelId = deviceJobStore.jobSelection.personnelId
    return personnelId ? String(personnelId) : ''
  })

  /** 是否可以打开锁定面板 */
  const canOpenPanel = computed(() => {
    // 必须已选择班组、人员
    const { teamId, personnelId } = deviceJobStore.jobSelection
    return Boolean(teamId && personnelId && deviceId.value)
  })

  /**
   * 打开锁定面板
   * @returns 是否成功打开
   */
  function openLockPanel(): boolean {
    if (!canOpenPanel.value) {
      logger.warn('无法打开锁定面板：前置条件不满足')
      return false
    }

    moldStore.openPanel()
    // 加载已锁定的模具列表
    if (deviceId.value) {
      moldStore.fetchLockedMolds(deviceId.value)
    }
    return true
  }

  /** 关闭锁定面板 */
  function closeLockPanel() {
    moldStore.closePanel()
  }

  /**
   * 处理模具号搜索（下拉列表）
   * @param keyword - 搜索关键词
   */
  async function handleSearchOptions(keyword: string) {
    moldStore.searchKeyword = keyword
    await moldStore.searchMoldOptions(keyword)
  }

  /**
   * 处理模具信息查询
   * @param mouldCode - 模具号
   */
  async function handleFetchMoldInfo(mouldCode: string) {
    if (!deviceId.value) {
      logger.warn('设备 ID 未设置，无法查询模具信息')
      return
    }
    await moldStore.fetchMoldInfo(mouldCode, deviceId.value)
  }

  /**
   * 处理模具选择
   * @param mold - 选中的模具
   */
  function handleSelectMold(mold: MoldSearchInfo | null) {
    moldStore.selectMold(mold)
  }

  /**
   * 处理工艺选择
   * @param craftCode - 工艺编码
   * @param craftName - 工艺名称
   */
  function handleCraftChange(craftCode: string, craftName: string) {
    moldStore.updateSelectedCraft(craftCode, craftName)
  }

  /**
   * 校验并获取结果
   * @returns 校验结果
   */
  function validate(): MoldValidationResult {
    return moldStore.validateSelection()
  }

  /**
   * 确认锁定模具
   * @returns 锁定结果，包含成功状态和提示消息
   */
  async function handleConfirmLock(): Promise<{ success: boolean; message: string }> {
    // 先校验
    const validation = validate()
    if (!validation.valid) {
      return { success: false, message: validation.message || '校验失败' }
    }

    // 执行锁定
    const result = await moldStore.confirmLock(currentUserName.value, deviceId.value)
    return result
  }

  /** 取消锁定（清空选择） */
  function handleCancelLock() {
    moldStore.clearSelection()
  }

  return {
    // 状态
    searchResults,
    moldCodeOptions,
    selectedMold,
    lockedMolds,
    panelVisible,
    loading,
    searchLoading,
    searchKeyword,
    lockedCount,
    canLockMore,
    // 计算属性
    deviceId,
    currentUserName,
    canOpenPanel,
    // 方法
    openLockPanel,
    closeLockPanel,
    handleSearchOptions,
    handleFetchMoldInfo,
    handleSelectMold,
    handleCraftChange,
    validate,
    handleConfirmLock,
    handleCancelLock
  }
}
