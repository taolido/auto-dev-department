import os
import boto3
from google.cloud import storage
from typing import Optional
from django.conf import settings


class StorageClient:
    def __init__(self, storage_type: str = settings.DEFAULT_STORAGE_TYPE):
        self.storage_type = storage_type
        if self.storage_type == 'aws':
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,  # Optional
                region_name=settings.AWS_REGION_NAME,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        elif self.storage_type == 'gcp':
            self.gcp_client = storage.Client.from_service_account_json(settings.GCP_CREDENTIALS_PATH)
            self.bucket_name = settings.GCP_STORAGE_BUCKET_NAME
        else:
            raise ValueError("Invalid storage type. Choose 'aws' or 'gcp'.")

    def upload_file(self, file_path: str, object_name: str) -> bool:
        """Upload a file to the specified cloud storage."""
        try:
            if self.storage_type == 'aws':
                self.s3_client.upload_file(file_path, self.bucket_name, object_name)
            elif self.storage_type == 'gcp':
                bucket = self.gcp_client.bucket(self.bucket_name)
                blob = bucket.blob(object_name)
                blob.upload_from_filename(file_path)
            return True
        except Exception as e:
            print(f"Error uploading file: {e}")
            return False

    def download_file(self, object_name: str, file_path: str) -> bool:
        """Download a file from the specified cloud storage."""
        try:
            if self.storage_type == 'aws':
                self.s3_client.download_file(self.bucket_name, object_name, file_path)
            elif self.storage_type == 'gcp':
                bucket = self.gcp_client.bucket(self.bucket_name)
                blob = bucket.blob(object_name)
                blob.download_to_filename(file_path)
            return True
        except Exception as e:
            print(f"Error downloading file: {e}")
            return False

    def delete_file(self, object_name: str) -> bool:
        """Delete a file from the specified cloud storage."""
        try:
            if self.storage_type == 'aws':
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_name)
            elif self.storage_type == 'gcp':
                bucket = self.gcp_client.bucket(self.bucket_name)
                blob = bucket.blob(object_name)
                blob.delete()
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False

    def generate_presigned_url(self, object_name: str, expiration: int = 3600) -> Optional[str]:
        """Generate a presigned URL to access the file."""
        try:
            if self.storage_type == 'aws':
                url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': object_name},
                    ExpiresIn=expiration
                )
                return url
            elif self.storage_type == 'gcp':
                bucket = self.gcp_client.bucket(self.bucket_name)
                blob = bucket.blob(object_name)
                url = blob.generate_signed_url(expiration=expiration)
                return url
            else:
                return None
        except Exception as e:
            print(f"Error generating presigned URL: {e}")
            return None


# Example Usage (within a Django view, for instance):
# from utils.storage import StorageClient
# storage_client = StorageClient()
# if storage_client.upload_file('/path/to/your/local/file.txt', 'remote/file.txt'):
#     print("File uploaded successfully!")
#
# download_path = '/tmp/downloaded_file.txt'
# if storage_client.download_file('remote/file.txt', download_path):
#     print(f"File downloaded successfully to {download_path}!")
#
# presigned_url = storage_client.generate_presigned_url('remote/file.txt')
# if presigned_url:
#     print(f"Presigned URL: {presigned_url}")