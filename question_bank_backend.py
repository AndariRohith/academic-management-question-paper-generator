from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS
import mysql.connector
from werkzeug.utils import secure_filename
import os, time

# ==========================
# CONFIG
# ==========================
BASE_UPLOAD_DIR = "uploads"     # base folder
ALLOWED_EXTENSIONS = {"pdf"}

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Mrs.Rossi@sql",
    "database": "siet_faculty_management"
}

# ==========================
# FLASK APP
# ==========================
app = Flask(__name__)
CORS(app)
os.makedirs(BASE_UPLOAD_DIR, exist_ok=True)


# ==========================
# HELPERS
# ==========================
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def subject_folder(subject_id):
    folder = os.path.join(BASE_UPLOAD_DIR, secure_filename(subject_id))
    os.makedirs(folder, exist_ok=True)
    return folder

# ==========================
# UPLOAD QB
# ==========================
@app.route('/upload_qb', methods=['POST'])
def upload_qb():
    try:
        subject_id = request.form.get("subject_id")
        if not subject_id:
            return jsonify({"error": "subject_id is required"}), 400

        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        filename = secure_filename(file.filename)
        if filename == "":
            return jsonify({"error": "Invalid filename"}), 400

        if not allowed_file(filename):
            return jsonify({"error": "Only PDF files are allowed"}), 400

        # add timestamp to avoid collisions
        ts = int(time.time())
        name, ext = os.path.splitext(filename)
        save_name = f"{name}_{ts}{ext}"
        folder = subject_folder(subject_id)
        save_path = os.path.join(folder, save_name)
        file.save(save_path)

        return jsonify({"message": "Uploaded successfully", "filename": save_name}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================
# LIST QB FILES FOR SUBJECT
# ==========================
@app.route('/list_qb/<subject_id>', methods=['GET'])
def list_qb(subject_id):
    try:
        folder = os.path.join(BASE_UPLOAD_DIR, secure_filename(subject_id))
        if not os.path.exists(folder):
            return jsonify([]), 200

        files = []
        for fname in sorted(os.listdir(folder), reverse=True):
            # only pdfs
            if not allowed_file(fname): 
                continue
            full = os.path.join(folder, fname)
            files.append({
                "filename": fname,
                "size": os.path.getsize(full),
                "uploaded_at": os.path.getmtime(full)
            })

        return jsonify(files), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================
# DOWNLOAD QB (open in new tab)
# ==========================
@app.route('/download_qb', methods=['GET'])
def download_qb():
    subject_id = request.args.get("subject_id")
    filename = request.args.get("filename")
    if not subject_id or not filename:
        return jsonify({"error": "subject_id and filename required"}), 400

    folder = os.path.join(BASE_UPLOAD_DIR, secure_filename(subject_id))
    path = os.path.join(folder, secure_filename(filename))
    if not os.path.exists(path):
        return jsonify({"error": "File not found"}), 404

    # send file inline so browser can open in new tab
    return send_file(path, mimetype="application/pdf")


# ==========================
# DELETE QB
# ==========================
@app.route('/delete_qb', methods=['DELETE'])
def delete_qb():
    try:
        subject_id = request.args.get("subject_id")
        filename = request.args.get("filename")
        if not subject_id or not filename:
            return jsonify({"error": "subject_id and filename required"}), 400

        folder = os.path.join(BASE_UPLOAD_DIR, secure_filename(subject_id))
        path = os.path.join(folder, secure_filename(filename))
        if not os.path.exists(path):
            return jsonify({"error": "File not found"}), 404

        os.remove(path)
        return jsonify({"message": "Deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================
# GET TOTAL QB COUNT
# ==========================
@app.route('/get_qb_count', methods=['GET'])
def get_qb_count():
    try:
        total_count = 0
        if os.path.exists(BASE_UPLOAD_DIR):
            for subject_folder in os.listdir(BASE_UPLOAD_DIR):
                folder_path = os.path.join(BASE_UPLOAD_DIR, subject_folder)
                if os.path.isdir(folder_path):
                    for fname in os.listdir(folder_path):
                        if allowed_file(fname):
                            total_count += 1
        return jsonify({"count": total_count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================
# RUN SERVER
# ==========================
if __name__ == "__main__":
    app.run(debug=True, port=5004)
