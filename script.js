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
const savedCountEl = document.getElementById("savedCount");
const lastRecordEl = document.getElementById("lastRecord");
const formModal = document.getElementById("formModal");
const formModalTitle = document.getElementById("formModalTitle");
const closeFormModalBtn = document.getElementById("closeFormModalBtn");
const allRecordsModal = document.getElementById("allRecordsModal");
const closeAllRecordsBtn = document.getElementById("closeAllRecordsBtn");
const allRecordsTableContainer = document.getElementById("allRecordsTableContainer");

let records = loadRecords();
let activeRecord = null;
let editingRecord = null;

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

  const rows = visibleRecords
    .slice()
    .reverse()
    .map((record) => `
      <tr>
        <td data-label="Record">${escapeHtml(record.recordNumber)}</td>
        <td data-label="Customer">${escapeHtml(record.customerName)}</td>
        <td data-label="Phone">${escapeHtml(record.phoneNumber)}</td>
        <td data-label="Date">${escapeHtml(formatDate(record.recordDate))}</td>
        <td data-label="Garment">${escapeHtml(record.garmentType)}</td>
        <td data-label="Actions" class="action-buttons">
          <button type="button" class="action-button view" data-action="view" data-id="${record.id}" title="View record">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button type="button" class="action-button edit" data-action="edit" data-id="${record.id}" title="Edit record">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
          <button type="button" class="action-button delete" data-action="delete" data-id="${record.id}" title="Delete record">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M8 6V4h8v2"/></svg>
          </button>
        </td>
      </tr>
    `)
    .join("");

  recordsList.innerHTML = `
    <table class="records-table">
      <thead>
        <tr>
          <th>Record</th>
          <th>Customer</th>
          <th>Phone</th>
          <th>Date</th>
          <th>Garment</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
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

  const recordData = {
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

  if (editingRecord) {
    const updatedRecord = {
      ...editingRecord,
      ...recordData,
    };
    records = records.map((item) => (item.id === editingRecord.id ? updatedRecord : item));
    saveRecords();
    renderRecords();
    closeFormModal();
    showMessage(`Updated ${updatedRecord.recordNumber} successfully.`, "success");
  } else {
    const newRecord = {
      id: crypto.randomUUID(),
      recordNumber: generateRecordNumber(),
      ...recordData,
    };
    records.push(newRecord);
    saveRecords();
    renderRecords();
    resetForm();
    showMessage(`Saved ${newRecord.recordNumber} successfully.`, "success");
  }
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

  const action = button.getAttribute("data-action");
  if (action === "view") {
    openCardModal(record);
  }

  if (action === "edit") {
    openEditForm(record);
  }

  if (action === "delete") {
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
    editingRecord = null;
    if (formModalTitle) formModalTitle.textContent = "New Measurement";
    resetForm();
    formModal.classList.add("is-open");
    formModal.setAttribute("aria-hidden", "false");
  }
}

function populateFormFields(record) {
  document.getElementById("customerName").value = record.customerName;
  document.getElementById("phoneNumber").value = record.phoneNumber;
  document.getElementById("recordDate").value = record.recordDate;
  document.getElementById("garmentType").value = record.garmentType;
  document.getElementById("chest").value = record.measurements.chest;
  document.getElementById("waist").value = record.measurements.waist;
  document.getElementById("shoulder").value = record.measurements.shoulder;
  document.getElementById("sleeve").value = record.measurements.sleeve;
  document.getElementById("length").value = record.measurements.length;
  document.getElementById("neck").value = record.measurements.neck;
  document.getElementById("hip").value = record.measurements.hip;
  document.getElementById("inseam").value = record.measurements.inseam;
  document.getElementById("notes").value = record.notes;
}

function openEditForm(record) {
  if (formModal) {
    editingRecord = record;
    if (formModalTitle) formModalTitle.textContent = "Edit Measurement";
    populateFormFields(record);
    clearMessage();
    formModal.classList.add("is-open");
    formModal.setAttribute("aria-hidden", "false");
  }
}

function closeFormModal() {
  if (formModal) {
    formModal.classList.remove("is-open");
    formModal.setAttribute("aria-hidden", "true");
    editingRecord = null;
    if (formModalTitle) formModalTitle.textContent = "New Measurement";
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
        <td data-label="Record">${escapeHtml(r.recordNumber)}</td>
        <td data-label="Customer">${escapeHtml(r.customerName)}</td>
        <td data-label="Phone">${escapeHtml(r.phoneNumber)}</td>
        <td data-label="Date">${escapeHtml(formatDate(r.recordDate))}</td>
        <td data-label="Garment">${escapeHtml(r.garmentType)}</td>
        <td data-label="Card"><button data-id="${r.id}" class="secondary view-btn">View Card</button></td>
        <td data-label="Remove"><button data-id="${r.id}" class="primary delete-btn">Delete</button></td>
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
if (closeAllRecordsBtn) closeAllRecordsBtn.addEventListener('click', closeAllRecordsModal);

// click overlay to close
if (formModal) formModal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeFormModal(); });
if (allRecordsModal) allRecordsModal.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeAllRecordsModal(); });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

renderRecords();
