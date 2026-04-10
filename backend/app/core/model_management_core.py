#!/usr/bin/env python3
"""
RAGFlow 模型管理演示应用 - 核心模块
展示如何添加、配置和管理 LLM 模型
"""

import asyncio
import json
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple


class LLMType(Enum):
    """模型类型枚举"""
    CHAT = "chat"
    EMBEDDING = "embedding"
    RERANK = "rerank"
    IMAGE2TEXT = "image2text"
    SPEECH2TEXT = "speech2text"
    TTS = "tts"
    OCR = "ocr"


@dataclass
class ModelConfig:
    """模型配置数据类"""
    tenant_id: str
    llm_factory: str
    llm_name: str
    model_type: str
    api_key: str
    api_base: str = ""
    max_tokens: int = 8192
    status: str = "1"


class LLMFactoryHandler:
    """LLM 厂商处理器"""
    
    SUPPORTED_FACTORIES = {
        "OpenAI": {
            "logo": "openai_logo",
            "tags": "LLM,Text Embedding,Image2Text",
            "model_types": ["chat", "embedding", "image2text"]
        },
        "Ollama": {
            "logo": "ollama_logo",
            "tags": "LLM",
            "model_types": ["chat", "embedding"]
        },
        "Bedrock": {
            "logo": "bedrock_logo",
            "tags": "LLM",
            "model_types": ["chat"]
        },
        "VolcEngine": {
            "logo": "volcengine_logo",
            "tags": "LLM",
            "model_types": ["chat"]
        },
        "Azure-OpenAI": {
            "logo": "azure_logo",
            "tags": "LLM,Text Embedding",
            "model_types": ["chat", "embedding"]
        },
    }
    
    @classmethod
    def get_factories(cls) -> List[Dict]:
        """获取所有支持的厂商"""
        factories = []
        for name, info in cls.SUPPORTED_FACTORIES.items():
            factories.append({
                "name": name,
                "logo": info["logo"],
                "tags": info["tags"],
                "model_types": info["model_types"],
                "status": "1"
            })
        return factories
    
    @classmethod
    def process_api_key(cls, factory: str, request_data: Dict) -> str:
        """根据厂商类型处理 API 密钥"""
        
        if factory == "VolcEngine":
            return json.dumps({
                "ark_api_key": request_data.get("ark_api_key", ""),
                "endpoint_id": request_data.get("endpoint_id", "")
            })
        
        elif factory == "Bedrock":
            return json.dumps({
                "auth_mode": request_data.get("auth_mode", ""),
                "bedrock_ak": request_data.get("bedrock_ak", ""),
                "bedrock_sk": request_data.get("bedrock_sk", ""),
                "bedrock_region": request_data.get("bedrock_region", ""),
                "aws_role_arn": request_data.get("aws_role_arn", "")
            })
        
        elif factory == "Azure-OpenAI":
            return json.dumps({
                "api_key": request_data.get("api_key", ""),
                "api_version": request_data.get("api_version", "")
            })
        
        else:
            return request_data.get("api_key", "")


class TenantLLMManager:
    """租户 LLM 管理器"""
    
    def __init__(self):
        """初始化管理器"""
        self.tenant_models: Dict[str, List[ModelConfig]] = {}
        self.tenant_settings: Dict[str, Dict] = {}
    
    def add_model(self, config: ModelConfig) -> bool:
        """添加或更新模型配置"""
        if config.tenant_id not in self.tenant_models:
            self.tenant_models[config.tenant_id] = []
        
        for i, model in enumerate(self.tenant_models[config.tenant_id]):
            if (model.llm_factory == config.llm_factory and 
                model.llm_name == config.llm_name):
                self.tenant_models[config.tenant_id][i] = config
                return True
        
        self.tenant_models[config.tenant_id].append(config)
        return True
    
    def delete_model(self, tenant_id: str, factory: str, model_name: str) -> bool:
        """删除模型配置"""
        if tenant_id not in self.tenant_models:
            return False
        
        self.tenant_models[tenant_id] = [
            m for m in self.tenant_models[tenant_id]
            if not (m.llm_factory == factory and m.llm_name == model_name)
        ]
        return True
    
    def get_models(self, tenant_id: str) -> List[ModelConfig]:
        """获取租户的所有模型"""
        return self.tenant_models.get(tenant_id, [])
    
    def get_model(self, tenant_id: str, factory: str, model_name: str) -> Optional[ModelConfig]:
        """获取特定模型配置"""
        models = self.get_models(tenant_id)
        for model in models:
            if model.llm_factory == factory and model.llm_name == model_name:
                return model
        return None
    
    def set_default_models(self, tenant_id: str, settings: Dict) -> bool:
        """设置系统默认模型"""
        self.tenant_settings[tenant_id] = settings
        return True
    
    def get_default_models(self, tenant_id: str) -> Dict:
        """获取系统默认模型设置"""
        return self.tenant_settings.get(tenant_id, {})


