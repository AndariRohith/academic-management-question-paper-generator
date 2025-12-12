from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
import os
import uuid

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads/faculty_pdfs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ---------------------------------------------------------
# DATABASE CONNECTION
# ---------------------------------------------------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Mrs.Rossi@sql",
        database="siet_faculty_management"
    )

# ---------------------------------------------------------
# VIEW PDF
# ---------------------------------------------------------
@app.route('/view_profile/<filename>')
def view_profile(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ---------------------------------------------------------
# ADD FACULTY
# ---------------------------------------------------------
@app.route('/add_faculty', methods=['POST'])
def add_faculty():
    faculty_id = request.form.get('faculty_id')
    name = request.form.get('name')
    designation = request.form.get('designation')
    date_of_joining = request.form.get('date_of_joining')
    qualification = request.form.get('qualification')
    nature_of_association = request.form.get('nature_of_association')
    password = request.form.get('password')

    file = request.files.get('profile_pdf')
    filename = None
    if file:
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO faculty
            (faculty_id, name, designation, date_of_joining,
             qualification, nature_of_association, profile_pdf, password)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (faculty_id, name, designation, date_of_joining,
              qualification, nature_of_association, filename, password))
        conn.commit()
        return jsonify({"status": "success", "message": "Faculty added successfully"})
    except mysql.connector.Error as err:
        return jsonify({"status": "error", "message": str(err)})
    finally:
        cursor.close()
        conn.close()

# ---------------------------------------------------------
# GET ALL FACULTY
# ---------------------------------------------------------
@app.route('/get_faculty', methods=['GET'])
def get_faculty():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Only return date (YYYY-MM-DD) for date_of_joining
        cursor.execute("""
            SELECT faculty_id, name, designation, 
                   DATE(date_of_joining) AS date_of_joining,
                   qualification, nature_of_association, profile_pdf, password
            FROM faculty
            ORDER BY name ASC
        """)
        data = cursor.fetchall()
        return jsonify({"status": "success", "data": data})
    except mysql.connector.Error as err:
        return jsonify({"status": "error", "message": str(err)})
    finally:
        cursor.close()
        conn.close()

# ---------------------------------------------------------
# SEARCH FACULTY
# ---------------------------------------------------------
@app.route('/search_faculty', methods=['GET'])
def search_faculty():
    keyword = request.args.get("keyword")
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        like_keyword = f"%{keyword}%"
        cursor.execute("""
            SELECT faculty_id, name, designation,
                   DATE(date_of_joining) AS date_of_joining,
                   qualification, nature_of_association, profile_pdf, password
            FROM faculty
            WHERE faculty_id LIKE %s OR name LIKE %s
        """, (like_keyword, like_keyword))
        data = cursor.fetchall()
        return jsonify({"status": "success", "data": data})
    except mysql.connector.Error as err:
        return jsonify({"status": "error", "message": str(err)})
    finally:
        cursor.close()
        conn.close()

# ---------------------------------------------------------
# UPDATE FACULTY
# ---------------------------------------------------------
@app.route('/update_faculty/<faculty_id>', methods=['POST'])
def update_faculty(faculty_id):
    name = request.form.get('name')
    designation = request.form.get('designation')
    date_of_joining = request.form.get('date_of_joining')
    qualification = request.form.get('qualification')
    nature_of_association = request.form.get('nature_of_association')
    password = request.form.get('password')

    file = request.files.get('profile_pdf')
    filename = None
    if file:
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if filename:
            cursor.execute("""
                UPDATE faculty SET
                    name=%s, designation=%s, date_of_joining=%s,
                    qualification=%s, nature_of_association=%s,
                    password=%s, profile_pdf=%s
                WHERE faculty_id=%s
            """, (name, designation, date_of_joining, qualification,
                  nature_of_association, password, filename, faculty_id))
        else:
            cursor.execute("""
                UPDATE faculty SET
                    name=%s, designation=%s, date_of_joining=%s,
                    qualification=%s, nature_of_association=%s,
                    password=%s
                WHERE faculty_id=%s
            """, (name, designation, date_of_joining, qualification,
                  nature_of_association, password, faculty_id))
        conn.commit()
        return jsonify({"status": "success", "message": "Faculty updated successfully"})
    except mysql.connector.Error as err:
        return jsonify({"status": "error", "message": str(err)})
    finally:
        cursor.close()
        conn.close()

# ---------------------------------------------------------
# DELETE FACULTY
# ---------------------------------------------------------
@app.route('/delete_faculty/<faculty_id>', methods=['DELETE'])
def delete_faculty(faculty_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM faculty WHERE faculty_id=%s", (faculty_id,))
        conn.commit()
        return jsonify({"status": "success", "message": "Faculty deleted successfully"})
    except mysql.connector.Error as err:
        return jsonify({"status": "error", "message": str(err)})
    finally:
        cursor.close()
        conn.close()

# ---------------------------------------------------------
# RUN APPLICATION
# ---------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)
