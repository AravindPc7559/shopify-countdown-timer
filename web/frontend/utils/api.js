const API_BASE_URL = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
};

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw new Error(error.message || 'Network error occurred');
  }
};

export const api = {
  get: (endpoint, options = {}) => {
    return request(endpoint, {
      method: 'GET',
      ...options,
    });
  },

  post: (endpoint, data, options = {}) => {
    return request(endpoint, {
      method: 'POST',
      body: data,
      ...options,
    });
  },

  put: (endpoint, data, options = {}) => {
    return request(endpoint, {
      method: 'PUT',
      body: data,
      ...options,
    });
  },

  delete: (endpoint, options = {}) => {
    return request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  },
};

export default api;

