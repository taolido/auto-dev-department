from rest_framework import serializers
from .models import Meeting

class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = '__all__'

    def validate(self, data: dict) -> dict:
        """
        Validate the meeting data.

        Args:
            data (dict): The meeting data to validate.

        Returns:
            dict: The validated meeting data.

        Raises:
            serializers.ValidationError: If the meeting data is invalid.
        """
        # Example validation: ensure start_time is before end_time
        if data.get('start_time') and data.get('end_time') and data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("Start time must be before end time.")

        # Add more validations as needed

        return data

    def create(self, validated_data: dict) -> Meeting:
        """
        Create a new meeting.

        Args:
            validated_data (dict): The validated meeting data.

        Returns:
            Meeting: The newly created meeting.
        """
        try:
            meeting = Meeting.objects.create(**validated_data)
            return meeting
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create meeting: {e}")

    def update(self, instance: Meeting, validated_data: dict) -> Meeting:
        """
        Update an existing meeting.

        Args:
            instance (Meeting): The meeting instance to update.
            validated_data (dict): The validated meeting data.

        Returns:
            Meeting: The updated meeting.
        """
        try:
            instance.title = validated_data.get('title', instance.title)
            instance.description = validated_data.get('description', instance.description)
            instance.start_time = validated_data.get('start_time', instance.start_time)
            instance.end_time = validated_data.get('end_time', instance.end_time)
            instance.participants = validated_data.get('participants', instance.participants)
            instance.save()
            return instance
        except Exception as e:
            raise serializers.ValidationError(f"Failed to update meeting: {e}")