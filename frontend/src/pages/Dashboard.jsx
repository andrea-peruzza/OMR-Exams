import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus, ScanText, CheckCircle, FileOutput, Library } from 'lucide-react';
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

        {/* Card Domande */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Domande (Markdown)</h2>
          <div className="flex items-center gap-3 mb-3">
            <span className={`w-3 h-3 rounded-full ${status?.questions_present ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium text-gray-800">
              {status?.questions_present ? 'Domande trovate' : 'Nessun file markdown'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Stato della cartella <code className="bg-gray-50 p-1 rounded">/data/questions</code>
          </p>
        </div>

        {/* Card Studenti */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Lista Studenti (Excel)</h2>
          <div className="flex items-center gap-3 mb-3">
            <span className={`w-3 h-3 rounded-full ${status?.students_present ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium text-gray-800">
              {status?.students_present ? 'File Excel presenti' : 'Nessun file Excel'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Stato della cartella <code className="bg-gray-50 p-1 rounded">/data/students</code>
          </p>
        </div>

      </div>

      {/* Sezione Hub Navigazione */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Strumenti OMR</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link to="/generate" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <FilePlus size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Genera Esami</h3>
            <p className="text-sm text-gray-500">Crea nuovi fascicoli, randomizza le domande e stampa in PDF.</p>
          </Link>

          <Link to="/sort" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-purple-50 text-purple-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <ScanText size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Smista Scansioni</h3>
            <p className="text-sm text-gray-500">Dividi e ordina le scansioni grezze nei fascicoli degli studenti.</p>
          </Link>

          <Link to="/correct" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Correggi</h3>
            <p className="text-sm text-gray-500">Rileva i QR code e analizza le risposte date per ogni studente.</p>
          </Link>

          <Link to="/mark" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-orange-50 text-orange-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <FileOutput size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Assegna Voti</h3>
            <p className="text-sm text-gray-500">Calcola i punteggi finali ed esporta la graduatoria in Excel.</p>
          </Link>

          <Link to="/moodle" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col items-center text-center sm:col-span-2 lg:col-span-4">
            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform flex justify-center w-16 mx-auto">
              <Library size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Convertitore Moodle</h3>
            <p className="text-sm text-gray-500">Importa o esporta il database di domande da/verso file XML compatibili con Moodle.</p>
          </Link>

        </div>
      </div>

    </div>
  );
}
