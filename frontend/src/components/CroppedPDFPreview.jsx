import React, { useState } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { RefreshCw } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function CroppedPDFPreview({ url, pages = [1], showAlgorithms = false }) {
  const [numPages, setNumPages] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col gap-8 bg-gray-100 p-4 rounded-lg overflow-x-auto min-h-[400px]">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex items-center justify-center h-64 text-gray-500">
            <RefreshCw size={32} className="animate-spin mb-4 opacity-50" />
            <p className="ml-3">Caricamento PDF...</p>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-64 text-red-500">
            <p>Impossibile caricare il PDF.</p>
          </div>
        }
      >
        {pages.map((pageNum) => (
          <div 
            key={pageNum}
            className="mb-8 relative border border-gray-300 shadow-md bg-white overflow-hidden transition-all duration-300 ease-in-out"
            style={{ 
              width: showAlgorithms ? '1037px' : '420px', 
              margin: '0', 
              height: '730px' 
            }} 
          >
            {/* 
              When showAlgorithms is true, we shift less to the left to show the right part,
              and we increase the width. We need to shift it so that the original exam is still cropped.
            */}
            <div style={{ 
              transform: showAlgorithms ? 'translateX(-32.9%) translateY(-13%)' : 'translateX(-60%) translateY(-13%)', 
              width: showAlgorithms ? '150%' : '200%',
              transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out'
            }}>
              <Page 
                pageNumber={pageNum} 
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={1600} 
              />
            </div>
          </div>
        ))}
      </Document>
    </div>
  );
}
