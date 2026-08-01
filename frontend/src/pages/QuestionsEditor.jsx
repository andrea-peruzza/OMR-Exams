import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit } from 'lucide-react';
import { generateAPI } from '../api/client';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import BackButton from '../components/BackButton';
import HomeButton from '../components/HomeButton';
import { usePrompt } from '../hooks/usePrompt';

export default function QuestionsEditor() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('new');
  const [filename, setFilename] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [availableFiles, setAvailableFiles] = useState([]);
  const [availableJsons, setAvailableJsons] = useState([]);
  const [updateExams, setUpdateExams] = useState(false);
  const [selectedJsonFile, setSelectedJsonFile] = useState('');
  
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState(null);
  const { prompt, PromptModal } = usePrompt();

  useEffect(() => {
    generateAPI.getFiles().then(res => {
      if (res.questions) setAvailableFiles(res.questions);
      if (res.jsons) setAvailableJsons(res.jsons);
    });
  }, [status]); // Reload files on successful save

  const loadAndParseFile = async (selectedFile) => {
    if (!selectedFile) {
      setQuestions([]);
      setFileTitle('');
      return;
    }
    try {
      const res = await generateAPI.readQuestions(selectedFile);
      if (res.content) {
        const text = res.content;
        const titleMatch = text.match(/^#\s+(.+)/m);
        if (titleMatch) setFileTitle(titleMatch[1].trim());
        else setFileTitle('');

        const blocks = text.split(/^---$/m).map(b => b.trim()).filter(b => b.length > 0 && !b.startsWith('# '));
        const parsedQuestions = blocks.map((block, idx) => {
          const closedMatch = block.match(/^##\s+(.+)/m);
          if (closedMatch) {
            const qText = closedMatch[1].trim();
            const answers = [];
            const ansRegex = /^- \[(x|X| )\]\s+(.+)/gm;
            let m;
            while ((m = ansRegex.exec(block)) !== null) {
              answers.push({ correct: m[1].toLowerCase() === 'x', text: m[2].trim() });
            }
            return {
              id: Date.now() + idx,
              type: 'closed',
              text: qText,
              answers,
              lines: 5,
              vspace: 0.5,
              vspaceModified: false
            };
          }
          const openMatch = block.match(/^###\s+(.+)/m);
          if (openMatch) {
            const qText = openMatch[1].trim();
            let vspace = 0.5;
            let lines = 5;
            const vspaceMatch = block.match(/\\vspace\{([\d.-]+)cm\}/);
            if (vspaceMatch) {
              const k = parseFloat(vspaceMatch[1]);
              vspace = parseFloat((0.8 + k).toFixed(2));
            }
            const linesMatch = block.match(/\{lines:([\d.-]+)cm\}/);
            if (linesMatch) {
              lines = parseFloat(linesMatch[1]);
            }
            return {
              id: Date.now() + idx,
              type: 'open',
              text: qText,
              answers: [],
              lines,
              vspace,
              vspaceModified: true
            };
          }
          return null;
        }).filter(q => q !== null);
        setQuestions(parsedQuestions);
      }
    } catch (e) {
      setStatus({ type: 'error', message: 'Impossibile caricare il file.' });
    }
  };

  useEffect(() => {
    if (mode === 'edit' && filename) {
      loadAndParseFile(filename);
    }
  }, [mode, filename]);

  const addQuestion = (type) => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        type,
        text: '',
        answers: type === 'closed' ? [{ text: '', correct: false }, { text: '', correct: false }] : [],
        lines: 5,
        vspace: 0.5,
        vspaceModified: false
      }
    ]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (field === 'text' && q.type === 'open' && !q.vspaceModified) {
          return { ...q, text: value, vspace: value.length >= 85 ? 0.6 : 0.5 };
        }
        if (field === 'vspace') {
          return { ...q, [field]: value, vspaceModified: true };
        }
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const addAnswer = (qId) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, answers: [...q.answers, { text: '', correct: false }] };
      }
      return q;
    }));
  };

  const updateAnswer = (qId, aIndex, field, value) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newAnswers = [...q.answers];
        newAnswers[aIndex] = { ...newAnswers[aIndex], [field]: value };
        return { ...q, answers: newAnswers };
      }
      return q;
    }));
  };

  const removeAnswer = (qId, aIndex) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newAnswers = q.answers.filter((_, i) => i !== aIndex);
        return { ...q, answers: newAnswers };
      }
      return q;
    }));
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSave = async () => {
    if (!filename) {
      setStatus({ type: 'error', message: 'Inserisci o seleziona un nome per il file.' });
      return;
    }
    if (questions.length === 0) {
      setStatus({ type: 'error', message: 'Aggiungi almeno una domanda.' });
      return;
    }
    
    // Validazione base
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text.trim()) {
             setStatus({ type: 'error', message: `La domanda ${i+1} non ha testo.` });
             return;
        }
        if (q.type === 'closed') {
             if (q.answers.length < 2) {
                 setStatus({ type: 'error', message: `La domanda ${i+1} deve avere almeno 2 risposte.` });
                 return;
             }
             for (let j = 0; j < q.answers.length; j++) {
                 if (!q.answers[j].text.trim()) {
                     setStatus({ type: 'error', message: `Una risposta della domanda ${i+1} è vuota.` });
                     return;
                 }
             }
             if (!q.answers.some(a => a.correct)) {
                 setStatus({ type: 'error', message: `La domanda ${i+1} deve avere almeno una risposta corretta.` });
                 return;
             }
        }
    } // FINE CICLO FOR

    if (mode === 'new' && !fileTitle.trim()) {
        setStatus({ type: 'error', message: 'Il titolo del file è obbligatorio per i nuovi file.' });
        return;
    }

    const finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;

    let appendMode = mode === 'existing';
    if (mode === 'edit') appendMode = false;
    let finalFilenameToUse = finalFilename;

    if (mode === 'new' && availableFiles.includes(finalFilename)) {
        const response = await prompt(
            `Il file "${finalFilename}" esiste già. Cosa vuoi fare? Se scegli "Cambia nome", modifica il nome nel campo di testo qui sotto.`,
            finalFilename,
            [
                { label: 'Annulla', value: 'cancel', className: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' },
                { label: 'Sovrascrivi', value: 'overwrite', className: 'bg-red-600 text-white hover:bg-red-700' },
                { label: 'Aggiungi', value: 'append', className: 'bg-green-600 text-white hover:bg-green-700' },
                { label: 'Cambia Nome e Salva', value: 'rename', className: 'bg-blue-600 text-white hover:bg-blue-700' }
            ]
        );

        if (!response || response.action === 'cancel') {
            return;
        } else if (response.action === 'overwrite') {
            appendMode = false;
        } else if (response.action === 'append') {
            appendMode = true;
        } else if (response.action === 'rename') {
            const newName = response.inputValue.endsWith('.md') ? response.inputValue : `${response.inputValue}.md`;
            if (availableFiles.includes(newName)) {
                setStatus({ type: 'error', message: 'Il nuovo nome inserito esiste già. Riprova.' });
                return;
            }
            appendMode = false;
            finalFilenameToUse = newName;
            setFilename(newName);
        }
    }

    let markdown = '';
    if ((mode === 'new' || mode === 'edit') && !appendMode && fileTitle.trim()) {
        markdown += `# ${fileTitle.trim()}\n\n`;
    }

    questions.forEach(q => {
      markdown += '---\n\n';
      if (q.type === 'closed') {
        markdown += `## ${q.text}\n`;
        q.answers.forEach(a => {
          markdown += `- [${a.correct ? 'x' : ' '}] ${a.text}\n`;
        });
      } else {
        markdown += `### ${q.text}\n`;
        const k = - (0.8 - (parseFloat(q.vspace) || 0));
        markdown += `\\vspace{${Number(k.toFixed(2))}cm}\n`;
        markdown += `{lines:${q.lines}cm}\n`;
      }
      markdown += '\n';
    });

    try {
      await generateAPI.saveQuestions({
        filename: finalFilenameToUse,
        content: markdown,
        append: appendMode
      });
      
      let updateMsg = '';
      if (mode === 'edit' && updateExams && selectedJsonFile) {
        await generateAPI.updateCorrected({
            question_files: [finalFilenameToUse],
            datafile: selectedJsonFile
        });
        updateMsg = ' ed esami aggiornati';
      }

      setStatus({ type: 'success', message: 'Domande salvate con successo nel file: ' + finalFilenameToUse + updateMsg });
      if (mode === 'new') {
        setQuestions([]);
        setMode('existing');
        setFilename(finalFilenameToUse);
        setFileTitle('');
      } else if (mode === 'existing') {
        setQuestions([]);
      }
      // If mode === 'edit', we keep the questions populated so the user can continue editing.
    } catch (e) {
      setStatus({ type: 'error', message: 'Errore durante il salvataggio.' });
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-200 via-white to-white">
      <BackButton />
      <HomeButton />
      <div className="max-w-6xl mx-auto p-6 space-y-8 pb-20">
        <header className="flex items-center gap-4 border-b pb-4 mb-8">
          <div className="bg-blue-100 p-3 rounded-full text-blue-700">
            <FileEdit size={32} />
          </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Editor Domande</h1>
          <p className="text-gray-600 mt-1">Aggiungi nuove domande ai file markdown in modo semplice e guidato.</p>
        </div>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Destinazione file</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex items-center gap-2">
            <input 
              type="radio" 
              id="mode-new" 
              checked={mode === 'new'} 
              onChange={() => { setMode('new'); setFilename(''); }} 
            />
            <label htmlFor="mode-new" className="font-semibold text-gray-700">Nuovo file</label>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="radio" 
              id="mode-existing" 
              checked={mode === 'existing'} 
              onChange={() => { 
                setMode('existing'); 
                setFilename(availableFiles[0] || '');
                setQuestions([]);
              }} 
            />
            <label htmlFor="mode-existing" className="font-semibold text-gray-700">Aggiungi a file esistente</label>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="radio" 
              id="mode-edit" 
              checked={mode === 'edit'} 
              onChange={() => { 
                setMode('edit'); 
                setFilename(availableFiles[0] || '');
              }} 
            />
            <label htmlFor="mode-edit" className="font-semibold text-gray-700">Modifica file già esistente</label>
          </div>
        </div>

        {mode === 'new' ? (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome del nuovo file (.md)</label>
              <input 
                type="text" 
                className="w-full border rounded-lg p-2" 
                placeholder="es. esame_matematica"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
              <input 
                type="text" 
                className="w-full border rounded-lg p-2" 
                placeholder="es. Esame di Matematica"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona file esistente</label>
            <select 
              className="w-full border rounded-lg p-2"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            >
              <option value="">-- Seleziona --</option>
              {availableFiles.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => removeQuestion(q.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full" title="Rimuovi domanda">
                <Trash2 size={20} />
              </button>
            </div>
            
            <h3 className="text-lg font-bold mb-4 text-blue-900">Domanda {idx + 1} ({q.type === 'closed' ? 'Chiusa' : 'Aperta'})</h3>
            
            <div className="mb-4">
              <label className="flex justify-between items-end text-sm font-medium text-gray-700 mb-1">
                <span>Testo della domanda</span>
                {q.type === 'open' && (
                  <span className="text-xs text-gray-500">{q.text.length} caratteri</span>
                )}
              </label>
              <textarea 
                className="w-full border rounded-lg p-2"
                rows="2"
                value={q.text}
                onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                placeholder="Inserisci la domanda..."
              />
            </div>

            {q.type === 'open' && (
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spazio per la risposta (in cm)</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full border rounded-lg p-2"
                    value={q.lines}
                    onChange={(e) => updateQuestion(q.id, 'lines', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spazio dall'inizio della risposta (in cm)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.1"
                    className="w-full border rounded-lg p-2"
                    value={q.vspace}
                    onChange={(e) => updateQuestion(q.id, 'vspace', e.target.value)}
                  />
                </div>
              </div>
            )}

            {q.type === 'closed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risposte</label>
                <div className="space-y-2">
                  {q.answers.map((ans, aIdx) => (
                    <div key={aIdx} className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        checked={ans.correct}
                        onChange={(e) => updateAnswer(q.id, aIdx, 'correct', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        title="Segna come risposta corretta"
                      />
                      <input 
                        type="text"
                        className={`flex-1 border rounded-lg p-2 ${ans.correct ? 'border-green-400 bg-green-50' : ''}`}
                        value={ans.text}
                        onChange={(e) => updateAnswer(q.id, aIdx, 'text', e.target.value)}
                        placeholder={`Risposta ${aIdx + 1}`}
                      />
                      <button onClick={() => removeAnswer(q.id, aIdx)} className="text-gray-400 hover:text-red-500 p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => addAnswer(q.id)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <Plus size={16} /> Aggiungi risposta
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 border-t pt-8">
        <div className="flex gap-4">
          <button 
            onClick={() => addQuestion('closed')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Domanda Chiusa
          </button>
          <button 
            onClick={() => addQuestion('open')}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Domanda Aperta
          </button>
        </div>

        {mode === 'edit' && (
            <div className="w-full max-w-lg mt-6 bg-gray-50 p-4 rounded-xl border">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800 mb-3">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  checked={updateExams}
                  onChange={(e) => setUpdateExams(e.target.checked)}
                />
                Aggiorna esami già generati
              </label>
              {updateExams && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Seleziona il file JSON da aggiornare</label>
                    <select 
                      className="w-full border rounded-lg p-2"
                      value={selectedJsonFile}
                      onChange={(e) => setSelectedJsonFile(e.target.value)}
                    >
                      <option value="">-- Seleziona --</option>
                      {availableJsons.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
              )}
            </div>
        )}

        {questions.length > 0 && (
          <button 
            onClick={handleSave}
            className={`px-8 py-3 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 mt-4 ${mode === 'edit' && updateExams ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <Save size={20} /> 
            {mode === 'edit' && updateExams ? 'Salva domande e aggiorna esami' : 'Salva nel Markdown'}
          </button>
        )}

        {status && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            {status.message}
          </div>
        )}
      </div>
      <PromptModal />
    </div>
    </div>
  );
}
