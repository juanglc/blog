// src/api/config.ts
const API_URL = import.meta.env.VITE_API_URL || "https://blog-hlkv.onrender.com";
// Remove trailing slash if present
export default API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;