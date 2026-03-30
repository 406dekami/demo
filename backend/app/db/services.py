#!/usr/bin/env python3
"""
LLM 模型数据服务
合并了 LLM 厂商管理、模型查询等功能
"""
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional
from peewee import prefetch
from .models import LLMFactory, LLMModel
from .database import DB


logger = logging.getLogger(__name__)


# ==================== 数据加载与初始化 ====================

def load_llm_factories_json():
    """加载 llm_factories.json文件"""
    try:
        # 从 app/db/services.py 向上三级到 backend/，然后到 conf/
        config_path = Path(__file__).parent.parent.parent / "conf" / "llm_factories.json"
        
        if not config_path.exists():
            logger.warning(f"配置文件不存在：{config_path}")
            return None
        
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"✅ 加载配置文件成功：{config_path}")
        return data.get('factory_llm_infos', [])
    
    except Exception as e:
        logger.error(f"❌ 加载配置文件失败：{e}")
        return None


def init_llm_factories():
    """
    初始化 LLM 厂商和模型数据
    """
    try:
        factory_exists = LLMFactory.table_exists()
        model_exists = LLMModel.table_exists()
        
        if factory_exists and model_exists:
            logger.info("⏭️  LLM 厂商和模型表已存在，跳过初始化")
            factory_count = LLMFactory.select().count()
            if factory_count == 0:
                logger.info("⚠️  表为空，开始导入数据...")
                return _import_data()
            return True
        
        logger.info("📋 开始创建 LLM 厂商和模型表...")
        
        with DB.atomic():
            LLMFactory.create_table(safe=True)
            LLMModel.create_table(safe=True)
        
        logger.info("✅ 表创建成功")
        return _import_data()
    
    except Exception as e:
        logger.error(f"❌ 初始化 LLM 厂商失败：{e}")
        return False


