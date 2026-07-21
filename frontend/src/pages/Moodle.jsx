import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { moodleAPI } from '../api/client';
import { Library, Upload, Download, CheckCircle, FileCode2 } from 'lucide-react';
import BackButton from '../components/BackButton';

export default function Moodle() {
  const [tab, setTab] = useState('export'); // 'export' or 'import'
  const [loading, setLoading] = useState(true);

  // Files
  const [questionsFiles, setQuestionsFiles] = useState([]);
  const [xmlFiles, setXmlFiles] = useState([]);

  // Export State
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [single, setSingle] = useState(false);
  const [penalty, setPenalty] = useState(0);
  const [exportOutput, setExportOutput] = useState('export_moodle.xml');
  
  const [exportLoading, setExportLoading] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportError, setExportError] = useState(null);

  // Import State
  const [selectedXml, setSelectedXml] = useState('');
  
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const qRes = await moodleAPI.getQuestionsFiles();
      setQuestionsFiles(qRes.files || []);
      
      const xmlRes = await moodleAPI.getXmlFiles();
      setXmlFiles(xmlRes.files || []);
      if (xmlRes.files && xmlRes.files.length > 0) {
        setSelectedXml(xmlRes.files[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionFile = (file) => {
    setSelectedQuestions(prev => 
      prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]
    );
  };

  const handleExport = async () => {
    if (selectedQuestions.length === 0 || !exportOutput) return;
    setExportLoading(true);
    setExportError(null);
    setExportResult(null);
    try {
      const reqData = {
        files: selectedQuestions,
        single: single,
        penalty: parseInt(penalty) || 0,
        outputfile: exportOutput
      };
      const res = await moodleAPI.exportToMoodle(reqData);
      setExportResult(res);
      // Ricarichiamo i file xml dato che ne abbiamo appena creato uno nuovo
      loadFiles();
    } catch (e) {
      setExportError(e.response?.data?.detail || "Errore durante l'esportazione");
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedXml) return;
    setImportLoading(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await moodleAPI.importFromMoodle({ xml_file: selectedXml });
      setImportResult(res);
      // Ricarichiamo le domande dato che ne abbiamo create di nuove
      loadFiles();
    } catch (e) {
      setImportError(e.response?.data?.detail || "Errore durante l'importazione");
    } finally {
      setImportLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setImportError(null);
    setImportResult(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await moodleAPI.uploadXml(formData);
      // Ricarica la lista dei file XML
      await loadFiles();
      // Imposta il file appena caricato come selezionato
      setSelectedXml(res.filename);
    } catch (err) {
      setImportError(err.response?.data?.detail || "Errore durante il caricamento del file");
    } finally {
      setUploading(false);
    }
  };

  if (loading && questionsFiles.length === 0 && xmlFiles.length === 0) {
    return <div className="p-8 text-center animate-pulse">Caricamento in corso...</div>;
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-200 via-white to-white">
      <BackButton />
      <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
        <header className="flex items-center gap-4 border-b pb-4">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-700">
            <Library size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Convertitore Moodle</h1>
            <p className="text-gray-600 mt-1">Esporta le domande da Markdown a XML per Moodle o importa XML per usarli nel generatore.</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b">
          <button 
            onClick={() => setTab('export')}
            className={`flex-1 py-4 flex justify-center items-center gap-2 font-semibold transition-colors ${tab === 'export' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Upload size={20} />
            Esportazione verso Moodle
          </button>
          <button 
            onClick={() => setTab('import')}
            className={`flex-1 py-4 flex justify-center items-center gap-2 font-semibold transition-colors ${tab === 'import' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Download size={20} />
            Importazione da Moodle
          </button>
        </div>

        {tab === 'export' && (
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-400 hover:shadow-md space-y-6">
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Upload size={20} className="text-indigo-600" /> Esporta XML
            </h2>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Seleziona i file delle domande da includere:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 border rounded bg-gray-50">
                {questionsFiles.length > 0 ? questionsFiles.map(f => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                    <input 
                      type="checkbox" 
                      checked={selectedQuestions.includes(f)}
                      onChange={() => toggleQuestionFile(f)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-mono text-sm text-gray-700">{f}</span>
                  </label>
                )) : (
                  <p className="text-sm text-gray-500 col-span-2">Nessun file markdown trovato in /questions</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 h-full">
                  <input 
                    type="checkbox" 
                    checked={single} 
                    onChange={(e) => setSingle(e.target.checked)} 
                    className="rounded text-indigo-600 focus:ring-indigo-500" 
                  />
                  Singola risposta corretta
                </label>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Penalità %</label>
                <input 
                  type="number" 
                  value={penalty} 
                  onChange={(e) => setPenalty(e.target.value)} 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500" 
                  min="0" max="100" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome file output (.xml)</label>
                <input 
                  type="text" 
                  value={exportOutput} 
                  onChange={(e) => setExportOutput(e.target.value)} 
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>

            <button 
              onClick={handleExport} 
              disabled={exportLoading || selectedQuestions.length === 0 || !exportOutput}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {exportLoading ? 'Conversione in corso...' : 'Converti in XML'}
            </button>

            {exportError && <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">{exportError}</div>}
            
            {exportResult && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-emerald-800 flex items-start gap-3">
                <CheckCircle className="mt-0.5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-lg">{exportResult.message}</p>
                  <p className="mt-1">
                    File generati presenti nella cartella <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded">{exportResult.path}</span>:
                  </p>
                  <ul className="list-disc ml-5 mt-2 font-mono text-sm">
                    {exportResult.files.map(f => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'import' && (
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-400 hover:shadow-md space-y-6">
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 flex items-center gap-2">
              <Download size={20} className="text-indigo-600" /> Importa Markdown
            </h2>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col items-center justify-center space-y-4">
              <FileCode2 size={48} className="text-blue-400" />
              
              <div className="w-full max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Carica un nuovo file XML dal tuo PC</label>
                  <input 
                    type="file" 
                    accept=".xml"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                  />
                </div>
                
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OPPURE</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Seleziona un file XML già presente nella cartella</label>
                  <select 
                    value={selectedXml} 
                    onChange={(e) => setSelectedXml(e.target.value)} 
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {xmlFiles.length > 0 ? (
                      xmlFiles.map(f => <option key={f} value={f}>{f}</option>)
                    ) : (
                      <option value="">Nessun file XML trovato in /data</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <button 
              onClick={handleImport} 
              disabled={importLoading || !selectedXml}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {importLoading ? 'Importazione in corso...' : 'Converti in Markdown'}
            </button>

            {importError && <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">{importError}</div>}
            
            {importResult && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-emerald-800 flex items-start gap-3">
                <CheckCircle className="mt-0.5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-lg">{importResult.message}</p>
                  <p className="mt-1">
                    Il file <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded">{importResult.file}</span> è stato generato e posizionato nella cartella <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded">{importResult.path}</span>.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Ritorno alla Dashboard */}
        <div className="flex justify-center mt-12">
          <Link to="/dashboard" className="px-6 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-900 transition-colors">
            Torna alla Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
