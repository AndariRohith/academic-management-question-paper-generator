// subject_management.js
(() => {
  const API_BASE = "http://127.0.0.1:5003"; // change if needed
  let currentMode = "add";
  let regulationsCache = []; // array of {id, code} or strings

  // We'll fill this inside init() so lookups happen after HTML is present
  let els = {};

  // guard flags
  let _initialized = false;
  let _eventsWired = false;
  let isSubmitting = false;

  // ---------- API helper ----------
  async function apiFetch(path, opts = {}) {
    const res = await fetch(API_BASE + path, opts);
    const contentType = res.headers.get("content-type") || "";
    let body = null;
    if (contentType.includes("application/json")) body = await res.json();
    else body = await res.text();
    if (!res.ok) {
      const message = (body && (body.msg || body.error)) ? (body.msg || body.error) : res.statusText;
      throw new Error(message || "API error");
    }
    return body;
  }

  // ---------- Utilities ----------
  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // ---------- Mode / UI helpers ----------
  function showAddMode() {
    currentMode = "add";
    if (els.formTitle) els.formTitle.innerText = "Add New Subject";
    if (els.formSubmit) els.formSubmit.innerText = "Add Subject";
    if (els.subject_id) els.subject_id.disabled = false;
    if (els.addFormCard) els.addFormCard.style.display = "block";
    if (els.deleteCard) els.deleteCard.style.display = "none";
    if (els.resultsCard) els.resultsCard.style.display = "none";
    resetForm();
  }

  function showUpdateMode() {
    currentMode = "update";
    if (els.formTitle) els.formTitle.innerText = "Update Subject";
    if (els.formSubmit) els.formSubmit.innerText = "Update Subject";
    if (els.subject_id) els.subject_id.disabled = true;
    if (els.addFormCard) els.addFormCard.style.display = "block";
    if (els.deleteCard) els.deleteCard.style.display = "none";
    if (els.resultsCard) els.resultsCard.style.display = "none";
  }

  function showDeleteMode() {
    currentMode = "delete";
    if (els.addFormCard) els.addFormCard.style.display = "none";
    if (els.deleteCard) els.deleteCard.style.display = "block";
    if (els.resultsCard) els.resultsCard.style.display = "none";
    resetDeleteFields();
  }

  function resetForm() {
    if (!els) return;
    if (els.subject_id) { els.subject_id.value = ""; els.subject_id.disabled = false; }
    if (els.subject_code) els.subject_code.value = "";
    if (els.subject_name) els.subject_name.value = "";
    if (els.regulation) els.regulation.value = "";
    if (els.semester) els.semester.value = "";
    if (els.faculty_assign) els.faculty_assign.value = "";
    if (els.credits) els.credits.value = "";
  }

  function resetDeleteFields() {
    if (!els) return;
    if (els.del_subject_id) els.del_subject_id.value = "";
    if (els.del_subject_code) els.del_subject_code.value = "";
    if (els.del_subject_name) els.del_subject_name.value = "";
    if (els.del_regulation) els.del_regulation.value = "";
    if (els.del_semester) els.del_semester.value = "";
  }

  // ---------- Regulations ----------
  async function loadRegulations() {
    try {
      const data = await apiFetch("/get_regulations"); // expects array
      regulationsCache = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Failed to load regulations:", err);
      regulationsCache = [];
    }

    const targetSelects = [
      { sel: els.regulation, allowEmpty: true, emptyText: "-- Select --" },
      { sel: els.del_regulation, allowEmpty: true, emptyText: "-- Select --" },
      { sel: els.pickRegulation, allowEmpty: false, emptyText: "All" }
    ];

    targetSelects.forEach(cfg => {
      const sel = cfg.sel;
      if (!sel) return;
      sel.innerHTML = "";

      if (cfg.allowEmpty) {
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = cfg.emptyText;
        sel.appendChild(emptyOpt);
      } else {
        const allOpt = document.createElement("option");
        allOpt.value = "All";
        allOpt.textContent = cfg.emptyText || "All";
        sel.appendChild(allOpt);
      }

      regulationsCache.forEach(r => {
        const value = (typeof r === "string") ? r : (r.id ?? r.reg_id ?? r.code ?? "");
        const text = (typeof r === "string") ? r : (r.code ?? r.reg_id ?? r.id ?? String(r));
        const o = document.createElement("option");
        o.value = value;
        o.textContent = text;
        sel.appendChild(o);
      });
    });
  }

  // ---------- Form values ----------
  function getFormValues() {
    const semesterVal = els.semester && els.semester.value ? Number(els.semester.value) : NaN;
    const creditsVal = els.credits && els.credits.value ? Number(els.credits.value) : NaN;

    const subject = {
      subject_id: els.subject_id ? els.subject_id.value.trim() : "",
      subject_code: els.subject_code ? els.subject_code.value.trim() : "",
      subject_name: els.subject_name ? els.subject_name.value.trim() : "",
      semester: semesterVal,
      faculty_assign: els.faculty_assign ? els.faculty_assign.value.trim() : "",
      credits: creditsVal,
      regulation_id: els.regulation ? els.regulation.value : ""
    };

    if (!subject.subject_id || !subject.subject_code || !subject.subject_name) {
      alert("Please fill Subject ID, Code and Name.");
      return null;
    }
    if (!Number.isInteger(subject.semester) || subject.semester <= 0) {
      alert("Please select a valid Semester.");
      return null;
    }
    if (!subject.regulation_id) {
      alert("Please select a Regulation.");
      return null;
    }
    if (Number.isNaN(subject.credits)) {
      alert("Please enter Credits (number).");
      return null;
    }

    return subject;
  }

  // ---------- CRUD operations ----------
  async function doAddSubject() {
    if (isSubmitting) return; // prevent double submit
    const subject = getFormValues();
    if (!subject) return;
    isSubmitting = true;
    try {
      await apiFetch("/add_subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subject)
      });
      alert("Subject added.");
      if (els.addFormCard) els.addFormCard.style.display = "none";
      resetForm();
      await refreshCurrentTableIfVisible();
      await loadRegulations();
    } catch (err) {
      alert("Add failed: " + err.message);
    } finally {
      isSubmitting = false;
    }
  }

  async function doUpdateSubject() {
    if (isSubmitting) return;
    const subject = getFormValues();
    if (!subject) return;
    isSubmitting = true;
    try {
      await apiFetch("/update_subject", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subject)
      });
      alert("Subject updated.");
      if (els.addFormCard) els.addFormCard.style.display = "none";
      resetForm();
      await refreshCurrentTableIfVisible();
      await loadRegulations();
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      isSubmitting = false;
    }
  }

  async function doDeleteByInputs() {
    const id = els.del_subject_id ? els.del_subject_id.value.trim() : "";
    if (!id) { alert("Enter Subject ID to delete."); return; }
    if (!confirm("Delete " + id + "?")) return;
    try {
      await apiFetch(`/delete_subject/${encodeURIComponent(id)}`, { method: "DELETE" });
      alert("Deleted.");
      if (els.deleteCard) els.deleteCard.style.display = "none";
      resetDeleteFields();
      await refreshCurrentTableIfVisible();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }

  // ---------- Modal open/close and view ----------
  function openSemesterModal() {
    if (els.semesterModal) els.semesterModal.style.display = "block";
    loadRegulations().catch(e => console.error(e));
  }
  function closeSemesterModal() {
    if (els.semesterModal) els.semesterModal.style.display = "none";
  }
  window.closeSemesterModal = closeSemesterModal;

  async function viewBySemester() {
    const sem = (els.pickSemester && els.pickSemester.value) || "All";
    const reg = (els.pickRegulation && els.pickRegulation.value) || "All";
    if (els.semesterModal) els.semesterModal.style.display = "none";
    await loadAndRenderSubjects({ semester: sem, regulation: reg });
  }
  window.viewBySemester = viewBySemester;

  // ---------- Load & render subjects ----------
  async function loadAndRenderSubjects({ semester = "All", regulation = "All" } = {}) {
    try {
      const data = await apiFetch("/get_subjects");
      const subjects = Array.isArray(data) ? data : [];
      const filtered = subjects
        .filter(s => semester === "All" || String(s.semester) === String(semester))
        .filter(s => regulation === "All" || String(s.regulation_id) === String(regulation) || String(s.reg_name) === String(regulation) || String(s.regulation) === String(regulation));
      renderTable(filtered);
      if (els.resultsCard) els.resultsCard.style.display = "block";
    } catch (err) {
      alert("Error loading subjects: " + err.message);
    }
  }

  function renderTable(list) {
    if (!els.tableBody) return;
    els.tableBody.innerHTML = "";
    if (!Array.isArray(list) || list.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="8" style="text-align:center; color:#666; padding:18px;">No subjects found.</td>`;
      els.tableBody.appendChild(tr);
      return;
    }

    list.forEach(sub => {
      const tr = document.createElement("tr");

      const regulationDisplay = sub.reg_name ?? sub.regulation_id ?? sub.regulation ?? "";

      tr.innerHTML = `
        <td>${escapeHtml(sub.subject_id)}</td>
        <td>${escapeHtml(sub.subject_code)}</td>
        <td>${escapeHtml(sub.subject_name)}</td>
        <td>${escapeHtml(regulationDisplay)}</td>
        <td>${escapeHtml(String(sub.semester ?? ""))}</td>
        <td>${escapeHtml(sub.faculty_assign ?? "")}</td>
        <td>${escapeHtml(String(sub.credits ?? ""))}</td>
        <td class="actions"></td>
      `;

      const actionsCell = tr.querySelector("td.actions");
      const editBtn = document.createElement("button");
      editBtn.className = "btn-primary outline";
      editBtn.textContent = "Edit";
      editBtn.type = "button";
      editBtn.addEventListener("click", () => loadForEdit(sub));

      const delBtn = document.createElement("button");
      delBtn.className = "btn-danger";
      delBtn.textContent = "Delete";
      delBtn.type = "button";
      delBtn.addEventListener("click", () => deleteDirect(sub.subject_id));

      actionsCell.appendChild(editBtn);
      actionsCell.appendChild(delBtn);

      els.tableBody.appendChild(tr);
    });
  }

  // ---------- Edit / Delete direct ----------
  function loadForEdit(sub) {
    showUpdateMode();
    if (els.subject_id) els.subject_id.value = sub.subject_id;
    if (els.subject_code) els.subject_code.value = sub.subject_code;
    if (els.subject_name) els.subject_name.value = sub.subject_name;
    if (els.semester) els.semester.value = sub.semester;
    if (els.faculty_assign) els.faculty_assign.value = sub.faculty_assign ?? "";
    if (els.credits) els.credits.value = sub.credits ?? "";

    const candidate = sub.regulation_id ?? sub.reg_id ?? sub.reg_name ?? "";
    if (candidate && els.regulation) {
      const option = Array.from(els.regulation.options).find(o => o.value === String(candidate) || o.textContent === String(candidate));
      if (option) els.regulation.value = option.value;
    }
  }

  async function deleteDirect(id) {
    if (!confirm("Delete " + id + "?")) return;
    try {
      await apiFetch(`/delete_subject/${encodeURIComponent(id)}`, { method: "DELETE" });
      alert("Deleted.");
      await refreshCurrentTableIfVisible();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }

  async function refreshCurrentTableIfVisible() {
    if (els.resultsCard && els.resultsCard.style.display === "block") {
      const sem = els.pickSemester ? els.pickSemester.value : "All";
      const reg = els.pickRegulation ? els.pickRegulation.value : "All";
      return loadAndRenderSubjects({ semester: sem, regulation: reg });
    }
    return Promise.resolve();
  }

  // ---------- Events wiring ----------
  function wireEvents() {
    // Only wire once
    if (_eventsWired) return;
    _eventsWired = true;

    if (els.modeAdd) els.modeAdd.addEventListener("click", showAddMode);
    if (els.modeUpdate) els.modeUpdate.addEventListener("click", showUpdateMode);
    if (els.modeDelete) els.modeDelete.addEventListener("click", showDeleteMode);
    if (els.btnView) els.btnView.addEventListener("click", openSemesterModal);

    if (els.btnCancelForm) els.btnCancelForm.addEventListener("click", (e) => { e.preventDefault(); if (els.addFormCard) els.addFormCard.style.display = "none"; resetForm(); });
    if (els.btnCancelDelete) els.btnCancelDelete.addEventListener("click", (e) => { e.preventDefault(); if (els.deleteCard) els.deleteCard.style.display = "none"; resetDeleteFields(); });
    if (els.btnReset) els.btnReset.addEventListener("click", (e) => { e.preventDefault(); resetForm(); });

    if (els.formSubmit) els.formSubmit.addEventListener("click", async (e) => {
      e.preventDefault();
      if (currentMode === "add") await doAddSubject();
      else await doUpdateSubject();
    });

    if (els.btnDeleteSubmit) els.btnDeleteSubmit.addEventListener("click", (e) => { e.preventDefault(); doDeleteByInputs(); });
  }

  // ---------- INIT ----------
  async function init() {
    if (_initialized) {
      // already initialized — just refresh regs/table if desired
      try {
        await loadRegulations();
      } catch (e) { /* ignore */ }
      return;
    }
    _initialized = true;

    // grab DOM elements now (safer when injected by SPA)
    els = {
      // cards
      addFormCard: document.getElementById("add-form-card"),
      deleteCard: document.getElementById("delete-card"),
      resultsCard: document.getElementById("results-card"),

      // mode buttons & view
      modeAdd: document.getElementById("mode-add"),
      modeUpdate: document.getElementById("mode-update"),
      modeDelete: document.getElementById("mode-delete"),
      btnView: document.getElementById("btn-view"),

      // form controls
      formTitle: document.getElementById("form-title"),
      formSubmit: document.getElementById("form-submit"),
      btnReset: document.getElementById("btn-reset"),
      btnCancelForm: document.getElementById("btn-cancel-form"),

      // delete controls
      btnCancelDelete: document.getElementById("btn-cancel-delete"),
      btnDeleteSubmit: document.getElementById("btn-delete-submit"),

      // modal / filters
      semesterModal: document.getElementById("semester-modal"),
      pickRegulation: document.getElementById("pick_regulation"),
      pickSemester: document.getElementById("pick_semester"),

      // table
      tableBody: document.querySelector("#subjects-table tbody"),

      // form inputs
      subject_id: document.getElementById("subject_id"),
      subject_code: document.getElementById("subject_code"),
      subject_name: document.getElementById("subject_name"),
      regulation: document.getElementById("regulation"),
      semester: document.getElementById("semester"),
      faculty_assign: document.getElementById("faculty_assign"),
      credits: document.getElementById("credits"),

      // delete inputs
      del_subject_id: document.getElementById("del_subject_id"),
      del_subject_code: document.getElementById("del_subject_code"),
      del_subject_name: document.getElementById("del_subject_name"),
      del_regulation: document.getElementById("del_regulation"),
      del_semester: document.getElementById("del_semester"),
    };

    // basic sanity
    if (!els.addFormCard || !els.deleteCard || !els.resultsCard) {
      console.error("subject_management init: required DOM elements missing - make sure this HTML is loaded into the page.");
      // still wire what we can
    }

    wireEvents();
    await loadRegulations();
    showAddMode();
  }

  // Expose to SPA loader
  window.initSubjectManagement = init;

  // no auto-init here — SPA or page can call initSubjectManagement()
})();
