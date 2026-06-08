// API Configuration
// 根据环境变量配置 API 地址

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 30000,
  endpoints: {
    auth: `${API_BASE_URL}/auth`,
    health: `${API_BASE_URL}/health`,
  }
};

export default API_CONFIG;
