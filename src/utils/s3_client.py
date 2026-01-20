import boto3
from botocore.exceptions import NoCredentialsError

class ProgressPercentage(object):
        def __init__(self, filename):
            self._filename = filename
            self._size = float(os.path.getsize(filename))
            self._seen_so_far = 0

        def __call__(self, bytes_amount):
            self._seen_so_far += bytes_amount
            percentage = (self._seen_so_far / self._size) * 100
            sys.stdout.write(f"\r{self._filename}  {self._seen_so_far} / {self._size}  ({percentage:.2f}%)")
            sys.stdout.flush()

def upload_to_s3(local_file, bucket, object_name=None):
    if object_name is None:
        object_name = local_file

    s3 = boto3.client('s3')

    try:
        s3.upload_file(local_file, bucket, object_name, Callback=ProgressPercentage(local_file))
        print("Upload Successful")
        return True
    except FileNotFoundError:
        print("The file was not found")
        return False
    except NoCredentialsError:
        print("Credentials not available")
        return False