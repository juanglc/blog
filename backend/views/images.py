from rest_framework.decorators import api_view
from rest_framework.response import Response
import boto3
from django.conf import settings
import uuid

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
                # Removed 'ACL': 'public-read' which was causing the error
            }
        )

        # Generate the URL for the uploaded image
        image_url = f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{unique_filename}"

        return Response({'imageUrl': image_url}, status=201)

    except Exception as e:
        print(f"Error uploading to S3: {str(e)}")
        return Response({'error': str(e)}, status=500)