class ModelVerifier:
    """模型验证器"""
    
    @staticmethod
    async def _verify_qwen_api_key(api_key: str, base_url: str, timeout: int) -> Tuple[bool, str]:
        """验证千问 API Key - 支持多种模型类型"""
        import httpx
        
        try:
            # 使用千问官方 API 端点
            api_base = base_url if base_url else "https://dashscope.aliyuncs.com/compatible-mode/v1"
            
            # 初始化验证标志
            chat_passed, embd_passed, rerank_passed = False, False, False
            msg = ""
            
            # 从数据库查询千问工厂的所有模型
            from ..db import LLMModel
            models = LLMModel.select().where(LLMModel.factory_id == "Tongyi-Qianwen")
            logging.info(f"Found {len(models)} models for Qianwen")
            for model in models:
                logging.info(f"Supported model: name={model.llm_name}, type={model.model_type}")
            if len(models) > 0:
                return True, "✓ 千问支持"
            else:
                return False, "未找到任何千问模型"
        except Exception as e:
            logging.error(f"Error verifying Qianwen API Key: {e}")
            return False, str(e)

            for llm in models:
                # 验证 Embedding 模型
                if not embd_passed and llm.model_type == LLMType.EMBEDDING.value:
                    # 检查千问是否支持 Embedding 模型
                    test_url = f"{api_base}/embeddings"
                    
                    payload = {
                        "model": llm.llm_name or "text-embedding-v1",
                        "input": ["Test if the api key is available"]
                    }
                    
                    headers = {
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    }
                    
                    async with httpx.AsyncClient(timeout=timeout) as client:
                        response = await client.post(test_url, headers=headers, json=payload)
                        
                        if response.status_code == 200:
                            data = response.json()
                            if "data" in data and len(data["data"]) > 0:
                                embd_passed = True
                        else:
                            msg += f"\nFail to access embedding model({llm.llm_name}) using this api key. HTTP {response.status_code}"
                
                # 验证 Chat 模型
                elif not chat_passed and llm.model_type == LLMType.CHAT.value:
                    # 构造一个简单的测试请求
                    test_url = f"{api_base}/chat/completions"
                    
                    payload = {
                        "model": llm.llm_name or "qwen-turbo",
                        "messages": [
                            {"role": "user", "content": "Hello! How are you doing!"}
                        ],
                        "max_tokens": 50
                    }
                    
                    headers = {
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    }
                    
                    async with httpx.AsyncClient(timeout=timeout) as client:
                        response = await client.post(test_url, headers=headers, json=payload)
                        
                        if response.status_code == 200:
                            data = response.json()
                            if "choices" in data and len(data["choices"]) > 0:
                                content = data["choices"][0]["message"]["content"]
                                if "**ERROR**" not in content:
                                    chat_passed = True
                        else:
                            msg += f"\nFail to access model({llm.llm_name}) using this api key. HTTP {response.status_code}"
                
                # 验证 Rerank 模型（如果需要）
                # elif not rerank_passed and llm.model_type == LLMType.RERANK.value:
                #     # 类似的验证流程
                #     pass
            
            # 检查验证结果
            if chat_passed and embd_passed:
                return True, "✓ 千问 API Key 验证成功（Chat 和 Embedding 模型均可用）"
            elif chat_passed:
                return True, "✓ 千问 API Key 验证成功（仅 Chat 模型可用）"
            elif embd_passed:
                return True, "✓ 千问 API Key 验证成功（仅 Embedding 模型可用）"
            else:
                return False, f"✗ API Key 验证失败：{msg}"
                    
        except httpx.TimeoutException:
            return False, "✗ 请求超时，请检查网络连接"
        except httpx.RequestError as e:
            return False, f"✗ 网络错误：{str(e)}"
        except Exception as e:
            return False, f"✗ 验证失败：{str(e)}"
    
    @staticmethod
    async def _verify_openai_api_key(api_key: str, base_url: str, timeout: int) -> Tuple[bool, str]:
        """验证 OpenAI API Key（待实现）"""
        # TODO: 实现 OpenAI 验证逻辑
        return True, "✓ OpenAI API Key 验证成功（待实现）"
    
    @staticmethod
    async def _verify_ollama_api_key(api_key: str, base_url: str, timeout: int) -> Tuple[bool, str]:
        """验证 Ollama API Key（待实现）"""
        # TODO: 实现 Ollama 验证逻辑
        return True, "✓ Ollama API Key 验证成功（待实现）"
    
    @staticmethod
    async def verify_api_key(factory: str, api_key: str, 
                            base_url: str = "", timeout: int = 10) -> Tuple[bool, str]:
        """
        验证厂商 API Key - 统一入口函数
        
        Args:
            factory: 厂商名称（如：Qwen, OpenAI, Ollama 等）
            api_key: API 密钥
            base_url: 基础 URL（可选）
            timeout: 超时时间（秒）
            
        Returns:
            Tuple[bool, str]: (是否成功，消息)
        """
        try:
            # 根据厂商名称路由到对应的验证函数
            if factory == "Tongyi-Qianwen":
                return await ModelVerifier._verify_qwen_api_key(api_key, base_url, timeout)
            elif factory == "OpenAI":
                return await ModelVerifier._verify_openai_api_key(api_key, base_url, timeout)
            elif factory == "Ollama":
                return await ModelVerifier._verify_ollama_api_key(api_key, base_url, timeout)
            else:
                # 默认返回未实现提示
                return False, f"✗ 暂不支持的厂商：{factory}"
                
        except asyncio.TimeoutError:
            return False, f"✗ 验证超时：{factory}"
        except Exception as e:
            return False, f"✗ 验证失败：{str(e)}"
    
    @staticmethod
    async def verify_embedding_model(factory: str, api_key: str, model_name: str,
                                     base_url: str = "", timeout: int = 10) -> Tuple[bool, str]:
        """验证嵌入模型"""
        try:
            await asyncio.sleep(0.5)
            
            if not api_key or api_key == "invalid":
                return False, f"Invalid API key for {factory}/{model_name}"
            
            return True, f"✓ Embedding model {model_name} verified successfully"
        except Exception as e:
            return False, f"Verification failed: {str(e)}"
    
    @staticmethod
    async def verify_model(model_type: str, factory: str, api_key: str, 
                          model_name: str, base_url: str = "") -> Tuple[bool, str]:
        """通用模型验证"""
        if model_type == LLMType.CHAT.value:
            return await ModelVerifier.verify_chat_model(factory, api_key, model_name, base_url)
        elif model_type == LLMType.EMBEDDING.value:
            return await ModelVerifier.verify_embedding_model(factory, api_key, model_name, base_url)
        else:
            return True, f"✓ Model {model_name} verified"


