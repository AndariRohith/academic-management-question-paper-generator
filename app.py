import subprocess

python_files = [
    "dashboard.py",
    "faculty.py",
    "subjects.py",
    "regulation.py",
    "question_bank_backend.py",
    "generator.py",
    # add more python files here
]

processes = []

for file in python_files:
    print(f"Starting {file}...")
    p = subprocess.Popen(["python", file])
    processes.append(p)

# OPTIONAL: Wait until all finish
for p in processes:
    p.wait()
