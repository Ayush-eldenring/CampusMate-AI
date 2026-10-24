# CampusMate AI – Prototype

A local Flask web prototype with three demo modules:
- Academic Rescue: extracts dates and action-related lines from pasted notices.
- Campus Navigator: searchable sample campus locations (replace with verified campus data).
- Lost & Found: create and search item reports stored in SQLite.

## Run on Windows
1. Install Python 3.10+ and VS Code.
2. Extract this folder.
3. Open the folder in VS Code.
4. Open Terminal in VS Code and run:
   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python app.py
   ```
5. Open http://127.0.0.1:5000

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again.

## Demo notes
Use sample notices with dates such as `25/10/2026` or `25 October 2026`.
This is a prototype: notice extraction uses simple pattern matching, not a real language model. Campus locations are sample entries and must be replaced with accurate campus information before presenting as real.
