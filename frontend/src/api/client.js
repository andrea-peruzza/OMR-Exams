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

export default apiClient;
