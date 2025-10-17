#!/usr/bin/env python3
"""
generate_or_update_app.py
-------------------------
Reads a JSON request (task brief) and builds or revises a web app repo using the OpenAI API.
- Round 1 → fresh build
- Round 2+ → update existing app based on new brief
"""

import os, json, subprocess, tempfile
from pathlib import Path
from datetime import datetime
from openai import OpenAI

# --- Configuration ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Missing OPENAI_API_KEY env var")

client = OpenAI(api_key=OPENAI_API_KEY)

# --- Helper functions ---

def run(cmd, cwd=None):
    """Run a shell command with error checking."""
    print(f"→ {cmd}")
    res = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print(res.stderr)
        raise RuntimeError(f"Command failed: {cmd}")
    return res.stdout.strip()

def git_commit_push(msg):
    """Commit and push all changes."""
    run('git add .')
    try:
        run(f'git commit -m "{msg}"')
    except RuntimeError:
        print("Nothing to commit.")
    run('git push origin HEAD')

# --- Core logic ---

def main():
    req_path = Path("request.json")
    if not req_path.exists():
        raise FileNotFoundError("request.json not found")

    request = json.loads(req_path.read_text())
    brief = request.get("brief", "")
    round_num = request.get("round", 1)
    task_id = request.get("task", f"task-{datetime.utcnow().isoformat()}")
    attachments = request.get("attachments", [])

    print(f"\n🔧 Task: {task_id}\n📄 Round: {round_num}\n🧠 Brief: {brief}\n")

    # --- Prepare context for LLM ---
    context = [
        {"role": "system", "content": "You are an expert front-end developer using HTML, JS, and CSS. Generate minimal, functional, and standards-compliant web apps."},
        {"role": "user", "content": f"Brief: {brief}\nRound: {round_num}\nAttachments: {attachments}"}
    ]

    # --- Ask the LLM for code ---
    print("🧠 Generating or updating app via OpenAI...")
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=context,
        temperature=0.4
    )

    code = completion.choices[0].message.content

    # --- Save output ---
    output_dir = Path(".")
    app_file = output_dir / "index.html"

    # Simple strategy: append or replace content
    if round_num == 1 or not app_file.exists():
        app_file.write_text(code, encoding="utf-8")
    else:
        # Add revision notes at top for Round 2+
        old = app_file.read_text(encoding="utf-8")
        app_file.write_text(f"<!-- Update round {round_num}: {brief} -->\n" + code + "\n" + old, encoding="utf-8")

    # --- Update README ---
    readme = Path("README.md")
    if readme.exists():
        old_md = readme.read_text(encoding="utf-8")
    else:
        old_md = ""
    new_md = f"## Round {round_num}\n\n**Brief:** {brief}\n\nGenerated on {datetime.utcnow().isoformat()} UTC\n\n"
    readme.write_text(new_md + "\n" + old_md, encoding="utf-8")

    # --- Add LICENSE if missing ---
    license_path = Path("LICENSE")
    if not license_path.exists():
        license_path.write_text("MIT License\n\nCopyright (c) {}\n".format(datetime.utcnow().year))

    # --- Commit & Push ---
    git_commit_push(f"Auto build/update for {task_id} (round {round_num})")

    print("\n✅ App generated/updated and pushed successfully.")

if __name__ == "__main__":
    main()
