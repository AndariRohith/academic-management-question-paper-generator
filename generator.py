import os
import re
import json
import random
import traceback
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
import csv
import time

# Serve static files from /static
app = Flask(__name__, static_folder="static")
CORS(app)

UPLOAD_FOLDER = "uploads"
GENERATED_FOLDER = "generated_papers"
TEMP_FOLDER = os.path.join(UPLOAD_FOLDER, "temp")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GENERATED_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

# ===== CONNECT DB =====
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Mrs.Rossi@sql",
        database="siet_faculty_management"
    )

# Serve the generator page from Flask so uploads are same-origin
@app.route("/")
def home():
    return send_from_directory(app.static_folder, "generator.html")

# ===== REGULATION LIST =====
@app.route("/get_regulations")
def get_regulations():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT reg_id, reg_name FROM regulations")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"regulations": [{"id": r[0], "name": r[1]} for r in rows]})
    except Exception as e:
        print("get_regulations error:", e)
        traceback.print_exc()
        return jsonify({"regulations": []})

# ===== SEMESTER LIST =====
@app.route("/get_semesters/<reg_id>")
def get_semesters(reg_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT semester FROM subjects WHERE regulation_id=%s ORDER BY semester", (reg_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"semesters": [r[0] for r in rows]})
    except Exception as e:
        print("get_semesters error:", e)
        traceback.print_exc()
        return jsonify({"semesters": []})

# ===== SUBJECT LIST =====
@app.route("/get_subjects/<reg_id>/<semester>")
def get_subjects(reg_id, semester):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT subject_id, subject_name, subject_code 
            FROM subjects
            WHERE regulation_id=%s AND semester=%s
            ORDER BY subject_name
        """, (reg_id, semester))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({
            "subjects": [
                {"id": r[0], "name": r[1], "code": r[2]} for r in rows
            ]
        })
    except Exception as e:
        print("get_subjects error:", e)
        traceback.print_exc()
        return jsonify({"subjects": []})

# ===== PDF TEXT =====
def extract_pdf(path):
    # robust reading (some PDFs may fail); raise exception on failure
    reader = PdfReader(path)
    out = []
    for p in reader.pages:
        text = p.extract_text()
        if text:
            out.append(text)
    return "\n".join(out)

# ===== UNIT SPLITTER =====
UNIT_PATTERN = re.compile(r"UNIT[\s:–-]*([IVXLC\d]+)", re.IGNORECASE)

def split_units(text):
    parts = UNIT_PATTERN.split(text)
    units = {}
    for i in range(1, len(parts), 2):
        heading = parts[i].strip()
        body = parts[i + 1].strip() if i + 1 < len(parts) else "" # Heading is the ID (I, II, 1)
        units[heading] = body
        
    if not units:
        if "UNIT" in text.upper():
            segs = re.split(r"UNIT", text, flags=re.IGNORECASE)
            for idx, seg in enumerate(segs[1:], start=1):
                units[str(idx)] = seg.strip()
        else:
             units["ALL"] = text
    return units

# ===== QUESTION SPLITTER WITH METADATA =====
# ===== QUESTION SPLITTER WITH METADATA =====
def parse_question_metadata(question_text):
    """
    Extract metadata from question text. 
    Supports two formats:
    1. [L#][CO#][#M] (Old format)
       Example: "Question text [L2][CO1][6M]"
    2. CO# L# #M (New detected format)
       Example: "Question text CO1 L2 12M"
    Returns: (clean_text, metadata_dict)
    """
    
    # Format 1: [L2][CO1][12M]
    # Regex for metadata with relaxed spacing
    # Matches [L2][CO1][10M] or [L2] [CO1] [10M] or [CO1 L2 10M]
    # We prioritize the bracketed format but with \s* to allow spaces
    bracket_pattern = re.compile(r"\[\s*L(\d+)\s*\]\s*\[\s*CO(\d+)\s*\]\s*\[\s*(\d+)M\s*\]", re.IGNORECASE)
    
    # Check for plain format: CO1 L2 12M
    # Pattern: CO(\d+)\s+L(\d+)\s+(\d+)M
    plain_pattern = re.compile(r"CO(\d+)\s+L(\d+)\s+(\d+)M", re.IGNORECASE)
    
    match_bracket = bracket_pattern.search(question_text)
    match_plain = plain_pattern.search(question_text)
    
    if match_bracket:
        level = match_bracket.group(1)
        co = match_bracket.group(2)
        marks = match_bracket.group(3)
        clean_text = re.sub(bracket_pattern, '', question_text).strip()
        metadata = {
            'level': level,
            'co': co,
            'marks': marks,
            'raw': f"CO{co}    L{level}    {marks}M"
        }
        return clean_text, metadata
        
    elif match_plain:
        # Extract groups. The order in regex is CO, L, M.
        co_str = match_plain.group(1) # CO1
        level_str = match_plain.group(2) # L2
        marks_str = match_plain.group(3) # 12
        
        co = co_str.replace("CO", "")
        level = level_str.replace("L", "")
        marks = marks_str
        
        clean_text = re.sub(plain_pattern, '', question_text).strip()
        
        metadata = {
            'level': level,
            'co': co,
            'marks': marks,
            'raw': f"{co_str}    {level_str}    {marks_str}M"
        }
        return clean_text, metadata

    else:
        # No metadata found
        return question_text, {'level': '', 'co': '', 'marks': '', 'raw': ''}

def extract_questions_to_csv(pdf_path, csv_path):
    text = extract_pdf(pdf_path)
    lines = text.splitlines()
    
    questions = []
    current_unit = "1"
    
    unit_pattern = re.compile(r"UNIT[\s:–-]*([IVXLC\d]+)", re.IGNORECASE)
    # Strict start pattern: 1-2 digits, separator, space?
    q_start_pattern = re.compile(r"^(\d{1,2})([\.\)\s])\s*")
    
    noise_patterns = [
        re.compile(r"^Prepared by", re.IGNORECASE),
        re.compile(r"^Section\s+[IVX]+", re.IGNORECASE),
        re.compile(r"^No\.?\s*of\s*workers", re.IGNORECASE),
        re.compile(r"^Page\s+\d+", re.IGNORECASE),
        re.compile(r"^Course\s+Code", re.IGNORECASE),
        re.compile(r"^Regulation", re.IGNORECASE),
        re.compile(r"^H\.T\.No", re.IGNORECASE),
        re.compile(r"^SIDDHARTH", re.IGNORECASE),
        re.compile(r"^Subject\s+with", re.IGNORECASE),
        re.compile(r"^Question\s+Bank", re.IGNORECASE),
        re.compile(r"^Year\s*&\s*Sem", re.IGNORECASE),
    ]
    
    current_block = []
    
    def process_block(blk, unit):
        if not blk: 
            return
        full_text = "\n".join(blk).strip()
        
        # Remove common footer artifacts from the text
        clean_text = full_text
        footer_noise = [
             r"Course Code\s*:?.*",
             r"Regulation\s*:?.*",
             r"H\.T\.No\..*",
             r"\d+[A-Z]{2}\d+.*",
             r"R\d+$"
        ]
        for pat in footer_noise:
            clean_text = re.sub(pat, "", clean_text, flags=re.IGNORECASE).strip()
            
        clean_text, meta = parse_question_metadata(clean_text)
        
        # Split Number and Text
        # match start pattern again to strip number
        m = q_start_pattern.match(clean_text)
        q_num = ""
        qt = clean_text
        if m:
            # We want to keep the "1" as q_num, but the text "a) ..." as qt
            # pattern groups: 1=digits, 2=sep
            # whole match is what we strip?
            whole_match = m.group(0)
            q_num = m.group(1)
            qt = clean_text[len(whole_match):].strip()
            
        if qt.upper() == "OR": return
        
        questions.append({
            'unit': unit,
            'question_number': q_num,
            'question_text': qt,
            'taxonomy_level': meta['level'],
            'course_outcome': meta['co'],
            'marks': meta['marks'],
            'has_or': False
        })

    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Noise Check
        is_noise = False
        for np in noise_patterns:
            if np.search(line):
                is_noise = True
                break
        if is_noise: continue
        
        # Unit Check
        u_match = unit_pattern.search(line)
        if u_match:
            process_block(current_block, current_unit)
            current_block = []
            
            raw_unit = u_match.group(1).upper()
            if raw_unit in ['I', '1', 'ONE']: current_unit = "1"
            elif raw_unit in ['II', '2', 'TWO']: current_unit = "2"
            elif raw_unit in ['III', '3', 'THREE']: current_unit = "3"
            elif raw_unit in ['IV', '4', 'FOUR']: current_unit = "4"
            elif raw_unit in ['V', '5', 'FIVE']: current_unit = "5"
            else:
                 # Try to map roman numerals
                 if raw_unit == "I": current_unit = "1"
                 elif raw_unit == "II": current_unit = "2"
                 elif raw_unit == "III": current_unit = "3"
                 elif raw_unit == "IV": current_unit = "4"
                 elif raw_unit == "V": current_unit = "5"
            continue
            
        # Question Start Check
        if q_start_pattern.match(line):
            process_block(current_block, current_unit)
            current_block = [line]
        elif line.strip().upper() == "OR":
            pass
        else:
            if current_block: # Only append if we are inside a question block
                current_block.append(line)
            
    process_block(current_block, current_unit)
    
    with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['unit', 'question_number', 'question_text', 'taxonomy_level', 'course_outcome', 'marks', 'has_or']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for q in questions:
            writer.writerow(q)
            
    return questions

def split_questions(text):
    lines = text.splitlines()
    questions = []
    
    # Strict start pattern: 1-2 digits, separator, space?
    q_start_pattern = re.compile(r"^(\d{1,2})([\.\)\s])\s*")
    
    noise_patterns = [
        re.compile(r"^Prepared by", re.IGNORECASE),
        re.compile(r"^Section\s+[IVX]+", re.IGNORECASE),
        re.compile(r"^No\.?\s*of\s*workers", re.IGNORECASE),
        re.compile(r"^Page\s+\d+", re.IGNORECASE),
        re.compile(r"^Course\s+Code", re.IGNORECASE),
        re.compile(r"^Regulation", re.IGNORECASE),
        re.compile(r"^H\.T\.No", re.IGNORECASE),
        re.compile(r"^SIDDHARTH", re.IGNORECASE),
        re.compile(r"^Subject\s+with", re.IGNORECASE),
        re.compile(r"^Question\s+Bank", re.IGNORECASE),
        re.compile(r"^Year\s*&\s*Sem", re.IGNORECASE),
    ]
    
    current_block = []
    
    def process_block(blk):
        if not blk: return
        full_text = "\n".join(blk).strip()
        
        # Remove common footer artifacts from the text
        clean_text = full_text
        footer_noise = [
             r"Course Code\s*:?.*",
             r"Regulation\s*:?.*",
             r"H\.T\.No\..*",
             r"\d+[A-Z]{2}\d+.*",
             r"R\d+$"
        ]
        for pat in footer_noise:
            clean_text = re.sub(pat, "", clean_text, flags=re.IGNORECASE).strip()
            
        clean_text, meta = parse_question_metadata(clean_text)
        
        # Split Number and Text
        m = q_start_pattern.match(clean_text)
        qt = clean_text
        if m:
            whole_match = m.group(0)
            qt = clean_text[len(whole_match):].strip()
            
        if qt.upper() == "OR": return
        
        questions.append({
            'text': qt,
            'metadata': meta # JSON flow uses parsed metadata
        })

    for ln in lines:
        ln = ln.strip()
        if not ln: continue
        
        # Noise Check
        is_noise = False
        for np in noise_patterns:
            if np.search(ln):
                is_noise = True
                break
        if is_noise: continue
        
        if q_start_pattern.match(ln):
            process_block(current_block)
            current_block = [ln]
        elif ln.upper() == "OR":
            pass
        else:
            if current_block:
                current_block.append(ln)
                
    process_block(current_block)
    return questions

# ===== UPLOAD & PARSE PDF =====
@app.route("/upload_question_bank", methods=["POST"])
def upload_question_bank():
    try:
        # debug prints for troubleshooting
        print("UPLOAD called")
        print("Request files keys:", list(request.files.keys()))
        print("Request form keys:", dict(request.form))

        # file must be posted with key 'file'
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "file missing in request.files (expected key 'file')", "files": list(request.files.keys()), "form": dict(request.form)}), 400

        filename = secure_filename(file.filename)
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(save_path)
        print("Saved uploaded file to:", save_path)

        # Extract text from PDF (may raise)
        try:
            text = extract_pdf(save_path)
        except Exception as e:
            print("PDF extraction failed:", e)
            traceback.print_exc()
            return jsonify({"error": "pdf read failed", "detail": str(e)}), 500

        # Split into units and questions (original JSON flow for backwards compat)
        units_data = split_units(text)
        if not units_data:
            # fallback: put entire text into one unit if parsing failed
            units_data = {"UNIT-ALL": text}

        parsed = {}
        for unit, utext in units_data.items():
            parsed[unit] = split_questions(utext)

        parsed_id = filename + ".json"
        parsed_path = os.path.join(UPLOAD_FOLDER, parsed_id)
        with open(parsed_path, "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)

        print("Parsed units and wrote:", parsed_path)
        
        # NEW: Also extract to CSV for validation
        csv_id = filename + "_questions.csv"
        csv_path = os.path.join(TEMP_FOLDER, csv_id)
        questions_list = extract_questions_to_csv(save_path, csv_path)
        print(f"Extracted {len(questions_list)} questions to CSV:", csv_path)

        return jsonify({
            "parsed_id": parsed_id, 
            "csv_id": csv_id,
            "units_count": {k: len(v) for k, v in parsed.items()},
            "questions_count": len(questions_list)
        })

    except Exception as e:
        print("upload_question_bank unexpected error:", e)
        traceback.print_exc()
        return jsonify({"error": "internal_server_error", "detail": str(e)}), 500

# ===== PDF GENERATOR =====
def wrap_text(txt, width, font="Helvetica", size=10):
    # Respect existing newlines
    source_lines = txt.split('\n')
    final_lines = []
    
    for sl in source_lines:
        words = sl.split()
        if not words:
            # preserve empty line
            final_lines.append("")
            continue
            
        cur = ""
        for w in words:
            test = (cur + " " + w).strip() if cur else w
            if stringWidth(test, font, size) < width:
                cur = test
            else:
                if cur:
                    final_lines.append(cur)
                cur = w
        if cur:
            final_lines.append(cur)
            
    return final_lines

def generate_pdf(parsed, meta, path, seed):
    random.seed(seed)
    c = canvas.Canvas(path, pagesize=A4)
    W, H = A4
    margin_x = 40
    y = H - 40

    # Header Box with O.P.Code, Regulation, H.T.No
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(1)
    
    # Top boxes
    c.rect(margin_x, y - 30, 140, 25)  # O.P.Code box
    c.rect(margin_x + 150, y - 30, 80, 25)  # Regulation box
    c.rect(margin_x + 240, y - 30, 280, 25)  # H.T.No box
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin_x + 5, y - 18, f"O.P.Code: {meta.get('subject_code', 'XXXXXX')}")
    c.drawString(margin_x + 165, y - 18, meta.get('regulation', 'R20'))
    c.drawString(margin_x + 250, y - 18, "H.T.No.")
    
    # Small boxes for H.T.No
    for i in range(10):
        c.rect(margin_x + 320 + (i * 20), y - 30, 20, 25)
    
    y -= 45

    # Institution Name
    c.setFont("Helvetica-Bold", 11)
    inst_text = "SIDDHARTH INSTITUTE OF ENGINEERING & TECHNOLOGY:: PUTTUR"
    c.drawCentredString(W / 2, y, inst_text)
    y -= 15
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, y, "(AUTONOMOUS)")
    y -= 20

    # Exam Details
    c.setFont("Helvetica-Bold", 10)
    exam_line = f"MCA I Year II Semester Regular & Supplementary Examinations June/July-2025"
    c.drawCentredString(W / 2, y, exam_line)
    y -= 15
    
    subject_name = meta.get('subject_name', 'SUBJECT NAME')
    c.drawCentredString(W / 2, y, subject_name.upper())
    y -= 20

    # Time and Max Marks
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin_x, y, "Time: 3 Hours")
    c.drawRightString(W - margin_x, y, "Max. Marks: 60")
    y -= 15

    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, y, "(Answer all Five Units 5 x 12 = 60 Marks)")
    y -= 25

    # Generate questions from units
    unit_keys = list(parsed.keys())[:5]
    
    for unit_idx, unit_key in enumerate(unit_keys, start=1):
        # Unit Header
        c.setFont("Helvetica-Bold", 10)
        unit_box_y = y
        c.rect(margin_x + 220, unit_box_y - 15, 80, 18)
        c.drawCentredString(margin_x + 260, unit_box_y - 10, f"UNIT-{unit_idx}")
        y -= 25

        pool = parsed.get(unit_key, [])
        
        # Generate 2 questions per unit (with OR)
        if len(pool) >= 2:
            q1_obj, q2_obj = random.sample(pool, 2)
        elif len(pool) == 1:
            q1_obj = q2_obj = pool[0]
        else:
            q1_obj = q2_obj = {'text': "No questions available", 'metadata': {'level': '2', 'co': '1', 'marks': '12', 'raw': 'CO1    L2    12M'}}

        # Extract question text and metadata
        q1 = q1_obj.get('text', q1_obj) if isinstance(q1_obj, dict) else q1_obj
        q1_meta = q1_obj.get('metadata', {'raw': 'CO1    L2    12M'}) if isinstance(q1_obj, dict) else {'raw': 'CO1    L2    12M'}
        
        q2 = q2_obj.get('text', q2_obj) if isinstance(q2_obj, dict) else q2_obj
        q2_meta = q2_obj.get('metadata', {'raw': 'CO1    L2    12M'}) if isinstance(q2_obj, dict) else {'raw': 'CO1    L2    12M'}

        # Question 1
        c.setFont("Helvetica", 10)
        qnum = (unit_idx - 1) * 2 + 1
        
        # Helper to draw a single question item
        def draw_question_block(text, meta, prefix_num):
            nonlocal y
            
            if not text:
                text = "No question text available."
            
            # Format: "{prefix_num}. <Full Question Text> [12 Marks]"
            
            full_text = f"{prefix_num}. {text} [12 Marks]"
            
            lines = wrap_text(full_text, W - 80)
            
            for line in lines:
                if y < 60:
                    c.showPage()
                    y = H - 50
                c.drawString(margin_x, y, line)
                y -= 14
            
            # Add 2-3 blank lines for readability
            y -= 40

        # Draw Q1
        draw_question_block(q1, q1_meta, qnum)

        # OR
        y -= 10 # Add padding before OR
        if y < 80:
            c.showPage()
            y = H - 50
            
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(W / 2, y, "OR")
        y -= 25 # Increased padding after OR


        # Question 2
        c.setFont("Helvetica", 10)
        qnum += 1
        draw_question_block(q2, q2_meta, qnum)
        
        y -= 20

    c.save()

# ===== GENERATE SETS =====
@app.route("/generate_sets", methods=["POST"])
def generate_sets():
    try:
        data = request.get_json()
        parsed_id = data.get("parsed_id")
        meta = data.get("paper_meta", {})

        if not parsed_id:
            return jsonify({"error": "missing parsed_id"}), 400

        parsed_path = os.path.join(UPLOAD_FOLDER, parsed_id)
        # We need to find the corresponding CSV file. 
        # Upload saves it as {filename}_questions.csv in TEMP_FOLDER
        # parsed_id is {filename}.json
        original_filename = parsed_id.replace(".json", "")
        csv_id = original_filename + "_questions.csv"
        csv_path = os.path.join(TEMP_FOLDER, csv_id)
        
        parsed = {}
        
        # Prefer CSV if exists, fallback to JSON
        if os.path.exists(csv_path):
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    u = row['unit']
                    # Map 1, 2, 3 to UNIT-1, etc to match structure expected by generate_pdf
                    unit_key = f"UNIT-{u}"
                    if unit_key not in parsed:
                        parsed[unit_key] = []
                    
                    # Reconstruct question object
                    parsed[unit_key].append({
                        'text': row['question_text'],
                        'metadata': {
                            'level': row['taxonomy_level'],
                            'co': row['course_outcome'],
                            'marks': row['marks'],
                            'raw': f"CO{row['course_outcome']}    L{row['taxonomy_level']}    {row['marks']}M"
                        }
                    })
        elif os.path.exists(parsed_path):
            # Fallback to JSON
            with open(parsed_path, "r", encoding="utf-8") as f:
                parsed = json.load(f)
        else:
             return jsonify({"error": "parsed file not found", "parsed_path": parsed_path}), 404

        num_sets = int(data.get("num_sets", 4))
        # Validate num_sets (e.g. 1 to 26 to stay within A-Z)
        num_sets = max(1, min(num_sets, 26))

        # Generate unique timestamp for this generation batch
        timestamp = int(time.time() * 1000)  # milliseconds for uniqueness
        
        sets = []
        for i in range(num_sets):
            set_letter = chr(65+i)  # A, B, C, etc.
            # Create unique filename with timestamp
            name = f"Set_{set_letter}_{timestamp}"
            pdf_path = os.path.join(GENERATED_FOLDER, f"{name}.pdf")
            
            # Use timestamp + index as seed for truly random selection each time
            seed = timestamp + i
            generate_pdf(parsed, meta, pdf_path, seed=seed)
            
            sets.append({"set": f"Set {set_letter}", "url": f"/download/{name}.pdf"})

        return jsonify({"sets": sets})
    except Exception as e:
        print("generate_sets error:", e)
        traceback.print_exc()
        return jsonify({"error": "internal_error", "detail": str(e)}), 500

@app.route("/view/<filename>")
def view_pdf(filename):
    """Serve PDF for inline viewing in browser"""
    return send_from_directory(GENERATED_FOLDER, filename, as_attachment=False)

@app.route("/download/<filename>")
def download(filename):
    """Serve PDF as download attachment"""
    return send_from_directory(GENERATED_FOLDER, filename, as_attachment=True)

@app.route("/download_csv/<csv_id>")
def download_csv(csv_id):
    """Serve CSV file for validation"""
    return send_from_directory(TEMP_FOLDER, csv_id, as_attachment=True)

if __name__ == "__main__":
    # change port here to match what you use (5005)
    app.run(debug=True, port=5005)

