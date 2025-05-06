from rest_framework.decorators import api_view
from rest_framework.response import Response
import uuid
from django.conf import settings
import os
from django.core.files.storage import default_storage

@api_view(['POST'])
def upload_image(request):
    try:
        # Get the image file from the request
        image_file = request.FILES.get('image')

        if not image_file:
            return Response({'error': 'No image file provided'}, status=400)

        # Generate unique filename
        file_extension = image_file.name.split('.')[-1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        # Check if S3 is configured
        if hasattr(settings, 'USE_S3') and settings.USE_S3:
            try:
                # Import boto3 only if we're using S3
                import boto3

                # Upload directly to S3
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME
                )

                # Upload the file without ACL parameter
                s3_client.upload_fileobj(
                    image_file,
                    settings.AWS_STORAGE_BUCKET_NAME,
                    unique_filename,
                    ExtraArgs={
                        'ContentType': image_file.content_type
                    }
                )

                # Generate the URL for the uploaded image
                image_url = f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{unique_filename}"

                return Response({'imageUrl': image_url}, status=201)

            except Exception as e:
                print(f"Error uploading to S3: {str(e)}")
                # If S3 fails, fall back to local storage
                print("Falling back to local storage...")

        # Use local file storage if S3 is not configured or failed
        file_path = os.path.join('images', unique_filename)
        path = default_storage.save(file_path, image_file)
        image_url = default_storage.url(path)

        return Response({'imageUrl': image_url}, status=201)

    except Exception as e:
        error_message = f"Error uploading image: {str(e)}"
        print(error_message)
        return Response({'error': error_message}, status=500)