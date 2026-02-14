import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_login():
    # 1. Add a dummy faculty
    faculty_data = {
        "faculty_id": "test_faculty_001",
        "name": "Test Faculty",
        "designation": "Professor",
        "date_of_joining": "2023-01-01",
        "qualification": "PhD",
        "nature_of_association": "Regular",
        "password": "password123"
    }
    
    # Check if delete endpoint exists or just add directly
    # Ideally delete first to ensure clean state, but let's just try to add
    # If duplicate, it might fail or we update.
    
    # Try adding
    print("Adding faculty...")
    try:
        res = requests.post(f"{BASE_URL}/add_faculty", data=faculty_data)
        print("Add response:", res.text)
    except Exception as e:
        print("Add failed:", e)

    # 2. Try Login with correct creds
    print("\nTesting valid login...")
    login_data = {
        "username": "test_faculty_001",
        "password": "password123"
    }
    res = requests.post(f"{BASE_URL}/login", json=login_data)
    print("Login Response:", res.status_code, res.json())
    
    if res.status_code == 200 and res.json().get("status") == "success":
        print("✅ Login SUCCESS")
    else:
        print("❌ Login FAILED")

    # 3. Try Login with wrong password
    print("\nTesting invalid login...")
    bad_data = {
        "username": "test_faculty_001",
        "password": "wrongpassword"
    }
    res = requests.post(f"{BASE_URL}/login", json=bad_data)
    print("Invalid Login Response:", res.status_code, res.json())
    
    if res.status_code == 401:
        print("✅ Invalid Login correctly rejected")
    else:
        print("❌ Invalid Login NOT rejected properly")

if __name__ == "__main__":
    test_login()
