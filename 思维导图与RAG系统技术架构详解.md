# 思维导图与RAG系统技术架构详解

## 📋 目录
- [1. 思维导图实现原理](#1-思维导图实现原理)
- [2. RAG检索增强生成系统](#2-rag检索增强生成系统)
- [3. 前后端集成方案](#3-前后端集成方案)
- [4. 核心数据流](#4-核心数据流)

---

## 1. 思维导图实现原理

### 1.1 整体架构

思维导图系统采用**树形数据结构 + 可视化渲染引擎**的架构设计，支持四级层级结构的知识图谱展示。

```
前端 (React + ECharts/自定义布局) ←→ 后端 API (FastAPI) ←→ 数据库 (SQLite + ChromaDB)
```

### 1.2 数据存储层

#### 1.2.1 数据库表结构 (`MindMapNode`)

```python
class MindMapNode(Model):
    id = CharField(primary_key=True)           # 节点唯一标识
    parent_id = CharField(null=True)            # 父节点ID（根节点为null）
    title = CharField()                         # 节点标题
    level = IntegerField()                      # 层级深度（0-3级）
    node_type = CharField()                     # 节点类型（章节/知识点）
    description = TextField(null=True)          # 节点描述
    content = TextField(null=True)              # 详细内容
    tags = JSONField(null=True)                 # 标签列表
    examples = JSONField(null=True)             # 示例列表
    related_questions = JSONField(null=True)    # 推荐问题
    order_index = IntegerField()                # 同级排序索引
    is_leaf = BooleanField(default=False)       # 是否为叶子节点
    icon = CharField(null=True)                 # 图标
    color = CharField(null=True)                # 颜色
    created_at = DateTimeField()                # 创建时间
    updated_at = DateTimeField()                # 更新时间
```

**关键设计点：**
- **自引用关系**：通过 `parent_id` 字段建立父子关系，形成树形结构
- **层级限制**：最多4级（0-3），避免过深导致性能问题
- **预置内容**：每个节点包含 `content`、`examples`、`related_questions` 等丰富信息，用于AI问答

#### 1.2.2 学习进度存储 (`UserNodeProgress`)

```python
class UserNodeProgress(Model):
    user_id = CharField()                       # 用户ID
    node_id = CharField()                       # 节点ID
    is_completed = BooleanField(default=False)  # 是否完成学习
    completed_at = DateTimeField(null=True)     # 完成时间
```

**功能：**
- 记录用户对每个节点的学习状态
- 支持前端显示学习进度条
- 登录后自动同步到后端，未登录时降级使用 localStorage

### 1.3 后端服务层

#### 1.3.1 核心服务类 (`MindMapService`)

**主要方法：**

```python
class MindMapService:
    @staticmethod
    def get_tree(root_id: str) -> Dict:
        """递归获取完整树形结构"""
        
    @staticmethod
    def get_node_path(node_id: str) -> List[Dict]:
        """获取从根节点到当前节点的路径（面包屑导航）"""
        
    @staticmethod
    def get_siblings(node_id: str) -> List[Dict]:
        """获取兄弟节点（构建上下文）"""
        
    @staticmethod
    def get_children_details(node_id: str) -> List[Dict]:
        """获取子节点详情（用于AI问答上下文）"""
        
    @staticmethod
    def get_suggested_questions(node_id: str) -> List[str]:
        """获取节点的推荐问题（优先使用JSON配置）"""
```

**关键技术点：**
- **递归查询**：通过递归函数构建树形结构
- **路径追踪**：从当前节点向上追溯父节点，构建完整路径
- **上下文构建**：收集父节点、兄弟节点、子节点信息，用于AI问答

#### 1.3.2 向量化服务 (`GraphVectorService`)

```python
class GraphVectorService:
    def index_all_nodes(self, kb_id: str) -> Dict:
        """批量向量化所有知识节点"""
        
    def search_nodes(self, query: str, top_k: int) -> List[Dict]:
        """语义搜索知识节点（基于向量相似度）"""
```

**工作流程：**
1. 遍历所有 `MindMapNode` 节点
2. 提取 `title` + `description` 作为文本
3. 调用千问 Embedding API 生成向量
4. 存入 ChromaDB 向量库
5. 搜索时计算查询向量与节点向量的余弦相似度

### 1.4 前端可视化层

#### 1.4.1 布局算法 (`mindMapLayout.ts`)

**核心函数：**

```typescript
export const layoutTree = (
  node: Node,
  collapsedIds: Set<string>,
  selectedId: string | null,
  pathIds: Set<string>,
  doneIds: Set<string>,
  depth = 0,
  x = 0,
  cursor = { y: 0 }
): LayoutNode => {
  // 1. 计算节点宽度（根据文本长度动态调整）
  const titleWidth = titleWidthOf(node, depth)
  
  // 2. 递归布局子节点
  const children = visibleChildren.map((child) =>
    layoutTree(child, ..., depth + 1, nextX, cursor)
  )
  
  // 3. 垂直居中对齐：父节点Y坐标 = 子节点Y坐标的平均值
  const y = children.length
    ? (children[0].y + children[children.length - 1].y) / 2
    : cursor.y
  
  return { node, x, y, width, children, ... }
}
```

**布局策略：**
- **水平方向**：从左到右展开（LR方向）
- **垂直方向**：叶子节点按顺序排列，父节点居中于子节点
- **动态宽度**：根据文本长度和字体大小计算节点宽度
- **折叠支持**：通过 `collapsedIds` 控制子节点是否可见

#### 1.4.2 视口管理 (`useMindMapViewport.ts`)

```typescript
const useMindMapViewport = ({ viewportRef }) => {
  const [view, setView] = useState({ x: 48, y: 72, scale: 1 })
  
  // 滚轮缩放（以鼠标位置为中心）
  const handleWheel = (event) => {
    applyZoom(event.clientX, event.clientY, delta)
  }
  
  // 拖拽平移
  const handleMouseDown = (event) => {
    dragRef.current = { startX, startY, originX, originY }
  }
  
  // 应用变换
  transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`
}
```

**交互功能：**
- **滚轮缩放**：0.3x ~ 2.5x，以鼠标位置为中心缩放
- **拖拽平移**：按住鼠标拖动画布
- **边界限制**：防止无限拖拽

#### 1.4.3 节点渲染 (`MindMapNodeItem.tsx`)

```tsx
<MindMapNodeItem
  item={layoutNode}
  onDone={handleDone}           // 标记完成
  onSelect={handleSelect}       // 单击选中
  onCollapse={handleCollapse}   // 双击展开/折叠
  onTip={updateTooltip}         // 悬停提示
/>
```

**视觉反馈：**
- **选中状态**：蓝色高亮边框 + 阴影
- **路径状态**：浅蓝色背景（从根节点到当前节点的路径）
- **完成状态**：删除线 + 半透明
- **层级颜色**：不同层级使用不同主题色

#### 1.4.4 连接线绘制 (`EdgeLayer`)

```tsx
<svg className="absolute inset-0">
  {edges.map((edge) => (
    <path
      d={edge.path}  // 贝塞尔曲线路径
      stroke={edge.active ? 'rgba(125,211,252,.95)' : 'rgba(108,127,164,.38)'}
      strokeWidth={edge.active ? 2.8 : 1.5}
    />
  ))}
</svg>
```

**曲线算法：**
- 使用三次贝塞尔曲线连接父子节点
- 激活路径上的连线高亮显示

### 1.5 AI问答集成

#### 1.5.1 对话流程

```
用户点击节点 → 加载推荐问题 → 用户提问 → 构建上下文 → 调用LLM → 返回答案
```

#### 1.5.2 上下文构建 (`mind_map.py:chat_with_node`)

```python
# 1. 获取节点路径（父节点链）
context_path = " > ".join([n['title'] for n in path])

# 2. 获取兄弟节点
siblings_context = f"同级知识点：{', '.join(siblings_titles)}"

# 3. 获取子节点
children_context = f"下属知识点：{', '.join(children_titles)}"

# 4. 构建系统提示词
system_prompt = f"""
你是一个数字逻辑课程辅导助手。当前正在讲解的知识点是：{context_path}

节点信息：
- 标题：{node.title}
- 类型：{'叶子节点' if node.is_leaf else '章节节点'}
- 描述：{node.description}
- 标签：{tags_str}
- 核心内容：{content_str}
- 示例：{examples_str}
- 知识图谱上下文：{siblings_context}{children_context}

请根据用户的问题，提供清晰、准确、易懂的解答。
"""

# 5. 调用LLM
answer = await chat_with_llm(system_prompt, user_question, conversation_id)
```

**上下文优势：**
- **层级感知**：知道当前节点在知识体系中的位置
- **横向关联**：了解同级知识点，便于对比讲解
- **纵向深入**：掌握下级知识点，可以引导深入学习

---

## 2. RAG检索增强生成系统

### 2.1 整体架构

```
用户上传文档 → 解析分块 → 向量化 → 存储ChromaDB
                                    ↓
用户提问 → 检索相关片段 → 拼接上下文 → LLM生成答案 → 返回结果
```

### 2.2 核心组件

#### 2.2.1 文档加载器 (`DocumentLoader`)

**支持的格式：**
- PDF、DOCX、TXT、Markdown
- PPTX、EPUB、HTML、Excel

**处理流程：**
```python
def load_document(file_path: str) -> List[Dict]:
    # 1. 根据文件扩展名选择对应的Loader
    loader = self._get_loader(file_path)
    
    # 2. 解析文档内容
    docs = loader.load()
    
    # 3. 提取元信息（页码、来源等）
    chunks = [{
        "text": doc.page_content,
        "page": doc.metadata.get("page"),
        "source": doc.metadata.get("source")
    } for doc in docs]
    
    return chunks
```

#### 2.2.2 文本分块器 (`LangChainChunker`)

**分块策略：**
```python
class LangChainChunker:
    def __init__(self, chunk_size=512, chunk_overlap=50):
        self.chunk_size = chunk_size      # 每块最大字符数
        self.chunk_overlap = chunk_overlap # 重叠字符数（保持上下文连贯）
    
    def chunk_text(self, text: str) -> List[Dict]:
        # 1. 按段落分割
        paragraphs = text.split('\n\n')
        
        # 2. 合并小段落，拆分大段落
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk) + len(para) <= self.chunk_size:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append({"text": current_chunk.strip()})
                current_chunk = para + "\n\n"
        
        # 3. 处理最后一块
        if current_chunk:
            chunks.append({"text": current_chunk.strip()})
        
        return chunks
```

**关键参数：**
- `chunk_size=512`：平衡检索精度和上下文完整性
- `chunk_overlap=50`：避免关键信息被截断

#### 2.2.3 向量化服务 (`QwenEmbedding`)

**调用千问Embedding API：**
```python
class QwenEmbedding:
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # 1. 分批处理（DashScope限制每批最多10条）
        batch_size = 10
        result = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            # 2. 调用API
            response = dashscope.TextEmbedding.call(
                model="text-embedding-v2",
                input=batch
            )
            
            # 3. 提取向量
            embeddings = [item.embedding for item in response.output.embeddings]
            result.extend(embeddings)
        
        return result
    
    def embed_query(self, query: str) -> List[float]:
        """单条查询向量化"""
        return self.embed_documents([query])[0]
```

**向量维度：** 1536维（text-embedding-v2模型）

#### 2.2.4 向量存储 (`VectorStore`)

**使用 ChromaDB：**
```python
class VectorStore:
    def __init__(self, kb_id: str):
        self.collection_name = kb_id
        self.client = chromadb.PersistentClient(path="./storage/chroma_db")
        self.collection = self.client.get_or_create_collection(kb_id)
    
    def add_vectors(self, vectors, documents, ids, metadatas):
        """批量添加向量"""
        self.collection.add(
            embeddings=vectors,
            documents=documents,
            ids=ids,
            metadatas=metadatas
        )
    
    def search(self, query_vector, top_k=5, filter_dict=None):
        """向量相似度搜索"""
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=top_k,
            where=filter_dict  # 可选过滤条件
        )
        return results
```

**存储结构：**
```
storage/chroma_db/
└── knowledge_graph/
    └── d26aad94-05b7-4a2a-945a-64aa98ebd150/
        └── chroma.sqlite3  # SQLite数据库存储向量
```

#### 2.2.5 检索器 (`Retriever`)

**双路检索策略：**
```python
class Retriever:
    def retrieve(self, query: str, top_k=5, use_knowledge_graph=True):
        # 策略1：优先从知识图谱检索（如果启用）
        if use_knowledge_graph:
            kg_results = graph_vector_service.search_nodes(query, top_k)
            if kg_results:
                return self._format_kg_results(kg_results)
        
        # 策略2：普通RAG检索（文档片段）
        query_embedding = embedding_service.embed_query(query)
        results = vector_store.search(query_embedding, top_k)
        return self._format_rag_results(results)
```

**检索流程：**
1. 用户提问："怎么设计计数器？"
2. 向量化查询文本
3. 在ChromaDB中搜索最相似的5个片段
4. 计算余弦相似度得分
5. 返回排序后的结果

**结果格式：**
```json
{
  "text": "计数器是一种时序逻辑电路...",
  "score": 0.89,
  "metadata": {
    "source": "数字逻辑教材.pdf",
    "page": 45,
    "chunk_index": 12
  }
}
```

#### 2.2.6 生成器 (`Generator`)

**调用千问LLM：**
```python
class Generator:
    def generate(self, query: str, context: List[Dict], history: List[Dict]) -> str:
        # 1. 拼接上下文
        context_text = "\n\n".join([c["text"] for c in context])
        
        # 2. 构建提示词
        prompt = f"""你是一个智能助手。请基于以下参考资料回答问题。

参考资料：
{context_text}

问题：{query}

请给出准确、详细的回答。如果资料中没有相关信息，请明确说明。"""
        
        # 3. 调用LLM API
        response = dashscope.Generation.call(
            model="qwen-plus",
            messages=[
                {"role": "system", "content": prompt},
                *history,  # 历史对话
                {"role": "user", "content": query}
            ]
        )
        
        return response.output.text
```

**多轮对话支持：**
- 保存对话历史到数据库
- 每次请求携带历史记录
- LLM根据上下文理解指代关系

### 2.3 数据处理流程

#### 2.3.1 文档上传与处理

```python
@router.post("/upload")
async def upload_document(file: UploadFile, kb_id: str):
    # 1. 保存文件到磁盘
    file_path = f"data/uploads/{tenant_id}/{kb_id}/{uuid}.pdf"
    
    # 2. 创建文档记录
    doc = Document.create(
        kb_id=kb_id,
        name=file.filename,
        file_path=file_path,
        parse_status="processing"
    )
    
    return {"document_id": doc.id}

@router.post("/process")
async def process_document(document_id: str):
    # 1. 加载文档
    raw_chunks = loader.load_document(doc.file_path)
    
    # 2. 分块处理
    text_chunks = chunker.chunk_documents(raw_chunks)
    
    # 3. 向量化
    texts = [chunk["text"] for chunk in text_chunks]
    embeddings = embedding_service.embed_documents(texts)
    
    # 4. 存储到向量库
    vector_store.add_vectors(embeddings, texts, ids, metadatas)
    
    # 5. 更新文档状态
    doc.parse_status = "done"
    doc.chunk_count = len(text_chunks)
    doc.save()
```

**异步处理建议：**
- 当前为同步处理，大文件会阻塞请求
- 可改用 Celery 任务队列实现后台处理
- 前端轮询处理进度

#### 2.3.2 问答流程

```python
@router.post("/query")
async def rag_query(request: QueryRequest):
    # 1. 验证知识库权限
    kb = KnowledgeBase.get(kb_id=request.kb_id)
    
    # 2. 加载对话历史
    if request.conversation_id:
        history = Message.select().where(conversation_id=...)
    
    # 3. 检索相关上下文
    retriever = Retriever(vector_store, embedding_service)
    context = retriever.retrieve(request.query, top_k=5)
    
    # 4. 生成答案
    generator = Generator(model_name="qwen-plus")
    answer = generator.generate(request.query, context, history)
    
    # 5. 保存对话记录
    Message.create(conversation_id=..., role="user", content=request.query)
    Message.create(conversation_id=..., role="assistant", content=answer)
    
    return {
        "answer": answer,
        "context": context,
        "conversation_id": request.conversation_id
    }
```

### 2.4 知识图谱与RAG融合

#### 2.4.1 混合检索策略

```python
def retrieve(self, query, use_knowledge_graph=True):
    if use_knowledge_graph:
        # 第一优先级：知识图谱语义搜索
        kg_results = graph_vector_service.search_nodes(query)
        if kg_results:
            return kg_results  # 直接返回结构化知识
    
    # 第二优先级：文档片段检索
    return vector_store.search(query_embedding)
```

**优势：**
- **知识图谱**：提供结构化、权威的定义和概念
- **文档片段**：提供详细的解释和实例
- **互补性**：两者结合提供更全面的答案

#### 2.4.2 向量化知识图谱

**脚本：** `backend/scripts/init_knowledge_graph_vectors.py`

```python
def main():
    # 1. 获取所有知识节点
    nodes = MindMapNode.select()
    
    # 2. 批量向量化
    vector_service = get_graph_vector_service()
    result = vector_service.index_all_nodes(
        kb_id="knowledge_graph",
        batch_size=10
    )
    
    print(f"成功：{result['success']}/{result['total']}")
```

**执行命令：**
```bash
cd backend
python scripts/init_knowledge_graph_vectors.py
```

---

## 3. 前后端集成方案

### 3.1 API设计规范

#### 3.1.1 RESTful风格

```
GET    /api/v1/mind-map/tree          # 获取思维导图树
GET    /api/v1/mind-map/node/{id}     # 获取节点详情
POST   /api/v1/mind-map/chat          # 与节点对话
POST   /api/v1/rag/upload             # 上传文档
POST   /api/v1/rag/query              # RAG问答
```

#### 3.1.2 统一响应格式

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

或

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 3.2 前端数据流

#### 3.2.1 思维导图页面加载

```typescript
// MindMapPage.tsx
useEffect(() => {
  // 1. 获取思维导图树
  const data = await getMindMapTree(ROOT_ID)
  setTree(data)
  
  // 2. 设置初始选中节点
  setSelectedId(data.id)
  
  // 3. 获取节点路径
  await syncPath(data.id)
}, [])

// 4. 布局计算
const root = useMemo(() => 
  layoutTree(tree, collapsedIds, selectedId, pathIds, completedIds),
  [tree, collapsedIds, selectedId]
)

// 5. 渲染节点
{nodes.map((item) => (
  <MindMapNodeItem item={item} ... />
))}
```

#### 3.2.2 问答面板交互

```typescript
// ChatPanel.tsx
const handleSend = async () => {
  setLoading(true)
  
  // 1. 发送问题
  const response = await sendQuestion({
    node_id: node.id,
    question: input,
    conversation_id: activeConversationId
  })
  
  // 2. 更新对话历史
  setConversations(prev => [...prev, {
    id: response.conversation_id,
    messages: [
      { role: "user", content: input },
      { role: "assistant", content: response.answer }
    ]
  }])
  
  setLoading(false)
}
```

### 3.3 认证与授权

#### 3.3.1 Token机制

```typescript
// 前端：存储Token
localStorage.setItem('auth_token', token)

// 前端：请求拦截器
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 后端：验证Token
@router.get("/progress")
async def get_user_progress(request: Request):
  token = request.headers.get("Authorization").replace("Bearer ", "")
  user_id = verify_token(token)
  
  if not user_id:
    return {"success": False, "message": "token无效"}
```

#### 3.3.2 租户隔离

```python
# 后端：多租户数据隔离
tenant_id = get_tenant_id(request)

# 查询时强制带上租户条件
kb = KnowledgeBase.get_or_none(
  (KnowledgeBase.kb_id == kb_id) & 
  (KnowledgeBase.tenant_id == tenant_id)
)
```

### 3.4 状态管理

#### 3.4.1 React Hooks

```typescript
// 本地状态
const [tree, setTree] = useState<Node | null>(null)
const [selectedId, setSelectedId] = useState<string | null>(null)
const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

// 持久化状态（localStorage）
const STORAGE_KEY = 'mindmap-completed-ids'
localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedIds]))
```

#### 3.4.2 Zustand全局状态（可选）

```typescript
// stores/knowledgeStore.ts
const useKnowledgeStore = create((set) => ({
  bases: [],
  addBase: (base) => set((state) => ({
    bases: [...state.bases, base]
  }))
}))
```

---

## 4. 核心数据流

### 4.1 思维导图数据流

```
┌─────────────┐
│  数据库表    │
│MindMapNode  │
└──────┬──────┘
       │ SELECT * WHERE parent_id = ?
       ▼
