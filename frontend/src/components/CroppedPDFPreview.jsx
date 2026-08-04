import React, { useState, useEffect } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { RefreshCw, ArrowDown, ArrowUp } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function CroppedPDFPreview({ url, pages = [1], showAlgorithms = false }) {
  const [numPages, setNumPages] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index if the student changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [pages]);

  const itemsPerPage = showAlgorithms ? 1 : 2;
  const visiblePages = pages.slice(currentIndex, currentIndex + itemsPerPage);

  const hasNext = currentIndex + itemsPerPage < pages.length;
  const hasPrev = currentIndex > 0;

  const goNext = () => {
    if (hasNext) setCurrentIndex(currentIndex + itemsPerPage);
  };

  const goPrev = () => {
    if (hasPrev) setCurrentIndex(Math.max(0, currentIndex - itemsPerPage));
  };

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
        <div className={`flex ${showAlgorithms ? 'flex-col' : 'flex-row'} gap-4 items-start`}>
          {visiblePages.map((pageNum) => (
            <div 
              key={pageNum}
              className="relative border border-gray-300 shadow-md bg-white overflow-hidden transition-all duration-300 ease-in-out shrink-0"
              style={{ 
                width: showAlgorithms ? '1037px' : '420px', 
                margin: '0', 
                height: '680px' 
              }} 
            >
              {/* 
                When showAlgorithms is true, we shift less to the left to show the right part,
                and we increase the width. We need to shift it so that the original exam is still cropped.
              */}
              <div style={{ 
                transform: showAlgorithms ? 'translateX(-32.9%) translateY(-12.5%)' : 'translateX(-60%) translateY(-13%)', 
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
        </div>

        {/* CONTROLLI PAGINAZIONE */}
        {(hasNext || hasPrev) && (
          <div className="flex flex-row gap-4 items-center justify-center mt-4 p-2 bg-white rounded-lg shadow-sm border border-gray-200 w-fit">
             <button
                onClick={goPrev}
                disabled={!hasPrev}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${hasPrev ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
             >
                <ArrowUp size={20} /> Precedenti
             </button>
             <span className="text-gray-600 text-sm px-2">
                Pag. {currentIndex + 1} - {Math.min(currentIndex + itemsPerPage, pages.length)} di {pages.length}
             </span>
             <button
                onClick={goNext}
                disabled={!hasNext}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${hasNext ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
             >
                Successivi <ArrowDown size={20} />
             </button>
          </div>
        )}
      </Document>
    </div>
  );
}
