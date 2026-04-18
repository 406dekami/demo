# RAG 数字逻辑学习助手

基于 FastAPI + React 的智能教育平台，集成知识图谱、RAG 问答和思维导图功能。

## 🚀 快速开始

### 环境要求

- Python 3.13+
- Node.js 24+
- Redis 6+ (可选，用于缓存)
- Neo4j 5.12+ (可选，用于知识图谱)

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 DASHSCOPE_API_KEY

# 启动服务
python server.py
```

访问 http://127.0.0.1:8000/docs 查看 API 文档

### 前端启动

```bash
cd my-rag-frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:5173

## 📁 项目结构

```
demo/
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── routers/       # API 路由
│   │   ├── rag/           # RAG 核心组件
│   │   ├── db/            # 数据库模型
│   │   └── services/      # 业务逻辑
│   ├── data/uploads/      # 上传文件存储
│   └── storage/           # 向量数据库
├── my-rag-frontend/       # React 前端
│   ├── src/
│   │   ├── api/          # API 调用
│   │   ├── pages/        # 页面组件
│   │   └── components/   # 通用组件
│   └── public/
└── docker-compose.dev.yml # 开发环境 Docker 配置
```

## 🔑 核心功能

### 1. 知识库管理
- 支持 PDF/DOCX/DOC 文档上传
- 自动分块、向量化存储
- 多知识库隔离

### 2. RAG 智能问答
- 基于通义千问模型
- 支持多轮对话
- 可关联多个知识库

### 3. 思维导图
- 四级层级结构
- 节点级问答
- 学习进度追踪
- 上下文增强检索（基于思维导图路径）

### 4. 知识图谱（后台增强）
- Neo4j 图数据库
- RAG 检索增强（不暴露独立页面）
- 后续可扩展为独立可视化功能

## ⚙️ 配置说明

关键环境变量见 `.env.example`：

```bash
DASHSCOPE_API_KEY=sk-xxx  # 必需，通义千问 API Key
REDIS_URL=redis://localhost:6379  # 可选
NEO4J_URI=bolt://localhost:7687   # 可选
```

## 🧪 测试

```bash
# 后端测试
cd backend
pytest tests/

# 前端测试
cd my-rag-frontend
pnpm test
```

## 📝 API 响应格式

所有接口统一返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {...}
}
```

错误时 `code` 为非 0 值（404/500 等）。

## 🛠️ 技术栈

**后端**: FastAPI, Peewee, ChromaDB, Neo4j, Redis, DashScope  
**前端**: React 19, TypeScript, Vite, TailwindCSS, ECharts  
**AI**: Qwen Embedding, Qwen Plus LLM

## 📄 License

MIT
