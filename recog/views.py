# views.py
from django.core.files.storage import default_storage
from rest_framework import status
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
        # Handle the GET request to fetch the image data
        image_id = kwargs.get('id')
        try:
            image_instance = TaggedImage.objects.get(id=image_id)
            image_url = image_instance.image.url  # Serve the image URL
            return Response({
                'image': image_url,
                'tags': image_instance.tags
            })
        except TaggedImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, *args, **kwargs):
        # Handle the PUT request to update the tags of an image
        image_id = kwargs.get('id')  # Access the 'id' from the URL parameters

        try:
            image_instance = TaggedImage.objects.get(id=image_id)
        except TaggedImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)

        # Assuming you're sending tags in the request data
        serializer = TaggedImageSerializer(image_instance, data=request.data,
                                           partial=True)  # partial=True allows updating only part of the model (tags)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Image tags updated successfully',
                'tags': serializer.data['tags']
            })
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        # Handle the DELETE request to remove an image from the database
        image_id = kwargs.get('id')  # Access the 'id' from the URL parameters

        try:
            image_instance = TaggedImage.objects.get(id=image_id)
            image_instance.delete()  # Delete the image instance from the database
            return Response({'message': 'Image deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except TaggedImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)