import React, { useState, useCallback } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const usePrompt = () => {
  const [promptState, setPromptState] = useState({
    isOpen: false,
    message: '',
    defaultValue: '',
    customButtons: null,
    hideInput: false,
    resolve: null,
  });
  
  const [inputValue, setInputValue] = useState('');

  const prompt = useCallback((message, defaultValue = '', customButtons = null, hideInput = false) => {
    return new Promise((resolve) => {
      setInputValue(defaultValue);
      setPromptState({
        isOpen: true,
        message,
        defaultValue,
        customButtons,
        hideInput,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (promptState.resolve) promptState.resolve(inputValue);
    setPromptState({ isOpen: false, message: '', defaultValue: '', customButtons: null, resolve: null });
  }, [promptState, inputValue]);

  const handleCancel = useCallback(() => {
    if (promptState.resolve) promptState.resolve(null);
    setPromptState({ isOpen: false, message: '', defaultValue: '', customButtons: null, resolve: null });
  }, [promptState]);

  const contextRef = React.useRef({ promptState, inputValue, setInputValue, handleConfirm, handleCancel });
  contextRef.current = { promptState, inputValue, setInputValue, handleConfirm, handleCancel };

  const PromptModal = useCallback(() => {
    const { promptState, inputValue, setInputValue, handleConfirm, handleCancel } = contextRef.current;
    if (!promptState.isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-blue-500" size={24} />
              <h3 className="text-lg font-bold text-gray-800">Richiesta Input</h3>
            </div>
            <button 
              onClick={handleCancel}
              className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-700" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{promptState.message}</p>
            {!promptState.hideInput && (
              <input
                type="text"
                autoFocus
                className="w-full border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 p-3 rounded-lg text-gray-800 outline-none transition-all font-medium"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
            )}
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap justify-end gap-3">
            {promptState.customButtons ? (
              promptState.customButtons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (promptState.resolve) promptState.resolve({ action: btn.value, inputValue });
                    setPromptState({ isOpen: false, message: '', defaultValue: '', customButtons: null, resolve: null });
                  }}
                  className={`px-4 py-2 font-semibold rounded-lg transition-colors shadow-sm ${btn.className || 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {btn.label}
                </button>
              ))
            ) : (
              <>
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button 
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Conferma
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }, []);

  return { prompt, PromptModal };
};
