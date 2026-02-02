import request from '../http'

// 用户信息类型
export interface UserInfo {
  userId: string
  userName: string
  nickName: string
  avatar: string
  roles: string[]
  permissions: string[]
  orgId: number | null
}

/** 登录响应类型 */
interface LoginResponse {
  token: string
}

/** 用户信息响应类型 */
interface UserInfoResponse {
  user: UserInfo
  roles: string[]
  permissions: string[]
}

// 免登录（工控机场景）
export function loginByFree(userName: string): Promise<LoginResponse> {
  return request({
    url: '/loginByFree',
    method: 'post',
    headers: {
      isToken: false
    },
    data: { username: userName }
  })
}

// 获取用户信息
export function getInfo(): Promise<UserInfoResponse> {
  return request({
    url: '/getInfo',
    method: 'get'
  })
}

// 退出登录
export function logout(): Promise<void> {
  return request({
    url: '/logout',
    method: 'post'
  })
}
