import mysql.connector

def update_schema():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="Mrs.Rossi@sql",
            database="siet_faculty_management"
        )
        cursor = conn.cursor()
        
        columns = [
            ("email", "VARCHAR(255)"),
            ("phone", "VARCHAR(20)"),
            ("experience", "VARCHAR(50)"),
            ("research_interests", "TEXT")
        ]
        
        for col, dtype in columns:
            try:
                print(f"Adding column {col}...")
                cursor.execute(f"ALTER TABLE faculty ADD COLUMN {col} {dtype}")
                print(f"✅ Added {col}")
            except mysql.connector.Error as err:
                if "Duplicate column" in str(err) or "1060" in str(err):
                    print(f"⚠️ Column {col} already exists.")
                else:
                    print(f"❌ Error adding {col}: {err}")
                    
        conn.commit()
        cursor.close()
        conn.close()
        print("Schema update completed.")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    update_schema()
