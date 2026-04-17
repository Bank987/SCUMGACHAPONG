import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 🎯 Route all /api fetch calls to the backend on Render and include cookies
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  let url = input as string;
  if (typeof url === "string" && url.startsWith("/api")) {
    url = `${import.meta.env.VITE_API_URL || ""}${url}`;
    init.credentials = "include"; // Required for cross-origin cookies

    // Pull token from localStorage and attach to Authorization header
    const token = localStorage.getItem("token");
    if (token) {
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${token}`
      };
    }
  }
  return originalFetch(url, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
