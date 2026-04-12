const supabaseClient = supabase.createClient('https://mgchkdmtshbefvjlbiqv.supabase.co', 'sb_publishable_2u6BnSpdmQdAxkhaz8YnIA_wZEv2-4S');

const storageKey = "bloodUsers";
const currentUserKey = "bloodCurrentUser";
const adminCredentials = { email: "admin@redflag.com", password: "Admin@123" };

const sampleDonors = [
  {
    id: "u1",
    name: "Aanya Sharma",
    email: "aanya.sharma@example.com",
    password: "Pass@2026",
    bloodGroup: "A+",
    phone: "+1 555 210 9943",
    address: "North Valley, CA",
  },
  {
    id: "u2",
    name: "Jay Patel",
    email: "jay.patel@example.com",
    password: "JayPass20",
    bloodGroup: "O-",
    phone: "+1 555 310 8811",
    address: "Downtown Austin, TX",
  },
  {
    id: "u3",
    name: "Sara Lee",
    email: "sara.lee@example.com",
    password: "Sara1234",
    bloodGroup: "B+",
    phone: "+1 555 423 2215",
    address: "Brookside, NY",
  },
  {
    id: "u4",
    name: "Miguel Reyes",
    email: "miguel.reyes@example.com",
    password: "Reyes!88",
    bloodGroup: "AB-",
    phone: "+1 555 672 0044",
    address: "Lincoln Park, IL",
  },
  {
    id: "u5",
    name: "Priya Rao",
    email: "priya.rao@example.com",
    password: "Rao@2026",
    bloodGroup: "O+",
    phone: "+1 555 839 9944",
    address: "Seaside, FL",
  },
];

async function getUsers() {
  const { data, error } = await supabaseClient.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data || [];
}

function setUsers(users) {
  localStorage.setItem(storageKey, JSON.stringify(users));
}

function getCurrentUser() {
  const raw = localStorage.getItem(currentUserKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(currentUserKey);
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(currentUserKey, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(currentUserKey);
}

function showMessage(element, text, success = false) {
  if (!element) return;
  element.textContent = text;
  element.style.color = success ? "#1b5f4f" : "#b91c1c";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^\+?[0-9\s\-()]{6,20}$/.test(phone);
}

function updateNav() {
  const navLinks = document.getElementById("nav-links");
  if (!navLinks) return;

  const currentUser = getCurrentUser();
  if (currentUser) {
    // Logged in: show user info and logout
    navLinks.innerHTML = `
      <span class="user-info">Welcome, ${currentUser.name} (${currentUser.blood_group || currentUser.bloodGroup})</span>
      <a href="dashboard.html">Dashboard</a>
      <a href="search.html">Search</a>
      <a href="#" id="logout-link">Logout</a>
    `;
    // Add logout event
    document.getElementById("logout-link").addEventListener("click", (e) => {
      e.preventDefault();
      clearCurrentUser();
      window.location.href = "index.html";
    });
  } else {
    // Not logged in: show default links
    navLinks.innerHTML = `
      <a href="login.html">Login</a>
      <a href="register.html">Register</a>
    `;
  }
}

async function initializeHome() {
  updateNav();
  // Insert sample data if table is empty
  const users = await getUsers();
  if (users.length === 0) {
    const sampleData = sampleDonors.map(donor => ({
      name: donor.name,
      email: donor.email.toLowerCase(),
      password: donor.password,
      blood_group: donor.bloodGroup,
      phone: donor.phone,
      address: donor.address,
    }));
    await supabaseClient.from('users').insert(sampleData);
  }
}

async function initializeLogin() {
  const loginForm = document.getElementById("loginForm");
  const messageEl = document.getElementById("loginMessage");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
      showMessage(messageEl, "Please fill in both fields.");
      return;
    }

    if (email.toLowerCase() === adminCredentials.email && password === adminCredentials.password) {
      window.location.href = "admin.html";
      return;
    }

    const { data: user, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user || user.password !== password) {
      showMessage(messageEl, "Invalid email or password.");
      return;
    }

    setCurrentUser(user);
    window.location.href = "dashboard.html";
  });
}

