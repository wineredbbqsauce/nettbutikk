const API_URL = "/api/auth";

// ====== HELPERS ======

function showMessage(message, type) {
  const existing = document.querySelector(".toast-msg");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast-msg";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    padding: 14px 20px;
    border-radius: 10px;
    z-index: 9999;
    font-family: "Poppins", sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    animation: slideIn 0.3s ease;
    background: ${type === "success" ? "#28a745" : "#dc3545"};
    color: white;
  `;

  const style = document.createElement("style");
  style.textContent = `@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`;
  document.head.appendChild(style);
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

function getFormValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

// ====== REGISTER ======

async function handleRegister(e) {
  if (e) e.preventDefault();

  const firstName = getFormValue("first-name");
  const lastName = getFormValue("last-name");
  const email = getFormValue("email");
  const password = getFormValue("password");
  const confirmPassword = getFormValue("confirmPassword");

  if (!firstName || !lastName || !email || !password) {
    showMessage("Please fill in all required fields.", "error");
    return;
  }

  if (password.length < 6) {
    showMessage("Password must be at least 6 characters.", "error");
    return;
  }

  if (confirmPassword && password !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || "Registration failed.", "error");
      return;
    }

    const loginRes = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (loginRes.ok) {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      localStorage.setItem("user", JSON.stringify(meData.user || meData));

      showMessage("Account created! Redirecting...", "success");
      setTimeout(() => (window.location.href = "/"), 1500);
    } else {
      showMessage(
        "Registration succeeded but login failed. Please try logging in.",
        "error",
      );
      setTimeout(() => (window.location.href = "/login"), 1500);
    }
  } catch (err) {
    showMessage("Something went wrong. Try again.", "error");
    console.error(err);
  }
}

// ====== LOGIN ======

async function handleLogin(e) {
  if (e) e.preventDefault();

  const email = getFormValue("email");
  const password = getFormValue("password");

  if (!email || !password) {
    showMessage("Please enter your email and password.", "error");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      localStorage.setItem("user", JSON.stringify(meData.user || meData));

      showMessage("Logged in! Redirecting...", "success");
      setTimeout(() => (window.location.href = "/"), 1500);
    } else {
      showMessage(data.error || "Invalid credentials.", "error");
    }
  } catch (err) {
    showMessage("Something went wrong. Try again.", "error");
    console.error(err);
  }
}

// ====== LOGOUT ======

async function logout() {
  try {
    await fetch(`${API_URL}/logout`, { method: "POST" });
    localStorage.removeItem("user");
    showMessage("Logged out.", "success");
    setTimeout(() => (window.location.href = "/login"), 1000);
  } catch (err) {
    console.error("Logout error", err);
  }
}

// ====== PASSWORD TOGGLE ======

function setupPasswordToggle(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;

  toggle.addEventListener("click", () => {
    const isPassword = input.getAttribute("type") === "password";
    input.setAttribute("type", isPassword ? "text" : "password");
    toggle.classList.toggle("fa-eye-slash");
  });
}

// ====== INIT ======

document.addEventListener("DOMContentLoaded", () => {
  // Hook up forms
  const registerForm = document.getElementById("register-form");
  if (registerForm) registerForm.addEventListener("submit", handleRegister);

  const loginForm = document.getElementById("login-form");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  // Password toggles
  setupPasswordToggle("password", "togglePassword");
  setupPasswordToggle("confirmPassword", "toggleConfirmPassword");

  // Nav search
  const navSearch = document.querySelector(".search-bar input");
  const navSearchBtn = document.querySelector(".search-bar .fa-search");

  if (navSearch && navSearchBtn) {
    function goToSearch() {
      const query = navSearch.value.trim();
      if (query)
        window.location.href = `/products?search=${encodeURIComponent(query)}`;
    }
    navSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") goToSearch();
    });
    navSearchBtn.addEventListener("click", goToSearch);
  }
});

// ====== SETTINGS ======

// Hent innlogget bruker fra localStorage (oppdateres fra server)
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("user"));
}

// Oppdater hele settings‑siden med brukerdata
function updateSettingsPage(user) {
  if (!user) return;

  const firstName = user.firstname || "";
  const lastName = user.lastname || "";
  const fullName = `${firstName} ${lastName}`.trim() || "User";
  const initials =
    ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "U";
  const email = user.email || "";

  // Sidebar
  const sidebarName = document.getElementById("sidebar-name");
  const sidebarEmail = document.getElementById("sidebar-email");
  const avatarCircle = document.getElementById("avatar-circle");
  if (sidebarName) sidebarName.textContent = fullName;
  if (sidebarEmail) sidebarEmail.textContent = email;
  if (avatarCircle) avatarCircle.textContent = initials;

  // Profilseksjon
  const avatarLarge = document.getElementById("avatar-large");
  const avatarDisplayName = document.getElementById("avatar-display-name");
  const firstNameInput = document.getElementById("first-name");
  const lastNameInput = document.getElementById("last-name");
  const emailInput = document.getElementById("profile-email");

  if (avatarLarge) avatarLarge.textContent = initials;
  if (avatarDisplayName) avatarDisplayName.textContent = fullName;
  if (firstNameInput) firstNameInput.value = firstName;
  if (lastNameInput) lastNameInput.value = lastName;
  if (emailInput) emailInput.value = email;
}

// Lagre profil (sender til server)
async function saveProfile() {
  const user = getCurrentUser();
  if (!user) {
    showToast?.("Not logged in.", "error") || alert("Not logged in.");
    return;
  }

  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const email = document.getElementById("profile-email").value.trim();

  try {
    const res = await fetch(`${API_URL}/update-profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      // Siden vi bruker sessions (cookies) trenger vi ingen Authorization‑header
      body: JSON.stringify({ firstName, lastName, email }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast?.(data.error || "Update failed.", "error");
      return;
    }

    // Oppdater localStorage og UI
    const updatedUser = {
      ...user,
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
    };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    updateSettingsPage(updatedUser);

    showToast?.("Profile saved!", "success");
  } catch (err) {
    console.error(err);
    showToast?.("Something went wrong.", "error");
  }
}

