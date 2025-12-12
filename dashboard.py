from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# --------------------------------------------------------
# 🔗 DATABASE CONNECTION
# --------------------------------------------------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Mrs.Rossi@sql",
        database="siet_faculty_management"
    )

# Helper to safely count rows
def safe_count(cursor, table_name):
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        return cursor.fetchone()[0]
    except:
        return 0   # If table does NOT exist

# --------------------------------------------------------
# 📊 API — GET HOD DASHBOARD STATS
# --------------------------------------------------------
@app.route('/get_hod_stats', methods=['GET'])
def get_hod_stats():
    conn = get_db_connection()
    cursor = conn.cursor()

    faculty_count     = safe_count(cursor, "faculty")
    subjects_count    = safe_count(cursor, "subjects")
    papers_count      = safe_count(cursor, "papers")          # may not exist
    qb_count          = safe_count(cursor, "question_banks")  # may not exist

    cursor.close()
    conn.close()

    return jsonify({
        "faculty": faculty_count,
        "subjects": subjects_count,
        "papers": papers_count,
        "questionbanks": qb_count
    })

# --------------------------------------------------------
# 🚀 RUN SERVER
# --------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5001)



