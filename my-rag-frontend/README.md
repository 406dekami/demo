# Demo RAG Platform

这是一个以 `FastAPI + React + Vite` 构建的数字逻辑学习助手，当前主线能力已经统一到以下几部分：

- 用户认证
- 知识库管理
- RAG 问答
- Notebook 单知识库问答
- 思维导图学习路径
- 知识图谱可视化
- 模型管理基础接口

## 当前状态

项目目前采用“先收口再扩展”的策略：

- `llm.py` / `models.py` 中以外的历史分支能力不再作为主入口扩散
- Notebook 当前只支持单知识库绑定，不做多知识库融合检索
- `mind_map` 与 `knowledge_graph` 暂未统一底层数据源，但路由职责已明确
- 后端统一响应格式为：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

## 目录

- `backend/`：FastAPI 后端
- `my-rag-frontend/`：React 前端

## 后端启动

1. 复制环境变量文件：

```bash
cp backend/.env.example backend/.env
```

2. 填写至少以下配置：

- `DASHSCOPE_API_KEY`
- 如需图数据库或缓存，再补 `NEO4J_*`、`REDIS_URL`

3. 安装依赖并启动：

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload
```

后端默认地址：`http://127.0.0.1:8000`

## 前端启动

```bash
cd my-rag-frontend
npm install
npm run dev
```

前端默认地址：`http://127.0.0.1:5173`

## 已统一的关键约定

### 1. API 客户端

前端统一通过：

- `my-rag-frontend/src/api/client.ts`

进行请求、鉴权头注入和错误处理。

### 2. Notebook 字段

统一使用：

- `title`
- `kb_ids`
- `model_name`
- `system_prompt`

### 3. Notebook 产品范围

当前版本：

- 仅支持单知识库问答
- 问答时会贯通 `conversation_id`
- 不支持多知识库真实融合检索

## 已启用路由

后端主路由前缀：`/api/v1`

已启用：

- `/auth`
- `/knowledge`
- `/rag`
- `/mind-map`
- `/knowledge-graph`
- `/model`

## 暂未做的事项

以下内容已明确为后续阶段，不在当前主线实现内：

- 多知识库真实检索融合
- `mind_map` 与 `knowledge_graph` 底层统一
- 更完整的模型配置闭环
- 弃用分支的彻底物理删除与数据库迁移整理

## 安全说明

- 用户密码已改用 `passlib[bcrypt]`
- 兼容历史 SHA256 密码，用户成功登录后会自动升级为 bcrypt
- CORS 使用环境变量控制，不再默认全开放

## 建议下一步

如果继续迭代，推荐优先顺序：

1. 完成模型管理前后端闭环
2. 清理历史弃用模块与重复代码
3. 统一 `mind_map` / `knowledge_graph` 数据源
4. 视产品需求再评估多知识库检索融合
