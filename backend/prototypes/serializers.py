from rest_framework import serializers
from .models import Prototype
from django.conf import settings
from backend.utils.storage import upload_file_to_storage, delete_file_from_storage
from typing import Dict, Any, Optional

class PrototypeSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Prototype
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_file_url(self, obj: Prototype) -> Optional[str]:
        if obj.file:
            if settings.USE_S3:
                return obj.file.url
            else:
                # Assuming local file storage, construct the URL
                return settings.MEDIA_URL + obj.file.name
        return None

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check that the prototype name is unique.
        """
        name = data.get('name', None) or self.instance.name if self.instance else data.get('name')
        meeting = data.get('meeting', None) or self.instance.meeting if self.instance else data.get('meeting')

        if name and meeting and Prototype.objects.filter(name=name, meeting=meeting).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError({"name": "This name already exists for this meeting."})
        return data

    def create(self, validated_data: Dict[str, Any]) -> Prototype:
        file = validated_data.pop('file', None)
        try:
            prototype = Prototype.objects.create(**validated_data)
            if file:
               # Upload file to cloud storage and update the prototype's file field
               file_url = upload_file_to_storage(file) # Assuming this returns the URL
               if file_url:
                   prototype.file = file
                   prototype.save()
               else:
                   raise serializers.ValidationError({"file": "File upload failed."})
            return prototype
        except Exception as e:
            raise serializers.ValidationError(str(e))


    def update(self, instance: Prototype, validated_data: Dict[str, Any]) -> Prototype:
        file = validated_data.pop('file', None)

        try:
            # Handle file updates
            if file:
                # Delete old file from storage
                if instance.file:
                    delete_file_from_storage(instance.file.name)

                # Upload new file to cloud storage
                file_url = upload_file_to_storage(file) # Assuming this returns the URL
                if file_url:
                    instance.file = file
                else:
                    raise serializers.ValidationError({"file": "File upload failed."})

            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            instance.save()
            return instance

        except Exception as e:
            raise serializers.ValidationError(str(e))

    def delete(self, instance: Prototype) -> None:
        try:
            # Delete file from storage if it exists
            if instance.file:
                delete_file_from_storage(instance.file.name)

            instance.delete()
        except Exception as e:
            raise serializers.ValidationError(str(e))