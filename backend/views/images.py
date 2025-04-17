from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
import uuid
from django.core.files.storage import FileSystemStorage

@csrf_exempt
def upload_image(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    if 'image' not in request.FILES:
        return JsonResponse({'error': 'No se envió ninguna imagen'}, status=400)

    image_file = request.FILES['image']

    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if image_file.content_type not in allowed_types:
        return JsonResponse({'error': 'Tipo de archivo no permitido'}, status=400)

    # Create media directory if it doesn't exist
    media_root = os.path.join(settings.BASE_DIR, 'media', 'images')
    os.makedirs(media_root, exist_ok=True)

    # Generate unique filename
    file_extension = os.path.splitext(image_file.name)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Save file
    fs = FileSystemStorage(location=media_root)
    filename = fs.save(unique_filename, image_file)

    # Generate URL
    file_url = f"/media/images/{filename}"

    return JsonResponse({
        'url': file_url,
        'filename': filename
    })