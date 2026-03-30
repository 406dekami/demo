import boto3
from botocore.config import Config
from botocore.client import ClientError
import os

AccessKey_ID = os.getenv("ACCESS_KEY_ID")
AccessKey_Secret = os.getenv("ACCESS_KEY_SECRET")
BUCKET_NAME = os.getenv("BUCKET_NAME")
class S3Storage:
    def __init__(self):
        self.endpoint_url = 'https://s3.cstcloud.cn'
        self.access_key = AccessKey_ID
        self.secret_key = AccessKey_Secret
        self.bucket_name = BUCKET_NAME
    
        # 创建 S3 客户端
        self.s3_client = boto3.client(
            service_name='s3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(
                signature_version='s3v4',  # 使用 v4 签名
                s3={'addressing_style': 'path'}  # 启用 Path-Style 访问
            )
        )

    def upload_file(self, local_file_path, object_name=None):
        """
        上传文件到存储桶

        Args:
            local_file_path: 本地文件路径
            object_name: 存储桶中的对象名称（可选，默认为文件名）

        Returns:
            文件URL
        """
        import os

        if object_name is None:
            object_name = os.path.basename(local_file_path)

        try:
            # 上传文件
            self.s3_client.upload_file(local_file_path, self.bucket_name, object_name)
            print(f"✓ 文件上传成功: {object_name}")

            # 生成可访问的URL
            file_url = f"{self.endpoint_url}/{self.bucket_name}/{object_name}"
            return file_url

        except ClientError as e:
            print(f"✗ 上传失败: {e}")
            return None

    def get_presigned_url(self, object_name, expiration=3600):
        """
        生成预签名URL（临时访问链接，适合私有文件）

        Args:
            object_name: 对象名称
            expiration: 过期时间（秒），默认1小时

        Returns:
            预签名URL
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_name},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            print(f"✗ 生成URL失败: {e}")
            return None

    def set_public_read(self, object_name):
        """
        设置文件为公开可读（谨慎使用）
        """
        try:
            self.s3_client.put_object_acl(
                ACL='public-read',
                Bucket=self.bucket_name,
                Key=object_name
            )
            print(f"✓ 文件已设置为公开访问")
        except ClientError as e:
            print(f"✗ 设置权限失败: {e}")


# ============ 使用示例 ============
if __name__ == "__main__":
    # 创建实例
    s3 = S3Storage()

    # 示例1: 上传文件并获取URL
    local_file = "test.pdf"  # 替换为你的文件路径
    url = s3.upload_file(local_file)

    if url:
        print(f"\n📎 文件URL: {url}")
        print("⚠️  注意：如果文件是私有的，直接访问可能403，需要使用预签名URL")

    # 示例2: 生成预签名URL（临时访问链接）
    # object_name = "test.pdf"
    # temp_url = s3.get_presigned_url(object_name, expiration=3600)
    # print(f"🔗 临时访问URL (1小时有效): {temp_url}")

    # 示例3: 设置文件公开可读（如果需要永久公开链接）
    # s3.set_public_read("test.pdf")