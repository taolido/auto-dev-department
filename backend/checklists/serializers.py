from rest_framework import serializers
from .models import Checklist

class ChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Checklist
        fields = '__all__'

    def create(self, validated_data: dict) -> Checklist:
        try:
            return Checklist.objects.create(**validated_data)
        except Exception as e:
            raise serializers.ValidationError(f"Checklist creation failed: {e}")

    def update(self, instance: Checklist, validated_data: dict) -> Checklist:
        try:
            instance.name = validated_data.get('name', instance.name)
            instance.description = validated_data.get('description', instance.description)
            instance.items = validated_data.get('items', instance.items)
            instance.save()
            return instance
        except Exception as e:
            raise serializers.ValidationError(f"Checklist update failed: {e}")

    def validate_items(self, value: list) -> list:
        if not isinstance(value, list):
            raise serializers.ValidationError("Items must be a list.")
        return value