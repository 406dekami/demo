# RAG 数字逻辑学习助手 - 前端

基于 **React 19 + TypeScript + Vite** 构建的现代化学习平台前端，提供知识库管理、智能问答、思维导图学习路径等功能。

## 🚀 核心功能

### ✅ 已实现

- **用户认证系统**
  - 手机号注册/登录
  - Token 自动管理
  - 个人资料编辑（昵称、头像、签名）

- **知识库管理**
  - 创建/编辑/删除知识库
  - 多格式文档上传（PDF、Word、TXT等）
  - 文档自动分块与向量化
  - 知识库封面自定义

- **RAG 智能问答**
  - Notebook 笔记本模式
  - 单知识库精准问答
  - 对话历史记录
  - 上下文贯通（conversation_id）

- **思维导图学习路径**
  - 四级层级结构可视化
  - 节点级问答助手
  - 学习进度追踪（叶子节点统计）
  - 完成状态级联逻辑
  - 含学习路径的增强检索

- **模型管理**
  - LLM 厂商列表展示
  - API Key 验证
  - 模型配置添加

### ⏳ 规划中

- 多知识库融合检索
- 知识图谱独立可视化页面
- 底层数据源统一（MindMap ↔ KnowledgeGraph）
- 更完善的模型配置闭环

---

## 📦 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | React 19 + TypeScript |
| **构建工具** | Vite 8.0 |
| **状态管理** | Zustand |
| **路由** | React Router v6 |
| **UI 组件** | Lucide Icons + 自定义组件 |
| **HTTP 客户端** | Axios（统一拦截器） |
| **样式方案** | Tailwind CSS |
| **通知提示** | react-hot-toast |

---

## 🛠️ 快速开始

### 前置要求

- Node.js >= 20
- pnpm（推荐）或 npm

### 安装依赖

```bash
cd my-rag-frontend
pnpm install
```

### 启动开发服务器

```bash
pnpm run dev
```

访问：`http://localhost:5173`

### 构建生产版本

```bash
pnpm run build
```

构建产物位于 `dist/` 目录。

### 预览生产构建

```bash
pnpm run preview
```

---

## 📁 项目结构

```
my-rag-frontend/
├── src/
│   ├── api/                  # API 调用层
│   │   ├── client.ts         # 统一 axios 实例（拦截器）
│   │   ├── auth.ts           # 认证相关接口
│   │   ├── knowledge.ts      # 知识库/Notebook 接口
│   │   ├── mindMap.ts        # 思维导图接口
│   │   └── knowledgeGraph.ts # 知识图谱接口
│   │
│   ├── components/           # 可复用组件
│   │   ├── auth/             # 登录/注册页面
│   │   ├── knowledge/        # 知识库卡片、上传区等
│   │   ├── notebook/         # Notebook 聊天界面
│   │   ├── settings/         # 设置页面组件
│   │   └── common/           # 通用组件
│   │
│   ├── pages/                # 页面组件
│   │   ├── home.tsx          # 首页（知识库列表）
│   │   ├── Knowledge/        # 知识库详情页
│   │   ├── Notebook/         # Notebook 详情页
│   │   ├── MindMap/          # 思维导图页
│   │   ├── SettingsPage.tsx  # 设置页
│   │   └── LandingPage.tsx   # 落地页
│   │
│   ├── stores/               # Zustand 状态管理
│   │   ├── notebookStore.ts  # Notebook 对话状态（消息、会话 ID）
│   │   └── knowledgeStore.ts # 知识库状态（当前 KB、文档列表、上传状态）
│   │
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useTheme.ts       # 主题切换（深色/浅色）
│   │   ├── use-factories.ts  # LLM 厂商数据获取
│   │   ├── use-model-verify.ts # 模型 API Key 验证
│   │   ├── useMindMap.ts     # 思维导图交互逻辑
│   │   └── use-llm-request.ts # LLM 请求封装
│   │
│   ├── layouts/              # 布局组件
│   │   └── MainLayout.tsx    # 主布局（侧边栏+内容区）
│   │
│   ├── types.ts              # 全局 TypeScript 类型定义
│   ├── App.tsx               # 路由配置
│   └── main.tsx              # 应用入口
│
├── public/                   # 静态资源
├── dist/                     # 构建产物
├── package.json
├── vite.config.ts            # Vite 配置
└── tsconfig.json             # TypeScript 配置
```

---

## 🔑 关键约定

### 1. 统一 API 响应格式

所有后端接口返回：

```typescript
interface ApiResponse<T = unknown> {
  code: number      // 0=成功, 401/403/404/409/500=错误
  message: string   // 提示信息
  data?: T          // 业务数据（可选）
}
```

### 2. 统一 HTTP 客户端

所有 API 调用通过 `src/api/client.ts` 的 `apiClient`：

```typescript
import apiClient from '@/api/client'

// 自动注入 Token
const response = await apiClient.get('/auth/userinfo')

// 统一错误处理（401 自动跳转登录）
```