def _import_data():
    """导入 JSON 数据到数据库"""
    try:
        factories_data = load_llm_factories_json()
        
        if not factories_data:
            logger.warning("⚠️  没有数据可导入")
            return False
        
        logger.info(f"📥 开始导入 {len(factories_data)} 个厂商数据...")
        
        with DB.atomic():
            total_models = 0
            
            for factory_info in factories_data:
                factory, created = LLMFactory.get_or_create(
                    name=factory_info['name'],
                    defaults={
                        'logo': factory_info.get('logo', ''),
                        'tags': factory_info.get('tags', ''),
                        'status': factory_info.get('status', '1'),
                        'rank': int(factory_info.get('rank', 0)),
                    }
                )
                
                if not created:
                    factory.logo = factory_info.get('logo', '')
                    factory.tags = factory_info.get('tags', '')
                    factory.status = factory_info.get('status', '1')
                    factory.rank = int(factory_info.get('rank', 0))
                    factory.save()
                
                llm_list = factory_info.get('llm', [])
                for llm_info in llm_list:
                    LLMModel.get_or_create(
                        factory_id=factory,
                        llm_name=llm_info['llm_name'],
                        defaults={
                            'tags': llm_info.get('tags', ''),
                            'max_tokens': int(llm_info.get('max_tokens', 4096)),
                            'model_type': llm_info.get('model_type', 'chat'),
                            'is_tools': llm_info.get('is_tools', False),
                        }
                    )
                    total_models += 1
            
            logger.info(f"🎉 导入完成：{len(factories_data)} 个厂商，{total_models} 个模型")
            return True
    
    except Exception as e:
        logger.error(f"❌ 导入数据失败：{e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


# ==================== 查询服务 ====================

def _safe_list_field(val):
    """统一处理标签字段"""
    if val is None:
        return []
    if isinstance(val, str):
        try:
            return json.loads(val)
        except:
            return [val] if val else []
    return list(val) if isinstance(val, (list, tuple)) else [str(val)]


def get_all_factories() -> List[Dict]:
    """获取所有厂商列表"""
    try:
        factories = LLMFactory.select().where(LLMFactory.status == '1').order_by(LLMFactory.rank.desc())
        
        result = []
        for factory in factories:
            factory_dict = {
                'id': int(factory.id),
                'name': str(factory.name) or "",
                'logo': str(factory.logo) or "",
                'tags': _safe_list_field(factory.tags),
                'status': str(factory.status) or "0",
                'rank': int(factory.rank) if factory.rank is not None else 0,
            }
            result.append(factory_dict)
        
        logger.info(f"✅ 获取厂商列表成功：{len(result)} 个")
        return result
    except Exception as e:
        logger.error(f"❌ 查询厂商失败：{e}", exc_info=True)
        return []


def get_models_by_factory(factory_name: str) -> List[Dict]:
    """根据厂商名称获取模型列表"""
    try:
        factory = LLMFactory.get_or_none(LLMFactory.name == factory_name)
        if not factory:
            return []
        
        models = LLMModel.select().where(LLMModel.factory_id == factory).order_by(LLMModel.llm_name)
        
        return [{
            'id': int(m.id),
            'llm_name': str(m.llm_name) or "",
            'tags': _safe_list_field(m.tags),
            'max_tokens': int(m.max_tokens) if m.max_tokens else 0,
            'model_type': str(m.model_type) or "",
            'is_tools': bool(m.is_tools) if m.is_tools is not None else False,
        } for m in models]
    except Exception as e:
        logger.error(f"❌ 查询模型失败：{e}", exc_info=True)
        return []


def get_all_factories_with_models() -> List[Dict]:
    """获取所有厂商及其模型（带模型列表）"""
    try:
        factories = get_all_factories()
        
        for factory in factories:
            models = get_models_by_factory(factory['name'])
            factory['models'] = models
        
        return factories
    except Exception as e:
        logger.error(f"❌ 查询厂商及模型失败：{e}", exc_info=True)
        return []


def get_models_by_type(model_type: str, factory_name: Optional[str] = None) -> List[Dict]:
    """根据模型类型获取模型列表"""
    try:
        query = LLMModel.select().join(LLMFactory).where(LLMModel.model_type == model_type)
        
        if factory_name:
            query = query.where(LLMFactory.name == factory_name)
        
        models = query.order_by(LLMModel.llm_name)
        
        return [{
            'id': int(m.id),
            'llm_name': str(m.llm_name) or "",
            'factory_name': str(m.factory_id.name) or "",
            'tags': _safe_list_field(m.tags),
            'max_tokens': int(m.max_tokens) if m.max_tokens else 0,
            'model_type': str(m.model_type) or "",
            'is_tools': bool(m.is_tools) if m.is_tools is not None else False,
        } for m in models]
    except Exception as e:
        logger.error(f"❌ 查询模型失败：{e}", exc_info=True)
        return []


# ==================== 业务服务类 ====================

class LLMService:
    """LLM 业务服务类（兼容旧 API）"""
    
    @staticmethod
    def get_all_factories() -> List[Dict]:
        """获取所有厂商及其模型"""
        return get_all_factories_with_models()
    
    @staticmethod
    def get_models_by_type(model_type: str, factory_name: Optional[str] = None) -> List[Dict]:
        """根据类型获取模型列表"""
        models = get_models_by_type(model_type, factory_name)
        
        if factory_name:
            models = [m for m in models if m['factory_name'] == factory_name]
        
        return models
    
    @staticmethod
    def get_model_types() -> List[Dict]:
        """获取所有支持的模型类型"""
        return [
            {"type": "chat", "label": "对话模型"},
            {"type": "embedding", "label": "嵌入模型"},
            {"type": "tts", "label": "语音合成"},
            {"type": "image2text", "label": "图像识别"},
            {"type": "speech2text", "label": "语音识别"},
            {"type": "rerank", "label": "重排序模型"},
        ]


class LLMFactoriesService:
    """LLM 厂商服务类（兼容旧 API）"""
    model = LLMFactory
    
    @staticmethod
    def get_all(reverse=True, order_by="rank"):
        """获取所有厂商"""
        return get_all_factories()


class TenantLLMService:
    """租户 LLM 服务类（简化版）"""
    model = LLMModel
    
    @staticmethod
    def split_model_name_and_factory(model_name: str):
        """拆分模型名称和厂商"""
        arr = model_name.split("@")
        if len(arr) < 2:
            return model_name, None
        if len(arr) > 2:
            return "@".join(arr[0:-1]), arr[-1]
        return arr[0], arr[-1]
    
    @staticmethod
    def get_my_llms(tenant_id: str) -> List[Dict]:
        """获取租户的模型列表"""
        try:
            fields = [
                LLMModel.llm_factory, 
                LLMFactory.logo, 
                LLMFactory.tags, 
                LLMModel.model_type, 
                LLMModel.llm_name, 
                LLMModel.used_tokens, 
                LLMModel.status
            ]
            objs = LLMModel.select(*fields).join(
                LLMFactory, 
                on=(LLMModel.llm_factory == LLMFactory.name)
            ).where(
                LLMModel.tenant_id == tenant_id, 
                ~LLMModel.api_key.is_null()
            ).dicts()
            
            return list(objs)
        except Exception as e:
            logger.error(f"❌ 查询租户模型失败：{e}", exc_info=True)
            return []
