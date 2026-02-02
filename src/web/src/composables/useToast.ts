/**
 * @file Toast 提示组合式函数
 * @description 全局 Toast 状态管理，提供统一的提示调用接口
 * @module composables/useToast
 */

import { ref } from 'vue'

/** Toast 类型 */
export type ToastVariant = 'info' | 'warning' | 'error' | 'success'

/** Toast 配置 */
export interface ToastConfig {
  /** 提示消息 */
  message: string
  /** 提示类型 */
  variant: ToastVariant
  /** 显示时长（毫秒） */
  duration: number
}

/** Toast 状态（全局单例） */
const visible = ref(false)
const message = ref('')
const variant = ref<ToastVariant>('warning')
const duration = ref(3000)

/**
 * Toast 提示组合式函数
 * @description 提供全局 Toast 显示/隐藏控制
 */
export function useToast() {
  /**
   * 显示 Toast 提示
   * @param msg - 提示消息
   * @param type - 提示类型，默认 warning
   * @param time - 显示时长，默认 3000ms
   */
  function showToast(msg: string, type: ToastVariant = 'warning', time = 3000) {
    message.value = msg
    variant.value = type
    duration.value = time
    visible.value = true
  }

  /** 隐藏 Toast */
  function hideToast() {
    visible.value = false
  }

  /** 显示警告提示 */
  function warning(msg: string, time = 3000) {
    showToast(msg, 'warning', time)
  }

  /** 显示错误提示 */
  function error(msg: string, time = 3000) {
    showToast(msg, 'error', time)
  }

  /** 显示成功提示 */
  function success(msg: string, time = 3000) {
    showToast(msg, 'success', time)
  }

  /** 显示信息提示 */
  function info(msg: string, time = 3000) {
    showToast(msg, 'info', time)
  }

  return {
    // 状态
    visible,
    message,
    variant,
    duration,
    // 方法
    showToast,
    hideToast,
    warning,
    error,
    success,
    info
  }
}
