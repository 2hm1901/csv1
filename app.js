const columns = [
  "loaiThietBi",
  "nhaSanXuat",
  "sl",
  "model",
  "congSuat",
  "donViSoHuu",
  "thoiHanKiemDinh",
  "bienSo",
];

const csvHeaders = {
  loaiThietBi: ["loai_thiet_bi", "loai thiet bi", "loai thiết bị", "loại thiết bị"],
  nhaSanXuat: ["ten nha san xuat", "tên nhà sản xuất", "nha san xuat"],
  sl: ["sl", "so luong", "số lượng"],
  model: ["doi may (model)", "doi may", "model", "đời máy"],
  congSuat: ["cong suat", "công suất"],
  donViSoHuu: ["don vi so huu", "đơn vị sở hữu"],
  thoiHanKiemDinh: ["thoi han kiem dinh", "thời hạn kiểm định"],
  bienSo: ["bien_so", "bien so", "biển số"],
};

const watermarkText = "Hoàng Giang - 0969.05.6446";
const adminCredentials = {
  username: "giang",
  password: "giang123",
};
const storeName = "rows";
const dbName = "csv1-device-table";
let db;
let rows = [];
let activeObjectUrl = "";
let currentRole = sessionStorage.getItem("csv1-role") || "";

const appShell = document.querySelector(".app-shell");
const authScreen = document.querySelector("#authScreen");
const roleChoices = document.querySelector("#roleChoices");
const adminChoice = document.querySelector("#adminChoice");
const userChoice = document.querySelector("#userChoice");
const adminLoginForm = document.querySelector("#adminLoginForm");
const adminUsername = document.querySelector("#adminUsername");
const adminPassword = document.querySelector("#adminPassword");
const loginError = document.querySelector("#loginError");
const backToRoles = document.querySelector("#backToRoles");
const roleBadge = document.querySelector("#roleBadge");
const logoutButton = document.querySelector("#logoutButton");
const tableBody = document.querySelector("#tableBody");
const emptyState = document.querySelector("#emptyState");
const csvInput = document.querySelector("#csvInput");
const addRowButton = document.querySelector("#addRowButton");
const clearButton = document.querySelector("#clearButton");
const pdfPreview = document.querySelector("#pdfPreview");
const previewFrame = document.querySelector("#previewFrame");
const previewTitle = document.querySelector("#previewTitle");
const previewMeta = document.querySelector("#previewMeta");

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName, { keyPath: "id" });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(mode = "readonly") {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function setRole(role) {
  currentRole = role;
  sessionStorage.setItem("csv1-role", role);
  authScreen.classList.add("hidden");
  appShell.classList.remove("hidden");
  appShell.classList.toggle("readonly", role !== "admin");
  roleBadge.textContent = role === "admin" ? "Admin: toan quyen" : "User: chi xem";
  render();
}

function resetAuth() {
  currentRole = "";
  sessionStorage.removeItem("csv1-role");
  hidePreview();
  appShell.classList.remove("readonly");
  appShell.classList.add("hidden");
  authScreen.classList.remove("hidden");
  roleChoices.classList.remove("hidden");
  adminLoginForm.classList.add("hidden");
  loginError.textContent = "";
  adminUsername.value = "";
  adminPassword.value = "";
}

function showAdminLogin() {
  roleChoices.classList.add("hidden");
  adminLoginForm.classList.remove("hidden");
  loginError.textContent = "";
  adminUsername.focus();
}

function loadRows() {
  return new Promise((resolve, reject) => {
    const request = tx().getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => a.createdAt - b.createdAt));
    request.onerror = () => reject(request.error);
  });
}

function saveRow(row) {
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").put(row);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function deleteRow(id) {
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function clearRows() {
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function createEmptyRow(values = {}) {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now() + Math.random(),
    loaiThietBi: values.loaiThietBi || "",
    nhaSanXuat: values.nhaSanXuat || "",
    sl: values.sl || "",
    model: values.model || "",
    congSuat: values.congSuat || "",
    donViSoHuu: values.donViSoHuu || "",
    thoiHanKiemDinh: values.thoiHanKiemDinh || "",
    bienSo: values.bienSo || "",
    pdfName: "",
    pdfBlob: null,
  };
}

function normalizeHeader(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ");
}

function parseCsv(text) {
  const rowsOut = [];
  let cell = "";
  let row = [];
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((item) => item.trim())) rowsOut.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((item) => item.trim())) rowsOut.push(row);
  return rowsOut;
}

