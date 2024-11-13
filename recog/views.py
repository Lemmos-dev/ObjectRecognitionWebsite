import requests
import torch
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.response import Response
from django.http import JsonResponse, HttpResponse
from rest_framework.decorators import api_view
from PIL import Image, ImageDraw
import torch
import numpy as np
from rest_framework.views import APIView
from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor
import io
import json

from recog.serializers import TaggedImageSerializer


@api_view(['GET'])
def hello_world(request):
    return Response({"message": "Hello World"})


class TaggedImageUploadView(APIView):
    parser_classes = [MultiPartParser, JSONParser]

    def post(self, request, *args, **kwargs):
        # First, save the data in the local database
        serializer = TaggedImageSerializer(data=request.data)
        if serializer.is_valid():
            tagged_image = serializer.save()

            # Prepare data to send to SAM2
            sam2_url = 'http://sam2-server/api/upload/'  # Replace with actual SAM2 API URL
            files = {'image': tagged_image.image.file}
            data = {'tags': tagged_image.tags}

            try:
                # Forward the image and tags to SAM2
                response = requests.post(sam2_url, files=files, data={'tags': tagged_image.tags})
                response.raise_for_status()

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except requests.exceptions.RequestException as e:
                # Handle request errors (e.g., network or server issues)
                return Response({"error": "Failed to forward to SAM2", "details": str(e)},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




# Load SAM2 model outside the view to avoid reloading it on each request
checkpoint = "F:/GitHub/sam2/checkpoints/sam2.1_hiera_small.pt"  # Path to your model checkpoint
model_cfg = "F:/GitHub/sam2/configs/sam2.1/sam2.1_hiera_s.yaml"  # Path to your model configuration file
predictor = SAM2ImagePredictor(build_sam2(model_cfg, checkpoint))


@api_view(['POST'])
def segment_image(request):
    image_file = request.FILES.get('image')
    tags = request.data.get('tags')

    if not image_file or not tags:
        return JsonResponse({'error': 'Missing image or tags'}, status=400)

    tags = json.loads(tags)
    point_coords = np.array([[tag['x'], tag['y']] for tag in tags])
    point_labels = np.array([tag['label'] for tag in tags])

    # Load and prepare the image as a PIL Image
    image = Image.open(image_file).convert("RGB")

    # Run SAM2 on the image
    with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
        predictor.set_image(image)
        masks, _, _ = predictor.predict(point_coords=point_coords, point_labels=point_labels)

    # Check if masks are generated
    if masks is None or len(masks) == 0:
        return JsonResponse({'error': 'No masks generated'}, status=500)

    # Create an overlay for the masks with RGBA mode for transparency
    mask_overlay = Image.new("RGBA", image.size)

    # Define colors and opacity
    mask_colors = [(255, 0, 0, 80), (0, 255, 0, 80), (0, 0, 255, 80)]  # Red, Green, Blue with 80/255 opacity
    color_index = 0  # Cycle through colors

    # Add each mask to the overlay with color and transparency
    for mask in masks:
        # Convert binary mask to an RGBA image
        colored_mask = Image.fromarray((mask * 255).astype(np.uint8), mode="L").convert("RGBA")
        colored_mask_data = colored_mask.getdata()

        # Apply the chosen color with transparency to each pixel in the mask
        color = mask_colors[color_index % len(mask_colors)]
        color_index += 1
        colored_mask.putdata([(color[0], color[1], color[2], int(color[3] * (p[0] / 255))) for p in colored_mask_data])

        # Composite each mask onto the overlay
        mask_overlay = Image.alpha_composite(mask_overlay, colored_mask)

    # Add tags (points) on the overlay for 'include' and 'exclude'
    draw = ImageDraw.Draw(mask_overlay)
    for i, (x, y) in enumerate(point_coords):
        color = (0, 255, 0, 255) if point_labels[i] == 1 else (255, 0, 0, 255)
        draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=color)

    # Combine the original image and the mask overlay
    combined_image = Image.alpha_composite(image.convert("RGBA"), mask_overlay)

    # Save the combined image to a BytesIO stream
    img_io = io.BytesIO()
    combined_image.save(img_io, 'PNG')
    img_io.seek(0)

    return HttpResponse(img_io, content_type='image/png')
