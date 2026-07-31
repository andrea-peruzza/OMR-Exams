import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, CheckSquare, Square, RefreshCcw } from 'lucide-react';
import apiClient from '../api/client';
import { useConfirm } from '../hooks/useConfirm';
import BackButton from '../components/BackButton';
import HomeButton from '../components/HomeButton';

export default function Cleanup() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);
  const { confirm, ConfirmModal } = useConfirm();

  const categories = [
    { id: 'all', label: 'Tutti i file' },
    { id: 'generated_pdfs', label: 'PDF degli esami generati' },
    { id: 'generated_jsons', label: 'JSON degli esami generati' },
    { id: 'scans', label: 'Esami scansionati (scans)' },
    { id: 'sorted', label: 'Immagini degli esami (sorted)' },
    { id: 'corrected', label: 'PDF degli esami corretti' },
    { id: 'reports', label: 'File Excel/Markdown (voti e report)' },
    { id: 'config', label: 'File di configurazione YAML' },
    { id: 'students', label: 'Excel degli studenti (students)' },
    { id: 'questions', label: 'Markdown delle domande (questions)' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/cleanup/files');
      setData(res.data);
      setSelectedFiles(new Set());
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Errore nel caricamento dei file.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFilesToShow = () => {
    if (!data) return [];
    if (category === 'all') {
      let all = [];
      Object.values(data).forEach(files => {
        all = all.concat(files);
      });
      // rimuovi duplicati in caso
      return [...new Set(all)];
    }
    return data[category] || [];
  };

  const filesToShow = getFilesToShow();

  const handleSelectAll = () => {
    if (selectedFiles.size === filesToShow.length) {
      // Deselect all
      setSelectedFiles(new Set());
    } else {
      // Select all in current view
      setSelectedFiles(new Set(filesToShow));
    }
  };

  const handleSelectFile = (file) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(file)) {
      newSelected.delete(file);
    } else {
      newSelected.add(file);
    }
    setSelectedFiles(newSelected);
  };

  const handleDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    const isConfirmed = await confirm(`Sei sicuro di voler eliminare ${selectedFiles.size} file selezionati?`);
    if (!isConfirmed) return;

    setDeleting(true);
    try {
      const payload = { files: Array.from(selectedFiles) };
      const res = await apiClient.delete('/api/cleanup/files', { data: payload });
      setMessage({ type: 'success', text: `Eliminati ${res.data.deleted.length} file con successo.` });
      fetchData(); // Ricarica la lista
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Errore durante l\'eliminazione dei file.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-slate-50 pb-20">
      <ConfirmModal />
      <BackButton />
      <HomeButton />
      <div className="p-8 max-w-5xl mx-auto font-sans pt-12">

      <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
        <Trash2 className="mr-3 text-red-500" size={32} />
        Gestione Dati
      </h1>
      <p className="text-gray-600 mb-8">
        Seleziona ed elimina i file non più necessari generati dal sistema.
      </p>

      {message && (
        <div className={`p-4 rounded-md mb-6 ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row h-[600px]">
        
        {/* Sidebar categorie */}
        <div className="w-full md:w-1/3 border-r border-gray-200 bg-gray-50">
          <div className="p-4 border-b border-gray-200 font-semibold text-gray-700">
            Categorie
          </div>
          <ul className="flex flex-col">
            {categories.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => { setCategory(c.id); setSelectedFiles(new Set()); }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${category === c.id ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500 font-medium' : 'text-gray-600 hover:bg-gray-100 border-l-4 border-transparent'}`}
                >
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Elenco file */}
        <div className="w-full md:w-2/3 flex flex-col">
          {category === 'generated_jsons' && (
            <div className="bg-yellow-50 text-yellow-800 p-3 text-sm border-b border-yellow-200">
              Nel caso ci si accorga che il file JSON appena cancellato serva ancora, si può ripristinare alla seguente <Link to="/backup" className="font-semibold underline hover:text-yellow-900">pagina</Link>.
            </div>
          )}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
            <h2 className="font-semibold text-gray-700">
              {categories.find(c => c.id === category)?.label} ({filesToShow.length} file)
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={fetchData} 
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Aggiorna lista"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
            {loading ? (
              <div className="flex justify-center items-center h-full text-gray-400">
                Caricamento in corso...
              </div>
            ) : filesToShow.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-400">
                Nessun file trovato in questa categoria.
              </div>
            ) : (
              <ul className="space-y-2">
                {filesToShow.map((file, idx) => (
                  <li key={idx} className="flex items-center p-3 bg-white border border-gray-200 rounded-md shadow-sm hover:border-blue-300 transition-colors">
                    <button 
                      onClick={() => handleSelectFile(file)}
                      className="mr-3 text-gray-400 hover:text-blue-500 focus:outline-none"
                    >
                      {selectedFiles.has(file) ? <CheckSquare className="text-blue-500" size={20} /> : <Square size={20} />}
                    </button>
                    <span className="text-sm text-gray-700 break-all">{file.split('/').pop()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer azioni */}
          <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={handleSelectAll}
                disabled={filesToShow.length === 0}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 font-medium"
              >
                {selectedFiles.size === filesToShow.length && filesToShow.length > 0 ? 'Deseleziona tutti' : 'Seleziona tutti'}
              </button>
              <span className="ml-4 text-sm text-gray-500">
                {selectedFiles.size} file selezionati
              </span>
            </div>
            
            <button
              onClick={handleDelete}
              disabled={selectedFiles.size === 0 || deleting}
              className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center "
            >
              {deleting ? 'Eliminazione...' : 'Cancella'}
            </button>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}
