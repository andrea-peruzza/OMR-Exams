import axios from 'axios';

// Crea un'istanza base di axios centralizzata
const apiClient = axios.create({
  baseURL: '', // Modifica con variabili d'ambiente se necessario
  headers: {
    'Content-Type': 'application/json',
  },
});

// Raccolta delle API raggruppate per funzionalità
export const dashboardAPI = {
  getStatus: async () => {
    const response = await apiClient.get('/api/dashboard/status');
    return response.data;
  },
  previewExcel: async (filename, headerRows = 1, indexCols = 0, centerHeaders = false) => {
    const response = await apiClient.get(`/api/dashboard/preview_excel?filename=${filename}&headerRows=${headerRows}&indexCols=${indexCols}&centerHeaders=${centerHeaders}`);
    return response.data;
  }
};

export const generateAPI = {
  getConfig: async (file = "config.yaml") => {
    const response = await apiClient.get(`/api/generate/config?file=${file}`);
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
  },
  testLayout: async (requestData) => {
    const response = await apiClient.post('/api/generate/test-layout', requestData);
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
  getCorrected: async () => {
    const response = await apiClient.get('/api/manual/corrected');
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

export const markAPI = {
  getQuestionsList: async (datafile) => {
    const response = await apiClient.get(`/api/mark/questions_list?datafile=${datafile}`);
    return response.data;
  },
  calculateMark: async (requestData) => {
    const response = await apiClient.post('/api/mark/calculate', requestData);
    return response.data;
  },
  generateReport: async (requestData) => {
    const response = await apiClient.post('/api/mark/report', requestData);
    return response.data;
  },
  reviewQuestion: async (datafile, questionFile, questionIndex, exportFormat, outputFilename) => {
    let url = `/api/mark/review_question?datafile=${datafile}&question_file=${questionFile}&question=${questionIndex}`;
    if (exportFormat && outputFilename) {
      url += `&export_format=${exportFormat}&output_filename=${outputFilename}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },
  studentsWithQuestion: async (datafile, questionFile, questionIndex, exportFormat, outputFilename) => {
    let url = `/api/mark/students_with_question?datafile=${datafile}&question_file=${questionFile}&question=${questionIndex}`;
    if (exportFormat && outputFilename) {
      url += `&export_format=${exportFormat}&output_filename=${outputFilename}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  }
};

export const moodleAPI = {
  getQuestionsFiles: async () => {
    const response = await apiClient.get('/api/moodle/questions');
    return response.data;
  },
  getXmlFiles: async () => {
    const response = await apiClient.get('/api/moodle/xml_files');
    return response.data;
  },
  exportToMoodle: async (requestData) => {
    const response = await apiClient.post('/api/moodle/export', requestData);
    return response.data;
  },
  importFromMoodle: async (requestData) => {
    const response = await apiClient.post('/api/moodle/import', requestData);
    return response.data;
  },
  uploadXml: async (formData) => {
    const response = await apiClient.post('/api/moodle/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export const backupAPI = {
  getBackups: async () => {
    const response = await apiClient.get('/api/backup/list');
    return response.data;
  },
  restoreBackup: async (filename) => {
    const response = await apiClient.post(`/api/backup/restore/${filename}`);
    return response.data;
  }
};

export default apiClient;