// Bytt passord (sender til server)
async function updatePassword() {
  const currentPw = document.getElementById("current-pw").value.trim();
  const newPw = document.getElementById("new-pw").value.trim();
  const confirmPw = document.getElementById("confirm-pw").value.trim();

  if (!currentPw || !newPw || !confirmPw) {
    showToast?.("All password fields are required.", "error");
    return;
  }
  if (newPw !== confirmPw) {
    showToast?.("Passwords do not match.", "error");
    return;
  }
  if (newPw.length < 6) {
    showToast?.("Password must be at least 6 characters.", "error");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/change-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast?.(data.error || "Password change failed.", "error");
      return;
    }

    // Tøm feltene
    document.getElementById("current-pw").value = "";
    document.getElementById("new-pw").value = "";
    document.getElementById("confirm-pw").value = "";
    // Styrkebaren nullstilles
    const fill = document.getElementById("strength-fill");
    if (fill) fill.style.width = "0";
    const label = document.getElementById("strength-label");
    if (label) label.textContent = "Enter a password";

    showToast?.("Password updated!", "success");
  } catch (err) {
    console.error(err);
    showToast?.("Something went wrong.", "error");
  }
}

// Legg til logout‑knapp i sidebaren (kalles fra settings.html)
function addLogoutToSettings() {
  const sidebar = document.querySelector(".side-nav");
  if (!sidebar) return;

  const divider = document.createElement("div");
  divider.className = "side-nav-divider";

  const logoutLink = document.createElement("a");
  logoutLink.className = "side-nav-item";
  logoutLink.href = "#";
  logoutLink.innerHTML =
    '<i class="fas fa-sign-out-alt"></i><span>Logout</span>';
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });

  sidebar.appendChild(divider);
  sidebar.appendChild(logoutLink);
}

// Slett konto
async function deleteAccount() {
  try {
    const res = await fetch("/api/auth/delete", { method: "POST" });
    if (res.ok) {
      localStorage.removeItem("user");
      showToast?.("Account deleted. Redirecting...", "success");
      setTimeout(() => (window.location.href = "/"), 2000);
    } else {
      const data = await res.json();
      showToast?.(data.error || "Failed to delete account.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast?.("Something went wrong.", "error");
  }
}
