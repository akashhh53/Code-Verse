import axios from "axios"

const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

const axiosClient =  axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

axiosClient.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem('codeverse-access-token');

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('codeverse-access-token');
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
