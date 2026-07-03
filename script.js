const STORAGE_KEY = "stitchmate-records";
const form = document.getElementById("customerForm");
const recordsList = document.getElementById("recordsList");
const searchInput = document.getElementById("searchInput");
const exportBtn = document.getElementById("exportBtn");
const clearFormBtn = document.getElementById("clearFormBtn");
const summaryPill = document.getElementById("summaryPill");
const messageArea = document.getElementById("formMessage");
const cardModal = document.getElementById("cardModal");
const cardPreview = document.getElementById("cardPreview");
const closeModalBtn = document.getElementById("closeModalBtn");
const printCardBtn = document.getElementById("printCardBtn");
const modalTitle = document.getElementById("modalTitle");

// Dashboard and modals elements
const newMeasurementBtn = document.getElementById("newMeasurementBtn");
const exportTopBtn = document.getElementById("exportTopBtn");
const savedRecordsCard = document.getElementById("savedRecordsCard");
const savedCountEl = document.getElementById("savedCount");
const lastRecordEl = document.getElementById("lastRecord");
const formModal = document.getElementById("formModal");
const closeFormModalBtn = document.getElementById("closeFormModalBtn");
const allRecordsModal = document.getElementById("allRecordsModal");
const closeAllRecordsBtn = document.getElementById("closeAllRecordsBtn");
const allRecordsTableContainer = document.getElementById("allRecordsTableContainer");

let records = loadRecords();
let activeRecord = null;

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Unable to load records", error);
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function generateRecordNumber() {
  const existing = records
    .map((record) => Number(record.recordNumber?.split("-")[1]))
    .filter((value) => Number.isFinite(value));
  const next = existing.length ? Math.max(...existing) + 1 : 1;
  return `SMT-${String(next).padStart(3, "0")}`;
}

function showMessage(text, type = "success") {
  messageArea.textContent = text;
  messageArea.className = `message ${type}`;
}

function clearMessage() {
  messageArea.textContent = "";
  messageArea.className = "message";
}

function resetForm() {
  form.reset();
  clearMessage();
}

