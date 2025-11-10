import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Store original activities
    original = {
        name: {
            "description": activity["description"],
            "schedule": activity["schedule"],
            "max_participants": activity["max_participants"],
            "participants": activity["participants"].copy()
        }
        for name, activity in activities.items()
    }
    # Let the test run
    yield
    # Restore original activities after each test
    activities.clear()
    activities.update(original)

def test_root_redirect(client):
    """Test that root path redirects to static/index.html"""
    response = client.get("/", follow_redirects=False)
    assert response.status_code in [307, 302]  # Both are valid redirect codes
    assert response.headers["location"] == "/static/index.html"

def test_get_activities(client):
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert len(data) > 0
    # Check structure of an activity
    activity = list(data.values())[0]
    assert "description" in activity
    assert "schedule" in activity
    assert "max_participants" in activity
    assert "participants" in activity

def test_signup_success(client):
    """Test successful activity signup"""
    activity_name = "Chess Club"
    email = "newstudent@mergington.edu"
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == f"Signed up {email} for {activity_name}"
    # Verify participant was added
    assert email in activities[activity_name]["participants"]

def test_signup_duplicate(client):
    """Test signing up the same student twice"""
    activity_name = "Chess Club"
    email = "michael@mergington.edu"  # Already registered
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400
    data = response.json()
    assert "already signed up" in data["detail"].lower()

def test_signup_nonexistent_activity(client):
    """Test signing up for a non-existent activity"""
    activity_name = "Nonexistent Club"
    email = "student@mergington.edu"
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()

def test_unregister_success(client):
    """Test successful unregistration from activity"""
    activity_name = "Chess Club"
    email = "michael@mergington.edu"  # Known participant
    response = client.delete(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == f"Unregistered {email} from {activity_name}"
    # Verify participant was removed
    assert email not in activities[activity_name]["participants"]

def test_unregister_not_registered(client):
    """Test unregistering a student who isn't registered"""
    activity_name = "Chess Club"
    email = "notregistered@mergington.edu"
    response = client.delete(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400
    data = response.json()
    assert "not registered" in data["detail"].lower()

def test_unregister_nonexistent_activity(client):
    """Test unregistering from a non-existent activity"""
    activity_name = "Nonexistent Club"
    email = "student@mergington.edu"
    response = client.delete(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()

def test_activity_spots_tracking(client):
    """Test that activity spots are correctly tracked"""
    activity_name = "Chess Club"
    initial_spots = activities[activity_name]["max_participants"]
    initial_participants = len(activities[activity_name]["participants"])
    
    # Register a new participant
    email = "newstudent@mergington.edu"
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    
    # Verify participant count increased
    assert len(activities[activity_name]["participants"]) == initial_participants + 1
    
    # Verify spots left
    spots_left = initial_spots - len(activities[activity_name]["participants"])
    assert spots_left >= 0  # Should never be negative