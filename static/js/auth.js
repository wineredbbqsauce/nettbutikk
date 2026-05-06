const API_URL = "/api/auth";

document.addEventListener("DOMContentLoaded", () => {
  async function checkAuth() {
    try {
      const res = await fetch(`${API_URL}/me`);
      if (res.ok) {
        const user = await res.json();
        updateCartUIForLoggedIn(user);
      } else {
        updateCartUIForLoggedOut();
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      updateCartUIForLoggedOut();
    }
  }

  async function register(username, email, password) {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        showMessage("Registration successful! Please log in.", "success");

        // clear form
        document.getElementById("registerForm").reset();
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return true;
      } else {
        showMessage(data.error || "Registration failed", "error");
        return false;
      }
    } catch (error) {
      showMessage("Error: " + error.message, "error");
      console.error("Registration error: ", error);
      return false;
    }
  }

  async function login(username, password) {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        showMessage("Login successful!", "success");

        // store user info (optional, since session is server-side)
        // But i choose to have it, cuz i can
        localStorage.setItem("user", JSON.stringify(data.user));

        // redirect to home or dashboard after 1.5s
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
        return true;
      } else {
        showMessage(data.error || "Login failed", "error");
        return false;
      }
    } catch (error) {
      showMessage("Error: " + error.message, "error");
      console.error("Login error: ", error);
      return false;
    }
  }

  async function logout() {
    try {
      const res = await fetch(`${API_URL}/logout`, {
        method: "POST",
      });

      if (res.ok) {
        localStorage.removeItem("user");
        showMessage("Logged out successfully", "success");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    } catch (error) {
      console.error("Logout error", error);
      showMessage("Error logging out", "error");
    }
  }

  function updateCartUIForLoggedIn(user) {
    const authContainer = document.getElementById("authContainer");
    if (authContainer) {
      authContainer.innerHTML = `
        <span>Welcome, <strong>${user.username}</strong></span>
        <buttom onclikc="logout()" class="btn btn-logout">Logout</button>
        `;
    }
  }

  function updateCartUIForLoggedOut() {
    const authContainer = document.getElementById("authContainer");
    if (authContainer) {
      authContainer.innerHTML = `
            <a href="/login" class="btn btn-login">Login</a>
            <a href="/register" class="btn btn-register">Register</a>
        `;
    }
  }

  function showMessage(message, type) {
    // create message element
    const messageDiv = document.createElement("div");
    message.className = `message message-${type}`;
    message.textContent = message;

    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9999;
        font-weight: bold;
        animation: slideIn 0.3s ease;
    `;

    if (type === "success") {
      messageDiv.style.backgroundColor = "#4caf50";
      messageDiv.style.color = "white";
    } else {
      messageDiv.style.backgroundColor = "#f44336";
      messageDiv.style.color = "white";
    }

    document.body.appendChild(messageDiv);

    // remove after 4 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 4000);
  }
});
