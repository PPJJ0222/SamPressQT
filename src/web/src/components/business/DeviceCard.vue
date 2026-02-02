<script setup lang="ts">
// 设备卡片组件
import Status from '../ui/Status.vue'

interface Props {
  name?: string
  model?: string
  status?: 'running' | 'stopped' | 'error' | 'warning'
  params?: { label: string; value: string | number; unit?: string }[]
}

withDefaults(defineProps<Props>(), {
  name: 'Device',
  model: 'Model',
  status: 'running',
  params: () => []
})
</script>

<template>
  <div class="flex flex-col gap-4 w-70 p-5 rounded-2xl bg-(--bg-glass) glass-effect shadow-[0_4px_16px_rgba(0,0,0,0.07)]">
    <!-- 头部 -->
    <div class="flex items-center justify-between w-full">
      <div class="flex flex-col gap-0.5">
        <span class="font-primary text-sm font-medium text-(--text-primary)">{{ name }}</span>
        <span class="font-primary text-[11px] text-(--text-tertiary)">{{ model }}</span>
      </div>
      <Status :variant="status" />
    </div>

    <!-- 参数 -->
    <div class="flex gap-4 w-full">
      <div v-for="param in params" :key="param.label" class="flex flex-col gap-1 flex-1">
        <span class="font-primary text-[11px] text-(--text-tertiary)">{{ param.label }}</span>
        <span class="font-primary text-base font-medium text-(--text-primary)">
          {{ param.value }}<span v-if="param.unit" class="text-xs text-(--text-tertiary) ml-0.5">{{ param.unit }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
