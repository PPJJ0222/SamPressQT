<script setup lang="ts">
/**
 * @file 模具锁定面板组件
 * @description 模具锁定功能的容器组件，整合搜索、列表和操作按钮
 */
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import MoldSearchSelect from './MoldSearchSelect.vue'
import MoldLockTable from './MoldLockTable.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useMoldStore } from '@/stores/mold/useMoldStore'
import { useErpStore } from '@/stores/erp/useErpStore'
import { useDeviceJobStore } from '@/stores/device/useDeviceJobStore'
import { useToastStore } from '@/stores/useToastStore'
import { MAX_MOLD_LOCK_COUNT } from '@/types/mold'
import type { MoldSearchInfo } from '@/types/mold'
import { logger } from '@/utils/logger'

interface Props {
  /** 设备 ID */
  deviceId: string
  /** 操作员用户名 */
  userName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const moldStore = useMoldStore()
const erpStore = useErpStore()
const deviceJobStore = useDeviceJobStore()
const toast = useToastStore()

const {
  searchResults,
  moldCodeOptions,
  selectedMold,
  loading,
  searchLoading,
  searchKeyword,
  canLockMore
} = storeToRefs(moldStore)

const { jobSelection, lockedMoldCodes } = storeToRefs(deviceJobStore)

/** 是否显示确认模态框 */
const showConfirmModal = ref(false)

/** 工艺选项 */
const craftOptions = computed(() => erpStore.craftList)

/** 状态提示文本 */
const statusText = computed(() => {
  return `已锁定 ${lockedMoldCodes.value.length}/${MAX_MOLD_LOCK_COUNT} 套`
})

/** 处理搜索 */
const handleSearch = async (keyword: string) => {
  await moldStore.searchMoldOptions(keyword)
}

/** 处理模具号选择 */
const handleMoldCodeSelect = async (mouldCode: string) => {
  await moldStore.fetchMoldInfo(mouldCode, props.deviceId)
}

/** 处理模具选择 - 同时自动设置预选工艺 */
const handleMoldSelect = (mold: MoldSearchInfo) => {
  // 先选中模具
  moldStore.selectMold(mold)

  // 如果作业选择区域已选择预选工艺，自动设置到选中的模具上
  const preselectedProcessId = jobSelection.value.processId
  logger.debug('模具选择 - 预选工艺匹配', {
    preselectedProcessId,
    craftOptionsCount: craftOptions.value.length,
    craftCodes: craftOptions.value.map(c => c.craftCode)
  })

  if (preselectedProcessId) {
    const craft = craftOptions.value.find(c => c.craftCode === preselectedProcessId)
    logger.debug('模具选择 - 工艺匹配结果', { craft, preselectedProcessId })
    if (craft) {
      moldStore.updateSelectedCraft(craft.craftCode || '', craft.craftName || '')
    }
  }
}

/** 处理工艺变更 */
const handleCraftChange = (craftCode: string, craftName: string) => {
  moldStore.updateSelectedCraft(craftCode, craftName)
}

/** 打开确认模态框 */
const handleLockClick = () => {
  showConfirmModal.value = true
}

/** 取消确认 */
const handleCancelConfirm = () => {
  showConfirmModal.value = false
}

/** 确认锁定 */
const handleConfirm = async () => {
  showConfirmModal.value = false
  const result = await moldStore.confirmLock(props.userName, props.deviceId)

  if (result.success) {
    toast.success(result.message)
    emit('success')
  } else if (result.message) {
    // 只有前端校验失败时才弹出提示，API 错误已由 http.ts 拦截器处理
    toast.warn(result.message)
  }
}

/** 重置搜索 */
const handleReset = () => {
  moldStore.clearSelection()
}
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0 gap-4 p-4 rounded-2xl bg-(--bg-card) border border-(--border-subtle) overflow-hidden">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between shrink-0">
      <h3 class="font-primary text-base font-medium text-(--text-primary)">锁定模具</h3>
      <span class="font-primary text-sm text-(--text-secondary)">{{ statusText }}</span>
    </div>

    <!-- 搜索区域 -->
    <div class="flex items-center gap-3 shrink-0 flex-wrap">
      <MoldSearchSelect
        v-model="searchKeyword"
        :options="moldCodeOptions"
        :loading="searchLoading"
        placeholder="请输入模具号"
        class="flex-1 min-w-50"
        @search="handleSearch"
        @select="handleMoldCodeSelect"
      />
      <!-- 搜索按钮 -->
      <button
        class="h-12 px-6 rounded-xl bg-(--bg-surface) border border-(--border-subtle) font-primary text-sm text-(--text-primary) touch-target touch-interactive disabled:opacity-50 flex items-center gap-2"
        :disabled="!searchKeyword || loading"
        @click="handleMoldCodeSelect(searchKeyword)"
      >
        <!-- Loading 图标 -->
        <svg
          v-if="loading"
          class="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
        </svg>
        <span>搜索</span>
      </button>
      <!-- 重置按钮 -->
      <button
        class="h-12 px-6 rounded-xl bg-(--bg-surface) border border-(--border-subtle) font-primary text-sm text-(--text-secondary) touch-target touch-interactive"
        @click="handleReset"
      >
        重置
      </button>
      <!-- 确认锁定按钮 -->
      <button
        class="h-12 px-6 rounded-xl gradient-primary font-primary text-sm font-medium text-white touch-target touch-interactive disabled:opacity-50 flex items-center gap-2"
        :disabled="!selectedMold || !canLockMore || loading"
        @click="handleLockClick"
      >
        <!-- Loading 图标 -->
        <svg
          v-if="loading"
          class="w-4 h-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
        </svg>
        <span>确认锁定</span>
      </button>
      <!-- 关闭按钮 -->
      <button
        class="h-12 px-6 rounded-xl bg-(--bg-surface) border border-(--border-subtle) font-primary text-sm text-(--text-secondary) touch-target touch-interactive"
        @click="emit('close')"
      >
        关闭
      </button>
    </div>

    <!-- 模具列表 -->
    <MoldLockTable
      :data="searchResults"
      :selected-mold="selectedMold"
      :craft-options="craftOptions"
      :loading="loading"
      @select="handleMoldSelect"
      @craft-change="handleCraftChange"
    />

    <!-- 二次确认模态框 -->
    <ConfirmModal
      :visible="showConfirmModal"
      title="确认锁定"
      :message="`确定要锁定模具 ${selectedMold?.mouldCode || ''} 吗？`"
      confirm-text="确认锁定"
      cancel-text="取消"
      :loading="loading"
      @confirm="handleConfirm"
      @cancel="handleCancelConfirm"
    />
  </div>
</template>
