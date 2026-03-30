"""
OSS 存储测试
"""
import pytest
import os
import tempfile
from unittest.mock import patch, MagicMock
from app.utils.oss import S3Storage


class TestS3Storage:
    """测试 S3Storage 类"""
    
    @pytest.fixture
    def s3_storage(self):
        """创建 S3Storage 实例（使用 mock）"""
        with patch('app.utils.oss.boto3.client') as mock_client:
            storage = S3Storage()
            storage.s3_client = mock_client
            yield storage
    
    def test_init(self):
        """测试初始化"""
        with patch('app.utils.oss.boto3.client') as mock_client:
            storage = S3Storage()
            
            # 验证配置
            assert storage.endpoint_url == 'https://s3.cstcloud.cn'
            assert storage.bucket_name == 'qwen-data'
            assert storage.access_key == 'AKIAGCV09EF9NYO3ATA9'
            mock_client.assert_called_once()
    
    def test_upload_file_success(self, s3_storage):
        """测试文件上传成功"""
        # 创建临时文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("测试内容")
            temp_file = f.name
        
        try:
            # Mock upload_file
            s3_storage.s3_client.upload_file = MagicMock()
            
            # 调用上传
            result = s3_storage.upload_file(temp_file, "test.txt")
            
            # 验证结果
            assert result is not None
            assert "test.txt" in result
            assert s3_storage.s3_client.upload_file.called
            
            # 验证调用参数
            call_args = s3_storage.s3_client.upload_file.call_args
            assert call_args[0][0] == temp_file  # local_file_path
            assert call_args[0][1] == 'qwen-data'  # bucket_name
            assert call_args[0][2] == 'test.txt'  # object_name
            
        finally:
            # 清理临时文件
            os.unlink(temp_file)
    
    def test_upload_file_with_default_name(self, s3_storage):
        """测试使用默认文件名上传"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.pdf', delete=False) as f:
            f.write("PDF 内容")
            temp_file = f.name
        
        try:
            s3_storage.s3_client.upload_file = MagicMock()
            
            # 不指定 object_name，应该使用文件名
            result = s3_storage.upload_file(temp_file)
            
            # 应该使用临时文件的 basename
            expected_name = os.path.basename(temp_file)
            call_args = s3_storage.s3_client.upload_file.call_args
            assert call_args[0][2] == expected_name
            
        finally:
            os.unlink(temp_file)
    
    def test_upload_file_failure(self, s3_storage):
        """测试文件上传失败"""
        from botocore.client import ClientError
        
        # Mock 异常
        error_response = {'Error': {'Code': '500', 'Message': 'Server Error'}}
        s3_storage.s3_client.upload_file = MagicMock(
            side_effect=ClientError(error_response, 'upload_file')
        )
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("测试")
            temp_file = f.name
        
        try:
            # 上传失败应该返回 None
            result = s3_storage.upload_file(temp_file, "fail.txt")
            assert result is None
            
        finally:
            os.unlink(temp_file)
    
    def test_get_presigned_url_success(self, s3_storage):
        """测试生成预签名 URL 成功"""
        # Mock generate_presigned_url
        s3_storage.s3_client.generate_presigned_url = MagicMock(
            return_value="https://presigned.url/test.txt"
        )
        
        # 调用
        result = s3_storage.get_presigned_url("test.txt", expiration=7200)
        
        # 验证
        assert result is not None
        assert "presigned.url" in result
        s3_storage.s3_client.generate_presigned_url.assert_called_once_with(
            'get_object',
            Params={'Bucket': 'qwen-data', 'Key': 'test.txt'},
            ExpiresIn=7200
        )
    
    def test_get_presigned_url_failure(self, s3_storage):
        """测试生成预签名 URL 失败"""
        from botocore.client import ClientError
        
        error_response = {'Error': {'Code': '403', 'Message': 'Forbidden'}}
        s3_storage.s3_client.generate_presigned_url = MagicMock(
            side_effect=ClientError(error_response, 'generate_presigned_url')
        )
        
        # 失败应该返回 None
        result = s3_storage.get_presigned_url("test.txt")
        assert result is None
    
    def test_set_public_read_success(self, s3_storage):
        """测试设置公开读成功"""
        s3_storage.s3_client.put_object_acl = MagicMock()
        
        # 调用
        s3_storage.set_public_read("test.txt")
        
        # 验证调用
        s3_storage.s3_client.put_object_acl.assert_called_once_with(
            ACL='public-read',
            Bucket='qwen-data',
            Key='test.txt'
        )
    
    def test_set_public_read_failure(self, s3_storage):
        """测试设置公开读失败"""
        from botocore.client import ClientError
        
        error_response = {'Error': {'Code': '403', 'Message': 'Access Denied'}}
        s3_storage.s3_client.put_object_acl = MagicMock(
            side_effect=ClientError(error_response, 'put_object_acl')
        )
        
        # 不应该抛出异常，只是打印错误
        s3_storage.set_public_read("test.txt")  # 应该不报错
    
    def test_real_upload_integration(self):
        """集成测试：真实上传到存储桶"""
        # 使用真实的 S3Storage 配置
        s3 = S3Storage()
        
        # 创建临时测试文件
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            f.write("集成测试内容 - 验证真实存储桶连接")
            temp_file = f.name
        
        object_name = "integration_test.txt"
        
        try:
            # 1. 测试上传
            print(f"\n开始上传测试文件：{temp_file}")
            url = s3.upload_file(temp_file, object_name)
            
            # 验证上传成功
            assert url is not None, "上传失败，返回 None"
            assert object_name in url, f"URL 中不包含对象名：{url}"
            print(f"✓ 上传成功，URL: {url}")
            
            # 2. 测试生成预签名 URL
            print("\n测试生成预签名 URL...")
            presigned_url = s3.get_presigned_url(object_name, expiration=3600)
            assert presigned_url is not None, "生成预签名 URL 失败"
            print(f"✓ 预签名 URL 生成成功：{presigned_url}")
            
            # 3. 验证 URL 格式
            assert "https://" in presigned_url, "预签名 URL 格式错误"
            assert object_name in presigned_url, "预签名 URL 中不包含对象名"
            
            print("\n✅ 所有集成测试通过！")
            
        except Exception as e:
            print(f"\n❌ 集成测试失败：{e}")
            raise
        finally:
            # 清理临时文件
            if os.path.exists(temp_file):
                os.unlink(temp_file)
                print(f"已清理临时文件：{temp_file}")
