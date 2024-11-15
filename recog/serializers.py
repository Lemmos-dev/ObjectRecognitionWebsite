from rest_framework import serializers
from .models import TaggedImage

class TaggedImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaggedImage
        fields = ['id','image', 'tags']