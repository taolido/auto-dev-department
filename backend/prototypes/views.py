from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Prototype
from .serializers import PrototypeSerializer
from backend.utils.storage import upload_file, delete_file
from django.conf import settings
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)


class PrototypeViewSet(viewsets.ModelViewSet):
    queryset = Prototype.objects.all()
    serializer_class = PrototypeSerializer
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            prototype_file = request.FILES.get('file')
            if not prototype_file:
                return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

            file_url = upload_file(prototype_file, settings.PROTOTYPE_STORAGE_BUCKET_NAME)
            if not file_url:
                return Response({"error": "File upload failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            serializer.validated_data['file_url'] = file_url
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            logger.exception("Error creating prototype: %s", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs) -> Response:
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        try:
            prototype_file = request.FILES.get('file')
            if prototype_file:
                # Delete the old file
                if instance.file_url:
                    delete_file(instance.file_url, settings.PROTOTYPE_STORAGE_BUCKET_NAME)

                # Upload the new file
                file_url = upload_file(prototype_file, settings.PROTOTYPE_STORAGE_BUCKET_NAME)
                if not file_url:
                    return Response({"error": "File upload failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                serializer.validated_data['file_url'] = file_url

            self.perform_update(serializer)

            if getattr(instance, '_prefetched_objects_cache', None):
                # If 'prefetch_related' has been applied to a queryset, we need to
                # forcibly invalidate the prefetch cache on the instance.
                instance._prefetched_objects_cache = {}

            return Response(serializer.data)

        except Exception as e:
            logger.exception("Error updating prototype: %s", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs) -> Response:
        instance = self.get_object()
        try:
            if instance.file_url:
                delete_file(instance.file_url, settings.PROTOTYPE_STORAGE_BUCKET_NAME)
        except Exception as e:
            logger.exception("Error deleting file: %s", e)
            return Response({"error": f"Error deleting file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()