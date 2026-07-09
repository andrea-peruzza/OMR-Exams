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
export const correctAPI = {
  getStatus: async () => {
    const response = await apiClient.get('/api/correct/status');
    return response.data;
  },
  startCorrection: async (requestData) => {
    const response = await apiClient.post('/api/correct/start', requestData);
    return response.data;
  }
};

export const manualAPI = {
  getScans: async () => {
    const response = await apiClient.get('/api/manual/scans');
    return response.data;
  },
  getMissing: async (datafile) => {
    const response = await apiClient.get(`/api/manual/missing?datafile=${datafile}`);
    return response.data;
  },
  getStudentData: async (datafile, studentId) => {
    const response = await apiClient.get(`/api/manual/student_data?datafile=${datafile}&student_id=${studentId}`);
    return response.data;
  },
  forceAnswer: async (requestData) => {
    const response = await apiClient.post('/api/manual/force_answer', requestData);
    return response.data;
  },
  forceAnswers: async (requestData) => {
    const response = await apiClient.post('/api/manual/force_answers', requestData);
    return response.data;
  }
};

export default apiClient;
