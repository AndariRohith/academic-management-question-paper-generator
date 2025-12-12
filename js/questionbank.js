// API URLs
const API_REG = "http://127.0.0.1:5002/get_regulations";
const API_SUB = "http://127.0.0.1:5003/get_subjects";

// QUESTION BANK FILE APIs (port 5004)
const API_UPLOAD_QB = "http://127.0.0.1:5004/upload_qb";
const API_LIST_QB   = "http://127.0.0.1:5004/list_qb";       // GET /list_qb/<subject_id>
const API_DOWNLOAD  = "http://127.0.0.1:5004/download_qb";   // GET ?subject_id=&filename=
const API_DELETE    = "http://127.0.0.1:5004/delete_qb";     // DELETE ?subject_id=&filename=

// ================= Load Regulations =================
loadRegulations();

function loadRegulations() {
    fetch(API_REG)
        .then(res => res.json())
        .then(data => {
            const regSelect = document.getElementById("regulation");
            regSelect.innerHTML = `<option value="">Select Regulation</option>`;

            data.forEach(r => {
                // backend returns { reg_id, reg_name } or { reg_id }
                const label = r.reg_name ? r.reg_name : r.reg_id;
                regSelect.innerHTML += `
                    <option value="${r.reg_id}">${label}</option>
                `;
            });
        })
        .catch(() => alert("Could not load regulations. Check backend 5002."));
}



// ================= Load Subjects =================
document.getElementById("regulation").addEventListener("change", loadSubjects);
document.getElementById("semester").addEventListener("change", loadSubjects);

function loadSubjects() {
    const reg = document.getElementById("regulation").value;
    const sem = document.getElementById("semester").value;

    if (!reg || !sem) {
        document.getElementById("subjectsBody").innerHTML = "";
        return;
    }

    fetch(`${API_SUB}?regulation=${encodeURIComponent(reg)}&semester=${encodeURIComponent(sem)}`)
        .then(res => res.json())
        .then(data => renderSubjects(data))
        .catch(() => alert("Could not load subjects. Check backend 5003."));
}



// ================= Build Table Rows =================
function renderSubjects(subjects) {

    const body = document.getElementById("subjectsBody");
    body.innerHTML = "";

    subjects.forEach(sub => {

        body.innerHTML += `
            <tr>
                <td>${sub.subject_code}</td>
                <td>${sub.subject_name}</td>
                <td>${sub.semester}</td>
                <td>${sub.regulation_id}</td>

                <td>
                    <button class="btn btn-upload" onclick="openFilesModal('${sub.subject_id}','${escapeHtml(sub.subject_code)}')">Upload</button>
                    <button class="btn btn-view" onclick="openFilesModal('${sub.subject_id}','${escapeHtml(sub.subject_code)}')">View</button>
                    <button class="btn btn-delete" onclick="deleteQBConfirm('${sub.subject_id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

function escapeHtml(s) {
    return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}



// ================= Modal & File Actions =================
const modalBackdrop = document.getElementById('modalBackdrop');
const filesList = document.getElementById('filesList');
const modalTitle = document.getElementById('modalTitle');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const modalClose = document.getElementById('modalClose');

let currentSubjectForModal = null;

function openFilesModal(subjectId, subjectLabel) {
    currentSubjectForModal = subjectId;
    modalTitle.textContent = `Files for ${subjectLabel || subjectId}`;
    fileInput.value = "";
    filesList.innerHTML = `<div style="padding:8px;color:#666">Loading...</div>`;
    modalBackdrop.style.display = 'flex';

    // load list
    fetch(`${API_LIST_QB}/${encodeURIComponent(subjectId)}`)
        .then(res => res.json())
        .then(files => {
            renderFilesList(files);
        })
        .catch(() => {
            filesList.innerHTML = `<div style="padding:8px;color:#d00">Cannot load files</div>`;
        });
}

modalClose.addEventListener('click', () => {
    modalBackdrop.style.display = 'none';
});

uploadBtn.addEventListener('click', () => {
    if (!currentSubjectForModal) return alert('No subject selected');
    const f = fileInput.files[0];
    if (!f) return alert('Select a PDF first');

    const form = new FormData();
    form.append('subject_id', currentSubjectForModal);
    form.append('file', f);

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    fetch(API_UPLOAD_QB, { method: 'POST', body: form })
        .then(res => res.json())
        .then(json => {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload';
            if (json && json.error) {
                alert('Upload failed: ' + json.error);
            } else {
                // refresh list
                fetch(`${API_LIST_QB}/${encodeURIComponent(currentSubjectForModal)}`)
                    .then(res => res.json())
                    .then(files => renderFilesList(files))
                    .catch(() => filesList.innerHTML = `<div style="padding:8px;color:#d00">Cannot load files</div>`);
            }
        })
        .catch(() => {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload';
            alert('Upload failed (network)');
        });
});


function renderFilesList(files) {
    if (!files || files.length === 0) {
        filesList.innerHTML = `<div style="padding:12px;color:#666">No files uploaded for this subject.</div>`;
        return;
    }

    filesList.innerHTML = '';
    files.forEach(f => {
        const row = document.createElement('div');
        row.className = 'file-row';

        const left = document.createElement('div');
        left.className = 'file-name';
        left.textContent = f.filename;

        const right = document.createElement('div');
        right.className = 'file-actions';

        // view/download button
        const downBtn = document.createElement('button');
        downBtn.className = 'btn';
        downBtn.style.background = '#7cb342';
        downBtn.textContent = 'Open';
        downBtn.onclick = () => {
            // download & open in new tab
            const url = `${API_DOWNLOAD}?subject_id=${encodeURIComponent(currentSubjectForModal)}&filename=${encodeURIComponent(f.filename)}`;
            // open in new tab
            window.open(url, '_blank');
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'btn';
        delBtn.style.background = '#d84315';
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => {
            if (!confirm(`Delete "${f.filename}" ?`)) return;
            fetch(`${API_DELETE}?subject_id=${encodeURIComponent(currentSubjectForModal)}&filename=${encodeURIComponent(f.filename)}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(json => {
                    if (json && json.error) {
                        alert('Delete failed: ' + json.error);
                    } else {
                        // refresh list
                        fetch(`${API_LIST_QB}/${encodeURIComponent(currentSubjectForModal)}`)
                            .then(res => res.json())
                            .then(files => renderFilesList(files))
                            .catch(() => filesList.innerHTML = `<div style="padding:8px;color:#d00">Cannot load files</div>`);
                    }
                })
                .catch(() => alert('Delete failed (network)'));
        };

        right.appendChild(downBtn);
        right.appendChild(delBtn);

        row.appendChild(left);
        row.appendChild(right);
        filesList.appendChild(row);
    });
}


// ================= Button Actions (backwards-compatible placeholders removed) =================
function uploadQB(id) {
    // simply open the modal for that subject
    openFilesModal(id, id);
}

function viewQB(id) {
    openFilesModal(id, id);
}

function deleteQBConfirm(id) {
    // If there is only a single file stored at uploads/<id> (old behavior), delete that file directly:
    if (!confirm('Open file list for this subject to select a file to delete? Click OK to open the list.')) {
        return;
    }
    openFilesModal(id, id);
}
