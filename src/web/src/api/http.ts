/**
 * @file HTTP 请求封装
 * @description Axios 实例配置、请求/响应拦截器、错误处理
 * @module api/http
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { getToken, removeToken } from './auth'
import { logger } from '@/utils/logger'
import { useToastStore } from '@/stores/useToastStore'

/** API 响应类型 */
export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

// 错误码映射
const errorCode: Record<number | string, string> = {
  401: '认证失败，请重新登录',
  403: '当前操作没有权限',
  404: '访问资源不存在',
  500: '服务器内部错误',
  default: '系统未知错误'
}

/**
 * 自定义参数序列化函数
 * @description 将对象参数序列化为 URL 查询字符串，数组使用重复参数格式
 * @example { a: 1, b: [2, 3] } => "a=1&b=2&b=3"
 */
function serializeParams(params: Record<string, unknown>): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      // 数组使用重复参数格式：key=v1&key=v2
      for (const item of value) {
        if (item !== null && item !== undefined) {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
        }
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    }
  }

  return parts.join('&')
}

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  },
  // 自定义参数序列化，使用重复参数格式兼容 Spring 后端
  paramsSerializer: {
    serialize: serializeParams
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    const isToken = (config.headers || {}).isToken === false
    if (token && !isToken) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // FormData 请求需要删除 Content-Type，让浏览器自动设置 multipart/form-data
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => {
    logger.error(`请求错误: ${error.message || error}`, { toast: false })
    return Promise.reject(error)
  }
)

/**
 * 获取 Toast Store 实例
 * @description 延迟获取，确保 Pinia 已初始化
 */
function getToastStore() {
  try {
    return useToastStore()
  } catch {
    return null
  }
}

// 响应拦截器
service.interceptors.response.use(
  (res: AxiosResponse<ApiResponse>) => {
    const code = res.data.code || 200
    // 获取错误信息：优先使用后台返回的 msg，其次使用 errorCode 映射
    const msg = res.data.msg || errorCode[code] || errorCode['default']
    const toast = getToastStore()

    if (code === 401) {
      removeToken()
      logger.error(`登录状态已过期: ${msg}`, { toast: false })
      // 显示提示信息，优先使用服务器返回的消息
      toast?.error(msg, 5000)
      return Promise.reject(new Error(msg))
    } else if (code === 500) {
      logger.error(`服务器错误: ${msg}`, { toast: false })
      // 显示错误信息，持续 15 秒（与原项目一致）
      toast?.error(msg, 15000)
      return Promise.reject(new Error(msg))
    } else if (code !== 200) {
      logger.error(`请求失败: ${msg}`, { toast: false })
      // 显示错误信息，持续 15 秒（与原项目一致）
      toast?.error(msg, 15000)
      return Promise.reject(new Error(msg))
    }
    // 类型断言：Axios 拦截器返回类型限制，需要断言为 unknown 再由调用方指定具体类型
    return res.data as unknown as AxiosResponse
  },
  (error) => {
    let message = error.message
    if (message === 'Network Error') {
      message = '后端接口连接异常'
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时'
    } else if (message.includes('Request failed with status code')) {
      message = '系统接口' + message.substring(message.length - 3) + '异常'
    }
    logger.error(`响应错误: ${message}`, { toast: false })
    // 显示网络错误提示
    const toast = getToastStore()
    toast?.error(message, 5000)
    return Promise.reject(error)
  }
)

export default service
