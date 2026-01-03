import pytest
from django.urls import reverse
from rest_framework import status
from meetings.models import Meeting


@pytest.mark.django_db
def test_create_meeting(api_client):
    url = reverse("meeting-list")
    data = {
        "title": "Test Meeting",
        "description": "Test Meeting Description",
        "start_time": "2023-10-27T10:00:00Z",
        "end_time": "2023-10-27T11:00:00Z",
    }
    response = api_client.post(url, data, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert Meeting.objects.count() == 1
    assert Meeting.objects.get().title == "Test Meeting"


@pytest.mark.django_db
def test_get_meeting(api_client):
    meeting = Meeting.objects.create(
        title="Test Meeting",
        description="Test Meeting Description",
        start_time="2023-10-27T10:00:00Z",
        end_time="2023-10-27T11:00:00Z",
    )
    url = reverse("meeting-detail", args=[meeting.id])
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["title"] == "Test Meeting"


@pytest.mark.django_db
def test_update_meeting(api_client):
    meeting = Meeting.objects.create(
        title="Test Meeting",
        description="Test Meeting Description",
        start_time="2023-10-27T10:00:00Z",
        end_time="2023-10-27T11:00:00Z",
    )
    url = reverse("meeting-detail", args=[meeting.id])
    data = {"title": "Updated Meeting"}
    response = api_client.patch(url, data, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert Meeting.objects.get().title == "Updated Meeting"


@pytest.mark.django_db
def test_delete_meeting(api_client):
    meeting = Meeting.objects.create(
        title="Test Meeting",
        description="Test Meeting Description",
        start_time="2023-10-27T10:00:00Z",
        end_time="2023-10-27T11:00:00Z",
    )
    url = reverse("meeting-detail", args=[meeting.id])
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Meeting.objects.count() == 0


@pytest.mark.django_db
def test_get_meeting_list(api_client):
    Meeting.objects.create(
        title="Test Meeting 1",
        description="Test Meeting Description 1",
        start_time="2023-10-27T10:00:00Z",
        end_time="2023-10-27T11:00:00Z",
    )
    Meeting.objects.create(
        title="Test Meeting 2",
        description="Test Meeting Description 2",
        start_time="2023-10-28T10:00:00Z",
        end_time="2023-10-28T11:00:00Z",
    )
    url = reverse("meeting-list")
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 2