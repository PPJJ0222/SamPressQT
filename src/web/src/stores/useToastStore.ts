/**
 * @file Toast 通知状态管理
 * @description 管理全局 Toast 通知队列，支持多个 Toast 同时显示
 * @module stores/useToastStore
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Toast 类型 */
export type ToastVariant = 'info' | 'warning' | 'error' | 'success'

/** Toast 项接口 */
export interface ToastItem {
  /** 唯一标识 */
  id: string
  /** 类型 */
  variant: ToastVariant
  /** 消息内容 */
  message: string
  /** 显示时长（毫秒），0 表示不自动关闭 */
  duration: number
}

/** 添加 Toast 的参数 */
export interface AddToastParams {
  variant: ToastVariant
  message: string
  /** 显示时长，默认 3000ms */
  duration?: number
}

/** 最大同时显示数量 */
const MAX_TOASTS = 5

/** 生成唯一 ID */
function generateId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export const useToastStore = defineStore('toast', () => {
  /** Toast 队列 */
  const toasts = ref<ToastItem[]>([])

  /**
   * 添加 Toast
   * @param params - Toast 参数
   * @returns Toast ID
   */
  function add(params: AddToastParams): string {
    const id = generateId()
    const toast: ToastItem = {
      id,
      variant: params.variant,
      message: params.message,
      duration: params.duration ?? 3000
    }

    // 使用不可变模式更新数组
    const currentToasts = toasts.value.length >= MAX_TOASTS
      ? toasts.value.slice(1) // 移除最早的
      : toasts.value

    toasts.value = [...currentToasts, toast]
    return id
  }

  /**
   * 移除指定 Toast
   * @param id - Toast ID
   */
  function remove(id: string): void {
    // 使用不可变模式过滤数组
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  /** 清空所有 Toast */
  function clear(): void {
    toasts.value = []
  }

  // 快捷方法
  const info = (message: string, duration?: number) =>
    add({ variant: 'info', message, duration })

  const success = (message: string, duration?: number) =>
    add({ variant: 'success', message, duration })

  const warn = (message: string, duration?: number) =>
    add({ variant: 'warning', message, duration })

  const error = (message: string, duration?: number) =>
    add({ variant: 'error', message, duration })

  return {
    toasts,
    add,
    remove,
    clear,
    info,
    success,
    warn,
    error
  }
})
