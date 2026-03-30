# webdav_upload.py
import requests
from requests.auth import HTTPBasicAuth
import os

AccessKey_ID = os.getenv("ACCESS_KEY_ID")
AccessKey_Secret = os.getenv("ACCESS_KEY_SECRET")
class CSTWebDAV:
    def __init__(self):
        self.base_url = 'https://data.cstcloud.cn/dav'  # WebDAV 端点
        self.username = AccessKey_ID
        self.password = AccessKey_Secret

    def upload_file(self, local_path, remote_name=None):
        """上传文件并返回公开访问 URL"""
        if remote_name is None:
            remote_name = os.path.basename(local_path)

        url = f"{self.base_url}/{remote_name}"

        # 🔑 关键：模拟 Zotero 客户端 UA
        headers = {
            'User-Agent': 'Zotero/8.0',
            'Content-Type': 'application/octet-stream'
        }

        try:
            with open(local_path, 'rb') as f:
                response = requests.put(
                    url,
                    data=f,
                    auth=HTTPBasicAuth(self.username, self.password),
                    headers=headers,
                    verify=True  # 生产环境建议开启证书验证
                )

            if response.status_code in [200, 201, 204]:
                print(f"✅ 上传成功: {remote_name}")
                # 生成公开访问链接（可能需要认证）
                public_url = f"{self.base_url}/{remote_name}"
                return public_url
            else:
                print(f"❌ 上传失败: {response.status_code}")
                print(f"📄 响应: {response.text[:200]}")
                return None

        except Exception as e:
            print(f"❌ 错误: {e}")
            return None

    def get_download_url(self, filename):
        """获取文件下载链接"""
        return f"{self.base_url}/{filename}"


# ============ 使用示例 ============
if __name__ == "__main__":
    storage = CSTWebDAV()

    # 上传文件
    url = storage.upload_file("test.pdf")  # 替换为你的文件

    if url:
        print(f"\n🔗 文件链接: {url}")
        print("⚠️  注意：他人访问时可能需要输入 AccessKey 作为账号密码")