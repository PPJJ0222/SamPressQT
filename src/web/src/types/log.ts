/**
 * @file 日志类型定义
 * @description 定义日志相关的类型接口
 * @module types/log
 */

/** 日志级别 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success'

/** 单条日志记录 */
export interface LogEntry {
  /** ISO 时间戳 */
  timestamp: string
  /** 日志级别 */
  level: LogLevel
  /** 日志消息 */
  message: string
}

/** 日志文件信息 */
export interface LogFile {
  /** 文件名，如 2026-02-02_15.txt */
  filename: string
  /** 日期 YYYY-MM-DD */
  date: string
  /** 小时 0-23 */
  hour: number
  /** 完整路径 */
  path: string
}

/** 日志筛选级别（包含 ALL 选项） */
export type LogFilterLevel = LogLevel | 'all'
