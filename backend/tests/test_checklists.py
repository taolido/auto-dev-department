import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from checklists.models import Checklist


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def checklist(db):
    return Checklist.objects.create(title="Test Checklist")


@pytest.mark.django_db
def test_checklist_list_view(api_client: APIClient, checklist: Checklist) -> None:
    url = reverse("checklist-list")
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["title"] == "Test Checklist"


@pytest.mark.django_db
def test_checklist_detail_view(api_client: APIClient, checklist: Checklist) -> None:
    url = reverse("checklist-detail", kwargs={"pk": checklist.pk})
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["title"] == "Test Checklist"


@pytest.mark.django_db
def test_checklist_create_view(api_client: APIClient) -> None:
    url = reverse("checklist-list")
    data = {"title": "New Checklist"}
    response = api_client.post(url, data)

    assert response.status_code == status.HTTP_201_CREATED
    assert Checklist.objects.count() == 1
    assert Checklist.objects.first().title == "New Checklist"


@pytest.mark.django_db
def test_checklist_update_view(api_client: APIClient, checklist: Checklist) -> None:
    url = reverse("checklist-detail", kwargs={"pk": checklist.pk})
    data = {"title": "Updated Checklist"}
    response = api_client.put(url, data)

    assert response.status_code == status.HTTP_200_OK
    assert Checklist.objects.first().title == "Updated Checklist"


@pytest.mark.django_db
def test_checklist_delete_view(api_client: APIClient, checklist: Checklist) -> None:
    url = reverse("checklist-detail", kwargs={"pk": checklist.pk})
    response = api_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Checklist.objects.count() == 0


@pytest.mark.django_db
def test_checklist_create_view_invalid_data(api_client: APIClient) -> None:
    url = reverse("checklist-list")
    data = {}  # Missing 'title' field
    response = api_client.post(url, data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_checklist_update_view_invalid_data(api_client: APIClient, checklist: Checklist) -> None:
    url = reverse("checklist-detail", kwargs={"pk": checklist.pk})
    data = {} # Missing 'title' field
    response = api_client.put(url, data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_checklist_detail_view_not_found(api_client: APIClient) -> None:
    url = reverse("checklist-detail", kwargs={"pk": 999})  # Non-existent ID
    response = api_client.get(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.django_db
def test_checklist_delete_view_not_found(api_client: APIClient) -> None:
    url = reverse("checklist-detail", kwargs={"pk": 999})  # Non-existent ID
    response = api_client.delete(url)

    assert response.status_code == status.HTTP_404_NOT_FOUND