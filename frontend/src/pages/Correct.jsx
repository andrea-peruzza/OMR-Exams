import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, ScanText } from 'lucide-react';
import { sortAPI, correctAPI } from '../api/client';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import HomeButton from '../components/HomeButton';
import HelpButton from '../components/HelpButton';
import { usePrompt } from '../hooks/usePrompt';

function Correct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { prompt, PromptModal } = usePrompt();

  // --- Combined Status ---
  const [status, setStatus] = useState({
    has_scans: false,
    scans_count: 0,
    data_files: [],
    scans_files: [],
    sorted_png_count: 0,
    has_datafile: false,
    has_sorted_scans: false,
    pdf_files: []
  });

  // --- SORT STATES ---
  const [selectedScans, setSelectedScans] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({
    datafile: '',
    paper: 'A4'
  });
  const [sorting, setSorting] = useState(false);
  const [sortProgress, setSortProgress] = useState(0);
  const [sortMessage, setSortMessage] = useState('');
  const [sortError, setSortError] = useState('');
  const [sortSuccess, setSortSuccess] = useState('');

  // --- CORRECT STATES ---
  const [correctConfig, setCorrectConfig] = useState({
    datafile: '',
    produce_pdf: false,
    pdf_filename: 'esami_corretti.pdf'
  });
  const [correcting, setCorrecting] = useState(false);
  const [correctProgress, setCorrectProgress] = useState(0);
  const [correctMessage, setCorrectMessage] = useState('');
  const [correctError, setCorrectError] = useState('');
  const [correctSuccess, setCorrectSuccess] = useState('');
  const [manualChecks, setManualChecks] = useState(0);

  // --- LOAD STATUS ---
  const loadStatus = async () => {
    try {
      setLoading(true);
      // Fetch status from both APIs
      const sortData = await sortAPI.getStatus();
      const correctData = await correctAPI.getStatus();
      
      const combinedStatus = { ...sortData, ...correctData };
      setStatus(combinedStatus);

      if (combinedStatus.data_files && combinedStatus.data_files.length > 0) {
        if (!sortConfig.datafile) {
          setSortConfig(prev => ({ ...prev, datafile: combinedStatus.data_files[0] }));
        }
        if (!correctConfig.datafile) {
          setCorrectConfig(prev => ({ ...prev, datafile: combinedStatus.data_files[0] }));
        }
      }
      if (sortData.scans_files) {
        setSelectedScans(prev => {
          const newFiles = sortData.scans_files.filter(f => !prev.includes(f));
          return [...prev, ...newFiles];
        });
      }
    } catch (err) {
      console.error(err);
      setSortError('Errore nel caricamento dello stato. Assicurati che il backend sia avviato.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // --- SORT LOGIC ---
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        await sortAPI.uploadScan(files[i]);
      }
      await loadStatus();
    } catch (err) {
      console.error(err);
      alert('Errore durante il caricamento dei file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startSort = async () => {
    if (!sortConfig.datafile) {
      setSortError('Seleziona un file dati json valido.');
      return;
    }
    if (selectedScans.length === 0) {
      setSortError('Seleziona almeno un file PDF da smistare.');
      return;
    }
    
    let cleanSorted = false;
    if (status.sorted_png_count > 0) {
      const choice = await prompt(
        "La cartella data/sorted/ contiene già file PNG. Scegli come procedere:",
        "",
        [
          { label: 'Svuota la cartella', value: 'S', className: 'bg-red-600 text-white hover:bg-red-700' },
          { label: 'Mantieni e aggiungi', value: 'M', className: 'bg-blue-600 text-white hover:bg-blue-700' },
          { label: 'Annulla', value: 'A', className: 'bg-gray-200 text-gray-800 hover:bg-gray-300' }
        ],
        true // hideInput
      );
      if (!choice || choice.action === 'A') return;
      
      if (choice.action === 'S') cleanSorted = true;
      else if (choice.action === 'M') cleanSorted = false;
      else return;
    }
    
    try {
      setSortError('');
      setSortSuccess('');
      setSorting(true);
      setSortProgress(0);
      setSortMessage('Avvio smistamento...');

      const reqPayload = { ...sortConfig, clean_sorted: cleanSorted, selected_scans: selectedScans };
      const response = await sortAPI.startSort(reqPayload);
      
      const eventSource = new EventSource(`/api/sse/stream/${response.task_id}`);

      eventSource.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'in_progress' || data.status === 'Starting') {
          const pct = (data.total && data.total > 0) ? (data.progress / data.total) * 100 : (data.progress || 0);
          setSortProgress(pct);
          setSortMessage(data.message || 'Smistamento in corso...');
        } else if (data.status === 'Completed' || data.status === 'completed') {
          setSortProgress(100);
          setSortMessage('Smistamento completato!');
          setSortSuccess(`I PDF scansionati sono stati smistati con successo per studente.`);
          setSorting(false);
          eventSource.close();
          await loadStatus(); // Aggiorna lo stato per sbloccare la Fase 2
        } else if (data.status === 'Failed' || data.status === 'failed') {
          setSortError(`Errore: ${data.error}`);
          setSorting(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        setSortError("La connessione al server per gli aggiornamenti si è interrotta.");
        setSorting(false);
        eventSource.close();
      };
      
    } catch (err) {
      setSortError(err.response?.data?.detail || err.message);
      setSorting(false);
    }
  };

  // --- CORRECT LOGIC ---
  const startCorrection = async () => {
    if (!correctConfig.datafile) {
      setCorrectError('Seleziona un file dati json valido.');
      return;
    }
    
    if (correctConfig.produce_pdf && !correctConfig.pdf_filename) {
      setCorrectError('Inserisci un nome valido per il file PDF corretto.');
      return;
    }

    let currentPdfName = correctConfig.pdf_filename;
    if (correctConfig.produce_pdf) {
      if (!currentPdfName.endsWith('.pdf')) {
        currentPdfName += '.pdf';
      }
      
      while (status.pdf_files && status.pdf_files.includes(currentPdfName)) {
        const userChoice = await prompt(`Il file PDF "${currentPdfName}" esiste già nella cartella dei file corretti.\nInserisci un nuovo nome per creare un nuovo file, oppure lascia questo per sovrascriverlo (Annulla per fermare):`, currentPdfName);
        if (userChoice === null) return;
        
        let newName = userChoice.trim();
        if (!newName.endsWith('.pdf')) {
          newName += '.pdf';
        }
        
        if (newName === currentPdfName) break;
        currentPdfName = newName;
      }
      
      if (currentPdfName !== correctConfig.pdf_filename) {
        setCorrectConfig(prev => ({ ...prev, pdf_filename: currentPdfName }));
      }
    }

    try {
      setCorrectError('');
      setCorrectSuccess('');
      setCorrecting(true);
      setCorrectProgress(0);
      setCorrectMessage('Avvio correzione...');

      const reqPayload = { ...correctConfig, pdf_filename: currentPdfName };
      const response = await correctAPI.startCorrection(reqPayload);
      
      const eventSource = new EventSource(`/api/sse/stream/${response.task_id}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'in_progress' || data.status === 'Starting') {
          const pct = (data.total && data.total > 0) ? (data.progress / data.total) * 100 : (data.progress || 0);
          setCorrectProgress(pct);
          setCorrectMessage(data.message || 'Correzione in corso...');
        } else if (data.status === 'Completed' || data.status === 'completed') {
          setCorrectProgress(100);
          setCorrectMessage('Correzione completata');
          setCorrectSuccess(`Gli esami sono stati corretti con successo ed il database è stato aggiornato`);
          if (data.result_data && data.result_data.manual_checks_needed !== undefined) {
            setManualChecks(data.result_data.manual_checks_needed);
          }
          setCorrecting(false);
          eventSource.close();
        } else if (data.status === 'Failed' || data.status === 'failed') {
          setCorrectError(`Errore: ${data.error}`);
          setCorrecting(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        setCorrectError("La connessione al server per gli aggiornamenti si è interrotta.");
        setCorrecting(false);
        eventSource.close();
      };
      
    } catch (err) {
      setCorrectError(err.response?.data?.detail || err.message);
      setCorrecting(false);
    }
  };

  const isFase2Ready = status.has_datafile && status.has_sorted_scans;

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-emerald-200 via-white to-white">
      <PromptModal />
      <BackButton />
      <HomeButton />
      <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
        <header className="flex items-center gap-4 border-b pb-4">
          <div className="bg-emerald-100 p-3 rounded-full text-emerald-700">
            <CheckCircle size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Smista e Correggi</h1>
            <p className="text-gray-600 mt-1">Smista i PDF scansionati per studente, e successivamente esegui la correzione ottica automatica.</p>
          </div>
        </header>

        {/* --- FASE 1: SORTING --- */}
        <div className="border-2 border-purple-200 rounded-2xl p-6 bg-purple-50/30">
          <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-3">
            <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg">1</span>
            Fase 1: Smistamento Scansioni
          </h2>
          
          {sortError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 shadow-sm mb-4">
              {sortError}
            </div>
          )}

          {/* STATUS & UPLOAD SEZIONE */}
          <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Stato scansioni</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-4 h-4 rounded-full ${status.has_scans ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700 font-medium">
                {status.has_scans 
                  ? `${status.scans_count} file di scansioni presenti nella cartella data/scans/. Seleziona quali elaborare:` 
                  : 'Nessun file di scansioni presente in data/scans/. Scansiona gli esami svolti e carica il file pdf con il pulsante sottostante'}
              </span>
            </div>
            
            {status.has_scans && (
              <div className="mb-4 pl-8">
                {status.scans_files && status.scans_files.map(file => (
                  <label key={file} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" 
                      checked={selectedScans.includes(file)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedScans([...selectedScans, file]);
                        else setSelectedScans(selectedScans.filter(f => f !== file));
                      }}
                    />
                    <span className="text-gray-600">{file}</span>
                  </label>
                ))}
                <div className="flex gap-4 mt-3">
                  <button 
                    onClick={() => setSelectedScans(status.scans_files)}
                    className="text-sm text-purple-600 hover:underline"
                  >Seleziona tutti</button>
                  <button 
                    onClick={() => setSelectedScans([])}
                    className="text-sm text-purple-600 hover:underline"
                  >Deseleziona tutti</button>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              <input 
                type="file" 
                accept=".pdf"
                multiple
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={uploading || sorting}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded font-medium hover:bg-purple-200 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Caricamento in corso...' : 'Carica nuovo file PDF'}
              </button>
            </div>
          </section>

          {/* IMPOSTAZIONI SEZIONE */}
          {status.has_scans && (
            <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col">
              <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2 flex items-center">
                Impostazioni smistamento
                <HelpButton title="Come funziona lo smistamento">
                  <p className="mb-3">Avverrà lo smistamento degli esami caricati.</p>
                  <p className="mb-3">Il sistema si occuperà di separare i singoli esami e convertirli in immagini PNG, che verranno salvate all'interno della cartella <span className="bg-gray-100 px-1.5 py-0.5 rounded text-grey-600 font-medium">data/sorted/</span>.</p>
                  <p>Questa separazione dei fogli è una fase preliminare necessaria per poter successivamente avviare la correzione automatica degli esami nella Fase 2.</p>
                </HelpButton>
              </h3>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File dati Json (Datafile)</label>
                  <select 
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-purple-500"
                    value={sortConfig.datafile}
                    onChange={(e) => setSortConfig({...sortConfig, datafile: e.target.value})}
                    disabled={sorting}
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
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-purple-500"
                    value={sortConfig.paper}
                    onChange={(e) => setSortConfig({...sortConfig, paper: e.target.value})}
                    disabled={sorting}
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* AZIONE E PROGRESSO SORT */}
          <div className="mt-8 flex flex-col items-center">
            {!sorting && (
              <button
                onClick={startSort}
                disabled={!status.has_scans || !sortConfig.datafile || selectedScans.length === 0}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold shadow hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avvia smistamento scansioni
              </button>
            )}

            {sorting && (
              <div className="w-full max-w-2xl mt-4">
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full transition-all duration-300"
                    style={{ width: `${sortProgress}%` }}
                  ></div>
                </div>
                <p className="text-center mt-2 text-sm text-gray-600 font-medium">
                  {sortMessage} ({Math.round(sortProgress)}%)
                </p>
              </div>
            )}

            {sortSuccess && (
              <div className="mt-6 text-center bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 w-full shadow-sm">
                <p className="font-medium">{sortSuccess}</p>
                <p className="text-sm mt-1">Puoi ora procedere con la Fase 2.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- FASE 2: CORRECTION --- */}
        <div className={`border-2 rounded-2xl p-6 transition-all duration-500 ${isFase2Ready ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50 opacity-60 grayscale-[0.5]'}`}>
          <div className="flex justify-between items-start mb-6">
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${isFase2Ready ? 'text-emerald-800' : 'text-gray-500'}`}>
              <span className={`${isFase2Ready ? 'bg-emerald-600' : 'bg-gray-400'} text-white w-8 h-8 rounded-full flex items-center justify-center text-lg`}>2</span>
              Fase 2: Correzione Automatica
            </h2>
            {!isFase2Ready && (
              <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Bloccata (Richiede smistamento)
              </span>
            )}
          </div>
          
          {correctError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 shadow-sm mb-4">
              {correctError}
            </div>
          )}

          {/* STATUS SEZIONE */}
          <section className={`group bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all flex flex-col mb-6 ${isFase2Ready ? 'hover:border-green-400 hover:shadow-md' : ''}`}>
            <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Verifica requisiti</h3>
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
                    ? 'Esami scannerizzati e smistati presenti (data/sorted/)' 
                    : 'Esami non ancora smistati (Completa la Fase 1).'}
                </span>
              </div>
            </div>
          </section>

          {/* IMPOSTAZIONI SEZIONE */}
          <div className={`transition-all duration-300 ${!isFase2Ready ? 'pointer-events-none' : ''}`}>
            {isFase2Ready && (
              <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-green-400 hover:shadow-md transition-all flex flex-col mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2 flex items-center">
                  Impostazioni correzione
                  <HelpButton title="Fase di correzione ottica">
                    <p className="mb-3">In questa fase il sistema analizza otticamente gli esami smistati per tutti gli studenti.</p>
                    <p className="mb-3">Il file JSON selezionato verrà ampliato aggiungendo i dati reali appena acquisiti, ovvero calcolando esattamente quali risposte sono state date, omesse o sbagliate da ciascuno studente, in modo da procedere successivamente alla fase di assegnazione dei voti.</p>
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded mt-4">
                      <p className="text-sm text-emerald-800">Selezionando l'apposita spunta, il sistema genererà un file PDF visivo di riepilogo (nella cartella data/corrected) che mostra graficamente i segni rilevati e le correzioni.</p>
                    </div>
                  </HelpButton>
                </h3>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona file JSON</label>
                    <select 
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-emerald-500"
                      value={correctConfig.datafile}
                      onChange={(e) => setCorrectConfig({...correctConfig, datafile: e.target.value})}
                      disabled={correcting}
                    >
                      <option value="">Seleziona...</option>
                      {status.data_files && status.data_files.map((file, idx) => (
                        <option key={idx} value={file}>{file}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 justify-center">
                    <label className="flex items-center gap-2 cursor-pointer mt-5">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                        checked={correctConfig.produce_pdf}
                        onChange={(e) => setCorrectConfig({...correctConfig, produce_pdf: e.target.checked})}
                        disabled={correcting}
                      />
                      <span className="font-medium text-gray-700">Genera PDF esami corretti</span>
                    </label>
                    
                    {correctConfig.produce_pdf && (
                      <div className="ml-7 mt-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome del file PDF di output (salvato in data/corrected/)</label>
                        <input 
                          type="text" 
                          className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-emerald-500"
                          value={correctConfig.pdf_filename}
                          onChange={(e) => setCorrectConfig({...correctConfig, pdf_filename: e.target.value})}
                          placeholder="esami_corretti.pdf"
                          disabled={correcting}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* AZIONE E PROGRESSO CORRECT */}
            <div className="flex flex-col items-center">
              {!correcting && (
                <button
                  onClick={startCorrection}
                  disabled={!isFase2Ready || !correctConfig.datafile}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold shadow hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Avvia correzione automatica
                </button>
              )}

              {correcting && (
                <div className="w-full max-w-2xl mt-4">
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${correctProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-center mt-2 text-sm text-gray-600 font-medium">
                    {correctMessage} ({Math.round(correctProgress)}%)
                  </p>
                </div>
              )}

              {correctSuccess && (
                <div className="mt-8 text-center bg-green-50 text-green-700 p-6 rounded-xl border border-green-200 w-full shadow-sm">
                  <h3 className="text-xl font-bold mb-2">Processo terminato con successo.</h3>
                  <p className="mb-4">{correctSuccess}</p>
                  
                  {correctConfig.produce_pdf && (
                    <p className="mb-4 font-medium text-emerald-800">
                      Il PDF con le correzioni è stato salvato nella cartella <span className="font-mono bg-green-100 px-1 rounded">data/corrected/</span>
                    </p>
                  )}
                  
                  {manualChecks > 0 && (
                    <div className="mb-6 bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200 flex items-start text-left gap-3 max-w-xl mx-auto">
                      <svg className="w-6 h-6 flex-shrink-0 mt-0.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      <div>
                        <p className="font-bold">Attenzione: Revisione manuale consigliata</p>
                        <p className="text-sm mt-1">Il sistema ha individuato <strong>{manualChecks} pagine</strong> con segni dubbi, ambigui o correzioni effettuate a penna dallo studente.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="flex items-center justify-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-900 transition-colors"
                    >
                      Ritorna alla Dashboard
                    </button>
                    {manualChecks > 0 ? (
                      <button 
                        onClick={() => navigate('/manual_correction')}
                        className="px-6 py-3 bg-yellow-500 text-white rounded-lg shadow font-bold hover:bg-yellow-600 transition-colors"
                      >
                        Vai alla Verifica Manuale
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate('/mark')}
                        className="px-6 py-3 bg-orange-600 text-white rounded-lg shadow font-bold hover:bg-orange-700 transition-colors"
                      >
                        Procedi alla Valutazione
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Correct;
