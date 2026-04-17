export const API_URL = import.meta.env.VITE_API_URL || "";

// Wrapper for fetch to automatically prefix API requests and include credentials
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith("/api") ? `${API_URL}${endpoint}` : endpoint;

    return fetch(url, {
        ...options,
        credentials: "include", // Required to send cookies cross-origin
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
}
