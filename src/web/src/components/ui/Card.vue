<script setup lang="ts">
// 通用卡片组件
interface Props {
  title?: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div
    class="flex flex-col w-80 rounded-2xl bg-(--bg-glass) glass-effect shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
  >
    <!-- 头部插槽 -->
    <div class="flex flex-col gap-1 p-5 w-full">
      <slot name="header">
        <h3 class="font-primary text-sm font-medium text-(--text-primary)">
          {{ title }}
        </h3>
        <p v-if="description" class="font-primary text-[11px] text-(--text-tertiary)">
          {{ description }}
        </p>
      </slot>
    </div>

    <!-- 内容插槽 -->
    <div class="flex flex-col gap-4 px-5 w-full">
      <slot />
    </div>

    <!-- 操作插槽 -->
    <div class="flex justify-end gap-3 p-5 w-full">
      <slot name="actions" />
    </div>
  </div>
</template>
