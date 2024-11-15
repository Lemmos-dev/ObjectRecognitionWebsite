# Create your models here.
from django.db import models

class TaggedImage(models.Model):
    image = models.ImageField(upload_to='tagged_images/')
    tags = models.JSONField()  # Stores the coordinates and labels for tags
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"TaggedImage {self.id}"