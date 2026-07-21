import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function BackButton() {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(-1)}
      className="absolute top-6 left-6 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 z-50"
      title="Torna indietro"
    >
      <ArrowLeft size={24} />
    </button>
  );
}

export default BackButton;
