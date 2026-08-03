import React, { useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder, label }) => {
  const quillRef = useRef(null);

  const insertTag = (tag) => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection(true);
    const cursorPosition = range ? range.index : 0;
    quill.insertText(cursorPosition, tag);
    quill.setSelection(cursorPosition + tag.length);
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ 'align': [] }],
        ['clean']
      ]
    }
  }), []);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <div className="flex gap-2">
          <span className="text-xs text-gray-500 mr-2 flex items-center">Variabili:</span>
          <button type="button" onClick={() => insertTag('{{DATA}}')} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100">Data</button>
          <button type="button" onClick={() => insertTag('{{NOME}}')} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100">Candidato</button>
          <button type="button" onClick={() => insertTag('{{MATRICOLA}}')} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100">Matricola</button>
          <button type="button" onClick={() => insertTag('{{PAGINA}}')} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100">Pagina</button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <ReactQuill 
          ref={quillRef}
          theme="snow" 
          value={value || ''} 
          onChange={onChange} 
          modules={modules}
          placeholder={placeholder}
          className="h-32 rounded-b-lg"
        />
      </div>
    </div>
  );
};

import templateBg from './template_preview/template.png';

const LivePreview = ({ header, preamble, footer }) => {
  // Funzione per interpretare l'HTML generato da Quill con le nostre variabili simulate
  const renderSimulatedHtml = (html) => {
    if (!html) return { __html: '' };
    
    // Simula le variabili magiche con dati fittizi
    let simulated = html
      .replace(/\{\{DATA\}\}/g, new Date().toLocaleDateString('it-IT'))
      .replace(/\{\{NOME\}\}/g, 'Mario Rossi')
      .replace(/\{\{MATRICOLA\}\}/g, '123456')
      .replace(/\{\{PAGINA\}\}/g, '1');

    return { __html: simulated };
  };

  return (
    <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 flex justify-center sticky top-6">
      <div 
        className="bg-white shadow-lg w-full max-w-[450px] aspect-[1/1.414] relative overflow-hidden"
        style={{ backgroundImage: `url(${templateBg})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
      >
        {/* Intestazione */}
        <div className="absolute top-[3.5%] bottom-[87%] left-[18%] right-[16%] bg-blue-50/80 border-2 border-blue-300 border-dashed rounded overflow-hidden">
          <div 
            className="ql-editor !px-0 !py-0 h-full w-full text-[7px] [&_p]:mb-1 leading-tight" 
            dangerouslySetInnerHTML={renderSimulatedHtml(header)} 
          />
        </div>
        
        {/* Istruzioni / Preambolo */}
        <div className="absolute top-[14%] bottom-[82.5%] left-[5%] right-[29%] bg-yellow-50/80 border-2 border-yellow-300 border-dashed rounded overflow-hidden">
          <div 
            className="ql-editor !px-0 !py-1 text-gray-800 h-full w-full text-[7px] [&_p]:mb-1 leading-tight" 
            dangerouslySetInnerHTML={renderSimulatedHtml(preamble)} 
          />
        </div>

        {/* Piè di pagina */}
        <div className="absolute bottom-[6%] top-[89%] left-[4.5%] right-[18%] bg-green-50/80 border-2 border-green-300 border-dashed rounded overflow-hidden">
          <div 
            className="ql-editor !px-0 !py-1 h-full w-full text-[7px] [&_p]:mb-1 leading-tight" 
            dangerouslySetInnerHTML={renderSimulatedHtml(footer)} 
          />
        </div>
        
      </div>
    </div>
  );
};

export default function HeaderFooterEditor({ config, setConfig }) {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Colonna Editor */}
      <div className="flex-1 space-y-8 pb-10">
        <RichTextEditor 
          label="Testata (Header)"
          placeholder="Inserisci la testata (es. dati universitari, nome, data...)"
          value={config.header}
          onChange={(val) => setConfig(prev => ({ ...prev, header: val }))}
        />
        <div className="h-10"></div> {/* Spaziatore perché Quill h-32 non conta la toolbar */}
        
        <RichTextEditor 
          label="Istruzioni per gli studenti (Preamble)"
          placeholder="Istruzioni generali (es. non usare la matita, riempire bene i cerchi...)"
          value={config.preamble}
          onChange={(val) => setConfig(prev => ({ ...prev, preamble: val }))}
        />
        <div className="h-10"></div>
        
        <RichTextEditor 
          label="Piè di pagina (Footer)"
          placeholder="Inserisci il piè di pagina (es. numero pagina...)"
          value={config.footer}
          onChange={(val) => setConfig(prev => ({ ...prev, footer: val }))}
        />
        <div className="h-10"></div>
      </div>

      {/* Colonna Live Preview */}
      <div className="w-full lg:w-[450px]">
        <LivePreview 
          header={config.header}
          preamble={config.preamble}
          footer={config.footer}
        />
      </div>
    </div>
  );
}
