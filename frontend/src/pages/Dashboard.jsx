import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../api/client';

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStatus()
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 font-sans">Caricamento stato...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-sans">Errore di connessione: {error}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard OMRExams</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card Configurazione */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Configurazione</h2>
          <div className="flex items-center gap-3 mb-3">
            <span className={`w-3 h-3 rounded-full ${status?.config_loaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium text-gray-800">
              {status?.config_loaded ? 'Configurazione caricata' : 'Nessuna configurazione'}
            </span>
          </div>
          {status?.config_path && (
            <p className="text-xs text-gray-500 break-all bg-gray-50 p-2 rounded">{status.config_path}</p>
          )}
        </div>

        {/* Card Database */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Database JSON</h2>
          <div className="flex items-center gap-3 mb-3">
            <span className={`w-3 h-3 rounded-full ${status?.exam_json_exists ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium text-gray-800">
              {status?.exam_json_exists ? 'Database presente' : 'Database mancante'}
            </span>
          </div>
          {status?.exam_json_path && (
            <p className="text-xs text-gray-500 break-all bg-gray-50 p-2 rounded">{status.exam_json_path}</p>
          )}
        </div>

        {/* Card Scansioni */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Scansioni Raw</h2>
          <div className="flex items-center gap-3 mb-3">
            <span className={`w-3 h-3 rounded-full ${status?.scans_present ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span className="font-medium text-gray-800">
              {status?.scans_present ? 'Scansioni rilevate' : 'Nessuna scansione'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Stato della cartella <code className="bg-gray-50 p-1 rounded">/output/scans/raw</code>
          </p>
        </div>

      </div>
    </div>
  );
}
