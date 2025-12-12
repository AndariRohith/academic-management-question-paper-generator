// Ensure this code runs only once
if (!window.regulationLoaded) {
  window.regulationLoaded = true;

  const API_BASE = "http://127.0.0.1:5002";
  let currentMode = "add";

  // Function to initialize the Regulation page after HTML is loaded
  function initRegulationPage() {
    const addFormCard = document.getElementById("add-form-card");
    const deleteCard = document.getElementById("delete-card");
    const resultsCard = document.getElementById("results-card");

    if (!addFormCard || !deleteCard || !resultsCard) return;

    // MODE SWITCHING
    document.getElementById("mode-add").onclick = switchToAddMode;
    document.getElementById("mode-update").onclick = switchToUpdateMode;
    document.getElementById("mode-delete").onclick = switchToDeleteMode;
    document.getElementById("btn-view").onclick = viewRegulations;

    // CANCEL AND RESET BUTTONS
    document.getElementById("btn-cancel-form").onclick = () => addFormCard.style.display = "none";
    document.getElementById("btn-cancel-delete").onclick = () => deleteCard.style.display = "none";
    document.getElementById("btn-reset").onclick = (e) => { e.preventDefault(); resetForm(); };

    // ADD / UPDATE
    document.getElementById("form-submit").onclick = async () => {
      const id = document.getElementById("reg_id").value.trim();
      const name = document.getElementById("reg_name").value.trim();
      if (!id || !name) { alert("ID and Name required."); return; }

      try {
        const res = await fetch(`${API_BASE}/${currentMode}_regulation`, {
          method: currentMode === "add" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reg_id: id, reg_name: name })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.msg);
        alert(currentMode === "add" ? "Regulation added" : "Regulation updated");
        addFormCard.style.display = "none";
        resetForm();
        viewRegulations();
      } catch (err) { alert(err.message); }
    };

    // DELETE
    document.getElementById("btn-delete-submit").onclick = async () => {
      const id = document.getElementById("del_reg_id").value.trim();
      if (!id) { alert("Provide Regulation ID."); return; }
      if (!confirm("Delete " + id + "?")) return;

      try {
        const res = await fetch(`${API_BASE}/delete_regulation/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.msg);
        alert("Deleted.");
        deleteCard.style.display = "none";
        viewRegulations();
      } catch (err) { alert(err.message); }
    };

    // RESET FORM FUNCTION
    function resetForm() {
      document.getElementById("reg_id").value = "";
      document.getElementById("reg_name").value = "";
      document.getElementById("reg_id").disabled = false;
    }

    // SWITCH MODES
    function switchToAddMode() {
      currentMode = "add";
      document.getElementById("form-title").innerText = "Add New Regulation";
      document.getElementById("form-submit").innerText = "Add Regulation";
      document.getElementById("reg_id").disabled = false;

      addFormCard.style.display = "block";
      deleteCard.style.display = "none";
      resultsCard.style.display = "none";
      resetForm();
    }

    function switchToUpdateMode() {
      currentMode = "update";
      document.getElementById("form-title").innerText = "Update Regulation";
      document.getElementById("form-submit").innerText = "Update Regulation";
      document.getElementById("reg_id").disabled = true;

      addFormCard.style.display = "block";
      deleteCard.style.display = "none";
      resultsCard.style.display = "none";
    }

    function switchToDeleteMode() {
      currentMode = "delete";
      addFormCard.style.display = "none";
      deleteCard.style.display = "block";
      resultsCard.style.display = "none";
      document.getElementById("del_reg_id").value = "";
    }

    // VIEW REGULATIONS
    async function viewRegulations() {
      try {
        const res = await fetch(`${API_BASE}/get_regulations`);
        const data = await res.json();
        const tbody = document.querySelector("#regulations-table tbody");
        tbody.innerHTML = "";
        data.forEach(r => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${r.reg_id}</td>
            <td>${r.reg_name}</td>
            <td class="actions">
              <button class="btn-primary outline edit-btn" data-reg='${JSON.stringify(r)}'>Edit</button>
              <button class="btn-danger delete-btn" data-id="${r.reg_id}">Delete</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
        resultsCard.style.display = "block";
      } catch (err) { alert("Error loading: " + err.message); }
    }

    // EVENT DELEGATION FOR DYNAMIC BUTTONS
    document.querySelector("#regulations-table tbody").addEventListener("click", async (e) => {
      if (e.target.classList.contains("edit-btn")) {
        const r = JSON.parse(e.target.dataset.reg);
        switchToUpdateMode();
        document.getElementById("reg_id").value = r.reg_id;
        document.getElementById("reg_name").value = r.reg_name;
        addFormCard.scrollIntoView();
      }

      if (e.target.classList.contains("delete-btn")) {
        const id = e.target.dataset.id;
        if (!confirm("Delete " + id + "?")) return;
        try {
          const res = await fetch(`${API_BASE}/delete_regulation/${id}`, { method: "DELETE" });
          const json = await res.json();
          if (!res.ok) throw new Error(json.msg);
          alert("Deleted.");
          viewRegulations();
        } catch (err) { alert(err.message); }
      }
    });
  }

  // Expose init function to dashboard
  window.initRegulationPage = initRegulationPage;
}