function validateMeasurements() {
  const measurements = [
    "chest",
    "waist",
    "shoulder",
    "sleeve",
    "length",
    "neck",
    "hip",
    "inseam",
  ];
  const decimalPattern = /^\d+(\.\d)?$/;

  for (const field of measurements) {
    const value = document.getElementById(field).value.trim();
    if (!decimalPattern.test(value)) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} must be a numeric inch value with up to one decimal place.`;
    }
  }

  return null;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderRecords() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const visibleRecords = records.filter((record) => {
    const haystack = `${record.customerName} ${record.phoneNumber}`.toLowerCase();
    return haystack.includes(searchTerm);
  });

  summaryPill.textContent = `${visibleRecords.length} record${visibleRecords.length === 1 ? "" : "s"}`;
  if (savedCountEl) savedCountEl.textContent = records.length;
  if (lastRecordEl) lastRecordEl.textContent = records.length ? records[records.length - 1].recordNumber : "—";

  if (!visibleRecords.length) {
    recordsList.innerHTML = '<div class="empty-state">No matching records yet. Save a new measurement card to begin.</div>';
    return;
  }

  recordsList.innerHTML = visibleRecords
    .slice()
    .reverse()
    .map((record) => `
      <article class="record-card">
        <div class="record-card-header">
          <div>
            <strong>${escapeHtml(record.customerName)}</strong>
            <div class="record-meta">${escapeHtml(record.recordNumber)} • ${escapeHtml(record.garmentType)} • ${escapeHtml(formatDate(record.recordDate))}</div>
          </div>
          <div class="record-actions">
            <button type="button" class="secondary" data-action="view" data-id="${record.id}">View Card</button>
            <button type="button" class="primary" data-action="delete" data-id="${record.id}">Delete</button>
          </div>
        </div>
        <div class="record-meta">Phone: ${escapeHtml(record.phoneNumber)}</div>
      </article>
    `)
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function openCardModal(record) {
  activeRecord = record;
  modalTitle.textContent = `${record.customerName} — ${record.recordNumber}`;
  cardPreview.innerHTML = `
    <div class="card-header">
      <div>
        <h3>StitchMate Tailors</h3>
        <p>Measurement Card</p>
      </div>
      <div>
        <p><strong>Record No:</strong> ${escapeHtml(record.recordNumber)}</p>
        <p><strong>Date:</strong> ${escapeHtml(formatDate(record.recordDate))}</p>
      </div>
    </div>

    <div class="card-grid">
      <div><strong>Customer:</strong> ${escapeHtml(record.customerName)}</div>
      <div><strong>Phone:</strong> ${escapeHtml(record.phoneNumber)}</div>
      <div><strong>Garment:</strong> ${escapeHtml(record.garmentType)}</div>
      <div><strong>Record Date:</strong> ${escapeHtml(formatDate(record.recordDate))}</div>
    </div>

    <table class="measurement-table">
      <thead>
        <tr>
          <th>Measurement</th>
          <th>Value (in)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Chest</td><td>${escapeHtml(record.measurements.chest)}</td></tr>
        <tr><td>Waist</td><td>${escapeHtml(record.measurements.waist)}</td></tr>
        <tr><td>Shoulder</td><td>${escapeHtml(record.measurements.shoulder)}</td></tr>
        <tr><td>Sleeve</td><td>${escapeHtml(record.measurements.sleeve)}</td></tr>
        <tr><td>Length</td><td>${escapeHtml(record.measurements.length)}</td></tr>
        <tr><td>Neck</td><td>${escapeHtml(record.measurements.neck)}</td></tr>
        <tr><td>Hip</td><td>${escapeHtml(record.measurements.hip)}</td></tr>
        <tr><td>Inseam</td><td>${escapeHtml(record.measurements.inseam)}</td></tr>
      </tbody>
    </table>

    <div>
      <h4>Notes</h4>
      <div class="notes-box">${escapeHtml(record.notes)}</div>
    </div>
  `;
  cardModal.classList.add("is-open");
  cardModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  cardModal.classList.remove("is-open");
  cardModal.setAttribute("aria-hidden", "true");
  activeRecord = null;
}

function exportToCsv() {
  const headers = [
    "record number",
    "customer name",
    "phone number",
    "record date",
    "garment type",
    "chest",
    "waist",
    "shoulder",
    "sleeve",
    "length",
    "neck",
    "hip",
    "inseam",
    "notes",
  ];

  const rows = records.map((record) => [
    record.recordNumber,
    record.customerName,
    record.phoneNumber,
    record.recordDate,
    record.garmentType,
    record.measurements.chest,
    record.measurements.waist,
    record.measurements.shoulder,
    record.measurements.sleeve,
    record.measurements.length,
    record.measurements.neck,
    record.measurements.hip,
    record.measurements.inseam,
    record.notes,
  ]);

  const csvRows = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stitchmate-records.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "").replace(/\r?\n/g, " ");
  return /[",]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearMessage();

  const requiredFields = [
    ["customerName", "Customer name"],
    ["phoneNumber", "Phone number"],
    ["recordDate", "Record date"],
    ["garmentType", "Garment type"],
  ];

  for (const [fieldId, label] of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      showMessage(`${label} is required.`, "error");
      field.focus();
      return;
    }
  }

  const measurementError = validateMeasurements();
  if (measurementError) {
    showMessage(measurementError, "error");
    return;
  }

  const notes = document.getElementById("notes").value.trim();
  if (notes.length < 120) {
    showMessage("Notes must be at least 120 characters.", "error");
    return;
  }

  const newRecord = {
    id: crypto.randomUUID(),
    recordNumber: generateRecordNumber(),
    customerName: document.getElementById("customerName").value.trim(),
    phoneNumber: document.getElementById("phoneNumber").value.trim(),
    recordDate: document.getElementById("recordDate").value,
    garmentType: document.getElementById("garmentType").value,
    measurements: {
      chest: document.getElementById("chest").value,
      waist: document.getElementById("waist").value,
      shoulder: document.getElementById("shoulder").value,
      sleeve: document.getElementById("sleeve").value,
      length: document.getElementById("length").value,
      neck: document.getElementById("neck").value,
      hip: document.getElementById("hip").value,
      inseam: document.getElementById("inseam").value,
    },
    notes,
  };

  records.push(newRecord);
  saveRecords();
  renderRecords();
  resetForm();
  showMessage(`Saved ${newRecord.recordNumber} successfully.`, "success");
});

clearFormBtn.addEventListener("click", () => {
  resetForm();
});

searchInput.addEventListener("input", renderRecords);
exportBtn.addEventListener("click", exportToCsv);

recordsList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const recordId = button.getAttribute("data-id");
  const record = records.find((item) => item.id === recordId);
  if (!record) return;

  if (button.getAttribute("data-action") === "view") {
    openCardModal(record);
  }

  if (button.getAttribute("data-action") === "delete") {
    const confirmed = window.confirm(`Delete record ${record.recordNumber} for ${record.customerName}?`);
    if (!confirmed) return;
    records = records.filter((item) => item.id !== record.id);
    saveRecords();
    renderRecords();
    showMessage(`Deleted ${record.recordNumber}.`, "success");
  }
});

closeModalBtn.addEventListener("click", closeModal);
printCardBtn.addEventListener("click", () => window.print());
cardModal.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close")) {
    closeModal();
  }
});

// Modal controls for form and all-records
function openFormModal() {
  if (formModal) {
    formModal.classList.add("is-open");
    formModal.setAttribute("aria-hidden", "false");
  }
}

function closeFormModal() {
  if (formModal) {
    formModal.classList.remove("is-open");
    formModal.setAttribute("aria-hidden", "true");
  }
}

function openAllRecordsModal() {
  if (allRecordsModal) {
    renderAllRecords();
    allRecordsModal.classList.add("is-open");
    allRecordsModal.setAttribute("aria-hidden", "false");
  }
}

function closeAllRecordsModal() {
  if (allRecordsModal) {
    allRecordsModal.classList.remove("is-open");
    allRecordsModal.setAttribute("aria-hidden", "true");
  }
}

function renderAllRecords() {
  if (!allRecordsTableContainer) return;
  if (!records.length) {
    allRecordsTableContainer.innerHTML = '<div class="empty-state">No records saved.</div>';
    return;
  }

  const rows = records
    .slice()
    .reverse()
    .map((r) => `
      <tr>
        <td>${escapeHtml(r.recordNumber)}</td>
        <td>${escapeHtml(r.customerName)}</td>
        <td>${escapeHtml(r.phoneNumber)}</td>
        <td>${escapeHtml(formatDate(r.recordDate))}</td>
        <td>${escapeHtml(r.garmentType)}</td>
        <td><button data-id="${r.id}" class="secondary view-btn">View Card</button></td>
        <td><button data-id="${r.id}" class="primary delete-btn">Delete</button></td>
      </tr>
    `)
    .join("");

  allRecordsTableContainer.innerHTML = `
    <div style="overflow:auto">
    <table class="measurement-table" style="width:100%">
      <thead>
        <tr>
          <th>Record</th>
          <th>Customer</th>
          <th>Phone</th>
          <th>Date</th>
          <th>Garment</th>
          <th>Card</th>
          <th>Remove</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    </div>
  `;

  // attach handlers
  allRecordsTableContainer.querySelectorAll('.view-btn').forEach((b) => {
    b.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const rec = records.find(r => r.id === id);
      if (rec) {
        closeAllRecordsModal();
        openCardModal(rec);
      }
    });
  });

  allRecordsTableContainer.querySelectorAll('.delete-btn').forEach((b) => {
    b.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const rec = records.find(r => r.id === id);
      if (!rec) return;
      if (confirm(`Delete record ${rec.recordNumber} for ${rec.customerName}?`)) {
        records = records.filter((item) => item.id !== id);
        saveRecords();
        renderRecords();
        renderAllRecords();
        showMessage(`Deleted ${rec.recordNumber}.`, 'success');
      }
    });
  });
}

// Hook up UI buttons
if (newMeasurementBtn) newMeasurementBtn.addEventListener('click', openFormModal);
if (closeFormModalBtn) closeFormModalBtn.addEventListener('click', closeFormModal);
if (savedRecordsCard) savedRecordsCard.addEventListener('click', openAllRecordsModal);
if (closeAllRecordsBtn) closeAllRecordsBtn.addEventListener('click', closeAllRecordsModal);
if (exportTopBtn) exportTopBtn.addEventListener('click', exportToCsv);

// click overlay to close
if (formModal) formModal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeFormModal(); });
if (allRecordsModal) allRecordsModal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeAllRecordsModal(); });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

renderRecords();