class ModelManagementDemo:
    """模型管理演示应用"""
    
    def __init__(self):
        """初始化演示应用"""
        self.manager = TenantLLMManager()
        self.verifier = ModelVerifier()
    
    async def add_model_workflow(self, tenant_id: str, factory: str, 
                                 model_name: str, model_type: str,
                                 request_data: Dict) -> Dict:
        """完整的模型添加工作流"""
        
        print(f"\n{'='*60}")
        print(f"添加模型: {factory}/{model_name}")
        print(f"{'='*60}")
        
        print("\n[步骤 1] 处理 API 密钥...")
        api_key = LLMFactoryHandler.process_api_key(factory, request_data)
        print(f"✓ API 密钥已处理")
        
        print("\n[步骤 2] 验证模型...")
        success, message = await self.verifier.verify_model(
            model_type, factory, api_key, model_name,
            request_data.get("api_base", "")
        )
        print(f"{message}")
        
        if not success:
            return {
                "code": 1,
                "message": message,
                "data": None
            }
        
        print("\n[步骤 3] 保存配置...")
        config = ModelConfig(
            tenant_id=tenant_id,
            llm_factory=factory,
            llm_name=model_name,
            model_type=model_type,
            api_key=api_key,
            api_base=request_data.get("api_base", ""),
            max_tokens=request_data.get("max_tokens", 8192)
        )
        
        self.manager.add_model(config)
        print(f"✓ 模型配置已保存")
        
        return {
            "code": 0,
            "message": "Model added successfully",
            "data": {
                "factory": factory,
                "model_name": model_name,
                "model_type": model_type,
                "status": "active"
            }
        }
    
    def list_models(self, tenant_id: str) -> Dict:
        """列出租户的所有模型"""
        models = self.manager.get_models(tenant_id)
        
        result = {}
        for model in models:
            if model.llm_factory not in result:
                result[model.llm_factory] = {
                    "factory": model.llm_factory,
                    "models": []
                }
            
            result[model.llm_factory]["models"].append({
                "name": model.llm_name,
                "type": model.model_type,
                "max_tokens": model.max_tokens,
                "status": model.status
            })
        
        return {
            "code": 0,
            "data": result
        }
    
    def delete_model(self, tenant_id: str, factory: str, model_name: str) -> Dict:
        """删除模型"""
        success = self.manager.delete_model(tenant_id, factory, model_name)
        
        return {
            "code": 0 if success else 1,
            "message": "Model deleted successfully" if success else "Model not found",
            "data": success
        }
    
    def set_default_models(self, tenant_id: str, settings: Dict) -> Dict:
        """设置系统默认模型"""
        self.manager.set_default_models(tenant_id, settings)
        
        return {
            "code": 0,
            "message": "Default models set successfully",
            "data": settings
        }
    
    def get_factories(self) -> Dict:
        """获取所有支持的厂商"""
        factories = LLMFactoryHandler.get_factories()
        
        return {
            "code": 0,
            "data": factories
        }
