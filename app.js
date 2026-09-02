/**
 * VARNA BANKER - Pawn & Gold Loan Management System Logic
 * Full backwards compatibility with loan_entries.json schema
 */

const STORAGE_KEY = 'varna_banker_loan_entries';
let loanRecords = [];
let currentImageBase64 = '';
let activeViewRecord = null;

// Initial Sample Seed Data if local storage is empty
const SAMPLE_RECORDS = [
  {
    "Serial Number": "1001",
    "Series Code": "GLD-2026",
    "Date (DD-MM-YYYY)": "01-08-2026",
    "Customer Name": "Rajesh Sharma",
    "Address": "42, MG Road, Near Central Market, Bengaluru",
    "Phone Number": "9876543210",
    "Item": "22K Gold Necklace with Emerald",
    "Weight": "45.80 g",
    "Amount": "180000",
    "Rate (in ₹)": "2.00",
    "Days": "32",
    "Duration": "0 years 1 months 2 days",
    "Interest Amount": "3840",
    "Closing Date": "02-09-2026",
    "Closing Amount": "183840",
    "Vendor": "Self",
    "Remarks": "Hallmark 916 Stamped, Mint Condition",
    "Image Path": "assets/samples/necklace.jpg",
    "Status": "Active"
  },
  {
    "Serial Number": "1002",
    "Series Code": "GLD-2026",
    "Date (DD-MM-YYYY)": "15-07-2026",
    "Customer Name": "Priya Ananth",
    "Address": "18, Royal Palms Layout, Mysuru",
    "Phone Number": "9448123456",
    "Item": "Traditional Antique Gold Bangles (Set of 4)",
    "Weight": "32.40 g",
    "Amount": "125000",
    "Rate (in ₹)": "1.75",
    "Days": "49",
    "Duration": "0 years 1 months 19 days",
    "Interest Amount": "3573",
    "Closing Date": "02-09-2026",
    "Closing Amount": "128573",
    "Vendor": "Agent Suresh",
    "Remarks": "Tested for 22K Purity",
    "Image Path": "assets/samples/bangles.jpg",
    "Status": "Active"
  }
];

// Initialize App on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Load Saved Records or Seed Defaults
  loadRecords();

  // Set default dates in form (Start Date = Today, Closing Date = Today + 30 days)
  setDefaultDates();

  // Initial Calculation & Dashboard Render
  calculateInterest();
  renderDashboard();
  renderRecordsTable();
});

/* ==========================================================================
   NAVIGATION & THEME TOGGLE
   ========================================================================== */

function switchTab(tabId) {
  document.querySelectorAll('.tab-page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

  const targetPage = document.getElementById(`tab-${tabId}`);
  const targetNav = document.getElementById(`nav-${tabId}`);

  if (targetPage) targetPage.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'records') renderRecordsTable();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);

  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.setAttribute('data-lucide', newTheme === 'light' ? 'sun' : 'moon');
    lucide.createIcons();
  }
}

/* ==========================================================================
   DATA STORAGE ENGINE
   ========================================================================== */

function loadRecords() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      loanRecords = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse local storage records:', e);
      loanRecords = [...SAMPLE_RECORDS];
    }
  } else {
    loanRecords = [...SAMPLE_RECORDS];
    saveRecordsToStorage();
  }
}

function saveRecordsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loanRecords));
}

/* ==========================================================================
   INTEREST & DURATION CALCULATION ENGINE
   ========================================================================== */

function setDefaultDates() {
  const today = new Date();
  const dateStr = formatDateToInput(today);
  
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 30);
  const closingStr = formatDateToInput(futureDate);

  document.getElementById('field-date').value = dateStr;
  document.getElementById('field-closing-date').value = closingStr;

  // Auto Serial Number Suggestion
  const nextSerial = loanRecords.length > 0 ? (Math.max(...loanRecords.map(r => parseInt(r["Serial Number"] || 0))) + 1) : 1001;
  document.getElementById('field-serial').value = nextSerial;
}