┌─────────────┐
│ Service层   │
│递归构建树    │
└──────┬──────┘
       │ 转换为JSON
       ▼
┌─────────────┐
│  API路由    │
│GET /tree    │
└──────┬──────┘
       │ HTTP Response
       ▼
┌─────────────┐
│  前端API层  │
│axios请求    │
└──────┬──────┘
       │ Promise
       ▼
┌─────────────┐
│ React组件   │
│useState存储  │
└──────┬──────┘
       │ useMemo计算布局
       ▼
┌─────────────┐
│  布局引擎    │
│layoutTree() │
└──────┬──────┘
       │ 返回坐标(x,y)
       ▼
┌─────────────┐
│  SVG渲染    │
│节点+连线    │
└─────────────┘
```

### 4.2 RAG问答数据流

```
┌─────────────┐
│  用户提问    │
│"怎么设计..." │
└──────┬──────┘
       │ POST /api/v1/rag/query
       ▼
┌─────────────┐
│  API路由    │
│验证权限      │
└──────┬──────┘
       │ 初始化组件
       ▼
┌─────────────┐
│  Retriever  │
│检索相关片段  │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌──────┐ ┌──────────┐
│知识图│ │向量库检索 │
│谱检索│ │ChromaDB  │
└──┬───┘ └────┬─────┘
   │          │
   └────┬─────┘
        │ 返回Top-K片段
        ▼
