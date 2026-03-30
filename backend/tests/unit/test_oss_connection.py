# test_minimal.py
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# 🔑 配置（先硬编码测试，成功后改从环境变量读取）
ENDPOINT = 'https://s3.cstcloud.cn'  # ✅ 确保无空格！
ACCESS_KEY = 'AKIAGCV09EF9NYO3ATA9'
SECRET_KEY = 'DGIVGCXQQ=KHO4+W0M4ND2AH3J4K6RLYNBREUJ=3'
BUCKET = 'database'  # ✅ 确认这是你创建的桶名

# 创建客户端
s3 = boto3.client(
    's3',
    endpoint_url=ENDPOINT,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    config=Config(
        signature_version='s3v4',
        s3={'addressing_style': 'path'}  # ✅ 必须启用 Path-Style
    )
)

# 测试连接
try:
    print("🔍 正在连接...")
    resp = s3.list_objects_v2(Bucket=BUCKET, MaxKeys=3)
    print("✅ 连接成功！")
    for obj in resp.get('Contents', []):
        print(f"   📄 {obj['Key']}")
except ClientError as e:
    code = e.response['Error']['Code']
    msg = e.response['Error']['Message']
    print(f"❌ 错误 [{code}]: {msg}")
    if code == '401' or code == 'InvalidAccessKeyId':
        print("\n💡 可能原因：")
        print("   1️⃣ AccessKey/SecretKey 错误或已禁用")
        print("   2️⃣ endpoint_url 有空格或协议错误")
        print("   3️⃣ 本地系统时间不准确（签名依赖时间）")