import React, { useState, useEffect, useRef } from 'react';
import { ScanText } from 'lucide-react';
import { sortAPI } from '../api/client';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import HelpButton from '../components/HelpButton';

function Sort() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ has_scans: false, scans_count: 0, data_files: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [config, setConfig] = useState({
    datafile: '',
    resolution: 300,
    paper: 'A4'
  });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await sortAPI.getStatus();
      setStatus(data);
      if (data.data_files && data.data_files.length > 0 && !config.datafile) {
        setConfig(prev => ({ ...prev, datafile: data.data_files[0] }));
      }
    } catch (err) {
      console.error(err);
      setError('Errore nel caricamento dello stato. Assicurati che il backend sia avviato.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      await sortAPI.uploadScan(file);
      await loadStatus(); // Ricarica lo stato per aggiornare il conteggio
    } catch (err) {
      console.error(err);
      alert('Errore durante il caricamento del file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startSort = async () => {
    if (!config.datafile) {
      setError('Seleziona un file dati json valido.');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setGenerating(true);
      setProgress(0);
      setProgressMessage('Avvio task...');

      const response = await sortAPI.startSort(config);
      const dataDir = response.data_dir;
      
      const eventSource = new EventSource(`/api/sse/stream/${response.task_id}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'in_progress' || data.status === 'Starting') {
          setProgress(data.progress || 0);
          setProgressMessage(data.message || 'Elaborazione in corso...');
        } else if (data.status === 'Completed' || data.status === 'completed') {
          setProgress(100);
          setProgressMessage('Smistamento completato!');
          setSuccess(`I pdf smistati per studente delle scansioni sono presenti nella cartella data/sorted/ del progetto`);
          setGenerating(false);
          eventSource.close();
        } else if (data.status === 'Failed' || data.status === 'failed') {
          setError(`Errore: ${data.error}`);
          setGenerating(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        setError("La connessione al server per gli aggiornamenti si è interrotta.");
        setGenerating(false);
        eventSource.close();
      };
      
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-purple-300 via-white to-white">
      <BackButton />
      <div className="max-w-5xl mx-auto p-6 space-y-6 pb-20">
        <header className="flex items-center gap-4 border-b pb-4 mb-8">
          <div className="bg-purple-100 p-3 rounded-full text-purple-700">
            <ScanText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Smistamento scansioni (Sort)</h1>
            <p className="text-gray-600 mt-1">Smista i PDF scansionati suddividendoli per studente, usando il file dati generato.</p>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 shadow-sm">
            {error}
          </div>
        )}

        {/* STATUS & UPLOAD SEZIONE */}
        <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Stato scansioni</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-4 h-4 rounded-full ${status.has_scans ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 font-medium">
              {status.has_scans 
                ? `${status.scans_count} file di scansioni presenti nella cartella data/scans/` 
                : 'Nessun file di scansioni presente in data/scans/. Scansiona gli esami svolti e carica il file pdf con il pulsante sottostante'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={uploading || generating}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded font-medium hover:bg-blue-100 disabled:opacity-50"
            >
              {uploading ? 'Caricamento in corso...' : 'Carica nuovo file PDF'}
            </button>
          </div>
        </section>

        {/* IMPOSTAZIONI SEZIONE */}
        {status.has_scans && (
          <>
            <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2 flex items-center">
                Impostazioni smistamento
                <HelpButton title="Come funziona lo smistamento">
                  <p className="mb-3">Avverrà lo smistamento degli esami caricati.</p>
                  <p className="mb-3">Il sistema si occuperà di separare i singoli esami e convertirli in immagini PNG, che verranno salvate all'interno della cartella <span className="bg-gray-100 px-1.5 py-0.5 rounded text-grey-600 font-medium">data/sorted/</span>.</p>
                  <p>Questa separazione dei fogli è una fase preliminare necessaria per poter successivamente avviare la correzione automatica degli esami.</p>
                </HelpButton>
              </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File dati Json (Datafile)</label>
              <select 
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                value={config.datafile}
                onChange={(e) => setConfig({...config, datafile: e.target.value})}
                disabled={generating}
              >
                <option value="">Seleziona...</option>
                {status.data_files && status.data_files.map((file, idx) => (
                  <option key={idx} value={file}>{file}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formato carta</label>
              <select 
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                value={config.paper}
                onChange={(e) => setConfig({...config, paper: e.target.value})}
                disabled={generating}
              >
                <option value="A4">A4</option>
                <option value="A3">A3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risoluzione (DPI)</label>
              <select 
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                value={config.resolution}
                onChange={(e) => setConfig({...config, resolution: parseInt(e.target.value) || 300})}
                disabled={generating}
              >
                <option value="150">150</option>
                <option value="200">200</option>
                <option value="300">300 (Predefinito)</option>
                <option value="600">600</option>
              </select>
            </div>
          </div>
        </section>

        {/* AZIONE E PROGRESSO */}
        <div className="mt-8 flex flex-col items-center">
          {!generating && (
            <button
              onClick={startSort}
              disabled={!status.has_scans || !config.datafile}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Avvia smistamento scansioni
            </button>
          )}

          {generating && (
            <div className="w-full max-w-2xl mt-4">
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center mt-2 text-sm text-gray-600 font-medium">
                {progressMessage} ({Math.round(progress)}%)
              </p>
            </div>
          )}

          {success && (
            <div className="mt-8 text-center bg-green-50 text-green-700 p-6 rounded-xl border border-green-200 w-full shadow-sm">
              <h3 className="text-xl font-bold mb-2">Completato con successo!</h3>
              <p className="mb-4">{success}</p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-900"
                >
                  Ritorna alla Dashboard
                </button>
                <button 
                  onClick={() => navigate('/correct')}
                  className="px-6 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition-colors"
                >
                  Procedi con la correzione
                </button>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default Sort;