┌─────────────┐
│  Generator  │
│拼接上下文    │
│调用LLM API  │
└──────┬──────┘
       │ 生成答案
       ▼
┌─────────────┐
│  保存对话   │
│Message表    │
└──────┬──────┘
       │ HTTP Response
       ▼
┌─────────────┐
│  前端展示    │
│ChatPanel    │
└─────────────┘
```

### 4.3 学习进度同步流

```
┌─────────────┐
│ 用户点击✓   │
│标记完成      │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌──────┐ ┌──────────┐
│本地  │ │防抖300ms  │
│State │ │后发送到后端│
└──┬───┘ └────┬─────┘
   │          │
   │     ┌────▼──────┐
   │     │POST       │
   │     │/progress  │
   │     │/toggle    │
   │     └────┬──────┘
   │          │
   │     ┌────▼──────┐
   │     │更新数据库  │
   │     │UserNode   │
   │     │Progress   │
   │     └───────────┘
   │
   ▼
┌──────┐
│刷新  │
│进度条│
└──────┘
```

---

## 5. 关键技术选型

### 5.1 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| FastAPI | 最新 | Web框架 |
| Peewee | 3.x | ORM（SQLite） |
| ChromaDB | 0.4.x | 向量数据库 |
| DashScope SDK | 最新 | 千问API调用 |
| Pydantic | 2.x | 数据验证 |
| Loguru | 0.7.x | 日志记录 |

### 5.2 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| Tailwind CSS | 4.x | 样式框架 |
| Axios | 1.x | HTTP客户端 |
| Lucide React | 最新 | 图标库 |
| ECharts | 5.x | 图表库（备用方案） |

### 5.3 AI服务

| 服务 | 模型 | 用途 |
|------|------|------|
| 阿里云DashScope | qwen-plus | LLM对话生成 |
| 阿里云DashScope | text-embedding-v2 | 文本向量化 |

---

## 6. 性能优化策略

### 6.1 后端优化

1. **数据库索引**
   ```python
   class Meta:
       indexes = (
           (('parent_id',), False),
           (('level',), False),
           (('kb_id', 'is_deleted'), False),
       )
   ```

2. **缓存机制**
   - Redis缓存热点数据（如思维导图树）
   - 内存缓存频繁访问的节点详情

3. **批量操作**
   ```python
   # 批量插入向量
   Chunk.bulk_create(db_chunks)
   
   # 批量向量化
   for i in range(0, len(texts), batch_size):
       batch = texts[i:i + batch_size]
   ```

4. **异步处理**
   - 文档处理改为Celery后台任务
   - 向量化过程异步执行

### 6.2 前端优化

1. **虚拟滚动**
   - 大量节点时使用虚拟列表
   - 只渲染可视区域内的节点

2. **防抖节流**
   ```typescript
   // 防抖：进度同步
   setTimeout(() => toggleNodeProgress(id), 300)
   
   // 节流：窗口resize
   useThrottle(handleResize, 200)
   ```

3. **懒加载**
   - 子节点按需加载（点击展开时请求）
   - 图片懒加载

4. **Memoization**
   ```typescript
   const root = useMemo(() => 
     layoutTree(tree, collapsedIds, ...),
     [tree, collapsedIds]
   )
   ```

---

## 7. 部署架构

### 7.1 开发环境

```
docker-compose.dev.yml
├── backend (FastAPI)
│   ├── Port: 8000
│   ├── Volume: ./backend:/app
│   └── Env: .env
├── frontend (Vite)
│   ├── Port: 5173
│   └── Proxy: /api → backend:8000
└── neo4j (社区版)
    ├── Port: 7474 (Browser)
    └── Port: 7687 (Bolt)
