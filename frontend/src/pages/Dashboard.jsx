import React from 'react';
import { Link } from 'react-router-dom';
import { FilePlus, ScanText, CheckCircle, FileOutput, Library, ClipboardEdit, Archive, Trash2 } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto font-sans text-center">
      <div className="mb-6 inline-block">
        <h1 className="text-5xl font-extrabold text-blue-900 drop-shadow-sm pb-2">
          OMRExams
        </h1>
      </div>
      <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
        Benvenuto in OMRExams, una suite per la generazione, lo smistamento, la correzione automatica e la valutazione di esami cartacei tramite Optical Mark Recognition (OMR).Seleziona uno degli strumenti sottostanti per procedere con il flusso di lavoro.
      </p>

      {/* Sezione Hub Navigazione */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Strumenti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link to="/generate" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <FilePlus size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Genera esami</h3>
            <p className="text-sm text-gray-500">Crea nuovi esami, randomizza le domande e stampa in PDF.</p>
          </Link>

          <Link to="/correct" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Smista e Correggi</h3>
            <p className="text-sm text-gray-500">Suddividi i PDF, rileva i QR code e analizza le risposte date per ogni studente.</p>
          </Link>

          <Link to="/manual_correction" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-yellow-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-yellow-50 text-yellow-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <ClipboardEdit size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verifica manuale</h3>
            <p className="text-sm text-gray-500">Gestisci gli esami dubbi e correggi forzatamente le correzioni automatiche.</p>
          </Link>

          <Link to="/mark" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-orange-50 text-orange-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <FileOutput size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Assegna voti</h3>
            <p className="text-sm text-gray-500">Calcola i punteggi finali ed esporta la graduatoria in Excel.</p>
          </Link>

        </div>
      </div>

      {/* Sezione Strumenti di ausilio */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Strumenti di ausilio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <Link to="/moodle" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Library size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Convertitore Moodle</h3>
            <p className="text-sm text-gray-500">Importa o esporta il database da/verso Moodle.</p>
          </Link>

          <Link to="/backup" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-teal-50 text-teal-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Archive size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Backup JSON</h3>
            <p className="text-sm text-gray-500">Recupera i file di configurazione degli esami eliminati per errore.</p>
          </Link>

          <Link to="/cleanup" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-red-400 hover:shadow-md transition-all flex flex-col items-center text-center">
            <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Gestione Dati</h3>
            <p className="text-sm text-gray-500">Elimina i file vecchi o non più necessari generati dal sistema.</p>
          </Link>

        </div>
      </div>

    </div>
  );
}
