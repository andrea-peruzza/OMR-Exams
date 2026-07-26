import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { correctAPI } from '../api/client';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import HelpButton from '../components/HelpButton';
import { usePrompt } from '../hooks/usePrompt';

function Correct() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ has_datafile: false, has_sorted_scans: false, data_files: [] });
  const [loading, setLoading] = useState(true);

  const [config, setConfig] = useState({
    datafile: '',
    produce_pdf: false,
    pdf_filename: 'esami_corretti.pdf'
  });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { prompt, PromptModal } = usePrompt();
  const [manualChecks, setManualChecks] = useState(0);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await correctAPI.getStatus();
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

  const startCorrection = async () => {
    if (!config.datafile) {
      setError('Seleziona un file dati json valido.');
      return;
    }
    
    if (config.produce_pdf && !config.pdf_filename) {
      setError('Inserisci un nome valido per il file PDF corretto.');
      return;
    }

    let currentPdfName = config.pdf_filename;
    if (config.produce_pdf) {
      if (!currentPdfName.endsWith('.pdf')) {
        currentPdfName += '.pdf';
      }
      
      while (status.pdf_files && status.pdf_files.includes(currentPdfName)) {
        const userChoice = await prompt(`Il file PDF "${currentPdfName}" esiste già.\nInserisci un nuovo nome per creare un nuovo file, oppure lascia questo per sovrascriverlo (Annulla per fermare):`, currentPdfName);
        if (userChoice === null) return;
        
        let newName = userChoice.trim();
        if (!newName.endsWith('.pdf')) {
          newName += '.pdf';
        }
        
        if (newName === currentPdfName) break;
        currentPdfName = newName;
      }
      
      if (currentPdfName !== config.pdf_filename) {
        setConfig(prev => ({ ...prev, pdf_filename: currentPdfName }));
      }
    }

    try {
      setError('');
      setSuccess('');
      setGenerating(true);
      setProgress(0);
      setProgressMessage('Avvio task...');

      const reqPayload = { ...config, pdf_filename: currentPdfName };
      const response = await correctAPI.startCorrection(reqPayload);
      
      const eventSource = new EventSource(`/api/sse/stream/${response.task_id}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'in_progress' || data.status === 'Starting') {
          setProgress(data.progress || 0);
          setProgressMessage(data.message || 'Elaborazione in corso...');
        } else if (data.status === 'Completed' || data.status === 'completed') {
          setProgress(100);
          setProgressMessage('Correzione completata!');
          setSuccess(`Gli esami sono stati corretti con successo ed il database è stato aggiornato!`);
          if (data.result_data && data.result_data.manual_checks_needed !== undefined) {
            setManualChecks(data.result_data.manual_checks_needed);
          }
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

  const isReady = status.has_datafile && status.has_sorted_scans;

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-emerald-200 via-white to-white">
      <PromptModal />
      <BackButton />
      <div className="max-w-5xl mx-auto p-6 space-y-6 pb-20">
        <header className="flex items-center gap-4 border-b pb-4 mb-8">
          <div className="bg-emerald-100 p-3 rounded-full text-emerald-700">
            <CheckCircle size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Correzione automatica</h1>
            <p className="text-gray-600 mt-1">Analizza i PDF smistati, rileva le risposte e verifica la correttezza rispetto alle soluzioni.</p>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 shadow-sm">
            {error}
          </div>
        )}

        {/* STATUS SEZIONE */}
        <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-green-400 hover:shadow-md transition-all flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Verifica preliminare</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${status.has_datafile ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700 font-medium">
                {status.has_datafile 
                  ? `File dati JSON presenti nella cartella (data/)` 
                  : 'Nessun file dati JSON presente. Genera prima gli esami.'}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${status.has_sorted_scans ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700 font-medium">
                {status.has_sorted_scans 
                  ? 'Esami scannerizzati e ordinati presenti (data/sorted/)' 
                  : 'Esami non ancora ordinati.'}
              </span>
            </div>
          </div>
        </section>

        {/* IMPOSTAZIONI SEZIONE */}
        {isReady && (
          <>
            <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-green-400 hover:shadow-md transition-all flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2 flex items-center">
                Impostazioni correzione
                <HelpButton title="Fase di correzione ottica">
                  <p className="mb-3">In questa fase il sistema analizza otticamente gli esami smistati per tutti gli studenti.</p>
                  <p className="mb-3">Il file JSON selezionato verrà ampliato aggiungendo i dati reali appena acquisiti, ovvero calcolando esattamente quali risposte sono state date, omesse o sbagliate da ciascuno studente, in modo da procedere successivamente alla fase di assegnazione dei voti.</p>
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded mt-4">
                    <p className="text-sm text-indigo-800">Selezionando l'apposita spunta, il sistema genererà un file PDF visivo di riepilogo che mostra graficamente i segni rilevati e le correzioni.</p>
                  </div>
                </HelpButton>
              </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona file JSON</label>
              <select 
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-emerald-500"
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
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="flex items-center mb-3">
              <input 
                type="checkbox" 
                id="produce_pdf"
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mr-2"
                checked={config.produce_pdf}
                onChange={(e) => setConfig({...config, produce_pdf: e.target.checked})}
                disabled={generating}
              />
              <label htmlFor="produce_pdf" className="font-medium text-gray-700">Produci il file PDF con le correzioni</label>
            </div>
            
            {config.produce_pdf && (
              <div className="ml-6">
                <label className="block text-sm text-gray-600 mb-1">Nome del file PDF generato</label>
                <input 
                  type="text" 
                  className="w-full md:w-1/2 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-emerald-500"
                  value={config.pdf_filename}
                  onChange={(e) => setConfig({...config, pdf_filename: e.target.value})}
                  disabled={generating}
                  placeholder="esami_corretti.pdf"
                />
              </div>
            )}
          </div>
        </section>

        {/* AZIONE E PROGRESSO */}
        <div className="mt-8 flex flex-col items-center">
          {!generating && (
            <button
              onClick={startCorrection}
              disabled={!isReady || !config.datafile}
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold shadow hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Avvia correzione automatica
            </button>
          )}

          {generating && (
            <div className="w-full max-w-2xl mt-4">
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center mt-2 text-sm text-gray-600 font-medium">
                {progressMessage} ({Math.round(progress)}%)
              </p>
            </div>
          )}

          {success && (
            <div className="mt-8 text-center bg-emerald-50 text-emerald-800 p-6 rounded-xl border border-emerald-200 w-full shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Completato con successo!</h3>
                <p>{success}</p>
                {config.produce_pdf && (
                  <p className="mt-2 text-sm">
                    Il file pdf con gli esami corretti è presente nella seguente cartella: <br/>
                    <span className="font-mono text-emerald-900 bg-emerald-100 px-2 py-1 rounded">cartella data/corrected/ del progetto</span>
                  </p>
                )}
              </div>

              {manualChecks > 0 && (
                <div className="bg-orange-100 border border-orange-300 text-orange-800 p-4 rounded-lg flex flex-col items-center gap-3">
                  <p className="font-medium text-lg">
                    {manualChecks} {manualChecks === 1 ? 'esame necessita' : 'esami necessitano'} di verifica manuale
                  </p>
                  <button 
                    onClick={() => navigate('/manual_correction')}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition-colors font-medium"
                  >
                    Procedi alla verifica manuale
                  </button>
                </div>
              )}

              <div className="flex justify-center gap-4 mt-2">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-900 transition-colors"
                >
                  Ritorna alla Dashboard
                </button>
                <button 
                  onClick={() => navigate('/mark')}
                  className="px-6 py-2 bg-emerald-600 text-white rounded shadow hover:bg-emerald-700 transition-colors font-medium"
                >
                  Procedi con l'assegnazione Voti
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

export default Correct;