```

### 7.2 生产环境建议

```
Nginx (反向代理 + 静态资源)
├── Frontend (dist/)
└── Backend API (/api/*)
    ├── Gunicorn (WSGI服务器)
    │   └── Workers: 4
    ├── Redis (缓存)
    ├── PostgreSQL (主数据库)
    ├── ChromaDB (向量库)
    └── Neo4j (知识图谱，可选)
```

---

## 8. 常见问题与解决方案

### 8.1 RAG返回空结果

**原因排查：**
1. 检查向量库是否有数据
   ```python
   vector_count = vector_store.count()
   if vector_count == 0:
       logger.warning("向量库为空")
   ```

2. 检查文档是否处理成功
   ```sql
   SELECT * FROM document WHERE parse_status = 'done';
   ```

3. 检查嵌入向量生成是否失败
   ```python
   embeddings = embedding_service.embed_documents(texts)
   if not embeddings:
       logger.error("向量化失败")
   ```

### 8.2 思维导图加载缓慢

**优化方案：**
1. 后端启用Redis缓存
2. 前端实现增量加载（懒加载子节点）
3. 数据库添加索引
4. 限制单次返回节点数量

### 8.3 LLM回答不准确

**改进措施：**
1. 优化提示词工程
2. 增加检索片段数量（top_k从5提升到8）
3. 引入Rerank重排序
4. 结合知识图谱提供结构化上下文

---

## 9. 扩展方向

### 9.1 功能扩展

1. **协作编辑**
   - WebSocket实时同步
   - 冲突解决机制

2. **智能推荐**
   - 基于学习路径推荐下一个节点
   - 相似知识点推荐

3. **多模态支持**
   - 图片识别（OCR）
   - 语音输入/输出

4. **个性化学习**
   - 自适应难度调整
   - 遗忘曲线复习提醒

### 9.2 技术升级

1. **向量数据库迁移**
   - ChromaDB → Milvus（分布式支持）
   - 提升检索性能和可扩展性

2. **模型升级**
   - qwen-plus → qwen-max（更强推理能力）
   - 本地部署开源模型（降低成本）

3. **微服务架构**
   - 拆分为独立服务（用户、知识、RAG）
   - Kubernetes编排

---

## 10. 总结

本系统通过**思维导图可视化 + RAG智能问答**的双引擎架构，实现了知识管理与智能学习的深度融合：

**核心优势：**
1. ✅ **结构化知识**：树形思维导图清晰展示知识体系
2. ✅ **智能检索**：向量搜索快速定位相关内容
3. ✅ **上下文感知**：结合节点层级关系提供精准答案
4. ✅ **学习追踪**：记录学习进度，支持个性化路径
5. ✅ **多源融合**：知识图谱 + 文档片段互补增强

**技术亮点：**
- 自研布局算法，支持大规模节点流畅渲染
- 双路检索策略，平衡准确性和覆盖率
- 防抖同步机制，优化用户体验
- 多租户隔离，支持SaaS化部署

**适用场景：**
- 在线教育平台
- 企业知识库
- 个人学习笔记
- 技术培训系统

---

*文档生成时间：2026-04-09*
*项目路径：D:\Projects\demo*
