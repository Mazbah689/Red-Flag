const adminSessionKey = "bloodAdminLoggedIn";
const donorStorageKey = "bloodUsers";
const adminCredentials = { email: "admin@redflag.com", password: "Admin@123" };

function getDonors() {
  const raw = localStorage.getItem(donorStorageKey);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setDonors(donors) {
  localStorage.setItem(donorStorageKey, JSON.stringify(donors));
}

function setAdminSession(value) {
  localStorage.setItem(adminSessionKey, JSON.stringify(Boolean(value)));
}

function getAdminSession() {
  return JSON.parse(localStorage.getItem(adminSessionKey) || "false");
}

function showAdminMessage(element, text, success = false) {
  if (!element) return;
  element.textContent = text;
  element.style.color = success ? "#1b5f4f" : "#b91c1c";
}

function renderAdminTable() {
  const tableBody = document.getElementById("adminDonorTable");
  const messageEl = document.getElementById("adminTableMessage");
  const donors = getDonors();
  tableBody.innerHTML = "";
  if (!donors.length) {
    messageEl.textContent = "No donor records are available.";
    return;
  }
  messageEl.textContent = "";

  donors.forEach((donor) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${donor.name}</td>
      <td>${donor.bloodGroup}</td>
      <td>${donor.email}</td>
      <td>${donor.phone}</td>
      <td>${donor.address}</td>
      <td>
        <button class="btn btn-secondary" data-action="edit" data-id="${donor.id}">Edit</button>
        <button class="btn btn-secondary" data-action="delete" data-id="${donor.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function showAdminDashboard() {
  document.getElementById("adminLoginSection").hidden = true;
  document.getElementById("adminDashboardSection").hidden = false;
  renderAdminTable();
}

function initializeAdmin() {
  const isAdminLoggedIn = getAdminSession();
  const adminLoginForm = document.getElementById("adminLoginForm");
  const adminMessage = document.getElementById("adminMessage");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  const adminAddForm = document.getElementById("adminAddForm");
  const adminAddMessage = document.getElementById("adminAddMessage");
  const adminTable = document.getElementById("adminDonorTable");

  if (isAdminLoggedIn) {
    showAdminDashboard();
  }

  adminLoginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    if (email.toLowerCase() === adminCredentials.email && password === adminCredentials.password) {
      setAdminSession(true);
      showAdminDashboard();
      showAdminMessage(adminMessage, "Admin login successful.", true);
    } else {
      showAdminMessage(adminMessage, "Invalid admin credentials.");
    }
  });

  adminLogoutBtn?.addEventListener("click", () => {
    setAdminSession(false);
    window.location.reload();
  });

  adminAddForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("adminName").value.trim();
    const email = document.getElementById("adminEmailAdd").value.trim();
    const bloodGroup = document.getElementById("adminBloodGroup").value;
    const phone = document.getElementById("adminPhone").value.trim();
    const address = document.getElementById("adminAddress").value.trim();

    if (!name || !email || !bloodGroup || !phone || !address) {
      showAdminMessage(adminAddMessage, "All fields are required.");
      return;
    }

    const donors = getDonors();
    if (donors.some((entry) => entry.email.toLowerCase() === email.toLowerCase())) {
      showAdminMessage(adminAddMessage, "A donor with this email already exists.");
      return;
    }

    donors.push({
      id: `u${Date.now()}`,
      name,
      email,
      password: "Default@123",
      bloodGroup,
      phone,
      address,
    });
    setDonors(donors);
    renderAdminTable();
    adminAddForm.reset();
    showAdminMessage(adminAddMessage, "Donor added successfully.", true);
  });

  adminTable?.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    const donorId = button.dataset.id;
    if (action === "delete") {
      if (!confirm("Delete this donor record? This cannot be undone.")) {
        return;
      }
      const donors = getDonors().filter((donor) => donor.id !== donorId);
      setDonors(donors);
      renderAdminTable();
    }
    if (action === "edit") {
      const donors = getDonors();
      const donor = donors.find((item) => item.id === donorId);
      if (!donor) return;

      const name = prompt("Update full name:", donor.name);
      if (name === null) return;
      const bloodGroup = prompt("Update blood group:", donor.bloodGroup);
      if (bloodGroup === null) return;
      const phone = prompt("Update phone number:", donor.phone);
      if (phone === null) return;
      const address = prompt("Update address:", donor.address);
      if (address === null) return;

      donor.name = name.trim() || donor.name;
      donor.bloodGroup = bloodGroup.trim() || donor.bloodGroup;
      donor.phone = phone.trim() || donor.phone;
      donor.address = address.trim() || donor.address;
      setDonors(donors);
      renderAdminTable();
    }
  });
}

document.addEventListener("DOMContentLoaded", initializeAdmin);
