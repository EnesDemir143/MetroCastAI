import boto3
import os
from tqdm import tqdm
from botocore.exceptions import NoCredentialsError

def upload_to_s3(file_path, bucket_name, object_name=None):
    if object_name is None:
        object_name = os.path.basename(file_path)

    file_size = os.path.getsize(file_path)
    s3 = boto3.client('s3')

    with tqdm(total=file_size, unit='B', unit_scale=True, desc=object_name) as pbar:
        try:
            s3.upload_file(
                file_path, 
                bucket_name, 
                object_name,
                Callback=lambda bytes_transferred: pbar.update(bytes_transferred)
            )
            return True
        except FileNotFoundError:
            print(f"The file {file_path} was not found")
            return False
        except NoCredentialsError:
            print("Credentials not available")
            return False
        except Exception as e:
            print(f"S3 Upload Error: {e}")
            return False
        