/**
 * @file Token 认证工具
 * @description 基于 Cookie 的 Token 存取管理
 * @module api/auth
 */

import Cookies from 'js-cookie'

/** Token 存储键名 */
const TokenKey = 'Admin-Token'

/**
 * 获取当前 Token
 * @returns Token 字符串，未登录时返回 undefined
 */
export function getToken(): string | undefined {
  return Cookies.get(TokenKey)
}

/**
 * 设置 Token
 * @param token - 认证 Token
 * @returns 设置后的 Token 值
 */
export function setToken(token: string): string | undefined {
  return Cookies.set(TokenKey, token)
}

/**
 * 移除 Token（退出登录）
 */
export function removeToken(): void {
  Cookies.remove(TokenKey)
}