### 3. Notebook 字段规范

```typescript
interface Notebook {
  id: string
  title: string              // 标题（不使用 name）
  kb_ids: string[]           // 关联的知识库 ID 数组
  model_name?: string        // 使用的模型
  system_prompt?: string     // 系统提示词
}
```

**注意**：当前版本仅支持单知识库，`kb_ids[0]` 为实际使用的知识库。

### 4. 思维导图进度追踪

```typescript
interface UserProgress {
  completed_ids: string[]    // 已完成的节点 ID
  total_nodes: number        // 总叶子节点数
  completed_count: number    // 已完成的叶子节点数
}
```

**级联逻辑**：
- 标记叶子节点完成 → 自动检查父节点的所有子节点是否完成
- 如果全部完成 → 自动标记父节点完成（递归向上）
- 取消完成 → 级联取消所有后代节点

---

## 🎨 UI/UX 特性

- **深色/浅色主题**：自动检测系统偏好，支持手动切换
- **响应式设计**：适配桌面端和移动端
- **加载状态**：统一的 Skeleton 骨架屏
- **错误提示**：Toast 通知 + 友好的错误信息
- **动画效果**：平滑的过渡动画和微交互

---

## 🔧 开发指南

### 添加新 API 接口

1. 在 `src/api/` 下创建或更新模块文件
2. 使用 `apiClient` 发起请求
3. 处理 `ApiResponse` 格式

```typescript
// 示例：src/api/example.ts
import apiClient from './client'
import type { ApiResponse } from '../types'

export interface ExampleData {
  id: string
  name: string
}

export const getExample = async (): Promise<ExampleData> => {
  const response = await apiClient.get<ApiResponse<ExampleData>>('/example')
  if (response.data.code !== 0) {
    throw new Error(response.data.message)
  }
  return response.data.data!
}
```

### 添加新页面

1. 在 `src/pages/` 下创建页面组件
2. 在 `App.tsx` 中添加路由
3. 如需侧边栏导航，在 `MainLayout.tsx` 中添加菜单项

### 状态管理

使用 **Zustand** 进行全局状态管理：

#### 1. Notebook Store (`notebookStore.ts`)

管理 Notebook 对话相关状态：

```typescript
interface NotebookState {
  selectedKbIds: string[]      // 选中的知识库 ID（限制为 1 个）
  conversationId: string | null // 会话 ID
  messages: Message[]           // 消息列表
  draft: string                 // 输入框草稿
  
  // 方法
  setSelectedKbIds: (kbIds) => void
  setConversationId: (id) => void
  addMessage: (message) => void
  loadFromStorage: (notebookId) => void  // 从 localStorage 加载
  saveToStorage: (notebookId) => void    // 保存到 localStorage
}
```

**特性**：
- ✅ 自动持久化到 `localStorage`
- ✅ 支持多 Notebook 隔离存储
- ✅ 单知识库限制（`slice(0, 1)`）

#### 2. Knowledge Store (`knowledgeStore.ts`)

管理知识库详情和文档上传状态：

```typescript
interface KnowledgeState {
  currentKb: KnowledgeBase | null  // 当前知识库
  documents: Document[]             // 文档列表
  isEditMode: boolean               // 编辑模式
  uploadingFiles: UploadFile[]      // 上传中文件列表
  
  // 方法
  setCurrentKb: (kb) => void
  setDocuments: (docs) => void
  addUploadingFile: (file) => void
  updateUploadingFile: (id, updates) => void
}
```

**使用场景**：
- 知识库详情页的文档管理
- 文件上传进度追踪
- 编辑模式切换

#### 3. 用户认证状态

**不使用 Zustand**，直接用 `localStorage`：

```typescript
// 登录时保存
localStorage.setItem('auth_token', token)
localStorage.setItem('user_info', JSON.stringify(userInfo))

// API 拦截器自动读取
const token = localStorage.getItem('auth_token')
config.headers.Authorization = `Bearer ${token}`
```

**原因**：
- 用户状态简单（只需 Token + 基本信息）
- 不需要响应式更新
- 减少不必要的复杂度

---

## 📊 性能优化

- **代码分割**：Vite 自动进行路由级代码分割
- **懒加载**：大型组件使用 `React.lazy()`
- **缓存策略**：API 响应缓存 + localStorage 持久化
- **Tree Shaking**：未使用的代码自动移除

---

## 🐛 常见问题

### 1. 登录后刷新页面需要重新登录？

检查 `localStorage` 中的 `auth_token` 是否存在，确认 `apiClient` 拦截器正确注入 Token。

### 2. API 请求失败但无错误提示？

检查 `src/api/client.ts` 中的错误处理逻辑，确保 Toast 正常显示。

### 3. 思维导图节点无法标记完成？

确认用户已登录，Token 有效，且后端 `/mind-map/progress/toggle` 接口正常。

---

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add your feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

---

## 📝 许可证

MIT License

---

## 📞 联系方式

如有问题或建议，请提交 Issue 或联系维护者。
