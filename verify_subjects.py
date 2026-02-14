import requests
import json

BASE_URL = "http://127.0.0.1:5003"

def test_subjects_filter():
    # 1. Fetch regulations to get a valid ID (assuming some exist)
    try:
        reg_res = requests.get(f"{BASE_URL}/get_regulations")
        regs = reg_res.json()
        if not regs:
            print("No regulations found. Skipping filter test.")
            return
        
        reg_id = regs[0]['id']
        semester = 1 # Assuming sem 1 has subjects
        
        print(f"Testing filter with Regulation {reg_id} and Semester {semester}...")
        
        url = f"{BASE_URL}/get_subjects?regulation={reg_id}&semester={semester}"
        res = requests.get(url)
        subjects = res.json()
        
        print(f"Fetch Response: {res.status_code}")
        
        if subjects and len(subjects) > 0:
            first_sub = subjects[0]
            if 'faculty_assign' in first_sub:
                print("✅ 'faculty_assign' field IS present in filtered response.")
                print("Sample Subject:", json.dumps(first_sub, indent=2))
            else:
                print("❌ 'faculty_assign' field is MISSING from filtered response.")
                print("Sample Subject:", json.dumps(first_sub, indent=2))
        else:
            print("⚠️ No subjects found for this filter. Cannot verify field presence.")
            
    except Exception as e:
        print("Test failed:", e)

if __name__ == "__main__":
    test_subjects_filter()
