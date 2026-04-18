// api/auth.ts - 认证相关 API 调用
import apiClient from './client'

export interface UserInfo {
  user_id: string
  phone: string
  nickname: string | null
  avatar: string | null
  email: string | null
  status: number
}

export interface UpdateProfileRequest {
  nickname?: string
  bio?: string
  avatar?: string
}

export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await apiClient.get<{ code: number; message: string; data: UserInfo }>('/auth/userinfo')
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '获取用户信息失败')
  }
  return response.data.data
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<UserInfo> => {
  const response = await apiClient.put<{ code: number; message: string; data: UserInfo }>('/auth/profile', data)
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '更新失败')
  }
  return response.data.data
}

export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<{
    code: number
    message: string
    data: { url: string }
  }>('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  if (response.data.code !== 0) {
    throw new Error(response.data.message || '上传失败')
  }

  return response.data.data.url
}
