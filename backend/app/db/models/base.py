#!/usr/bin/env python3
"""
数据库模型基类
"""
from datetime import datetime
from peewee import Model, BigIntegerField, BooleanField
from ..database import DB


class BaseModel(Model):
    """所有模型的基类：自动时间戳 + 软删除 + 转字典"""
    create_time = BigIntegerField(null=True, index=True, help_text="创建时间戳")
    update_time = BigIntegerField(null=True, index=True, help_text="更新时间戳")
    is_deleted = BooleanField(default=False, index=True, help_text="软删除标记")

    class Meta:
        database = DB

    def to_dict(self):
        """模型 → 字典（方便 API 返回）"""
        data = {}
        for field in self._meta.sorted_fields:
            value = getattr(self, field.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            data[field.name] = value
        return data

    @classmethod
    def _auto_timestamp(cls, data):
        """插入/更新时自动填充时间戳"""
        import time
        now = int(time.time() * 1000)  # 毫秒时间戳
        if "create_time" not in data or data["create_time"] is None:
            data["create_time"] = now
        data["update_time"] = now
        return data

    @classmethod
    def insert(cls, __data=None, **insert):
        data = cls._auto_timestamp(__data or {})
        data.update(insert)
        return super().insert(data)

    @classmethod
    def update(cls, __data=None, **update):
        data = cls._auto_timestamp(__data or {})
        data.update(update)
        return super().update(data)
