#!/usr/bin/env python3
"""
启动器层 - 进程生命周期管理
"""
import faulthandler
import logging
import os
import signal
import socket
import traceback
import uvicorn

# 导入 FastAPI 应用实例
from app.main import app

# 启用故障处理器
faulthandler.enable()


def main():
    """主启动函数"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logging.info("=" * 60)
    logging.info("RAG Platform Server Starting...")
    logging.info("=" * 60)

    # 配置服务地址和端口
    host, port = '127.0.0.1', 8000

    # 启动服务
    try:
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
        )
    except KeyboardInterrupt:
        logging.info("收到中断信号，正在关闭服务...")
    except SystemExit:
        logging.error("服务异常退出")
    except socket.error as e:
        logging.error(f"网络错误：{e}")
    except Exception as e:
        logging.error(f"服务启动失败：{type(e).__name__} - {e}")
        traceback.print_exc()
        os.kill(os.getpid(), signal.SIGKILL)


if __name__ == "__main__":
    main()
