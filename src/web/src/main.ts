/**
 * @file 应用入口文件
 * @description Vue 应用初始化，配置 Pinia 状态管理和路由
 * @module main
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/tailwind.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
