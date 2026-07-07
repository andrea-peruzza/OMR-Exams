import axios from 'axios';

// Crea un'istanza base di axios centralizzata
const apiClient = axios.create({
  baseURL: 'http://localhost:5000', // Modifica con variabili d'ambiente se necessario
  headers: {
    'Content-Type': 'application/json',
  },
});

// Raccolta delle API raggruppate per funzionalità
export const dashboardAPI = {
  getStatus: async () => {
    const response = await apiClient.get('/api/dashboard/status');
    return response.data;
  }
};

export const generateAPI = {
  getConfig: async () => {
    const response = await apiClient.get('/api/generate/config');
    return response.data;
  },
  getFiles: async () => {
    const response = await apiClient.get('/api/generate/files');
    return response.data;
  },
  uploadQuestion: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/generate/upload/question', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  uploadStudent: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/generate/upload/student', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  startGeneration: async (requestData) => {
    const response = await apiClient.post('/api/generate/start', requestData);
    return response.data;
  }
};
export const sortAPI = {
  getStatus: async () => {
    const response = await apiClient.get('/api/sort/status');
    return response.data;
  },
  uploadScan: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/sort/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  startSort: async (requestData) => {
    const response = await apiClient.post('/api/sort/start', requestData);
    return response.data;
  }
};

export default apiClient;
