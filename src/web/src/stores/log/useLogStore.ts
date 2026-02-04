/**
 * @file 日志 Store
 * @description 管理日志文件读取和展示
 * @module stores/log/useLogStore
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getPlcBridge } from '@/bridge/plc'
import type { LogEntry, LogFile, LogFilterLevel } from '@/types/log'
import { logger } from '@/utils/logger'

export const useLogStore = defineStore('log', () => {
  // ========== 状态 ==========
  /** 日志文件列表 */
  const files = ref<LogFile[]>([])
  /** 当前加载的日志条目 */
  const entries = ref<LogEntry[]>([])
  /** 选中的日期 */
  const selectedDate = ref<string>('')
  /** 筛选级别 */
  const filterLevel = ref<LogFilterLevel>('all')
  /** 加载状态 */
  const loading = ref(false)
  /** 错误信息 */
  const error = ref<string | null>(null)

  // ========== 计算属性 ==========
  /** 可用的日期列表（去重） */
  const availableDates = computed(() => {
    const dates = new Set(files.value.map(f => f.date))
    return Array.from(dates).sort().reverse()
  })

  /** 筛选后的日志条目 */
  const filteredEntries = computed(() => {
    if (filterLevel.value === 'all') {
      return entries.value
    }
    return entries.value.filter(e => e.level === filterLevel.value)
  })

  /** 各级别日志数量统计 */
  const levelCounts = computed(() => {
    const counts = { info: 0, warn: 0, error: 0, debug: 0, success: 0 }
    for (const entry of entries.value) {
      if (entry.level in counts) {
        counts[entry.level as keyof typeof counts]++
      }
    }
    return counts
  })

  // ========== 方法 ==========
  /**
   * 加载日志文件列表
   * @param days - 加载最近几天的日志，默认 3 天
   */
  async function loadLogFiles(days = 3) {
    const bridge = getPlcBridge()
    if (!bridge) {
      logger.warn('PlcBridge 未初始化')
      return
    }

    loading.value = true
    error.value = null

    try {
      const result = bridge.getLogFiles(days) as unknown

      if (result && typeof (result as { then?: unknown }).then === 'function') {
        const data = await (result as Promise<LogFile[]>)
        files.value = data || []
      } else {
        files.value = (result as LogFile[]) || []
      }

      logger.info(`已加载 ${files.value.length} 个日志文件`)

      // 默认选中最新日期
      if (files.value.length > 0 && !selectedDate.value) {
        selectedDate.value = files.value[0].date
      }
    } catch (err) {
      logger.error('加载日志文件列表失败', err)
      error.value = '加载日志文件列表失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载指定日期的日志内容
   * @param date - 日期字符串 YYYY-MM-DD
   */
  async function loadLogsByDate(date: string) {
    const bridge = getPlcBridge()
    if (!bridge) {
      logger.warn('PlcBridge 未初始化')
      return
    }

    // 获取该日期的所有文件
    const dateFiles = files.value.filter(f => f.date === date)
    if (dateFiles.length === 0) {
      entries.value = []
      return
    }

    loading.value = true
    error.value = null
    selectedDate.value = date

    try {
      const allEntries: LogEntry[] = []

      // 按小时倒序加载文件
      const sortedFiles = [...dateFiles].sort((a, b) => b.hour - a.hour)

      for (const file of sortedFiles) {
        const result = bridge.readLogFile(file.path) as unknown
        let content: string

        if (result && typeof (result as { then?: unknown }).then === 'function') {
          content = await (result as Promise<string>)
        } else {
          content = result as string
        }

        if (content) {
          const parsed = parseLogContent(content)
          allEntries.push(...parsed)
        }
      }

      // 按时间倒序排列
      entries.value = allEntries.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      logger.info(`已加载 ${entries.value.length} 条日志记录`)
    } catch (err) {
      logger.error('加载日志内容失败', err)
      error.value = '加载日志内容失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 解析日志文件内容
   * @param content - 日志文件原始内容
   * @returns 解析后的日志条目数组
   */
  function parseLogContent(content: string): LogEntry[] {
    const lines = content.split('\n').filter(line => line.trim())
    const parsed: LogEntry[] = []

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as LogEntry
        // 验证必要字段
        if (entry.timestamp && entry.level && entry.message) {
          parsed.push(entry)
        }
      } catch {
        // 跳过无法解析的行
        logger.warn('无法解析日志行', { line })
      }
    }

    return parsed
  }

  /** 设置筛选级别 */
  function setFilterLevel(level: LogFilterLevel) {
    filterLevel.value = level
  }

  /** 清空日志 */
  function clearEntries() {
    entries.value = []
  }

  return {
    // 状态
    files,
    entries,
    selectedDate,
    filterLevel,
    loading,
    error,
    // 计算属性
    availableDates,
    filteredEntries,
    levelCounts,
    // 方法
    loadLogFiles,
    loadLogsByDate,
    setFilterLevel,
    clearEntries,
  }
})