function formatDateToInput(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatInputToDDMMYYYY(inputVal) {
  if (!inputVal) return '';
  const parts = inputVal.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return inputVal;
}

function parseDDMMYYYYtoDate(dateStr) {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date(dateStr);
}

function calculateInterest(forceRecalc = false) {
  const amountVal = parseFloat(document.getElementById('field-amount').value) || 0;
  const rateVal = parseFloat(document.getElementById('field-rate').value) || 0;
  const startDateVal = document.getElementById('field-date').value;
  const closingDateVal = document.getElementById('field-closing-date').value;

  if (!startDateVal || !closingDateVal) {
    updateCalcUI(0, '0 years 0 months 0 days', 0, 0);
    return;
  }

  const d1 = new Date(startDateVal);
  const d2 = new Date(closingDateVal);

  const diffTime = d2.getTime() - d1.getTime();
  const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remDays = (days % 365) % 30;

  const durationText = `${years} years ${months} months ${remDays} days`;

  // Formula matching Python main.py: round((amount * rate * days) / (100 * 30))
  const interest = Math.round((amountVal * rateVal * days) / (100 * 30));
  const closingAmount = Math.round(amountVal + interest);

  updateCalcUI(days, durationText, interest, closingAmount);
}

function updateCalcUI(days, durationText, interest, closingAmount) {
  document.getElementById('calc-days').innerText = days;
  document.getElementById('calc-duration').innerText = durationText;
  document.getElementById('calc-interest').innerText = `₹${interest.toLocaleString('en-IN')}`;
  document.getElementById('calc-closing').innerText = `₹${closingAmount.toLocaleString('en-IN')}`;
}

/* ==========================================================================
   IMAGE HANDLING
   ========================================================================== */

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    currentImageBase64 = e.target.result;
    showImagePreview(currentImageBase64);
  };
  reader.readAsDataURL(file);
}

function loadSamplePhoto(type) {
  const samplePath = type === 'necklace' ? 'assets/samples/necklace.jpg' : 'assets/samples/bangles.jpg';
  currentImageBase64 = samplePath;
  showImagePreview(samplePath);
}

function showImagePreview(src) {
  const img = document.getElementById('image-preview');
  const emptyBox = document.getElementById('empty-preview');
  const btnClear = document.getElementById('btn-clear-image');

  img.src = src;
  img.style.display = 'block';
  emptyBox.style.display = 'none';
  btnClear.style.display = 'inline-flex';
}

function clearImage() {
  currentImageBase64 = '';
  const img = document.getElementById('image-preview');
  const emptyBox = document.getElementById('empty-preview');
  const btnClear = document.getElementById('btn-clear-image');
  const fileInput = document.getElementById('field-image-file');

  img.src = '';
  img.style.display = 'none';
  emptyBox.style.display = 'flex';
  btnClear.style.display = 'none';
  if (fileInput) fileInput.value = '';
}

/* ==========================================================================
   FORM SUBMISSION & RECORD SAVING
   ========================================================================== */

function handleFormSubmit(event) {
  event.preventDefault();

  const startDateStr = formatInputToDDMMYYYY(document.getElementById('field-date').value);
  const closingDateStr = formatInputToDDMMYYYY(document.getElementById('field-closing-date').value);

  const days = document.getElementById('calc-days').innerText;
  const duration = document.getElementById('calc-duration').innerText;
  const interestRaw = document.getElementById('calc-interest').innerText.replace(/[₹,]/g, '');
  const closingRaw = document.getElementById('calc-closing').innerText.replace(/[₹,]/g, '');

  const newRecord = {
    "Serial Number": document.getElementById('field-serial').value,
    "Series Code": document.getElementById('field-series').value || "GLD-2026",
    "Date (DD-MM-YYYY)": startDateStr,
    "Customer Name": document.getElementById('field-customer').value,
    "Address": document.getElementById('field-address').value || "",
    "Phone Number": document.getElementById('field-phone').value || "",
    "Item": document.getElementById('field-item').value,
    "Weight": document.getElementById('field-weight').value || "0 g",
    "Amount": document.getElementById('field-amount').value,
    "Rate (in ₹)": document.getElementById('field-rate').value,
    "Days": days,
    "Duration": duration,
    "Interest Amount": interestRaw,
    "Closing Date": closingDateStr,
    "Closing Amount": closingRaw,
    "Vendor": document.getElementById('field-vendor').value || "Self",
    "Remarks": document.getElementById('field-remarks').value || "",
    "Image Path": currentImageBase64 || "",
    "Status": "Active"
  };

  loanRecords.unshift(newRecord);
  saveRecordsToStorage();

  alert(`Loan Record Saved Successfully!\nCustomer: ${newRecord["Customer Name"]}\nAmount: ₹${newRecord["Amount"]}`);

  resetForm();
  switchTab('dashboard');
}

