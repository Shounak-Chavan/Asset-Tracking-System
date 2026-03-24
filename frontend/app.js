const tokenKey = "asset_tracking_access_token";
const baseUrlKey = "asset_tracking_base_url";

const outputEl = document.getElementById("output");
const tokenPreviewEl = document.getElementById("tokenPreview");
const baseUrlEl = document.getElementById("baseUrl");

function getBaseUrl() {
  const fallback = "http://127.0.0.1:8000";
  if (!baseUrlEl) {
    return (localStorage.getItem(baseUrlKey) || fallback).replace(/\/+$/, "");
  }
  return baseUrlEl.value.trim().replace(/\/+$/, "") || fallback;
}

function setBaseUrl(url) {
  localStorage.setItem(baseUrlKey, url);
}

function getToken() {
  return localStorage.getItem(tokenKey);
}

function renderTokenPreview() {
  if (!tokenPreviewEl) return;
  const token = getToken();
  tokenPreviewEl.textContent = token ? `${token.slice(0, 36)}...` : "Not set";
}

function setToken(token) {
  if (!token) {
    localStorage.removeItem(tokenKey);
    renderTokenPreview();
    return;
  }
  localStorage.setItem(tokenKey, token);
  renderTokenPreview();
}

function log(title, data) {
  if (!outputEl) return;
  const time = new Date().toLocaleTimeString();
  const body = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  outputEl.textContent = `[${time}] ${title}\n${body}`;
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include"
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = { detail: "No JSON response body" };
  }

  if (!response.ok) {
    throw { status: response.status, payload };
  }

  return payload;
}

function formDataToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}

function bindHealthButton() {
  const healthBtn = document.getElementById("healthBtn");
  if (!healthBtn) return;
  healthBtn.addEventListener("click", async () => {
    try {
      const data = await api("/health");
      log("Backend health check success", data);
    } catch (err) {
      log("Backend health check failed", err);
    }
  });
}

function bindAuthPage() {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const changePasswordForm = document.getElementById("changePasswordForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = formDataToObject(e.currentTarget);
      try {
        const res = await api("/auth/register", { method: "POST", body: data });
        log("Register success", res);
      } catch (err) {
        log("Register failed", err);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = formDataToObject(e.currentTarget);
      try {
        const res = await api("/auth/login", { method: "POST", body: data });
        setToken(res.access_token);
        log("Login success. Access token stored.", res);
      } catch (err) {
        log("Login failed", err);
      }
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = formDataToObject(e.currentTarget);
      try {
        const res = await api("/auth/change-password", { method: "POST", body: data });
        log("Change password success", res);
      } catch (err) {
        log("Change password failed", err);
      }
    });
  }
}

function bindExplorePage() {
  const meBtn = document.getElementById("meBtn");
  const categoriesBtn = document.getElementById("categoriesBtn");
  const plansBtn = document.getElementById("plansBtn");
  const assetsBtn = document.getElementById("assetsBtn");
  const assetsFilterForm = document.getElementById("assetsFilterForm");

  if (meBtn) {
    meBtn.addEventListener("click", async () => {
      try {
        const res = await api("/users/me");
        log("Profile data fetched", res);
      } catch (err) {
        log("Profile fetch failed", err);
      }
    });
  }

  if (categoriesBtn) {
    categoriesBtn.addEventListener("click", async () => {
      try {
        const res = await api("/categories/");
        log("Categories fetched", res);
      } catch (err) {
        log("Categories fetch failed", err);
      }
    });
  }

  if (plansBtn) {
    plansBtn.addEventListener("click", async () => {
      try {
        const res = await api("/rental-plans/");
        log("Rental plans fetched", res);
      } catch (err) {
        log("Rental plans fetch failed", err);
      }
    });
  }

  if (assetsBtn) {
    assetsBtn.addEventListener("click", async () => {
      try {
        const res = await api("/assets/");
        log("Assets fetched", res);
      } catch (err) {
        log("Assets fetch failed", err);
      }
    });
  }

  if (assetsFilterForm) {
    assetsFilterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = formDataToObject(e.currentTarget);
      const params = new URLSearchParams();
      if (data.name) params.set("name", data.name);
      if (data.category_name) params.set("category_name", data.category_name);
      const query = params.toString();
      try {
        const res = await api(`/assets/${query ? `?${query}` : ""}`);
        log("Filtered assets fetched", res);
      } catch (err) {
        log("Filtered assets fetch failed", err);
      }
    });
  }
}

function bindAdminPage() {
  const categoryCreateForm = document.getElementById("categoryCreateForm");
  const planCreateForm = document.getElementById("planCreateForm");
  const assetCreateForm = document.getElementById("assetCreateForm");

  if (categoryCreateForm) {
    categoryCreateForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = formDataToObject(e.currentTarget);
      try {
        const res = await api("/categories/", { method: "POST", body: data });
        log("Category created", res);
      } catch (err) {
        log("Category creation failed", err);
      }
    });
  }

  if (planCreateForm) {
    planCreateForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = formDataToObject(e.currentTarget);
      const payload = {
        name: data.name,
        duration_days: toNumber(data.duration_days),
        daily_rate: toNumber(data.daily_rate),
        deposit_amount: toNumber(data.deposit_amount),
        daily_fine_rate: toNumber(data.daily_fine_rate)
      };
      try {
        const res = await api("/rental-plans/", { method: "POST", body: payload });
        log("Rental plan created", res);
      } catch (err) {
        log("Rental plan creation failed", err);
      }
    });
  }

  if (assetCreateForm) {
    assetCreateForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = formDataToObject(e.currentTarget);
      const payload = {
        name: data.name,
        description: data.description,
        category_id: toNumber(data.category_id),
        quantity: toNumber(data.quantity)
      };
      try {
        const res = await api("/assets/", { method: "POST", body: payload });
        log("Assets created in bulk", res);
      } catch (err) {
        log("Asset creation failed", err);
      }
    });
  }
}

function bindSessionPage() {
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      try {
        const res = await api("/auth/refresh", { method: "POST" });
        setToken(res.access_token);
        log("Access token refreshed", res);
      } catch (err) {
        log("Refresh failed", err);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const res = await api("/auth/logout", { method: "POST" });
        setToken(null);
        log("Logged out successfully", res);
      } catch (err) {
        log("Logout failed", err);
      }
    });
  }
}

function initBaseUrlInput() {
  if (!baseUrlEl) return;
  const saved = localStorage.getItem(baseUrlKey);
  if (saved) {
    baseUrlEl.value = saved;
  } else {
    setBaseUrl(getBaseUrl());
  }
  baseUrlEl.addEventListener("change", () => setBaseUrl(getBaseUrl()));
  baseUrlEl.addEventListener("blur", () => setBaseUrl(getBaseUrl()));
}

function initHomePage() {
  const clearBtn = document.getElementById("clearLogBtn");
  if (!clearBtn) return;
  clearBtn.addEventListener("click", () => {
    if (!outputEl) return;
    outputEl.textContent = "Console cleared.";
  });
}

function init() {
  initBaseUrlInput();
  renderTokenPreview();
  bindHealthButton();
  initHomePage();
  bindAuthPage();
  bindExplorePage();
  bindAdminPage();
  bindSessionPage();
}

init();