async function initializeRegister() {
  const registerForm = document.getElementById("registerForm");
  const messageEl = document.getElementById("registerMessage");

  if (!registerForm) return;

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value.trim();
    const bloodGroup = document.getElementById("registerBloodGroup").value;
    const phone = document.getElementById("registerPhone").value.trim();
    const address = document.getElementById("registerAddress").value.trim();

    // validation
    if (!name || !email || !password || !bloodGroup || !phone || !address) {
      showMessage(messageEl, "All fields are required.");
      return;
    }

    if (!validateEmail(email)) {
      showMessage(messageEl, "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      showMessage(messageEl, "Password must be at least 6 characters.");
      return;
    }

    if (!validatePhone(phone)) {
      showMessage(messageEl, "Please enter a valid phone number.");
      return;
    }

    // check if email already exists
    const { data: existingUser, error: checkError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Check email error:", checkError);
      showMessage(messageEl, "Error checking email.");
      return;
    }

    if (existingUser) {
      showMessage(messageEl, "This email is already registered.");
      return;
    }

    // insert new user
    const { data: newUser, error: insertError } = await supabaseClient
      .from("users")
      .insert([
        {
          name: name,
          email: email,
          password: password,
          blood_group: bloodGroup,
          phone: phone,
          address: address,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      showMessage(messageEl, "Registration failed. Please try again.");
      return;
    }

    // save current user
    setCurrentUser(newUser);

    showMessage(messageEl, "Registration successful!", true);

    // reset form
    registerForm.reset();

    // redirect
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  });
}

function initializeDashboard() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const welcomeMessage = document.getElementById("welcomeMessage");
  welcomeMessage.textContent = `Welcome back, ${currentUser.name}`;

  const logoutBtn = document.getElementById("logoutBtn");
  const editProfileBtn = document.getElementById("editProfileBtn");
  const profileSection = document.getElementById("profileSection");
  const profileForm = document.getElementById("profileForm");
  const profileMessage = document.getElementById("profileMessage");

  document.getElementById("profileName").value = currentUser.name;
  document.getElementById("profileEmail").value = currentUser.email;
  document.getElementById("profileBloodGroup").value = currentUser.blood_group || currentUser.bloodGroup;
  document.getElementById("profilePhone").value = currentUser.phone;
  document.getElementById("profileAddress").value = currentUser.address;

  profileSection.classList.add("active");

  logoutBtn?.addEventListener("click", () => {
    clearCurrentUser();
    window.location.href = "login.html";
  });

  editProfileBtn?.addEventListener("click", () => {
    profileSection.scrollIntoView({ behavior: "smooth" });
  });

  profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("profileName").value.trim();
    const bloodGroup = document.getElementById("profileBloodGroup").value;
    const phone = document.getElementById("profilePhone").value.trim();
    const address = document.getElementById("profileAddress").value.trim();

    if (!name || !bloodGroup || !phone || !address) {
      showMessage(profileMessage, "Please complete all profile fields.");
      return;
    }

    if (!validatePhone(phone)) {
      showMessage(profileMessage, "Enter a valid phone number.");
      return;
    }

    const { error } = await supabaseClient
      .from('users')
      .update({
        name,
        blood_group: bloodGroup,
        phone,
        address,
      })
      .eq('email', currentUser.email);

    if (error) {
      showMessage(profileMessage, "Unable to update profile. Please login again.");
      return;
    }

    // Update local currentUser
    currentUser.name = name;
    currentUser.blood_group = bloodGroup;
    currentUser.phone = phone;
    currentUser.address = address;
    setCurrentUser(currentUser);

    showMessage(profileMessage, "Profile updated successfully.", true);
  });
}

function renderSearchResults(results) {
 async function initializeRegister() {
  const registerForm = document.getElementById("registerForm");
  const messageEl = document.getElementById("registerMessage");
  if (!registerForm) return;

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value.trim();
    const bloodGroup = document.getElementById("registerBloodGroup").value;
    const phone = document.getElementById("registerPhone").value.trim();
    const address = document.getElementById("registerAddress").value.trim();

    if (!name || !email || !password || !bloodGroup || !phone || !address) {
      showMessage(messageEl, "All fields are required.");
      return;
    }

    if (!validateEmail(email)) {
      showMessage(messageEl, "Enter a valid email address.");
      return;
    }

    if (!validatePhone(phone)) {
      showMessage(messageEl, "Enter a valid phone number.");
      return;
    }

    // check existing email properly
    const { data: existingUser, error: checkError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error(checkError);
      showMessage(messageEl, "Error checking email.");
      return;
    }

    if (existingUser) {
      showMessage(messageEl, "This email is already registered.");
      return;
    }

    // insert new user
    const { data: newUser, error: insertError } = await supabaseClient
      .from("users")
      .insert([
        {
          name,
          email,
          password,
          blood_group: bloodGroup,
          phone,
          address,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      showMessage(messageEl, "Registration failed.");
      return;
    }

    setCurrentUser(newUser);
    showMessage(messageEl, "Registration successful!", true);

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  });
}
}

function initializeSearch() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  updateNav();

  const searchForm = document.getElementById("searchForm");
  const loadingState = document.getElementById("loadingState");
  const searchMessage = document.getElementById("searchMessage");
  const resultList = document.getElementById("resultList");

  if (!searchForm) return;

  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const bloodGroup = document.getElementById("searchGroup").value;

    if (!bloodGroup) {
      searchMessage.textContent = "Please select a blood group.";
      return;
    }

    resultList.innerHTML = "";
    searchMessage.textContent = "";
    loadingState.hidden = false;

    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .eq("blood_group", bloodGroup);

    loadingState.hidden = true;

    if (error) {
      console.error("Search error:", error);
      searchMessage.textContent = "Unable to search donors.";
      return;
    }

    if (!data || data.length === 0) {
      searchMessage.textContent = "No donors found.";
      return;
    }

    const currentUser = getCurrentUser();

    data.forEach((donor) => {
      const card = document.createElement("div");
      card.className = "result-card";

      if (currentUser) {
        // logged in user sees full details
        card.innerHTML = `
          <h3>${donor.name}</h3>
          <p><strong>Blood Group:</strong> ${donor.blood_group}</p>
          <p><strong>Email:</strong> ${donor.email}</p>
          <p><strong>Phone:</strong> ${donor.phone}</p>
          <p><strong>Address:</strong> ${donor.address}</p>
        `;
      } else {
        // guest user sees limited details
        card.innerHTML = `
          <h3>${donor.name}</h3>
          <p><strong>Blood Group:</strong> ${donor.blood_group}</p>
          <p><em>Login to view contact details</em></p>
        `;
      }

      resultList.appendChild(card);
    });
  });
}
function initializePage() {
  const page = document.body.dataset.page;
  switch (page) {
    case "home":
      initializeHome();
      break;
    case "login":
      initializeLogin();
      break;
    case "register":
      initializeRegister();
      break;
    case "dashboard":
      initializeDashboard();
      break;
    case "search":
      initializeSearch();
      break;
    default:
      break;
  }
}

document.addEventListener("DOMContentLoaded", initializePage);