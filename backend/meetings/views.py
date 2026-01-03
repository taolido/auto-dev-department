from typing import Any, Dict, List

from django.http import Http404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from meetings.models import Meeting
from meetings.serializers import MeetingSerializer


class MeetingList(APIView):
    """
    会議一覧を取得または新規作成するAPIエンドポイント
    """

    def get(self, request) -> Response:
        """
        会議一覧を取得する

        Returns:
            Response: 会議一覧のシリアライズされたデータ
        """
        meetings = Meeting.objects.all()
        serializer = MeetingSerializer(meetings, many=True)
        return Response(serializer.data)

    def post(self, request) -> Response:
        """
        会議を新規作成する

        Args:
            request: リクエストオブジェクト

        Returns:
            Response: 作成された会議のシリアライズされたデータ。エラーが発生した場合はエラーメッセージ
        """
        serializer = MeetingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeetingDetail(APIView):
    """
    特定の会議を取得、更新、削除するAPIエンドポイント
    """

    def get_object(self, pk: int) -> Meeting:
        """
        指定されたPKの会議オブジェクトを取得する

        Args:
            pk: 会議のPK

        Returns:
            Meeting: 会議オブジェクト

        Raises:
            Http404: 会議が見つからない場合
        """
        try:
            return Meeting.objects.get(pk=pk)
        except Meeting.DoesNotExist:
            raise Http404

    def get(self, request, pk: int) -> Response:
        """
        特定の会議を取得する

        Args:
            request: リクエストオブジェクト
            pk: 会議のPK

        Returns:
            Response: 会議のシリアライズされたデータ
        """
        meeting = self.get_object(pk)
        serializer = MeetingSerializer(meeting)
        return Response(serializer.data)

    def put(self, request, pk: int) -> Response:
        """
        特定の会議を更新する

        Args:
            request: リクエストオブジェクト
            pk: 会議のPK

        Returns:
            Response: 更新された会議のシリアライズされたデータ。エラーが発生した場合はエラーメッセージ
        """
        meeting = self.get_object(pk)
        serializer = MeetingSerializer(meeting, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk: int) -> Response:
        """
        特定の会議を削除する

        Args:
            request: リクエストオブジェクト
            pk: 会議のPK

        Returns:
            Response: 削除成功のステータスコード
        """
        meeting = self.get_object(pk)
        meeting.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)