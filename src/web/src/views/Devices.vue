<script setup lang="ts">
/**
 * @file 设备页面
 * @description 设备作业管理主页面，包含作业选择、操作按钮、作业信息展示
 * @module views/Devices
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { logger } from '@/utils/logger'
import { useErpStore } from '@/stores/erp/useErpStore'
import { useDeviceJobStore } from '@/stores/device/useDeviceJobStore'
import { useMoldStore } from '@/stores/mold/useMoldStore'
import {
  JobSelectionSection,
  ActionButtonsSection,
  CurrentJobTable,
  MoldUnlockPanel,
  DeviceParamsSection
} from '@/components/business'

const erpStore = useErpStore()
const deviceJobStore = useDeviceJobStore()
const moldStore = useMoldStore()

const { unlockPanelVisible } = storeToRefs(moldStore)

/** 当前作业区域元素引用 */
const currentJobSectionRef = ref<HTMLElement | null>(null)

/** 解锁面板顶部位置 */
const unlockPanelTop = ref(0)

/** 更新解锁面板位置 */
const updateUnlockPanelPosition = () => {
  if (currentJobSectionRef.value) {
    const rect = currentJobSectionRef.value.getBoundingClientRect()
    unlockPanelTop.value = rect.top + 40 // 标题高度 + 间距
  }
}

/** 当前设备 ID */
const currentDeviceId = computed(() => deviceJobStore.currentDeviceId)

/** 解锁面板是否显示 */
const showUnlockPanel = computed(() => unlockPanelVisible.value)

/** 页面初始化 */
onMounted(async () => {
  logger.info('设备页面初始化')

  // 并行加载 ERP 基础数据和作业数据
  await Promise.all([
    erpStore.initData(),
    deviceJobStore.initData()
  ])

  // 初始化解锁面板位置
  updateUnlockPanelPosition()
  window.addEventListener('resize', updateUnlockPanelPosition)

  logger.info('设备页面数据加载完成')
})

onUnmounted(() => {
  window.removeEventListener('resize', updateUnlockPanelPosition)
})

/**
 * 处理模具号点击，打开解锁面板
 * @param mouldCode - 模具号
 */
const handleUnlockMold = (mouldCode: string) => {
  logger.debug('点击模具号，打开解锁面板', { mouldCode })
  // 使用设备 ID 加载已锁定模具列表
  if (currentDeviceId.value) {
    moldStore.fetchLockedMolds(currentDeviceId.value)
  }
  moldStore.openUnlockPanel()
}

/** 关闭解锁面板 */
const handleCloseUnlockPanel = () => {
  moldStore.closeUnlockPanel()
}

/** 解锁成功回调 */
const handleUnlockSuccess = () => {
  logger.info('模具解锁成功')
  // 刷新压机作业信息
  deviceJobStore.fetchPressJobByIp()
}
</script>

<template>
  <div class="relative flex flex-col gap-5 p-6 h-full overflow-y-auto">
    <!-- 作业选择区域 -->
    <JobSelectionSection />

    <!-- 功能按钮区域（含内联展开的模具锁定面板） -->
    <ActionButtonsSection />

    <!-- 当前作业信息 -->
    <section ref="currentJobSectionRef" class="flex flex-col gap-4">
      <h2 class="text-base font-semibold text-(--text-primary)">
        当前作业信息
      </h2>
      <CurrentJobTable @unlock-mold="handleUnlockMold" />
    </section>

    <!-- 设备参数信息区域 -->
    <DeviceParamsSection />

    <!-- 解锁面板（fixed 定位遮盖，扩展到页面底部） -->
    <Transition name="slide-panel">
      <div
        v-if="showUnlockPanel"
        class="fixed left-6 right-6 bottom-6 z-10"
        :style="{ top: `${unlockPanelTop}px` }"
      >
        <MoldUnlockPanel
          :device-id="currentDeviceId"
          class="h-full"
          @close="handleCloseUnlockPanel"
          @success="handleUnlockSuccess"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 面板滑动展开动画 */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.3s ease-out;
}

.slide-panel-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.slide-panel-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
