# views.py
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework import status
from .models import TaggedImage
import numpy as np
from .serializers import TaggedImageSerializer
from .services.sam2_model import process_and_save_image
from django.http import JsonResponse, HttpResponse
from PIL import Image, ImageDraw
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