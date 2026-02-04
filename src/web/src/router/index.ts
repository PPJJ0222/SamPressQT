import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/manual'
    },
    {
      path: '/manual',
      name: 'Manual',
      component: () => import('@/views/Manual.vue')
    },
    {
      path: '/devices',
      name: 'Devices',
      component: () => import('@/views/Devices.vue')
    },
    {
      path: '/analytics',
      name: 'SignalDebug',
      component: () => import('@/views/SignalDebug.vue')
    },
    {
      path: '/logs',
      name: 'Logs',
      component: () => import('@/views/Logs.vue')
    }
  ]
})

export default router
