from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)


# ----------------------------------------
# DB CONNECTION
# ----------------------------------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Mrs.Rossi@sql",
        database="siet_faculty_management"
    )


# ----------------------------------------
# ADD SUBJECT
# ----------------------------------------
@app.route('/add_subject', methods=['POST'])
def add_subject():
    try:
        data = request.json

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO subjects
            (subject_id, subject_code, subject_name, regulation_id, semester, faculty_assign, credits)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        cursor.execute(query, (
            data.get('subject_id'),
            data.get('subject_code'),
            data.get('subject_name'),
            data.get('regulation_id'),
            data.get('semester'),
            data.get('faculty_assign'),
            data.get('credits')
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"msg": "Subject added successfully!"}), 200

    except Exception as e:
        return jsonify({"msg": str(e)}), 400


# ----------------------------------------
# GET SUBJECTS (supports QB filtering + old UI)
# ----------------------------------------
@app.route('/get_subjects', methods=['GET'])
def get_subjects():
    try:
        regulation = request.args.get("regulation")
        semester = request.args.get("semester")

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # NEW: Filtering for Question Bank page
        if regulation and semester:
            cursor.execute("""
                SELECT subject_id, subject_code, subject_name, semester, regulation_id, faculty_assign
                FROM subjects
                WHERE regulation_id = %s AND semester = %s
                ORDER BY subject_code
            """, (regulation, semester))

        else:
            # OLD: List all subjects for admin/HOD UI
            cursor.execute("""
                SELECT s.*, r.reg_id AS reg_name
                FROM subjects s
                LEFT JOIN regulations r ON s.regulation_id = r.reg_id
                ORDER BY s.semester ASC, s.subject_id ASC
            """)

        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(rows), 200

    except Exception as e:
        return jsonify({"msg": str(e)}), 400


# ----------------------------------------
# GET SUBJECTS BY SEMESTER
# ----------------------------------------
@app.route('/get_subjects/<semester>', methods=['GET'])
def get_subjects_by_semester(semester):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if semester == "All":
            cursor.execute("""
                SELECT s.*, r.reg_id AS reg_name
                FROM subjects s
                LEFT JOIN regulations r ON s.regulation_id = r.reg_id
                ORDER BY s.semester ASC, s.subject_id ASC
            """)
        else:
            cursor.execute("""
                SELECT s.*, r.reg_id AS reg_name
                FROM subjects s
                LEFT JOIN regulations r ON s.regulation_id = r.reg_id
                WHERE s.semester=%s
                ORDER BY s.subject_id ASC
            """, (semester,))

        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(rows), 200

    except Exception as e:
        return jsonify({"msg": str(e)}), 400


# ----------------------------------------
# UPDATE SUBJECT
# ----------------------------------------
@app.route('/update_subject', methods=['PUT'])
def update_subject():
    try:
        data = request.json

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            UPDATE subjects
            SET subject_code=%s,
                subject_name=%s,
                regulation_id=%s,
                semester=%s,
                faculty_assign=%s,
                credits=%s
            WHERE subject_id=%s
        """

        cursor.execute(query, (
            data.get('subject_code'),
            data.get('subject_name'),
            data.get('regulation_id'),
            data.get('semester'),
            data.get('faculty_assign'),
            data.get('credits'),
            data.get('subject_id')
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"msg": "Subject updated successfully!"}), 200

    except Exception as e:
        return jsonify({"msg": str(e)}), 400


# ----------------------------------------
# DELETE SUBJECT
# ----------------------------------------
@app.route('/delete_subject/<subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM subjects WHERE subject_id=%s", (subject_id,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"msg": "Subject deleted successfully!"}), 200

    except Exception as e:
        return jsonify({"msg": str(e)}), 400


# ----------------------------------------
# GET REGULATIONS FOR DROPDOWN
# ----------------------------------------
@app.route('/get_regulations', methods=['GET'])
def get_regulations():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT reg_id FROM regulations ORDER BY reg_id DESC")
        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        regs = []
        for r in rows:
            reg_id = r.get('reg_id')
            regs.append({"id": reg_id, "code": reg_id})
        return jsonify(regs), 200

    except Exception as e:
        return jsonify({"msg": str(e)}), 400


# ----------------------------------------
# RUN SERVER
# ----------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5003)
