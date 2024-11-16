# services/sam2_model.py
import numpy as np
import torch
from PIL import Image, ImageDraw
from sam2.sam2_image_predictor import SAM2ImagePredictor
from sam2.build_sam import build_sam2

from recog.serializers import TaggedImageSerializer

# Load SAM2 model outside the view to avoid reloading it on each request
# checkpoint = "C:/Users/Lemmea/Documents/GitHub/sam2/checkpoints/sam2.1_hiera_large.pt"  # Path to your model checkpoint
# model_cfg = "C:/Users/Lemmea/Documents/GitHub/sam2/configs/sam2.1/sam2.1_hiera_l.yaml"  # Path to your model configuration file
checkpoint = "F:/GitHub/sam2/checkpoints/sam2.1_hiera_large.pt"
model_cfg = "F:/GitHub/sam2/configs/sam2.1/sam2.1_hiera_l.yaml"
predictor = SAM2ImagePredictor(build_sam2(model_cfg, checkpoint))

def process_image_with_sam2(image_file, tags):
    # Parse tags into point coordinates and labels
    try:
        point_coords = np.array([[tag['x'], tag['y']] for tag in tags])
        point_labels = np.array([tag['label'] for tag in tags])
    except Exception as e:
        raise ValueError(f"Invalid tags format: {str(e)}")

    # Load the image using PIL
    image = Image.open(image_file).convert("RGB")

    # Run SAM2 on the image to get the segmentation masks
    with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
        predictor.set_image(image)
        masks, _, _ = predictor.predict(point_coords=point_coords, point_labels=point_labels)

    if masks is None or len(masks) == 0:
        raise Exception("No masks generated")

    # Prepare the mask overlay and combine it with the image
    mask_overlay = Image.new("RGBA", image.size)
    mask_colors = [(255, 0, 0, 80), (0, 255, 0, 80), (0, 0, 255, 80)]  # Red, Green, Blue with opacity
    color_index = 0

    for mask in masks:
        colored_mask = Image.fromarray((mask * 255).astype(np.uint8), mode="L").convert("RGBA")
        colored_mask_data = colored_mask.getdata()

        color = mask_colors[color_index % len(mask_colors)]
        color_index += 1
        colored_mask.putdata([(color[0], color[1], color[2], int(color[3] * (p[0] / 255))) for p in colored_mask_data])
        mask_overlay = Image.alpha_composite(mask_overlay, colored_mask)

    # Add the points (tags) onto the overlay with 'include' and 'exclude' markers
    draw = ImageDraw.Draw(mask_overlay)
    for i, (x, y) in enumerate(point_coords):
        color = (0, 255, 0, 255) if point_labels[i] == 1 else (255, 0, 0, 255)
        draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=color)

    # Combine the original image with the overlay
    combined_image = Image.alpha_composite(image.convert("RGBA"), mask_overlay)

    return masks, combined_image

def process_and_save_image(image_file, tags):
    # Save the image and tags first
    serializer = TaggedImageSerializer(data={"image": image_file, "tags": tags})
    if not serializer.is_valid():
        raise ValueError("Invalid data: " + str(serializer.errors))
    serializer.save()

    # Process the image with SAM2
    return process_image_with_sam2(image_file, tags)