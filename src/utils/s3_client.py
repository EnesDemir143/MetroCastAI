import boto3
import os
from tqdm import tqdm
from botocore.exceptions import NoCredentialsError
import hashlib

def download_from_s3(file_path, bucket_name, logger):
    s3 = boto3.client('s3')
    try:
        logger.info(f"Downloading {file_path} from S3...")
        s3.download_file(bucket_name, os.path.basename(file_path), file_path)
        return True
    except Exception as e:
        logger.error(f"S3 Download Error: {e}")
        return False

def get_md5(file_path):
    """This function calculates the MD5 hash of a file."""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def upload_to_s3(file_path, bucket_name, object_name=None):
    if object_name is None:
        object_name = os.path.basename(file_path)

    s3 = boto3.client('s3')
    local_md5 = get_md5(file_path)

    try:
        response = s3.head_object(Bucket=bucket_name, Key=object_name)
        # Check for custom metadata 'md5'
        remote_md5 = response.get('Metadata', {}).get('md5')
        
        # Fallback to ETag if custom metadata is missing (legacy support)
        # remove quotes from ETag
        if not remote_md5 and 'ETag' in response:
            remote_md5 = response['ETag'].strip('"')

        if remote_md5 == local_md5:
            print(f"File {object_name} already exists in S3 with the same content (MD5 match). Skipping upload.")
            return True
        else:
            print(f"File {object_name} exists in S3 but content differs. Uploading new version.")

    except s3.exceptions.ClientError as e:
        if e.response['Error']['Code'] == '404':
            print(f"File {object_name} does not exist in S3. Proceeding with upload.")
        else:
            print(f"Error checking S3 object: {e}")
            return False

    file_size = os.path.getsize(file_path)

    with tqdm(total=file_size, unit='B', unit_scale=True, desc=object_name) as pbar:
        try:
            s3.upload_file(
                file_path, 
                bucket_name, 
                object_name,
                ExtraArgs={'Metadata': {'md5': local_md5}},
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
        