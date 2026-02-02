/**
 * @file 用户状态管理
 * @description 管理用户认证、信息、角色和权限
 * @module stores/useUserStore
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginByFree, getInfo, logout, type UserInfo } from '@/api/modules/login'
import { getToken, setToken, removeToken } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  /** 认证 Token */
  const token = ref<string>(getToken() || '')
  /** 用户信息 */
  const userInfo = ref<UserInfo | null>(null)
  /** 用户角色列表 */
  const roles = ref<string[]>([])
  /** 用户权限列表 */
  const permissions = ref<string[]>([])

  /**
   * 免登录（工控机场景）
   * @param userName - 用户名
   * @returns 登录响应
   */
  async function loginFree(userName: string) {
    const res = await loginByFree(userName)
    token.value = res.token
    setToken(res.token)
    return res
  }

  /**
   * 获取用户信息
   * @returns 用户信息响应
   */
  async function getUserInfo() {
    const res = await getInfo()
    userInfo.value = res.user
    roles.value = res.roles || []
    permissions.value = res.permissions || []
    return res
  }

  /**
   * 退出登录（调用后端接口）
   */
  async function logOut() {
    await logout()
    token.value = ''
    userInfo.value = null
    roles.value = []
    permissions.value = []
    removeToken()
  }

  /**
   * 前端登出（仅清除本地状态）
   */
  function fedLogOut() {
    token.value = ''
    userInfo.value = null
    removeToken()
  }

  return {
    token,
    userInfo,
    roles,
    permissions,
    loginFree,
    getUserInfo,
    logOut,
    fedLogOut
  }
})