function resetForm() {
  document.getElementById('loan-form').reset();
  clearImage();
  setDefaultDates();
  calculateInterest();
}

/* ==========================================================================
   DASHBOARD & TABLE RENDERING
   ========================================================================== */

function renderDashboard() {
  let totalAmount = 0;
  let totalInterest = 0;
  let totalWeightGrams = 0;
  let activeCount = 0;

  loanRecords.forEach(r => {
    totalAmount += parseFloat(r["Amount"]) || 0;
    totalInterest += parseFloat(r["Interest Amount"]) || 0;
    if (r["Status"] !== 'Settled') activeCount++;

    const wMatch = (r["Weight"] || "").match(/[\d.]+/);
    if (wMatch) {
      totalWeightGrams += parseFloat(wMatch[0]);
    }
  });

  document.getElementById('stat-total-amount').innerText = `₹${totalAmount.toLocaleString('en-IN')}`;
  document.getElementById('stat-total-interest').innerText = `₹${totalInterest.toLocaleString('en-IN')}`;
  document.getElementById('stat-total-count').innerText = loanRecords.length;
  document.getElementById('stat-active-count').innerText = `${activeCount} Active / ${loanRecords.length - activeCount} Settled`;
  document.getElementById('stat-total-weight').innerText = `${totalWeightGrams.toFixed(2)} g`;

  // Render Recent Table (Last 5)
  const tbody = document.getElementById('recent-table-body');
  tbody.innerHTML = '';

  const recent = loanRecords.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 20px;">No loan records found. Click "New Loan Entry" to add one.</td></tr>`;
    return;
  }

  recent.forEach((rec, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${rec["Series Code"] || ""}-${rec["Serial Number"]}</strong></td>
      <td>${rec["Customer Name"]}</td>
      <td>${rec["Item"]} (${rec["Weight"] || 'N/A'})</td>
      <td>${rec["Date (DD-MM-YYYY)"]}</td>
      <td><strong>₹${parseFloat(rec["Amount"] || 0).toLocaleString('en-IN')}</strong></td>
      <td>₹${rec["Rate (in ₹)"]}/mo</td>
      <td class="emerald">₹${parseFloat(rec["Interest Amount"] || 0).toLocaleString('en-IN')}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="viewRecordDetail(${idx})">
          <i data-lucide="eye"></i> View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

function handleQuickSearch(query) {
  if (!query) {
    renderDashboard();
    return;
  }
  const filtered = loanRecords.filter(r => 
    r["Customer Name"].toLowerCase().includes(query.toLowerCase()) ||
    (r["Phone Number"] && r["Phone Number"].includes(query)) ||
    r["Serial Number"].includes(query) ||
    r["Item"].toLowerCase().includes(query.toLowerCase())
  );

  const tbody = document.getElementById('recent-table-body');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 20px;">No matching records found for "${query}".</td></tr>`;
    return;
  }

  filtered.forEach((rec, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${rec["Series Code"] || ""}-${rec["Serial Number"]}</strong></td>
      <td>${rec["Customer Name"]}</td>
      <td>${rec["Item"]} (${rec["Weight"] || 'N/A'})</td>
      <td>${rec["Date (DD-MM-YYYY)"]}</td>
      <td><strong>₹${parseFloat(rec["Amount"] || 0).toLocaleString('en-IN')}</strong></td>
      <td>₹${rec["Rate (in ₹)"]}/mo</td>
      <td class="emerald">₹${parseFloat(rec["Interest Amount"] || 0).toLocaleString('en-IN')}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="viewRecordDetail(${loanRecords.indexOf(rec)})">
          <i data-lucide="eye"></i> View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

function renderRecordsTable() {
  const searchQuery = document.getElementById('records-search-input').value.toLowerCase().trim();
  const statusFilter = document.getElementById('filter-status').value;
  const sortBy = document.getElementById('sort-by').value;

  let records = [...loanRecords];

  // Search Filter
  if (searchQuery) {
    records = records.filter(r => 
      r["Customer Name"].toLowerCase().includes(searchQuery) ||
      (r["Phone Number"] && r["Phone Number"].includes(searchQuery)) ||
      r["Serial Number"].toLowerCase().includes(searchQuery) ||
      r["Item"].toLowerCase().includes(searchQuery)
    );
  }

  // Status Filter
  if (statusFilter === 'active') {
    records = records.filter(r => r["Status"] !== 'Settled');
  } else if (statusFilter === 'settled') {
    records = records.filter(r => r["Status"] === 'Settled');
  }

  // Sorting
  records.sort((a, b) => {
    if (sortBy === 'amount-desc') return parseFloat(b["Amount"]) - parseFloat(a["Amount"]);
    if (sortBy === 'amount-asc') return parseFloat(a["Amount"]) - parseFloat(b["Amount"]);
    if (sortBy === 'name-asc') return a["Customer Name"].localeCompare(b["Customer Name"]);
    if (sortBy === 'date-asc') return parseDDMMYYYYtoDate(a["Date (DD-MM-YYYY)"]) - parseDDMMYYYYtoDate(b["Date (DD-MM-YYYY)"]);
    // default date-desc
    return parseDDMMYYYYtoDate(b["Date (DD-MM-YYYY)"]) - parseDDMMYYYYtoDate(a["Date (DD-MM-YYYY)"]);
  });

  const tbody = document.getElementById('records-table-body');
  tbody.innerHTML = '';

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">No loan records matching your criteria.</td></tr>`;
    return;
  }

  records.forEach(rec => {
    const originalIndex = loanRecords.indexOf(rec);
    const tr = document.createElement('tr');
    const isSettled = rec["Status"] === 'Settled';

    tr.innerHTML = `
      <td><strong>${rec["Series Code"] || ""}-${rec["Serial Number"]}</strong></td>
      <td>${rec["Customer Name"]}</td>
      <td>${rec["Phone Number"] || '-'}</td>
      <td>${rec["Item"]}</td>
      <td>${rec["Weight"] || '-'}</td>
      <td><strong>₹${parseFloat(rec["Amount"] || 0).toLocaleString('en-IN')}</strong></td>
      <td class="emerald">₹${parseFloat(rec["Interest Amount"] || 0).toLocaleString('en-IN')}</td>
      <td>${rec["Closing Date"]}</td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-outline btn-sm" onclick="viewRecordDetail(${originalIndex})" title="View Details">
            <i data-lucide="eye"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openPrintReceiptModal(${originalIndex})" title="Print Pawn Ticket">
            <i data-lucide="printer"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteRecord(${originalIndex})" title="Delete Record">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

/* ==========================================================================
   MODAL & DETAIL INSPECTION
   ========================================================================== */

function viewRecordDetail(index) {
  const rec = loanRecords[index];
  if (!rec) return;

  activeViewRecord = rec;

  document.getElementById('modal-serial-title').innerText = `Loan Record #${rec["Series Code"] || ""}-${rec["Serial Number"]}`;
  document.getElementById('modal-date-subtitle').innerText = `Pawned on ${rec["Date (DD-MM-YYYY)"]} | Closing: ${rec["Closing Date"]}`;

  const body = document.getElementById('modal-record-body');
  
  const photoHTML = rec["Image Path"] ? 
    `<div style="text-align:center; margin-bottom: 16px;">
      <img src="${rec["Image Path"]}" alt="Collateral" style="max-width: 100%; max-height: 220px; border-radius: 12px; border: 1px solid var(--border-color); object-fit: cover;">
     </div>` : '';

  body.innerHTML = `
    ${photoHTML}
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.92rem;">
      <div><strong>Customer Name:</strong> ${rec["Customer Name"]}</div>
      <div><strong>Phone Number:</strong> ${rec["Phone Number"] || 'N/A'}</div>
      <div style="grid-column: span 2;"><strong>Address:</strong> ${rec["Address"] || 'N/A'}</div>
      <div><strong>Item Description:</strong> ${rec["Item"]}</div>
      <div><strong>Weight:</strong> ${rec["Weight"] || 'N/A'}</div>
      <div><strong>Principal Amount:</strong> ₹${parseFloat(rec["Amount"]).toLocaleString('en-IN')}</div>
      <div><strong>Monthly Rate:</strong> ₹${rec["Rate (in ₹)"]} / ₹100</div>
      <div><strong>Elapsed Duration:</strong> ${rec["Duration"]} (${rec["Days"]} days)</div>
      <div><strong>Accrued Interest:</strong> ₹${parseFloat(rec["Interest Amount"]).toLocaleString('en-IN')}</div>
      <div style="grid-column: span 2; padding: 10px; background: rgba(245, 158, 11, 0.15); border-radius: 8px; border: 1px solid var(--gold-glow); text-align: center;">
        <strong style="color: var(--gold-primary); font-size: 1.1rem;">Total Closing Amount: ₹${parseFloat(rec["Closing Amount"]).toLocaleString('en-IN')}</strong>
      </div>
      <div><strong>Vendor/Ref:</strong> ${rec["Vendor"] || 'Self'}</div>
      <div><strong>Remarks:</strong> ${rec["Remarks"] || 'None'}</div>
    </div>
  `;

  document.getElementById('view-record-modal').classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function deleteRecord(index) {
  const rec = loanRecords[index];
  if (!rec) return;

  if (confirm(`Are you sure you want to delete loan entry for ${rec["Customer Name"]} (Serial #${rec["Serial Number"]})?`)) {
    loanRecords.splice(index, 1);
    saveRecordsToStorage();
    renderDashboard();
    renderRecordsTable();
  }
}

/* ==========================================================================
   PRINTABLE PAWN RECEIPT VOUCHER
   ========================================================================== */

function openPrintReceiptModal(index) {
  const rec = loanRecords[index];
  if (!rec) return;

  activeViewRecord = rec;

  document.getElementById('rec-serial').innerText = rec["Serial Number"];
  document.getElementById('rec-series').innerText = rec["Series Code"] || "GLD-2026";
  document.getElementById('rec-date').innerText = rec["Date (DD-MM-YYYY)"];
  document.getElementById('rec-customer').innerText = rec["Customer Name"];
  document.getElementById('rec-phone').innerText = rec["Phone Number"] || "-";
  document.getElementById('rec-vendor').innerText = rec["Vendor"] || "Self";
  document.getElementById('rec-address').innerText = rec["Address"] || "N/A";

  document.getElementById('rec-item').innerText = rec["Item"];
  document.getElementById('rec-weight').innerText = rec["Weight"] || "-";
  document.getElementById('rec-rate').innerText = `₹${rec["Rate (in ₹)"]} / mo`;
  document.getElementById('rec-amount').innerText = `₹${parseFloat(rec["Amount"]).toLocaleString('en-IN')}`;

  document.getElementById('rec-duration').innerText = `${rec["Duration"]} (${rec["Days"]} days)`;
  document.getElementById('rec-interest').innerText = `₹${parseFloat(rec["Interest Amount"]).toLocaleString('en-IN')}`;
  document.getElementById('rec-closing').innerText = `₹${parseFloat(rec["Closing Amount"]).toLocaleString('en-IN')}`;

  const imgBox = document.getElementById('rec-image-box');
  const imgEl = document.getElementById('rec-image');

  if (rec["Image Path"]) {
    imgEl.src = rec["Image Path"];
    imgBox.style.display = 'block';
  } else {
    imgBox.style.display = 'none';
  }

  document.getElementById('print-modal').classList.add('active');
}

function printReceiptFromModal() {
  if (!activeViewRecord) return;
  closeModal('view-record-modal');
  openPrintReceiptModal(loanRecords.indexOf(activeViewRecord));
}

function triggerPrint() {
  window.print();
}

/* ==========================================================================
   IMPORT & EXPORT (BACKWARDS COMPATIBILITY WITH loan_entries.json)
   ========================================================================== */

function exportDataJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(loanRecords, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "loan_entries.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function exportDataCSV() {
  if (loanRecords.length === 0) {
    alert("No records to export.");
    return;
  }

  const headers = Object.keys(loanRecords[0]);
  let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

  loanRecords.forEach(rec => {
    const row = headers.map(h => `"${(rec[h] || '').toString().replace(/"/g, '""')}"`).join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "varna_banker_loan_records.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function importDataJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        loanRecords = imported;
        saveRecordsToStorage();
        renderDashboard();
        renderRecordsTable();
        alert(`Successfully imported ${imported.length} loan records from JSON!`);
      } else {
        alert("Invalid JSON format. Expected an array of loan entry objects.");
      }
    } catch (err) {
      alert("Error reading JSON file: " + err.message);
    }
  };
  reader.readAsText(file);
}
