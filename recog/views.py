import numpy as np
from django.shortcuts import render
import torch
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.views import APIView
from rest_framework import status
from PIL import Image
import io
import json
from .models import TaggedImage
from .serializers import TaggedImageSerializer
from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor

@api_view(['GET'])
def hello_world(request):
    return Response({"message": "Hello World"})

# SAM2 model setup
checkpoint = "F:/GitHub/sam2/checkpoints/sam2.1_hiera_small.pt"
model_cfg = "F:/GitHub/sam2/configs/sam2.1/sam2.1_hiera_s.yaml"
predictor = SAM2ImagePredictor(build_sam2(model_cfg, checkpoint))

class TaggedImageUploadView(APIView):
    parser_classes = [MultiPartParser, JSONParser]

    def post(self, request, *args, **kwargs):
        # Save the data in the database
        serializer = TaggedImageSerializer(data=request.data)
        if serializer.is_valid():
            tagged_image = serializer.save()

            # Get the image and tags data from the request
            image_file = tagged_image.image
            tags = json.loads(tagged_image.tags)

            # Open and convert the image for SAM2 processing
            image = Image.open(image_file).convert("RGB")
            image_np = np.array(image)  # Convert to numpy array (H, W, C)

            # Convert image to the format SAM2 expects (e.g., float and normalized)
            image_np = image_np.astype(np.float32) / 255.0  # Normalize to [0, 1] range

            # Prepare input prompts (coordinates) from tags as a numpy array
            input_prompts = np.array([(tag['x'], tag['y']) for tag in tags])

            # Run SAM2 inference
            with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
                predictor.set_image(image_np)  # Set the image for SAM2
                masks, _, _ = predictor.predict(input_prompts)  # Run prediction

            # Convert masks to a format suitable for JSON response
            segmentation_data = [mask.cpu().numpy().tolist() for mask in masks]

            return Response({
                'image': tagged_image.image.url,
                'tags': tagged_image.tags,
                'segmentation': segmentation_data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)