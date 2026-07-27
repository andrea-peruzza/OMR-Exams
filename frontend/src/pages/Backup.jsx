import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ArchiveRestore, AlertCircle } from 'lucide-react';
import { backupAPI } from '../api/client';

export default function Backup() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchBackups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await backupAPI.getBackups();
      setBackups(data.backups);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Errore durante il recupero dei backup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleRestore = async (filename) => {
    if (!window.confirm(`Sei sicuro di voler ripristinare il file ${filename}? Se il file esiste in data/, verrà sovrascritto.`)) {
      return;
    }
    
    setError(null);
    setSuccess(null);
    
    try {
      await backupAPI.restoreBackup(filename);
      setSuccess(`File ${filename} ripristinato con successo!`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Errore durante il ripristino del backup');
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString('it-IT');
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-900 drop-shadow-sm pb-2">
            Backup e Ripristino
          </h1>
          <p className="text-gray-600">Gestisci i backup dei file JSON degli esami (massimo 5 file conservati).</p>
        </div>
        <Link to="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 transition">
          <ArrowLeft size={20} className="mr-2" /> Torna alla Dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-3" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center">
          <CheckCircle size={20} className="mr-3" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">File di Backup Disponibili</h2>
          <button 
            onClick={fetchBackups} 
            className="flex items-center text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-100 transition"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> 
            Aggiorna
          </button>
        </div>
        
        {loading && backups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Caricamento backup in corso...</div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessun backup trovato.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                  <th className="p-4 font-semibold">Nome File</th>
                  <th className="p-4 font-semibold">Data Creazione / Modifica</th>
                  <th className="p-4 font-semibold">Dimensione</th>
                  <th className="p-4 font-semibold text-right">Azione</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.filename} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-800">{b.filename}</td>
                    <td className="p-4 text-gray-600 text-sm">{formatDate(b.modified)}</td>
                    <td className="p-4 text-gray-600 text-sm">{formatSize(b.size)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRestore(b.filename)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition"
                      >
                        <ArchiveRestore size={16} className="mr-1.5" /> Ripristina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple fallback for CheckCircle if lucide-react doesn't have it imported above
function CheckCircle(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
