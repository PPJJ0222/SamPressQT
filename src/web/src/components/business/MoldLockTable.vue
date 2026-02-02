<script setup lang="ts">
/**
 * @file 模具锁定列表组件
 * @description 展示可锁定的模具列表，支持单选和工艺选择
 */
import { computed } from 'vue'
import { Dropdown } from '@/components/ui'
import type { MoldSearchInfo } from '@/types/mold'
import type { PlineCraft } from '@/types/device'

interface Props {
  /** 模具列表数据 */
  data?: MoldSearchInfo[]
  /** 当前选中的模具 */
  selectedMold?: MoldSearchInfo | null
  /** 工艺选项列表 */
  craftOptions?: PlineCraft[]
  /** 是否正在加载 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  selectedMold: null,
  craftOptions: () => [],
  loading: false
})

const emit = defineEmits<{
  select: [mold: MoldSearchInfo]
  craftChange: [craftCode: string, craftName: string]
}>()

/** 表格列定义 */
const columns = [
  { key: 'selection', label: '选择', width: 50 },
  { key: 'index', label: '序号', width: 50 },
  { key: 'makeOrderNumber', label: '制造令号', width: 140 },
  { key: 'mouldCode', label: '模具号', width: 140 },
  { key: 'name', label: '模具名称', width: 140 },
  { key: 'stages', label: '工序号', width: 100 },
  { key: 'craftCode', label: '选择工艺' }
]

/**
 * 生成行的唯一标识
 * @description 使用模具号+制造令号+工序号组合作为唯一标识，避免重复
 */
const getRowKey = (mold: MoldSearchInfo) => {
  return `${mold.mouldCode || ''}_${mold.makeOrderNumber || ''}_${mold.stages || ''}`
}

/** 是否选中某行 */
const isSelected = (mold: MoldSearchInfo) => {
  if (!props.selectedMold) return false
  return getRowKey(props.selectedMold) === getRowKey(mold)
}

/**
 * 获取行的工艺编码
 * @description 选中行使用 selectedMold 的工艺，未选中行使用原始数据
 */
const getRowCraftCode = (mold: MoldSearchInfo) => {
  if (isSelected(mold) && props.selectedMold?.craftCode) {
    return props.selectedMold.craftCode
  }
  return mold.craftCode || ''
}

/**
 * 获取行的工艺名称
 * @description 用于未选中行显示当前工艺名称
 */
const getRowCraftName = (mold: MoldSearchInfo) => {
  const craftCode = getRowCraftCode(mold)
  if (!craftCode) return ''
  const craft = props.craftOptions.find(c => c.craftCode === craftCode)
  return craft?.craftName || ''
}

/** 转换工艺选项为 Dropdown 组件所需格式 */
const dropdownCraftOptions = computed(() =>
  props.craftOptions.map(c => ({
    label: c.craftName || '',
    value: c.craftCode || ''
  }))
)

/** 处理行选择 */
const handleSelect = (mold: MoldSearchInfo) => {
  emit('select', mold)
}

/**
 * 处理工艺选择（模态框模式）
 * @param craftCode - 选中的工艺编码
 */
const handleCraftSelect = (craftCode: string | number) => {
  const craft = props.craftOptions.find(c => c.craftCode === craftCode)
  if (craft) {
    emit('craftChange', craft.craftCode || '', craft.craftName || '')
  }
}
</script>

<template>
  <div class="flex flex-col flex-1 w-full min-h-0">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="w-6 h-6 border-2 border-(--blue-link) border-t-transparent rounded-full animate-spin" />
      <span class="ml-2 text-sm text-(--text-secondary)">加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="data.length === 0" class="flex items-center justify-center py-8 text-sm text-(--text-tertiary)">
      暂无数据，请先搜索模具
    </div>

    <!-- 表格 -->
    <div v-else class="flex flex-col flex-1 min-h-0 w-full rounded-xl bg-(--bg-glass) glass-effect border border-(--border-subtle) overflow-hidden">
      <!-- 表头 -->
      <div class="flex items-center h-10 px-3 bg-(--bg-surface)">
        <div
          v-for="col in columns"
          :key="col.key"
          :style="{ width: col.width ? `${col.width}px` : 'auto', flex: col.width ? 'none' : '1' }"
          class="font-primary text-xs font-medium text-(--text-secondary) px-1"
        >
          {{ col.label }}
        </div>
      </div>

      <!-- 数据行容器（可滚动） -->
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="(row, index) in data"
          :key="getRowKey(row)"
          class="flex items-center min-h-12 px-3 border-t border-(--border-subtle) touch-interactive"
          :class="{ 'bg-(--blue-light)': isSelected(row) }"
          @click="handleSelect(row)"
        >
        <!-- 选择列 -->
        <div style="width: 50px" class="flex items-center justify-center px-1">
          <div
            class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
            :class="isSelected(row) ? 'border-(--blue-link) bg-(--blue-link)' : 'border-(--border-subtle)'"
          >
            <svg v-if="isSelected(row)" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
        </div>

        <!-- 序号列 -->
        <div style="width: 50px" class="font-primary text-sm text-(--text-primary) px-1">
          {{ index + 1 }}
        </div>

        <!-- 制造令号列 -->
        <div style="width: 140px" class="font-primary text-sm text-(--text-primary) px-1 truncate">
          {{ row.makeOrderNumber }}
        </div>

        <!-- 模具号列 -->
        <div style="width: 140px" class="font-primary text-sm text-(--text-primary) px-1 truncate">
          {{ row.mouldCode }}
        </div>

        <!-- 模具名称列 -->
        <div style="width: 140px" class="font-primary text-sm text-(--text-primary) px-1 truncate">
          {{ row.name || '-' }}
        </div>

        <!-- 工序号列 -->
        <div style="width: 100px" class="font-primary text-sm text-(--text-primary) px-1 truncate">
          {{ row.stages }}
        </div>

        <!-- 工艺选择列 -->
        <div style="flex: 1" class="px-1" @click.stop>
          <!-- 选中行：显示 Dropdown 模态框选择器 -->
          <Dropdown
            v-if="isSelected(row)"
            :model-value="getRowCraftCode(row)"
            :options="dropdownCraftOptions"
            :columns="4"
            :use-modal="true"
            title="选择工艺"
            placeholder="请选择"
            class="w-full"
            @update:model-value="handleCraftSelect"
          />
          <!-- 未选中行：显示静态文本 -->
          <div
            v-else
            class="w-full h-9 px-2 flex items-center rounded-lg bg-(--bg-surface) border border-(--border-subtle) font-primary text-sm text-(--text-tertiary) opacity-50"
          >
            {{ getRowCraftName(row) || '请选择' }}
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
