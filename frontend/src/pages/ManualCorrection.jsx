import { useState, useEffect } from 'react';
import { manualAPI, correctAPI } from '../api/client';
import PDFPreview from '../components/PDFPreview';
import { useNavigate } from 'react-router-dom';

export default function ManualCorrection() {
  const [dataFiles, setDataFiles] = useState([]);
  const [datafile, setDatafile] = useState('');
  
  const [mode, setMode] = useState(null); // 'scans' or 'missing'
  
  // Scans Mode State
  const [scansList, setScansList] = useState([]);
  const [selectedScan, setSelectedScan] = useState('');
  
  // Missing Mode State
  const [missingList, setMissingList] = useState([]);
  const [currentMissingIndex, setCurrentMissingIndex] = useState(0);
  
  // Student Data (Shared for correction panel)
  const [currentStudentId, setCurrentStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  
  // Feedback
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await correctAPI.getStatus();
      setDataFiles(res.data_files || []);
    } catch (e) {
      console.error(e);
      setError("Errore nel caricamento dei dati di base");
    }
  };

  const loadScans = async () => {
    try {
      const res = await manualAPI.getScans();
      setScansList(res.scans || []);
      setMode('scans');
      setCurrentStudentId('');
      setStudentData(null);
      if (res.scans.length > 0) setSelectedScan(res.scans[0]);
    } catch (e) {
      setError("Errore nel caricamento delle scansioni");
    }
  };

  const loadMissing = async () => {
    if (!datafile) {
      setError("Seleziona prima un file JSON");
      return;
    }
    try {
      const res = await manualAPI.getMissing(datafile);
      setMissingList(res.missing || []);
      setMode('missing');
      setCurrentMissingIndex(0);
      if (res.missing && res.missing.length > 0) {
        handleStudentSelect(res.missing[0].student_id);
      } else {
        setMessage("Tutti gli esami sono stati corretti correttamente!");
        setCurrentStudentId('');
        setStudentData(null);
      }
    } catch (e) {
      setError("Errore nel caricamento degli esami dubbi");
    }
  };

  const handleStudentSelect = async (id) => {
    if (!datafile || !id) return;
    setCurrentStudentId(id);
    try {
      const res = await manualAPI.getStudentData(datafile, id);
      setStudentData(res);
    } catch (e) {
      setError("Errore nel caricamento dei dati dello studente");
    }
  };

  const handleForceAnswer = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const question = parseInt(fd.get('question'));
    const given_answers = fd.get('given_answers');
    
    if (!question || !given_answers) return;
    
    try {
      await manualAPI.forceAnswer({
        datafile,
        student_id: currentStudentId,
        question,
        given_answers
      });
      setMessage(`Risposta alla domanda ${question} forzata con successo!`);
      // Ricarica i dati per aggiornare la maschera
      handleStudentSelect(currentStudentId);
    } catch (e) {
      setError(e.response?.data?.detail || "Errore durante il salvataggio");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-white to-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6 pb-20">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Verifica Manuale</h1>
          <p className="text-gray-600 mt-2">Gestisci gli esami dubbi e correggi le risposte manualmente.</p>
        </header>


        {/* SELEZIONE DATAFILE */}
        <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-yellow-400 hover:shadow-md transition-all flex flex-col">
          <label className="font-semibold text-gray-700">Database JSON Attivo:</label>
          <select 
            className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-orange-500 w-64"
            value={datafile}
            onChange={(e) => setDatafile(e.target.value)}
          >
            <option value="">Seleziona...</option>
            {dataFiles.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </section>

        {/* MODALITA' */}
        <div className="grid grid-cols-2 gap-6">
          <button 
            onClick={loadScans}
            className={`p-6 rounded-xl border-2 transition-all ${mode === 'scans' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white shadow-sm'}`}
          >
            <h3 className="text-xl font-bold text-blue-800 mb-2">Tutti gli esami (Scans PDF)</h3>
            <p className="text-sm text-gray-600">Visualizza i PDF completi originali scansionati.</p>
          </button>
          
          <button 
            onClick={loadMissing}
            className={`p-6 rounded-xl border-2 transition-all ${mode === 'missing' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300 bg-white shadow-sm'}`}
          >
            <h3 className="text-xl font-bold text-orange-800 mb-2">Esami Dubbi (Da Verificare)</h3>
            <p className="text-sm text-gray-600">Visualizza solo i fogli che il sistema non è riuscito a leggere in automatico.</p>
          </button>
        </div>

        {/* VISTA SCANS */}
        {mode === 'scans' && (
          <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-yellow-400 hover:shadow-md transition-all flex flex-col">
            <div className="flex items-center gap-4">
              <label className="font-semibold text-gray-700">Seleziona PDF:</label>
              <select 
                className="border border-gray-300 p-2 rounded w-64"
                value={selectedScan}
                onChange={(e) => setSelectedScan(e.target.value)}
              >
                {scansList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="border border-gray-200 rounded overflow-hidden">
              {selectedScan ? (
                <PDFPreview url={`http://localhost:5000/api/data/scans/${selectedScan}`} />
              ) : (
                <p className="p-4 text-gray-500">Nessun file selezionato</p>
              )}
            </div>
          </section>
        )}

        {/* VISTA MISSING (DUBBI) */}
        {mode === 'missing' && missingList.length > 0 && (
          <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-yellow-400 hover:shadow-md transition-all flex flex-col">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
              <button 
                onClick={() => {
                  const newIdx = Math.max(0, currentMissingIndex - 1);
                  setCurrentMissingIndex(newIdx);
                  handleStudentSelect(missingList[newIdx].student_id);
                }}
                disabled={currentMissingIndex === 0}
                className="px-4 py-2 bg-white border border-gray-300 rounded shadow-sm disabled:opacity-50 hover:bg-gray-50"
              >
                &larr; Precedente
              </button>
              <div className="text-center">
                <span className="font-bold text-lg text-gray-800">Studente ID: {missingList[currentMissingIndex].student_id}</span>
                <p className="text-sm text-gray-500">Esame {currentMissingIndex + 1} di {missingList.length}</p>
              </div>
              <button 
                onClick={() => {
                  const newIdx = Math.min(missingList.length - 1, currentMissingIndex + 1);
                  setCurrentMissingIndex(newIdx);
                  handleStudentSelect(missingList[newIdx].student_id);
                }}
                disabled={currentMissingIndex === missingList.length - 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded shadow-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Successivo &rarr;
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto p-4 bg-gray-100 rounded-lg">
              {missingList[currentMissingIndex].images.map(img => (
                <img 
                  key={img} 
                  src={`http://localhost:5000/api/data/sorted/${img}`} 
                  alt="Exam Page" 
                  className="max-h-[600px] object-contain border bg-white shadow-sm"
                />
              ))}
              {missingList[currentMissingIndex].images.length === 0 && (
                <p className="text-gray-500 italic p-4">Nessuna immagine trovata in sorted per questo studente.</p>
              )}
            </div>
          </section>
        )}

        {/* STRUMENTI DI CORREZIONE (Visibile in entrambe le modalità se c'è un file caricato e inseriamo manuale) */}
        <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-yellow-400 hover:shadow-md transition-all flex flex-col">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Pannello Correzione Manuale</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 shadow-sm flex justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="font-bold">&times;</button>
            </div>
          )}
          
          {message && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-lg border border-emerald-200 shadow-sm flex justify-between">
              <span>{message}</span>
              <button onClick={() => setMessage('')} className="font-bold">&times;</button>
            </div>
          )}
          
          <div className="flex gap-4 items-end bg-blue-50 p-4 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Studente ID in esame:</label>
              <input 
                type="text" 
                value={currentStudentId} 
                onChange={(e) => setCurrentStudentId(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Inserisci ID studente..."
              />
            </div>
            <button 
              onClick={() => handleStudentSelect(currentStudentId)}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            >
              Carica Maschera
            </button>
          </div>

          {studentData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              
              {/* Tabella Get Answers / Correction Mask */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">Stato Risposte Attuale (Get Answers)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border">Q</th>
                        <th className="p-2 border">Ref Correct</th>
                        <th className="p-2 border">Marked</th>
                        <th className="p-2 border">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.answers_status.map((ans, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2 border font-mono">{ans.question}</td>
                          <td className="p-2 border text-emerald-600">{Array.isArray(ans.correct_ref) ? ans.correct_ref.join(', ') : ans.correct_ref}</td>
                          <td className="p-2 border text-orange-600 font-bold">{Array.isArray(ans.marked) ? ans.marked.join(', ') : ans.marked || '-'}</td>
                          <td className="p-2 border">{ans.marking}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Force Answer */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Forza Risposta (Force Answer)</h3>
                <form onSubmit={handleForceAnswer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N. Domanda</label>
                    <input 
                      name="question"
                      type="number" 
                      min="1" 
                      required
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risposta (es. A, AC, D...)</label>
                    <input 
                      name="given_answers"
                      type="text" 
                      required
                      placeholder="Stringa senza spazi"
                      className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2 bg-yellow-500 text-white font-bold rounded shadow hover:bg-yellow-600"
                  >
                    Applica Modifica
                  </button>
                </form>
              </div>
              
            </div>
          )}

        </section>

        <div className="flex justify-center gap-4 pt-4 border-t">
          <button 
              onClick={() => navigate('/mark')}
              className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg shadow-md hover:bg-orange-700 transition-colors"
            >
              Assegna i voti &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
