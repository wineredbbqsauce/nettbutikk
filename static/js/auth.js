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
  // const username =
  //   (firstName + lastName).toLowerCase().replace(/\s/g, "") ||
  //   getFormValue("username");
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

    if (res.ok) {
      showMessage("Account created! Redirecting to login...", "success");
      setTimeout(() => (window.location.href = "/login"), 2000);
    } else {
      showMessage(data.error || "Registration failed.", "error");
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
      localStorage.setItem("user", JSON.stringify(data.user));
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
