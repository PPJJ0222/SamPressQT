<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TopNav } from './components/layout'
import { ToastContainer } from './components/ui'
import { useUserStore } from './stores/useUserStore'
import { usePlcStore } from './stores/plc/usePlcStore'
import { initLogBridge } from './bridge/log'
import { getPlcBridge } from './bridge/plc'

const userStore = useUserStore()
const plcStore = usePlcStore()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')

/**
 * 当前激活的导航项
 * 从路由路径派生，确保刷新页面后导航状态与路由同步
 */
const activeNav = computed(() => {
  const path = route.path.slice(1)
  return path || 'dashboard'
})

/**
 * 处理导航点击事件
 * @param key - 导航项的 key
 * @description 路由跳转后，activeNav 会自动从路由派生更新
 */
function handleNavigate(key: string) {
  router.push(`/${key}`)
}

onMounted(async () => {
  try {
    // 初始化日志桥接
    await initLogBridge()
    // 初始化 PLC 桥接（必须在 initWithToken 之前）
    await plcStore.init()

    // 免登录：使用设备配置的账号自动登录
    const deviceUser = import.meta.env.VITE_DEVICE_USERNAME
    if (deviceUser) {
      await userStore.loginFree(deviceUser)
      await userStore.getUserInfo()

      // 登录成功后，通知 C++ 端并传递 Token 以初始化设备配置
      const bridge = getPlcBridge()
      if (bridge && userStore.token) {
        bridge.initWithToken(userStore.token)
      }
    }
  } catch (e: unknown) {
    const err = e as Error
    error.value = err.message || '初始化失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="h-screen flex flex-col bg-(--bg-page)">
    <TopNav :active-nav="activeNav" @navigate="handleNavigate" />
    <main class="flex-1 overflow-auto">
      <div v-if="loading" class="flex items-center justify-center h-64">
        <p class="text-(--text-secondary)">系统初始化中...</p>
      </div>
      <div v-else-if="error" class="p-6">
        <p class="text-(--red-error)">{{ error }}</p>
      </div>
      <router-view v-else />
    </main>
    <!-- 全局 Toast 通知容器 -->
    <ToastContainer />
  </div>
</template>
