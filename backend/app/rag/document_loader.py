"""
文档加载与解析模块
支持多种格式的文档加载和解析
"""
import os
import logging
from typing import List, Dict, Any
import pdfplumber
from docx import Document as DocxDocument

class DocumentLoader:
    """
    文档加载器，支持多种格式的文档解析
    """
    
    def __init__(self):
        self.supported_types = ['pdf', 'txt', 'md', 'docx', 'doc']
        
    def load_document(self, file_path: str) -> List[Dict[str, Any]]:
        """
        加载并解析文档，返回文本片段列表
        
        Args:
            file_path: 文档文件路径
            
        Returns:
            包含文本内容和元信息的字典列表
        """
        file_ext = os.path.splitext(file_path)[1][1:].lower()
        
        if file_ext == 'pdf':
            return self._load_pdf(file_path)
        elif file_ext == 'txt':
            return self._load_txt(file_path)
        elif file_ext == 'md':
            return self._load_md(file_path)
        elif file_ext == 'docx':
            return self._load_docx(file_path)
        elif file_ext == 'doc':
            return self._load_doc(file_path)
        else:
            raise ValueError(f"不支持的文件格式：{file_ext}")

    def _load_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        """
        解析 PDF 文档
        """
        content = []
        try:
            logging.info(f"开始解析 PDF: {file_path}")
            with pdfplumber.open(file_path) as pdf:
                logging.info(f"PDF 页数：{len(pdf.pages)}")
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    logging.info(f"第 {page_num + 1} 页提取文本长度：{len(text) if text else 0}")
                    if text and text.strip():
                        content.append({
                            "text": text,
                            "page": page_num + 1,
                            "source": f"{os.path.basename(file_path)}_page_{page_num + 1}"
                        })
        except Exception as e:
            logging.error(f"解析 PDF 文件失败 {file_path}: {e}")
            raise
            
        logging.info(f"PDF 解析完成，共提取 {len(content)} 个文本片段")
        return content
    
    def _load_txt(self, file_path: str) -> List[Dict[str, Any]]:
        """
        解析纯文本文件
        """
        content = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
                if text and text.strip():
                    content.append({
                        "text": text,
                        "source": os.path.basename(file_path)
                    })
        except Exception as e:
            logging.error(f"解析TXT文件失败 {file_path}: {e}")
            raise
        
        return content
    
    def _load_md(self, file_path: str) -> List[Dict[str, Any]]:
        """
        解析Markdown文件
        """
        content = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
                if text and text.strip():
                    content.append({
                        "text": text,
                        "source": os.path.basename(file_path)
                    })
        except Exception as e:
            logging.error(f"解析Markdown文件失败 {file_path}: {e}")
            raise
        
        return content
    
    def _load_docx(self, file_path: str) -> List[Dict[str, Any]]:
        """
        解析 Word 文档
        """
        content = []
        try:
            doc = DocxDocument(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
                
            if text and text.strip():
                content.append({
                    "text": text,
                    "source": os.path.basename(file_path)
                })
        except Exception as e:
            logging.error(f"解析 Word 文件失败 {file_path}: {e}")
            raise
            
        return content
        
    def _load_doc(self, file_path: str) -> List[Dict[str, Any]]:
        """
        解析旧版 Word 文档（.doc）
        注意：.doc 是二进制格式，需要使用专用库或转换工具
        这里提供简单的文本提取（可能不完整）
        """
        content = []
        try:
            # 尝试使用 antiword 或 catdoc（需要系统安装）
            import subprocess
            
            # 优先尝试 antiword
            try:
                result = subprocess.run(
                    ['antiword', file_path],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if result.returncode == 0 and result.stdout.strip():
                    content.append({
                        "text": result.stdout,
                        "source": os.path.basename(file_path)
                    })
                    return content
            except (FileNotFoundError, subprocess.TimeoutExpired):
                pass
            
            # 尝试 catdoc
            try:
                result = subprocess.run(
                    ['catdoc', file_path],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if result.returncode == 0 and result.stdout.strip():
                    content.append({
                        "text": result.stdout,
                        "source": os.path.basename(file_path)
                    })
                    return content
            except (FileNotFoundError, subprocess.TimeoutExpired):
                pass
            
            # 备用方案：使用 olefile 读取（纯 Python 实现）
            try:
                import olefile
                ole = olefile.OleFileIO(file_path)
                text_streams = []
                
                # 读取文本流
                for stream in ole.listdir():
                    if 'WordDocument' in stream or '1Table' in stream:
                        continue
                    try:
                        data = ole.openstream(stream).read()
                        # 尝试解码
                        try:
                            text = data.decode('utf-8', errors='ignore')
                            if text.strip():
                                text_streams.append(text)
                        except:
                            pass
                    except:
                        pass
                
                if text_streams:
                    content.append({
                        "text": "\n".join(text_streams),
                        "source": os.path.basename(file_path)
                    })
            except ImportError:
                logging.warning("olefile 未安装，无法解析 .doc 文件")
            except Exception as e:
                logging.warning(f"olefile 解析失败：{e}")
            
            # 最后的备用方案：直接读取文本（效果有限）
            if not content:
                logging.info(f"尝试直接读取 DOC 文件...")
                with open(file_path, 'rb') as f:
                    data = f.read()
                    # 尝试提取 ASCII 文本
                    text = ''.join(chr(b) if 32 <= b < 127 else ' ' for b in data)
                    text = ' '.join(text.split())  # 清理空白字符
                    if text.strip():
                        content.append({
                            "text": text,
                            "source": os.path.basename(file_path)
                        })
                        
        except Exception as e:
            logging.error(f"解析 DOC 文件失败 {file_path}: {e}")
            raise
        
        return content