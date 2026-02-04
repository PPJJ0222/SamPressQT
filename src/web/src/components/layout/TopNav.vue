<script setup lang="ts">
// 顶部导航栏组件
import NavItem from '../ui/NavItem.vue'

interface NavItemConfig {
  label: string
  key: string
}

interface Props {
  logo?: string
  navItems?: NavItemConfig[]
  activeNav?: string
}

withDefaults(defineProps<Props>(), {
  logo: 'SamPress',
  activeNav: 'dashboard',
  navItems: () => [
    { label: '操作手册', key: 'manual' },
    { label: '设备', key: 'devices' },
    { label: '信号调试', key: 'analytics' },
    { label: '日志', key: 'logs' }
  ]
})

const emit = defineEmits<{
  navigate: [key: string]
  notification: []
}>()
</script>

<template>
  <header
    class="flex items-center justify-between gap-6 h-16 w-full px-6 rounded-2xl bg-(--bg-glass) glass-effect shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
  >
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <span class="font-primary text-lg font-semibold text-(--text-primary)">{{ logo }}</span>
      <span class="w-2 h-5 rounded-sm bg-(--green-primary)" />
    </div>

    <!-- 导航项 -->
    <nav class="flex items-center gap-2">
      <NavItem
        v-for="item in navItems"
        :key="item.key"
        :label="item.label"
        :active="activeNav === item.key"
        @click="emit('navigate', item.key)"
      />
    </nav>

    <!-- 用户区域 -->
    <div class="flex items-center gap-3">
      <button class="touch-target touch-interactive" @click="emit('notification')">
        <svg class="w-5 h-5 text-(--text-secondary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
      </button>
      <div class="w-9 h-9 rounded-full gradient-avatar flex items-center justify-center">
        <span class="text-white text-xs font-medium">U</span>
      </div>
    </div>
  </header>
</template>
