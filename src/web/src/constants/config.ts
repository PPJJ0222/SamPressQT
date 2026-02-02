/**
 * 应用配置常量
 */

// 应用基本信息
export const APP_CONFIG = {
  NAME: 'SamPressQT',
  VERSION: '1.0.0',
} as const

// API 配置
export const API_CONFIG = {
  TIMEOUT: 30000,           // 请求超时时间（毫秒）
  RETRY_COUNT: 3,           // 重试次数
  RETRY_DELAY: 1000,        // 重试间隔（毫秒）
} as const

// 存储键名
export const STORAGE_KEYS = {
  TOKEN: 'sam_token',
  USER_INFO: 'sam_user_info',
  THEME: 'sam_theme',
} as const

// UI 配置
export const UI_CONFIG = {
  TOAST_DURATION: 3000,     // Toast 显示时长（毫秒）
  DEBOUNCE_DELAY: 300,      // 输入防抖延迟（毫秒）
  ANIMATION_DURATION: 150,  // 动画时长（毫秒）
} as const

// 触屏配置
export const TOUCH_CONFIG = {
  MIN_TARGET_SIZE: 44,      // 最小触控目标（px）
  MIN_BUTTON_SIZE: 48,      // 最小按钮尺寸（px）
  MIN_SPACING: 8,           // 最小元素间距（px）
} as const