function mapCsvRows(csvRows) {
  if (!csvRows.length) return [];

  const headers = csvRows[0].map(normalizeHeader);
  const indexes = {};

  Object.entries(csvHeaders).forEach(([key, aliases]) => {
    indexes[key] = headers.findIndex((header) => aliases.map(normalizeHeader).includes(header));
  });

  return csvRows.slice(1).map((csvRow) => {
    const values = {};
    columns.forEach((key) => {
      const index = indexes[key];
      values[key] = index >= 0 ? (csvRow[index] || "").trim() : "";
    });
    return createEmptyRow(values);
  });
}

function formatFileLabel(row) {
  return row.pdfName ? "Doi PDF" : "Gan PDF";
}

function getDeviceNameFromPdf(fileName) {
  return fileName.replace(/\.pdf$/i, "").trim();
}

function isAdmin() {
  return currentRole === "admin";
}

function render() {
  tableBody.innerHTML = "";
  emptyState.classList.toggle("hidden", rows.length > 0);

  rows.forEach((row, index) => {
    const readOnlyAttribute = isAdmin() ? "" : "readonly";
    const pdfCell = isAdmin()
      ? `<label class="pdf-upload">
          <input type="file" accept="application/pdf" data-pdf-id="${row.id}" />
          ${formatFileLabel(row)}
        </label>`
      : `<span class="pdf-name">${row.pdfName || "Chua co PDF"}</span>`;
    const removeCell = isAdmin()
      ? `<button class="remove-row" type="button" data-remove-id="${row.id}">Xoa</button>`
      : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><input class="type-cell" type="text" data-key="loaiThietBi" data-id="${row.id}" placeholder="(trong)" ${readOnlyAttribute} /></td>
      <td><input type="text" data-key="nhaSanXuat" data-id="${row.id}" ${readOnlyAttribute} /></td>
      <td><input type="number" min="0" data-key="sl" data-id="${row.id}" ${readOnlyAttribute} /></td>
      <td><input type="text" data-key="model" data-id="${row.id}" ${readOnlyAttribute} /></td>
      <td><input type="text" data-key="congSuat" data-id="${row.id}" ${readOnlyAttribute} /></td>
      <td><input type="text" data-key="donViSoHuu" data-id="${row.id}" ${readOnlyAttribute} /></td>
      <td><input type="text" data-key="thoiHanKiemDinh" data-id="${row.id}" ${readOnlyAttribute} /></td>
      <td><input type="text" data-key="bienSo" data-id="${row.id}" ${readOnlyAttribute} /></td>
      <td>${pdfCell}</td>
      <td>${removeCell}</td>
    `;

    tr.querySelectorAll("input[data-key]").forEach((input) => {
      const key = input.dataset.key;
      input.value = row[key] || "";
    });

    tableBody.append(tr);
  });
}

function findRow(id) {
  return rows.find((row) => row.id === id);
}

async function updateField(id, key, value) {
  const row = findRow(id);
  if (!row) return;
  row[key] = value;
  await saveRow(row);
  render();
}

function clearObjectUrl() {
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = "";
  }
}

async function addWatermark(file) {
  if (!window.PDFLib) {
    throw new Error("Thu vien watermark PDF chua tai xong. Hay thu lai sau vai giay.");
  }

  const { PDFDocument, StandardFonts, rgb, degrees } = window.PDFLib;
  const sourceBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(sourceBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = Math.max(32, Math.min(width, height) / 12);
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    const textHeight = font.heightAtSize(fontSize);
    const angle = -32 * (Math.PI / 180);
    const centerX = width / 2;
    const centerY = height / 2;
    const x =
      centerX -
      (textWidth / 2) * Math.cos(angle) +
      (textHeight / 2) * Math.sin(angle);
    const y =
      centerY -
      (textWidth / 2) * Math.sin(angle) -
      (textHeight / 2) * Math.cos(angle);

    page.drawText(watermarkText, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.35, 0.35, 0.35),
      opacity: 0.18,
      rotate: degrees(-32),
    });
  });

  const watermarkedBytes = await pdfDoc.save();
  return new Blob([watermarkedBytes], { type: "application/pdf" });
}

function showPreview(row) {
  clearObjectUrl();
  previewTitle.textContent = row.loaiThietBi || "Loai_thiet_bi";
  previewMeta.textContent = row.pdfName || "";
  pdfPreview.classList.toggle("no-pdf", !row.pdfBlob);
  appShell.classList.add("preview-open");
  pdfPreview.classList.add("visible");
  pdfPreview.setAttribute("aria-hidden", "false");

  if (row.pdfBlob) {
    activeObjectUrl = URL.createObjectURL(row.pdfBlob);
    previewFrame.src = activeObjectUrl;
  } else {
    previewFrame.removeAttribute("src");
  }
}

function hidePreview() {
  appShell.classList.remove("preview-open");
  pdfPreview.classList.remove("visible");
  pdfPreview.setAttribute("aria-hidden", "true");
  previewFrame.removeAttribute("src");
  clearObjectUrl();
}

tableBody.addEventListener("input", (event) => {
  if (!isAdmin()) return;
  const input = event.target.closest("input[data-key]");
  if (!input) return;
  const row = findRow(input.dataset.id);
  if (!row) return;
  row[input.dataset.key] = input.value;
});

tableBody.addEventListener("change", async (event) => {
  if (!isAdmin()) return;
  const fieldInput = event.target.closest("input[data-key]");
  if (fieldInput) {
    await updateField(fieldInput.dataset.id, fieldInput.dataset.key, fieldInput.value);
    return;
  }

  const pdfInput = event.target.closest("input[data-pdf-id]");
  if (!pdfInput || !pdfInput.files.length) return;

  const file = pdfInput.files[0];
  if (file.type !== "application/pdf") {
    alert("Hay chon file PDF.");
    pdfInput.value = "";
    return;
  }

  const row = findRow(pdfInput.dataset.pdfId);
  if (!row) return;

  try {
    const pdfBlob = currentRole === "admin" ? file : await addWatermark(file);
    row.pdfName = file.name;
    row.pdfBlob = pdfBlob;
    row.loaiThietBi = getDeviceNameFromPdf(file.name);
    await saveRow(row);
    render();
  } catch (error) {
    console.error(error);
    alert(`Khong the them watermark vao PDF: ${error.message}`);
    pdfInput.value = "";
  }
});

tableBody.addEventListener("click", (event) => {
  const typeCell = event.target.closest(".type-cell");
  if (!typeCell) return;
  const row = findRow(typeCell.dataset.id);
  if (row) showPreview(row);
});

tableBody.addEventListener("click", async (event) => {
  if (!isAdmin()) return;
  const button = event.target.closest("[data-remove-id]");
  if (!button) return;

  const id = button.dataset.removeId;
  rows = rows.filter((row) => row.id !== id);
  await deleteRow(id);
  hidePreview();
  render();
});

document.addEventListener("click", (event) => {
  if (!pdfPreview.classList.contains("visible")) return;
  if (event.target.closest(".panel") || event.target.closest("#pdfPreview")) return;
  hidePreview();
});

addRowButton.addEventListener("click", async () => {
  if (!isAdmin()) return;
  const row = createEmptyRow();
  rows.push(row);
  await saveRow(row);
  render();
});

clearButton.addEventListener("click", async () => {
  if (!isAdmin()) return;
  if (!confirm("Xoa toan bo du lieu dang luu tren trinh duyet nay?")) return;
  rows = [];
  await clearRows();
  hidePreview();
  render();
});

adminChoice.addEventListener("click", showAdminLogin);

userChoice.addEventListener("click", () => {
  setRole("user");
});

backToRoles.addEventListener("click", () => {
  roleChoices.classList.remove("hidden");
  adminLoginForm.classList.add("hidden");
  loginError.textContent = "";
  adminUsername.value = "";
  adminPassword.value = "";
});

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (
    adminUsername.value.trim() === adminCredentials.username &&
    adminPassword.value === adminCredentials.password
  ) {
    setRole("admin");
    adminUsername.value = "";
    adminPassword.value = "";
    return;
  }

  loginError.textContent = "Tai khoan hoac mat khau khong dung.";
});

logoutButton.addEventListener("click", resetAuth);

csvInput.addEventListener("change", async () => {
  if (!isAdmin()) {
    csvInput.value = "";
    return;
  }

  const file = csvInput.files[0];
  if (!file) return;

  const text = await file.text();
  const importedRows = mapCsvRows(parseCsv(text));
  rows = rows.concat(importedRows);
  await Promise.all(importedRows.map(saveRow));
  csvInput.value = "";
  render();
});

window.addEventListener("beforeunload", clearObjectUrl);

openDb()
  .then(async (database) => {
    db = database;
    rows = await loadRows();
    render();

    if (currentRole === "admin" || currentRole === "user") {
      setRole(currentRole);
    } else {
      resetAuth();
    }
  })
  .catch((error) => {
    console.error(error);
    alert("Khong the khoi tao noi luu du lieu tren trinh duyet.");
  });
