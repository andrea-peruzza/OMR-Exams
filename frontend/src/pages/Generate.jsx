import React, { useState, useEffect } from 'react';
import { generateAPI } from '../api/client';
import { Play, Upload, CheckCircle2, AlertCircle, ArrowLeft, FilePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PDFPreview from '../components/PDFPreview';
import BackButton from '../components/BackButton';
import HelpButton from '../components/HelpButton';

export default function Generate() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    exam: { name: 'Esame', language: 'it', shuffle_questions: true, shuffle_answers: true, max_questions: '', max_open_questions: '', page_limits: 2 },
    choices: { circled: false, usesf: false },
    paper: 'A4',
    dyslexia: false,
    header: '',
    footer: '',
    preamble: '',
    excel: {
      data_marker: { skip_until: '', on_column: 0, skip_rows: 0 },
      fields: { id: 'id', name: 'name', surname: 'surname', email: '' }
    },
    questions: []
  });

  const [runtime, setRuntime] = useState({
    date: new Date().toISOString().split('T')[0],
    is_anonymous: false,
    num_anonymous_exams: 1,
    selected_student_file: '',
    output_prefix: 'esame_generato',
    split: '',
    seed: 42,
    folded: true,
    rotated: false,
    save_config: false
  });

  const [availableFiles, setAvailableFiles] = useState({ questions: [], students: [] });
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [dataDir, setDataDir] = useState('');
  const [configPresent, setConfigPresent] = useState(false);

  useEffect(() => {
    loadFiles();
    checkConfigStatus();
  }, []);

  const checkConfigStatus = async () => {
    try {
      const savedConfig = await generateAPI.getConfig();
      if (savedConfig && Object.keys(savedConfig).length > 0) {
        setConfigPresent(true);
      } else {
        setConfigPresent(false);
      }
    } catch (e) {
      console.error(e);
      setConfigPresent(false);
    }
  };

  useEffect(() => {
    if (!taskId) return;
    const sse = new EventSource(`http://localhost:5000/api/sse/stream/${taskId}`);
    sse.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.error) {
        setError(data.error);
        sse.close();
      } else {
        setProgress(data);
        if (data.completed) sse.close();
      }
    };
    sse.onerror = () => {
      setError("Connessione SSE persa.");
      sse.close();
    };
    return () => sse.close();
  }, [taskId]);

  const loadFiles = async () => {
    try {
      const files = await generateAPI.getFiles();
      setAvailableFiles(files);
    } catch (e) {
      console.error(e);
    }
  };

  const loadConfig = async () => {
    try {
      const savedConfig = await generateAPI.getConfig();
      if (savedConfig && Object.keys(savedConfig).length > 0) {
        setConfig(prev => ({ ...prev, ...savedConfig }));
        if (savedConfig.students) {
          setRuntime(prev => ({ ...prev, is_anonymous: false, selected_student_file: savedConfig.students }));
        }
      } else {
        alert("Nessun config.yaml trovato.");
      }
    } catch (e) {
      alert("Errore caricamento config");
    }
  };

  const handleUploadQuestion = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await generateAPI.uploadQuestion(file);
    loadFiles();
  };

  const handleUploadStudent = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await generateAPI.uploadStudent(file);
    loadFiles();
  };

  const handleStart = async () => {
    setError(null);
    setProgress(null);
    
    // Funzione helper per tradurre linguaggio naturale in LaTeX
    const translateToLatex = (text) => {
      if (!text) return text;
      let latex = text;
      latex = latex.replace(/Numero di pagina/gi, '\\thepage');
      latex = latex.replace(/Data dell'esame/gi, 'Data: \\thedate');
      latex = latex.replace(/Nome del candidato/gi, 'Candidato: \\thestudent');
      latex = latex.replace(/Matricola/gi, 'Matricola: \\thematriculationno');
      latex = latex.replace(/\n/g, ' \\newline ');
      return latex;
    };

    // Clean up config before sending
    const payloadConfig = { ...config };
    payloadConfig.header = translateToLatex(payloadConfig.header);
    payloadConfig.preamble = translateToLatex(payloadConfig.preamble);
    payloadConfig.footer = translateToLatex(payloadConfig.footer);

    if (!payloadConfig.exam.max_questions) delete payloadConfig.exam.max_questions;
    if (!payloadConfig.exam.max_open_questions) delete payloadConfig.exam.max_open_questions;
    if (!payloadConfig.exam.page_limits) delete payloadConfig.exam.page_limits;
    
    // Process questions mapping
    const mappedQuestions = payloadConfig.questions.filter(q => q.from && q.draw).map(q => ({
      from: q.from,
      draw: parseInt(q.draw, 10)
    }));
    payloadConfig.questions = mappedQuestions.length > 0 ? mappedQuestions : undefined;

    const reqData = {
      config: payloadConfig,
      save_config: runtime.save_config,
      date: runtime.date,
      is_anonymous: runtime.is_anonymous,
      num_anonymous_exams: runtime.is_anonymous ? parseInt(runtime.num_anonymous_exams, 10) : undefined,
      selected_student_file: runtime.is_anonymous ? undefined : runtime.selected_student_file,
      output_prefix: runtime.output_prefix,
      split: runtime.split ? parseInt(runtime.split, 10) : undefined,
      seed: parseInt(runtime.seed, 10),
      folded: runtime.folded,
      rotated: runtime.rotated
    };

    try {
      const res = await generateAPI.startGeneration(reqData);
      setTaskId(res.task_id);
      setDataDir(res.data_dir);
    } catch (e) {
      let errorMsg = e.message;
      if (e.response?.data?.detail) {
        errorMsg = typeof e.response.data.detail === 'string' 
          ? e.response.data.detail 
          : JSON.stringify(e.response.data.detail);
      }
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-blue-200 via-white to-white">
      <BackButton />
      <div className="max-w-5xl mx-auto p-8 font-sans">
        <header className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full text-blue-700">
              <FilePlus size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Genera esami</h1>
              <p className="text-gray-600 mt-1">Genera esami in base alla configurazione fornita.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur rounded-lg shadow-sm border border-gray-100">
              <span className={`w-3 h-3 rounded-full ${configPresent ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm font-medium text-gray-700">
                {configPresent ? 'Config. presente' : 'Nessun config.yaml'}
              </span>
            </div>
            <button 
              onClick={loadConfig} 
              disabled={!configPresent}
              className="bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Precompila con la configurazione già presente
            </button>
          </div>
        </header>



      <div className="space-y-8">
        {/* Sezione Impostazioni esame */}
        <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Impostazioni esame</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titolo esame</label>
              <input type="text" className="w-full border p-2 rounded" value={config.exam.name} onChange={e => setConfig({...config, exam: {...config.exam, name: e.target.value}})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lingua</label>
              <select className="w-full border p-2 rounded" value={config.exam.language} onChange={e => setConfig({...config, exam: {...config.exam, language: e.target.value}})}>
                <option value="it">Italiano</option>
                <option value="en">Inglese</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data esame</label>
              <input type="date" className="w-full border p-2 rounded" value={runtime.date} onChange={e => setRuntime({...runtime, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prefisso output file</label>
              <input type="text" className="w-full border p-2 rounded" value={runtime.output_prefix} onChange={e => setRuntime({...runtime, output_prefix: e.target.value})} />
            </div>
          </div>
        </section>

        {/* Sezione Impostazioni studenti */}
        <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Impostazioni studenti</h2>
          
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="student_mode" checked={runtime.is_anonymous} onChange={() => setRuntime({...runtime, is_anonymous: true})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-700">Generazione anonima</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="student_mode" checked={!runtime.is_anonymous} onChange={() => setRuntime({...runtime, is_anonymous: false})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-700">Utilizza file studenti</span>
            </label>
          </div>

          <div className="mt-2">
            {runtime.is_anonymous ? (
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero esami da generare</label>
                <input type="number" min="1" className="w-full border p-2 rounded" value={runtime.num_anonymous_exams} onChange={e => setRuntime({...runtime, num_anonymous_exams: e.target.value})} />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="max-w-md">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    Seleziona file excel studenti
                    <HelpButton title="Come preparare il file Excel">
                      <p className="mb-3">Il file Excel deve avere la prima riga dedicata alle <strong>intestazioni delle colonne</strong>.</p>
                      <p className="mb-2">Per funzionare correttamente, il sistema deve poter estrapolare questi tre dati per ogni riga:</p>
                      <ul className="list-disc pl-5 mb-4 space-y-1">
                        <li><code className="bg-gray-100 px-1 rounded text-pink-600">id</code> (la matricola o identificativo)</li>
                        <li><code className="bg-gray-100 px-1 rounded text-pink-600">name</code> (il nome)</li>
                        <li><code className="bg-gray-100 px-1 rounded text-pink-600">surname</code> (il cognome)</li>
                      </ul>
                      <p>Se il tuo file usa parole diverse per le intestazioni (ad esempio "Matricola", "NomeStudente", "CognomeStudente") o presenta colonne aggiuntive basterà specificarlo nella sezione <strong>Mappatura colonne Excel</strong> sottostante</p>
                    </HelpButton>
                  </label>
                  <div className="flex gap-2">
                    <select className="flex-1 border p-2 rounded" value={runtime.selected_student_file} onChange={e => setRuntime({...runtime, selected_student_file: e.target.value})}>
                      <option value="">-- Seleziona --</option>
                      {availableFiles.students.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <label className="bg-gray-100 border p-2 rounded cursor-pointer hover:bg-gray-200 flex items-center justify-center w-10">
                      <Upload size={20} />
                      <input type="file" accept=".xls,.xlsx" className="hidden" onChange={handleUploadStudent} />
                    </label>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Mappatura colonne Excel</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(config.excel.fields).map(([key, value]) => {
                      const isMandatory = ['name', 'surname', 'id'].includes(key);
                      return (
                        <div key={key}>
                          <label className="block text-xs text-gray-600 mb-1 capitalize">Colonna {key === 'id' ? 'Matricola' : key}</label>
                          <div className="flex gap-2">
                            <input type="text" className="flex-1 border p-2 rounded text-sm" value={value} onChange={e => setConfig({...config, excel: {...config.excel, fields: {...config.excel.fields, [key]: e.target.value}}})} />
                            {!isMandatory && (
                              <button className="text-red-500 hover:bg-red-50 px-2 rounded font-bold text-sm" onClick={() => {
                                const newFields = {...config.excel.fields};
                                delete newFields[key];
                                setConfig({...config, excel: {...config.excel, fields: newFields}});
                              }}>X</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button className="text-sm text-blue-600 hover:underline mt-4 inline-block text-left" onClick={() => {
                    const newKey = prompt("Inserisci il nome del nuovo parametro (es. email):");
                    if (newKey && !config.excel.fields[newKey.toLowerCase()]) {
                      setConfig({...config, excel: {...config.excel, fields: {...config.excel.fields, [newKey.toLowerCase()]: newKey}}});
                    }
                  }}>
                    + Aggiungi colonna personalizzata
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sezione Impostazioni domande */}
        <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center">
              Impostazioni domande
              <HelpButton title="Sintassi Markdown delle domande">
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Esempio pratico:</p>
                    <pre className="bg-slate-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
{`---
## Quale linguaggio viene eseguito nel browser?

- [ ] Java
- [x] JavaScript
- [ ] Python
- [ ] C`}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Convenzioni strutturali:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><code className="bg-gray-100 px-1 rounded text-pink-600 font-bold">[x]</code> indica la risposta corretta</li>
                      <li><code className="bg-gray-100 px-1 rounded text-pink-600 font-bold">[ ]</code> indica una risposta errata</li>
                      <li><code className="bg-gray-100 px-1 rounded text-pink-600 font-bold">---</code> funge da separatore tra una domanda e l'altra</li>
                      <li><code className="bg-gray-100 px-1 rounded text-pink-600 font-bold">##</code> definisce una domanda chiusa (a scelta multipla)</li>
                      <li><code className="bg-gray-100 px-1 rounded text-pink-600 font-bold">###</code> definisce una domanda aperta</li>
                      <li><code className="bg-gray-100 px-1 rounded text-pink-600 font-bold">{'{'}lines:2cm{'}'}</code> definisce lo spazio da lasciare per rispondere ad una domanda aperta</li>
                      <li>È possibile avere domande con più risposte corrette</li>
                    </ul>
                  </div>
                </div>
              </HelpButton>
            </h2>
            <label className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded cursor-pointer hover:bg-blue-100 flex items-center gap-1">
              <Upload size={16} /> Carica file .md
              <input type="file" accept=".md" className="hidden" onChange={handleUploadQuestion} />
            </label>
          </div>
          
          {config.questions.length > 0 && (
            <div className="flex gap-4 mb-2 px-1">
              <label className="flex-1 text-sm font-medium text-gray-700">File delle domande</label>
              <label className="w-48 text-sm font-medium text-gray-700 flex items-center">
                Domande da estrarre
                <HelpButton title="Estrazione delle domande">
                  <p className="mb-3">Il numero di domande indicato si riferisce <strong>esclusivamente alle domande a scelta multipla</strong>.</p>
                  <p className="mb-3">Tutte le <strong>domande aperte</strong> presenti nel file verranno inserite in blocco alla fine dell'esame, a meno che non venga impostato un limite massimo tramite la casella "Numero max domande aperte" nella sezione delle <strong>impostazioni aggiuntive</strong>sottostante.</p>
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded mt-2">
                    <p className="text-sm text-blue-800">Per un controllo più preciso, suggerisco di tenere le domande chiuse e quelle aperte separate in due file <code>.md</code> distinti.</p>
                  </div>
                </HelpButton>
              </label>
              <div className="w-8"></div>
            </div>
          )}

          {config.questions.map((q, idx) => (
            <div key={idx} className="flex gap-4 mb-2 items-center">
              <select className="flex-1 border p-2 rounded" value={q.from} onChange={e => {
                const newQ = [...config.questions];
                newQ[idx].from = e.target.value;
                setConfig({...config, questions: newQ});
              }}>
                <option value="">-- Seleziona file markdown --</option>
                {availableFiles.questions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <input type="number" placeholder="Quante estrarne?" className="w-48 border p-2 rounded" value={q.draw || ''} onChange={e => {
                const newQ = [...config.questions];
                newQ[idx].draw = e.target.value;
                setConfig({...config, questions: newQ});
              }} />
              <button className="text-red-500 hover:bg-red-50 p-2 rounded" onClick={() => {
                const newQ = config.questions.filter((_, i) => i !== idx);
                setConfig({...config, questions: newQ});
              }}>X</button>
            </div>
          ))}
          <button className="text-sm text-blue-600 hover:underline mt-2 inline-block text-left" onClick={() => setConfig({...config, questions: [...config.questions, {from: '', draw: 1}]})}>
            + Aggiungi file delle domande
          </button>
        </section>

        {/* Sezione Impostazioni aggiuntive */}
        <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">Impostazioni aggiuntive</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" checked={config.exam.shuffle_questions} onChange={e => setConfig({...config, exam: {...config.exam, shuffle_questions: e.target.checked}})} />
              <label className="text-sm text-gray-600">Mescola domande</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" checked={config.exam.shuffle_answers} onChange={e => setConfig({...config, exam: {...config.exam, shuffle_answers: e.target.checked}})} />
              <label className="text-sm text-gray-600">Mescola risposte</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" checked={config.dyslexia} onChange={e => setConfig({...config, dyslexia: e.target.checked})} />
              <label className="text-sm text-gray-600">Modalità dislessia</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" checked={config.choices?.circled || false} onChange={e => setConfig({...config, choices: {...(config.choices || {}), circled: e.target.checked}})} />
              <label className="text-sm text-gray-600">Cerchia opzioni di risposta</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" className="mr-2" checked={config.exam.max_questions !== '' && config.exam.max_questions !== undefined} onChange={e => {
                if(e.target.checked) setConfig({...config, exam: {...config.exam, max_questions: 10}});
                else setConfig({...config, exam: {...config.exam, max_questions: ''}});
              }} />
              <label className="text-sm text-gray-600">Numero max domande chiuse</label>
              {(config.exam.max_questions !== '' && config.exam.max_questions !== undefined) && (
                <input type="number" min="1" className="w-20 border p-1 rounded text-sm ml-auto" value={config.exam.max_questions} onChange={e => setConfig({...config, exam: {...config.exam, max_questions: e.target.value}})} />
              )}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" className="mr-2" checked={config.exam.max_open_questions !== '' && config.exam.max_open_questions !== undefined} onChange={e => {
                if(e.target.checked) setConfig({...config, exam: {...config.exam, max_open_questions: 5}});
                else setConfig({...config, exam: {...config.exam, max_open_questions: ''}});
              }} />
              <label className="text-sm text-gray-600">Numero max domande aperte</label>
              {(config.exam.max_open_questions !== '' && config.exam.max_open_questions !== undefined) && (
                <input type="number" min="1" className="w-20 border p-1 rounded text-sm ml-auto" value={config.exam.max_open_questions} onChange={e => setConfig({...config, exam: {...config.exam, max_open_questions: e.target.value}})} />
              )}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" className="mr-2" checked={config.exam.page_limits !== '' && config.exam.page_limits !== undefined} onChange={e => {
                if(e.target.checked) setConfig({...config, exam: {...config.exam, page_limits: 2}});
                else setConfig({...config, exam: {...config.exam, page_limits: ''}});
              }} />
              <label className="text-sm text-gray-600">Numero max pagine pdf</label>
              {(config.exam.page_limits !== '' && config.exam.page_limits !== undefined) && (
                <input type="number" min="1" className="w-20 border p-1 rounded text-sm ml-auto" value={config.exam.page_limits} onChange={e => setConfig({...config, exam: {...config.exam, page_limits: e.target.value}})} />
              )}
            </div>

            <div className="mt-2 md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Formato carta</label>
              <select className="w-full md:w-1/2 border p-2 rounded" value={config.paper} onChange={e => setConfig({...config, paper: e.target.value})}>
                <option value="A4">A4</option>
                <option value="A3">A3</option>
              </select>
            </div>
          </div>
        </section>

        {/* Parti personalizzate */}
        <section className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2 flex items-center">
            Parti personalizzate
            <HelpButton title="Formattazione in LaTeX">
              <p className="mb-3">In questi campi puoi scrivere in linguaggio naturale ed eventualmente utilizzare i comandi base di LaTeX per impaginare a piacimento l'intestazione, il preambolo e il piè di pagina.</p>
              <p className="mb-2 font-medium text-gray-800">Comandi che potrebbero essere utili:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">\newline</code> per andare a capo alla riga successiva</li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">\thedate</code> stampa la data impostata</li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">\thestudent</code> stampa nome e cognome dello studente estratto</li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">\thematriculationno</code> stampa il numero di matricola/id dello studente</li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">\thepage</code> stampa il numero della pagina corrente</li>
                <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">\textbf&#123;testo&#125;</code> per fare il <span className="font-bold">testo in grassetto</span></li>
              </ul>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded mt-5">
                <p className="text-sm text-blue-800">Eventualmente possono anche essere utilizzati dei template precompilati standard presenti sulla destra.</p>
              </div>
            </HelpButton>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Header</label>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-800" onClick={() => setConfig({...config, header: "Data dell'esame\nNome del candidato\nMatricola"})}>Usa standard: "Data, nome e matricola"</button>
              </div>
              <textarea className="w-full border p-2 rounded text-sm" rows="3" value={config.header} onChange={e => setConfig({...config, header: e.target.value})} placeholder="Testata dell'esame"></textarea>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Preamble</label>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-800" onClick={() => setConfig({...config, preamble: "Istruzioni: rispondi a tutte le domande annerendo completamente la casella."})}>Usa standard: "Istruzioni esame"</button>
              </div>
              <textarea className="w-full border p-2 rounded text-sm" rows="3" value={config.preamble} onChange={e => setConfig({...config, preamble: e.target.value})} placeholder="Testo libero introdotto prima delle domande"></textarea>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Footer</label>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-800" onClick={() => setConfig({...config, footer: 'Numero di pagina'})}>Usa standard: "Numero di pagina"</button>
              </div>
              <input type="text" className="w-full border p-2 rounded text-sm" value={config.footer} onChange={e => setConfig({...config, footer: e.target.value})} placeholder="Piè di pagina dell'esame" />
            </div>
          </div>
        </section>

        {/* Submit */}
        {(!taskId || (progress && (progress.completed || progress.error)) || error) && (
          <div className="flex items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <input type="checkbox" className="mr-2 h-5 w-5" checked={runtime.save_config} onChange={e => setRuntime({...runtime, save_config: e.target.checked})} />
              <label className="font-medium text-gray-700">Salva in config.yaml</label>
            </div>
            <button 
              onClick={handleStart}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              <Play size={20} /> Avvia generazione
            </button>
          </div>
        )}

        {/* Barra di Avanzamento, Errori e Preview */}
        {error && <div className="p-4 mt-6 bg-red-100 text-red-700 rounded-lg">{error}</div>}
        
        {taskId && progress && (
          <div className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h2 className="text-xl font-bold text-blue-800 mb-2">Stato Generazione</h2>
            <div className="w-full bg-blue-200 rounded-full h-4 mb-2">
              <div className="bg-blue-600 h-4 rounded-full transition-all duration-500" style={{ width: `${(progress.progress / progress.total) * 100}%` }}></div>
            </div>
            <p className="text-blue-700">{progress.message} ({progress.progress} / {progress.total})</p>
            {progress.completed && !progress.error && (
              <div className="mt-4">
                <p className="text-green-600 font-bold mb-4"><CheckCircle2 className="inline mr-1" /> Generazione Completata!</p>
                <p className="text-gray-800 mb-4 bg-white p-4 rounded border border-gray-200 shadow-sm">
                  Il file pdf degli esami è stato generato ed è presente nella cartella:<br />
                  <span className="font-mono text-sm text-blue-600 block mb-3">{dataDir}</span>
                  <span className="text-sm text-orange-600 font-medium flex items-center gap-1">
                    <AlertCircle size={16} />
                    Non spostare il file <strong className="font-mono">{runtime.output_prefix}.json</strong> per poter svolgere in seguito la correzione di questi esami dato che contiene le informazioni sulla generazione degli esami
                  </span>
                </p>
                
                {/* PDF Preview */}
                <PDFPreview url={`http://localhost:5000/api/data/${runtime.output_prefix}.pdf`} />
                
                {/* Ritorno Dashboard */}
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-900"
                  >
                    <ArrowLeft size={20} /> Torna alla Dashboard
                  </button>
                </div>
              </div>
            )}
            {progress.error && <p className="text-red-600 font-bold mt-2"><AlertCircle className="inline mr-1" /> Errore: {progress.error}</p>}
          </div>
        )}

      </div>
    </div>
    </div>
  );
}
