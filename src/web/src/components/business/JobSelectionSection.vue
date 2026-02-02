<script setup lang="ts">
/**
 * @file 作业选择区域组件
 * @description 包含班组、人员、工艺三个下拉选择框
 * @module components/business/JobSelectionSection
 */

import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Dropdown } from '@/components/ui'
import { useErpStore } from '@/stores/erp/useErpStore'
import { useDeviceJobStore } from '@/stores/device/useDeviceJobStore'
import { logger } from '@/utils/logger'

const erpStore = useErpStore()
const deviceJobStore = useDeviceJobStore()

const { productionLines, plineUsers, craftList, currentUserInfo } = storeToRefs(erpStore)
const { jobSelection } = storeToRefs(deviceJobStore)

/** 产线选项列表 */
const productionLineOptions = computed(() =>
  productionLines.value.map((p) => ({ label: p.name, value: p.code }))
)

/** 人员选项列表（根据产线获取，value 使用 userName） */
const personnelOptions = computed(() =>
  plineUsers.value.map((u) => ({ label: u.nickName, value: u.userName }))
)

/** 工艺选项列表（根据产线获取，value 使用 craftCode） */
const craftOptions = computed(() =>
  craftList.value.map((c) => ({ label: c.craftName || '', value: c.craftCode || '' }))
)

/** 初始化默认值：根据当前用户信息设置班组和人员 */
watch(
  currentUserInfo,
  (userInfo) => {
    if (userInfo && !jobSelection.value.teamId) {
      // 设置默认班组（产线编码）
      if (userInfo.plineCode) {
        jobSelection.value.teamId = userInfo.plineCode
      }
      // 设置默认人员（用户名）
      if (userInfo.userName) {
        jobSelection.value.personnelId = userInfo.userName
      }
      logger.debug('初始化作业选择默认值', {
        teamId: userInfo.plineCode,
        personnelId: userInfo.userName
      })
    }
  },
  { immediate: true }
)

/** 产线变化时重新加载人员和工艺数据 */
watch(
  () => jobSelection.value.teamId,
  async (newPlineCode) => {
    jobSelection.value.personnelId = undefined
    jobSelection.value.processId = undefined

    if (newPlineCode && typeof newPlineCode === 'string') {
      await erpStore.getQtUsers(newPlineCode)
    }
    logger.debug('产线选择变化，重新加载数据', { plineCode: newPlineCode })
  }
)
</script>

<template>
  <div class="flex flex-wrap items-end gap-4">
    <!-- 班组选择（3列） -->
    <div class="flex items-center gap-3">
      <span class="text-sm font-medium text-(--text-secondary)">班组</span>
      <Dropdown
        v-model="jobSelection.teamId"
        :options="productionLineOptions"
        :columns="3"
        placeholder="请选择"
        class="w-50"
      />
    </div>

    <!-- 人员选择（4列） -->
    <div class="flex items-center gap-3">
      <span class="text-sm font-medium text-(--text-secondary)">人员</span>
      <Dropdown
        v-model="jobSelection.personnelId"
        :options="personnelOptions"
        :columns="4"
        placeholder="请选择"
        class="w-50"
      />
    </div>

    <!-- 预选工艺选择（4列，模态框模式） -->
    <div class="flex flex-1 items-center gap-3">
      <span class="text-sm font-medium text-(--text-secondary) shrink-0">预选工艺</span>
      <Dropdown
        v-model="jobSelection.processId"
        :options="craftOptions"
        :columns="4"
        :use-modal="true"
        title="选择预选工艺"
        placeholder="请选择"
        class="flex-1"
      />
    </div>
  </div>
</template>
