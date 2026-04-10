import {type FC, useEffect, useRef, useState} from 'react'
import {Camera, Save} from 'lucide-react'
import {useTheme} from '@/hooks/useTheme'
import {getUserInfo, updateProfile, uploadAvatar, type UserInfo} from '@/api/auth'
import toast from 'react-hot-toast'

export const ProfileSettings: FC = () => {
  const { isDark } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadUserInfo = async () => {
    try {
      setLoading(true)
      const info = await getUserInfo()
      setUserInfo(info)
      setNickname(info.nickname || '用户')
      // bio 临时存储在 email 字段中
      setBio(info.email || '')
    } catch (error) {
      console.error('加载用户信息失败:', error)
      toast.error('加载用户信息失败')
    } finally {
      setLoading(false)
    }
  }

  // 页面加载时获取用户信息
  useEffect(() => {
    void loadUserInfo()
  }, [])

  const handleSave = async () => {
    try {
      setLoading(true)
      const updatedInfo = await updateProfile({
        nickname,
        bio,
      })
      
      setUserInfo(updatedInfo)
      setIsEditing(false)
      toast.success('保存成功')
      
      // 更新 localStorage 中的用户信息
      const storedUserInfo = localStorage.getItem('user_info')
      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo)
        localStorage.setItem('user_info', JSON.stringify({
          ...parsed,
          nickname: updatedInfo.nickname,
          avatar: updatedInfo.avatar,
        }))
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB')
      return
    }

    try {
      setUploading(true)
      const avatarUrl = await uploadAvatar(file)
      
      // 更新头像
      const updatedInfo = await updateProfile({
        avatar: avatarUrl,
      })
      
      setUserInfo(updatedInfo)
      toast.success('头像上传成功')
      
      // 更新 localStorage
      const storedUserInfo = localStorage.getItem('user_info')
      if (storedUserInfo) {
        const parsed = JSON.parse(storedUserInfo)
        localStorage.setItem('user_info', JSON.stringify({
          ...parsed,
          avatar: updatedInfo.avatar,
        }))
      }
    } catch (error) {
      console.error('上传失败:', error)
      toast.error('上传失败，请重试')
    } finally {
      setUploading(false)
      // 清空 input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 获取头像首字母
  const getAvatarInitial = () => {
    if (userInfo?.nickname) {
      return userInfo.nickname.charAt(0).toUpperCase()
    }
    return 'U'
  }

  if (loading && !userInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`h-8 w-8 animate-spin rounded-full border-4 ${
          isDark ? 'border-slate-700 border-t-sky-500' : 'border-slate-200 border-t-sky-500'
        }`}></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>个人资料</h2>
        <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>管理您的个人信息和头像</p>
      </div>

      {/* 头像卡片 */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-6">
          {/* 头像 */}
          <div className="relative">
            {userInfo?.avatar ? (
              <img
                src={userInfo.avatar}
                alt="头像"
                className="h-24 w-24 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-violet-500 text-3xl font-bold text-white shadow-lg">
                {getAvatarInitial()}
              </div>
            )}
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={uploading}
              className={`absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border shadow-md transition ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-sky-400 hover:bg-slate-700'
                  : 'border-white bg-white text-sky-500 hover:bg-slate-50'
              } ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-label="更换头像"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => void handleFileChange(e)}
              className="hidden"
            />
          </div>

          {/* 头像信息 */}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>头像</h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              支持 JPG、PNG 格式，文件小于 2MB
            </p>
          </div>
        </div>
      </div>

      {/* 基本信息表单 */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>基本信息</h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>更新您的昵称和个人签名</p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                isDark
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              编辑
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {/* 昵称 */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              昵称
            </label>
            {isEditing ? (
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'border-slate-700 bg-slate-800/50 text-slate-100 focus:border-sky-500 focus:ring-sky-500/20'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-sky-500 focus:ring-sky-500/20'
                }`}
                placeholder="请输入昵称"
              />
            ) : (
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{nickname}</p>
            )}
          </div>

          {/* 个人签名 */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              个人签名
            </label>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className={`mt-2 w-full resize-none rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'border-slate-700 bg-slate-800/50 text-slate-100 focus:border-sky-500 focus:ring-sky-500/20'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-sky-500 focus:ring-sky-500/20'
                }`}
                placeholder="介绍一下自己..."
              />
            ) : (
              <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {bio || '还没有设置签名'}
              </p>
            )}
          </div>

          {/* 保存按钮 */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  isDark
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-sky-600"
              >
                <Save className="h-4 w-4" />
                保存更改
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 账号信息（只读） */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>账号信息</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>用户 ID</p>
            <p className={`mt-1 text-sm font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {userInfo?.user_id || '加载中...'}
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>手机号</p>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {userInfo?.phone || '加载中...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
