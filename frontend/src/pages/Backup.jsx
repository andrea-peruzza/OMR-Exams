import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ArchiveRestore, AlertCircle, Archive } from 'lucide-react';
import { backupAPI } from '../api/client';
import BackButton from '../components/BackButton';
import HomeButton from '../components/HomeButton';
import HelpButton from '../components/HelpButton';

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
    <div className="min-h-screen relative bg-gradient-to-br from-teal-200 via-white to-white">
      <BackButton />
      <HomeButton />
      <div className="max-w-6xl mx-auto p-6 space-y-8 pb-20">
      <header className="flex items-center gap-4 border-b pb-4 mb-8">
        <div className="bg-teal-100 p-3 rounded-full text-teal-700">
          <Archive size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Backup e ripristino</h1>
          <p className="text-gray-600 mt-1">Gestisci i backup dei datafile degli esami (JSON) (massimo 5 file conservati).</p>
        </div>
      </header>

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-teal-400 hover:shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            File di backup disponibili
            <HelpButton title="Informazioni sui Backup">
              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <p>
                  In questa pagina è possibile recuperare i datafile JSON contenenti le informazioni degli esami che sono stati erroneamente cancellati in precedenza.
                </p>
                <p>
                  Per non occupare troppa memoria sul disco, il sistema è configurato per mantenere la possibilità di ripristinare solamente gli <strong>ultimi 5 datafile JSON</strong> degli esami generati. I backup più vecchi vengono eliminati automaticamente.
                </p>
              </div>
            </HelpButton>
          </h2>
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
                  <th className="p-4 font-semibold">Nome file</th>
                  <th className="p-4 font-semibold">Data creazione / modifica</th>
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
