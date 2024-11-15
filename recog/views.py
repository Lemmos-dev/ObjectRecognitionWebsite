# views.py
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework import status
from .models import TaggedImage
import numpy as np
from .serializers import TaggedImageSerializer
from .services.sam2_service import process_image_with_sam2
from django.http import JsonResponse, HttpResponse
from PIL import Image, ImageDraw
import io
import json

class TaggedImageUploadView(APIView):
    parser_classes = [MultiPartParser, JSONParser]

    def post(self, request, *args, **kwargs):
        print("Request Data:", request.data)

        # Save the data in the local database
        serializer = TaggedImageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            print("Data saved successfully")

            # After saving, process the image with SAM2
            image_file = request.FILES.get('image')
            tags = request.data.get('tags')

            if not image_file or not tags:
                return JsonResponse({'error': 'Missing image or tags'}, status=400)

            tags = json.loads(tags)

            # Call the process_image_with_sam2 function to get the masks and processed image
            try:
                masks, combined_image = process_image_with_sam2(image_file, tags)
                if masks is None or len(masks) == 0:
                    return JsonResponse({'error': 'No masks generated'}, status=500)

                # Save the final combined image to a BytesIO stream
                img_io = io.BytesIO()
                combined_image.save(img_io, 'PNG')
                img_io.seek(0)

                return HttpResponse(img_io, content_type='image/png')
            except Exception as e:
                return JsonResponse({'error': str(e)}, status=500)
        else:
            print("Errors in serializer:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)