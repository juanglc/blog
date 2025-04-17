import axios, { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
    baseURL: "http://localhost:8000/api/", // Ensure your backend is running here
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;