import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://ph7lootlotterybackend-v1-production.up.railway.app/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */
axiosInstance.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    let token = "";

    // ✅ ADMIN APIs (ONLY /admin)
    if (url.startsWith("/admin")) {
      token = localStorage.getItem("admin_token");
    }
    // ✅ USER APIs (everything else)
    else {
      token =
        localStorage.getItem("user_token") ||
        localStorage.getItem("token");
    }

    // ✅ sanitize token
    token = String(token || "")
      .replace(/^"|"$/g, "")
      .replace(/^Bearer\s+/i, "");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    const isAdminApi = url.startsWith("/admin");

    // ✅ Handle unauthorized
    if (status === 401) {
      if (isAdminApi) {
        // 🔥 Admin logout
        localStorage.removeItem("adminUser");
        localStorage.removeItem("admin_token");
      } else {
        // 🔥 User logout
        localStorage.removeItem("user");
        localStorage.removeItem("user_token");
        localStorage.removeItem("token");
      }

      // 🔔 Notify app (AuthContext / listeners)
      window.dispatchEvent(new Event("authChanged"));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
