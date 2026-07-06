import React from 'react';
import { FileText } from 'lucide-react';

export default function PDFPreview({ url, title = "Anteprima PDF" }) {
  if (!url) return null;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-6 flex flex-col">
      <div className="flex items-center gap-2 mb-3 border-b pb-2">
        <FileText className="text-red-500" size={24} />
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="w-full bg-gray-100 rounded-lg overflow-hidden h-[600px]">
        <iframe
          src={`${url}#view=FitH`}
          title={title}
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
