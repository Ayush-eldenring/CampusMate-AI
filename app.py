from flask import Flask, render_template, request, jsonify
import sqlite3, re
from datetime import datetime
from pathlib import Path

app = Flask(__name__)
DB = Path(__file__).with_name("campusmate.db")

def connect():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    with connect() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL, due_date TEXT, source TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""")
        con.execute("""CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT NOT NULL, category TEXT, place TEXT, details TEXT,
            status TEXT DEFAULT 'Lost', created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""")

def extract_dates(text):
    patterns = [
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
        r'\b\d{1,2}\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)\s+\d{2,4}\b',
        r'\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{2,4}\b'
    ]
    found = []
    for pattern in patterns:
        found.extend(re.findall(pattern, text, flags=re.I))
    return list(dict.fromkeys(found))

@app.route("/")
def home():
    return render_template("index.html")

@app.get("/api/tasks")
def tasks():
    with connect() as con:
        rows = con.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.post("/api/analyze")
def analyze():
    data = request.get_json(force=True)
    notice = (data.get("notice") or "").strip()
    if not notice:
        return jsonify({"error": "Paste a notice first."}), 400
    dates = extract_dates(notice)
    lines = [x.strip(" •-\t") for x in notice.splitlines() if x.strip()]
    title = next((x for x in lines if len(x) > 5), "College notice")
    keywords = ["exam", "assignment", "submission", "fee", "registration", "hall ticket", "record", "project", "deadline"]
    important = [line for line in lines if any(k in line.lower() for k in keywords)]
    summary = important[:5] if important else lines[:3]
    return jsonify({"title": title[:100], "dates": dates, "key_points": summary})

@app.post("/api/tasks")
def add_task():
    data = request.get_json(force=True)
    title = (data.get("title") or "").strip()
    due = (data.get("due_date") or "").strip()
    source = (data.get("source") or "").strip()
    if not title:
        return jsonify({"error": "Task title is required."}), 400
    with connect() as con:
        cur = con.execute("INSERT INTO tasks(title,due_date,source) VALUES(?,?,?)", (title, due, source))
        task_id = cur.lastrowid
    return jsonify({"ok": True, "id": task_id})

@app.get("/api/reports")
def reports():
    q = (request.args.get("q") or "").strip().lower()
    with connect() as con:
        rows = con.execute("SELECT * FROM reports ORDER BY id DESC").fetchall()
    result = [dict(r) for r in rows]
    if q:
        result = [r for r in result if q in " ".join(str(r.get(k) or "") for k in ("item","category","place","details","status")).lower()]
    return jsonify(result)

@app.post("/api/reports")
def add_report():
    data = request.get_json(force=True)
    item = (data.get("item") or "").strip()
    if not item:
        return jsonify({"error": "Enter an item name."}), 400
    with connect() as con:
        cur = con.execute(
            "INSERT INTO reports(item,category,place,details,status) VALUES(?,?,?,?,?)",
            (item, data.get("category","Other"), data.get("place",""), data.get("details",""), data.get("status","Lost"))
        )
    return jsonify({"ok": True, "id": cur.lastrowid})

@app.get("/api/locations")
def locations():
    return jsonify([
        {"name":"Main Block","type":"Academic","hint":"Classrooms, faculty offices"},
        {"name":"Library","type":"Study","hint":"Books, reading and study space"},
        {"name":"Central Lab","type":"Laboratory","hint":"Computer and practical labs"},
        {"name":"Administrative Office","type":"Services","hint":"Certificates and student support"},
        {"name":"Auditorium","type":"Events","hint":"Seminars and college events"},
        {"name":"Hostel Office","type":"Hostel","hint":"Hostel administration"}
    ])

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
