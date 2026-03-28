const tokenKey = "asset_tracking_access_token";
const baseUrlKey = "asset_tracking_base_url";
const timelineKey = "asset_tracking_recent_actions";

const outputEl = document.getElementById("output");
const tokenPreviewEl = document.getElementById("tokenPreview");
const baseUrlEl = document.getElementById("baseUrl");
const statusBackendEl = document.getElementById("statusBackend");
const statusAuthEl = document.getElementById("statusAuth");
const statusLastEl = document.getElementById("statusLast");
const activityListEl = document.getElementById("activityList");

function setPill(el, text, cls) {
  if (!el) return;
  el.textContent = text;
  el.className = `pill ${cls}`;
}

function setBackendStatus(type, text) {
  setPill(statusBackendEl, text, type);
}

function setAuthStatusFromToken() {
  const token = getToken();
  if (token) {
    setPill(statusAuthEl, "Token Active", "success");
  } else {
    setPill(statusAuthEl, "No Token", "pending");
  }
}

function setLastAction(type, text) {
  setPill(statusLastEl, text, type);
}

function getTimeline() {
  try {
    return JSON.parse(localStorage.getItem(timelineKey) || "[]");
  } catch {
    return [];
  }
}

function pushTimeline(status, label) {
  const current = getTimeline();
  const time = new Date().toLocaleTimeString();
  current.unshift({ status, label, time });
  const limited = current.slice(0, 8);
  localStorage.setItem(timelineKey, JSON.stringify(limited));
  renderTimeline();
}

function renderTimeline() {
  if (!activityListEl) return;
  const timeline = getTimeline();
  activityListEl.innerHTML = "";

  if (!timeline.length) {
    const li = document.createElement("li");
    li.textContent = "No actions yet. Start with backend health check.";
    activityListEl.appendChild(li);
    return;
  }

  for (const item of timeline) {
    const li = document.createElement("li");
    li.className = item.status === "success" ? "ok" : "fail";
    li.textContent = `[${item.time}] ${item.label}`;
    activityListEl.appendChild(li);
  }
}

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
    setAuthStatusFromToken();
    return;
  }
  localStorage.setItem(tokenKey, token);
  renderTokenPreview();
  setAuthStatusFromToken();
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

async function runAction(config) {
  const { label, path, method = "GET", body, onSuccess } = config;

  try {
    const res = await api(path, { method, body });
    if (typeof onSuccess === "function") {
      onSuccess(res);
    }
    setLastAction("success", label);
    pushTimeline("success", `${label} succeeded`);
    log(`${label} success`, res);
  } catch (err) {
    setLastAction("error", label);
    pushTimeline("fail", `${label} failed`);
    log(`${label} failed`, err);
  }
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
    healthBtn.disabled = true;
    await runAction({
      label: "Backend health check",
      path: "/health",
      onSuccess: () => setBackendStatus("success", "Live")
    });
    if (statusLastEl && statusLastEl.className.includes("error")) {
      setBackendStatus("error", "Not reachable");
    }
    healthBtn.disabled = false;
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
      await runAction({
        label: "Register user",
        path: "/auth/register",
        method: "POST",
        body: data
      });
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = formDataToObject(e.currentTarget);
      await runAction({
        label: "Login user",
        path: "/auth/login",
        method: "POST",
        body: data,
        onSuccess: (res) => setToken(res.access_token)
      });
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = formDataToObject(e.currentTarget);
      await runAction({
        label: "Change password",
        path: "/auth/change-password",
        method: "POST",
        body: data
      });
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
      await runAction({ label: "Fetch profile", path: "/users/me" });
    });
  }

  if (categoriesBtn) {
    categoriesBtn.addEventListener("click", async () => {
      await runAction({ label: "Fetch categories", path: "/categories/" });
    });
  }

  if (plansBtn) {
    plansBtn.addEventListener("click", async () => {
      await runAction({ label: "Fetch rental plans", path: "/rental-plans/" });
    });
  }

  if (assetsBtn) {
    assetsBtn.addEventListener("click", async () => {
      await runAction({ label: "Fetch assets", path: "/assets/" });
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
      await runAction({
        label: "Fetch filtered assets",
        path: `/assets/${query ? `?${query}` : ""}`
      });
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
      await runAction({
        label: "Create category",
        path: "/categories/",
        method: "POST",
        body: data
      });
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
      await runAction({
        label: "Create rental plan",
        path: "/rental-plans/",
        method: "POST",
        body: payload
      });
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
      await runAction({
        label: "Create assets",
        path: "/assets/",
        method: "POST",
        body: payload
      });
    });
  }
}

function bindSessionPage() {
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      await runAction({
        label: "Refresh token",
        path: "/auth/refresh",
        method: "POST",
        onSuccess: (res) => setToken(res.access_token)
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await runAction({
        label: "Logout",
        path: "/auth/logout",
        method: "POST",
        onSuccess: () => setToken(null)
      });
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
    localStorage.removeItem(timelineKey);
    renderTimeline();
    setLastAction("neutral", "None yet");
  });
}

function init() {
  initBaseUrlInput();
  renderTokenPreview();
  setAuthStatusFromToken();
  setBackendStatus("pending", "Not checked");
  setLastAction("neutral", "None yet");
  renderTimeline();
  bindHealthButton();
  initHomePage();
  bindAuthPage();
  bindExplorePage();
  bindAdminPage();
  bindSessionPage();
}

init();
