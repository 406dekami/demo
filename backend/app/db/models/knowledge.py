#!/usr/bin/env python3
"""
知识库相关模型
"""
from peewee import CharField, TextField, IntegerField, FloatField
from .base import BaseModel


class KnowledgeBase(BaseModel):
    """知识库（文档集合）"""
    tenant_id = CharField(max_length=32, index=True, help_text="租户 ID")
    kb_id = CharField(max_length=32, index=True, primary_key=True, help_text="知识库 ID")
    name = CharField(max_length=128, index=True, help_text="知识库名称")
    description = TextField(null=True, help_text="描述")
    chunk_size = IntegerField(default=512, help_text="切片长度")
    chunk_overlap = IntegerField(default=50, help_text="切片重叠")
    parser_type = CharField(max_length=32, default="naive", help_text="解析方式：naive/ocr/table")

    class Meta:
        table_name = "knowledgebase"


class Document(BaseModel):
    """文档（知识库中的文件）"""
    id = CharField(max_length=32, primary_key=True, help_text="文档 ID")
    kb_id = CharField(max_length=32, index=True, help_text="所属知识库")
    name = CharField(max_length=255, index=True, help_text="文件名")
    file_path = TextField(help_text="文件存储路径/URL")
    file_type = CharField(max_length=16, help_text="扩展名：pdf/txt/md...")
    file_size = IntegerField(default=0, help_text="文件大小（字节）")
    chunk_count = IntegerField(default=0, help_text="已切片数量")
    parse_status = CharField(max_length=16, default="pending", help_text="pending/processing/done/failed")
    parse_msg = TextField(null=True, help_text="解析日志/错误信息")

    class Meta:
        table_name = "document"


class Chunk(BaseModel):
    """文档切片（向量检索的基本单位）"""
    document_id = CharField(max_length=32, index=True, help_text="所属文档")
    kb_id = CharField(max_length=32, index=True, help_text="冗余字段，方便查询")
    content = TextField(help_text="切片文本内容")
    vector = TextField(null=True, help_text="嵌入向量（JSON 数组，或存外部向量库）")
    meta_info = TextField(null=True, help_text="页码/表格位置等，JSON 格式")
    score = FloatField(default=0, help_text="检索时的相关度分数（临时）")

    class Meta:
        table_name = "chunk"
        indexes = (
            (("kb_id", "create_time"), False),
        )
