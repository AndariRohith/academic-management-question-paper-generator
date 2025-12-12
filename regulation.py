from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# ---------------- DATABASE CONNECTION ----------------
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "Mrs.Rossi@sql",  # replace with your MySQL password
    "database": "siet_faculty_management"
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

# ---------------- ADD REGULATION ----------------
@app.route('/add_regulation', methods=['POST'])
def add_regulation():
    data = request.json
    reg_id = data.get('reg_id')
    reg_name = data.get('reg_name')

    if not reg_id or not reg_name:
        return jsonify({"msg":"ID and Name required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO regulations (reg_id, reg_name) VALUES (%s, %s)", (reg_id, reg_name))
        conn.commit()
        return jsonify({"msg":"Regulation added"})
    except mysql.connector.IntegrityError:
        return jsonify({"msg":"Regulation ID already exists"}), 400
    finally:
        cursor.close()
        conn.close()

# ---------------- UPDATE REGULATION ----------------
@app.route('/update_regulation', methods=['PUT'])
def update_regulation():
    data = request.json
    reg_id = data.get('reg_id')
    reg_name = data.get('reg_name')

    if not reg_id or not reg_name:
        return jsonify({"msg":"ID and Name required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE regulations SET reg_name=%s WHERE reg_id=%s", (reg_name, reg_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"msg":"Regulation updated"})

# ---------------- DELETE REGULATION ----------------
@app.route('/delete_regulation/<reg_id>', methods=['DELETE'])
def delete_regulation(reg_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM regulations WHERE reg_id=%s", (reg_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"msg":"Regulation deleted"})

# ---------------- GET ALL REGULATIONS ----------------
@app.route('/get_regulations', methods=['GET'])
def get_regulations():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM regulations ORDER BY reg_id")
    regs = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(regs)

# ---------------- RUN SERVER ----------------
if __name__ == '__main__':
    app.run(debug=True, port=5002)
