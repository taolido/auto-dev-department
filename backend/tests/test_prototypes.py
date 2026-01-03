import pytest
from django.urls import reverse
from rest_framework import status
from prototypes.models import Prototype
from users.models import User
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_user():
    def _create_user(username="testuser", password="testpassword"):
        return User.objects.create_user(username=username, password=password)

    return _create_user


@pytest.fixture
def create_prototype():
    def _create_prototype(name="Test Prototype", description="Test Description", file="test.pdf", owner=None):
        if owner is None:
            owner = User.objects.create_user(username="defaultowner", password="testpassword")
        return Prototype.objects.create(name=name, description=description, file=file, owner=owner)

    return _create_prototype


@pytest.mark.django_db
def test_prototype_list_create(api_client: APIClient, create_user, create_prototype):
    user = create_user()
    api_client.force_authenticate(user=user)
    url = reverse("prototype-list")
    data = {"name": "New Prototype", "description": "New Description", "file": "new.pdf"}
    response = api_client.post(url, data, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert Prototype.objects.count() == 1
    assert Prototype.objects.first().name == "New Prototype"


@pytest.mark.django_db
def test_prototype_retrieve(api_client: APIClient, create_user, create_prototype):
    user = create_user()
    api_client.force_authenticate(user=user)
    prototype = create_prototype(owner=user)
    url = reverse("prototype-detail", args=[prototype.id])
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["name"] == prototype.name


@pytest.mark.django_db
def test_prototype_update(api_client: APIClient, create_user, create_prototype):
    user = create_user()
    api_client.force_authenticate(user=user)
    prototype = create_prototype(owner=user)
    url = reverse("prototype-detail", args=[prototype.id])
    data = {"name": "Updated Prototype", "description": "Updated Description", "file": "updated.pdf"}
    response = api_client.put(url, data, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert Prototype.objects.get(id=prototype.id).name == "Updated Prototype"


@pytest.mark.django_db
def test_prototype_delete(api_client: APIClient, create_user, create_prototype):
    user = create_user()
    api_client.force_authenticate(user=user)
    prototype = create_prototype(owner=user)
    url = reverse("prototype-detail", args=[prototype.id])
    response = api_client.delete(url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Prototype.objects.count() == 0


@pytest.mark.django_db
def test_prototype_permission(api_client: APIClient, create_user, create_prototype):
    user1 = create_user(username="user1")
    user2 = create_user(username="user2")
    api_client.force_authenticate(user=user2)  # Authenticate with user2

    prototype = create_prototype(owner=user1)  # Prototype owned by user1
    url = reverse("prototype-detail", args=[prototype.id])
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK # User can view, but can't edit/delete

    data = {"name": "Updated Prototype", "description": "Updated Description", "file": "updated.pdf"}
    response = api_client.put(url, data, format="json")
    assert response.status_code == status.HTTP_403_FORBIDDEN

    response = api_client.delete(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN