# Create your models here.
from django.db import models

class TaggedImage(models.Model):
    image = models.ImageField(upload_to='images/')
    tags = models.JSONField()  # Store coordinates and tags as JSON

    def __str__(self):
        return f"Image {self.id} with tags"