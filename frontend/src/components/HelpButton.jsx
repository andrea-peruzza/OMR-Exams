import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function HelpButton({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-blue-500 transition-colors inline-flex items-center ml-1 focus:outline-none"
        title="Clicca per maggiori informazioni"
      >
        <HelpCircle size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()} // Previene la chiusura cliccando dentro la modale
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <HelpCircle size={20} className="text-blue-500" />
                {title}
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full p-1 shadow-sm border border-gray-200 transition-colors focus:outline-none"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 text-gray-600 text-sm leading-relaxed max-h-[75vh] overflow-y-auto">
              {children}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:outline-none"
              >
                Ho capito
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
