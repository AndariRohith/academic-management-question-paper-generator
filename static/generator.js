const API_BASE = "http://127.0.0.1:5005";

const regSel = document.getElementById("regSel");
const semSel = document.getElementById("semSel");
const subSel = document.getElementById("subSel");
const qbFile = document.getElementById("qbFile");
const uploadBtn = document.getElementById("uploadBtn");
const genBtn = document.getElementById("genBtn");
const status = document.getElementById("status");
const links = document.getElementById("links");

let parsed_id = null;
let paper_meta = null;

// ===== LOAD REGULATIONS =====
async function loadRegulations() {
    const res = await fetch(`${API_BASE}/get_regulations`);
    const data = await res.json();

    regSel.innerHTML = `<option value="">-- select regulation --</option>`;
    data.regulations.forEach(r => {
        regSel.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
}

// ===== LOAD SEMESTERS =====
regSel.addEventListener("change", async () => {
    semSel.innerHTML = `<option value="">-- select semester --</option>`;
    subSel.innerHTML = `<option value="">-- select subject --</option>`;

    if (regSel.value === "") return;

    const res = await fetch(`${API_BASE}/get_semesters/${regSel.value}`);
    const data = await res.json();

    data.semesters.forEach(s => {
        semSel.innerHTML += `<option value="${s}">${s}</option>`;
    });
});

// ===== LOAD SUBJECTS =====
semSel.addEventListener("change", async () => {
    subSel.innerHTML = `<option value="">-- select subject --</option>`;

    if (regSel.value === "" || semSel.value === "") return;

    const res = await fetch(`${API_BASE}/get_subjects/${regSel.value}/${semSel.value}`);
    const data = await res.json();

    data.subjects.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.code})`;
        opt.dataset.name = s.name;
        opt.dataset.code = s.code;
        subSel.appendChild(opt);
    });
});

subSel.addEventListener("change", () => {
    const opt = subSel.selectedOptions[0];
    if (opt) {
        paper_meta = {
            subject_name: opt.dataset.name,
            subject_code: opt.dataset.code,
            regulation: regSel.value,
            semester: semSel.value
        };
    }
});

// ===== UPLOAD & PARSE PDF =====
uploadBtn.addEventListener("click", async () => {
    if (!regSel.value || !semSel.value || !subSel.value) {
        status.textContent = "Select regulation, semester, and subject.";
        return;
    }
    if (!qbFile.files.length) {
        status.textContent = "Please upload a PDF file.";
        return;
    }

    const fd = new FormData();
    fd.append("file", qbFile.files[0]);
    fd.append("regulation", regSel.value);
    fd.append("semester", semSel.value);
    fd.append("subject_id", subSel.value);

    status.textContent = "Uploading & parsing...";

    const res = await fetch(`${API_BASE}/upload_question_bank`, {
        method: "POST",
        body: fd
    });

    const data = await res.json();

    if (!res.ok) {
        status.textContent = "Upload failed: " + data.error;
        return;
    }

    parsed_id = data.parsed_id;
    status.textContent = "Uploaded & parsed successfully!";
    genBtn.disabled = false;
});

// ===== GENERATE 4 SETS =====
genBtn.addEventListener("click", async () => {
    status.textContent = "Generating sets...";
    links.innerHTML = "";

    const res = await fetch(`${API_BASE}/generate_sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            parsed_id: parsed_id,
            paper_meta: paper_meta
        })
    });

    const data = await res.json();

    if (!res.ok) {
        status.textContent = "Generation failed!";
        return;
    }

    status.textContent = "Generated successfully!";

    data.sets.forEach(s => {
        const a = document.createElement("a");
        a.href = API_BASE + s.url;
        a.textContent = `Download ${s.set}`;
        links.appendChild(a);
    });
});

// Load regulations on start
loadRegulations();
