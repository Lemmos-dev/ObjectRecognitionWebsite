# views.py
from django.core.files.storage import default_storage
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, JSONParser

from .models import TaggedImage
from .serializers import TaggedImageSerializer
from .services.sam2_model import process_and_save_image
from django.http import JsonResponse, HttpResponse
import io
import json

class TaggedImageUploadView(APIView):
    parser_classes = [MultiPartParser, JSONParser]

    def post(self, request, *args, **kwargs):
        image_file = request.FILES.get('image')
        tags = json.loads(request.data.get('tags'))

        try:
            masks, combined_image = process_and_save_image(image_file, tags)
            img_io = io.BytesIO()
            combined_image.save(img_io, 'PNG')
            img_io.seek(0)
            return HttpResponse(img_io, content_type='image/png')
        except ValueError as e:
            return JsonResponse({'error': str(e)}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    def get(self, request, *args, **kwargs):
        try:
            # Access the id parameter from kwargs
            image_id = kwargs.get('id')  # This will get the id from the URL

            # Fetch the TaggedImage object by id
            image_instance = TaggedImage.objects.get(id=image_id)

            # Return the image URL and tags as JSON response
            image_url = image_instance.image.url  # Using image field's URL property
            return JsonResponse({
                'image': image_url,
                'tags': image_instance.tags
            })
        except TaggedImage.DoesNotExist:
            return JsonResponse({'error': 'Image not found'}, status=404)

    def put(self, request, image_id):
        try:
            image = TaggedImage.objects.get(id=image_id)
            serializer = TaggedImageSerializer(image, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=200)
            return Response(serializer.errors, status=400)
        except TaggedImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=404)

    def delete(self, request, image_id):
        try:
            image = TaggedImage.objects.get(id=image_id)
            image.delete()
            return Response({"message": "Image deleted"}, status=204)
        except TaggedImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=404)