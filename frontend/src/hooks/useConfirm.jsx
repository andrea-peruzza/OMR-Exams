import React, { useState, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    resolve: null,
  });

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        message,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmState.resolve) confirmState.resolve(true);
    setConfirmState({ isOpen: false, message: '', resolve: null });
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    if (confirmState.resolve) confirmState.resolve(false);
    setConfirmState({ isOpen: false, message: '', resolve: null });
  }, [confirmState]);

  const contextRef = React.useRef({ confirmState, handleConfirm, handleCancel });
  contextRef.current = { confirmState, handleConfirm, handleCancel };

  const ConfirmModal = useCallback(() => {
    const { confirmState, handleConfirm, handleCancel } = contextRef.current;
    if (!confirmState.isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-red-50">
            <div className="flex items-center gap-2">
              <Trash2 className="text-red-600" size={24} />
              <h3 className="text-lg font-bold text-gray-900">Conferma Eliminazione</h3>
            </div>
            <button 
              onClick={handleCancel}
              className="p-1.5 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
            >
              <X size={20} className="text-red-800" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-800 font-medium whitespace-pre-wrap">{confirmState.message}</p>
            <p className="text-sm text-gray-500 mt-2">Questa azione è irreversibile.</p>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap justify-end gap-3">
            <button 
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button 
              onClick={handleConfirm}
              autoFocus
              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              Elimina Definitivamente
            </button>
          </div>
        </div>
      </div>
    );
  }, []);

  return { confirm, ConfirmModal };
};
