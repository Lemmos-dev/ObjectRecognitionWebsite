from django.contrib import admin

# Register your models here.
from recog.models import TaggedImage

class TaggedImageAdmin(admin.ModelAdmin):
    pass

admin.site.register(TaggedImage, TaggedImageAdmin)