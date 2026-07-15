import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function XlsxPreview({ filename, headerRows = 1 }) {
  const [data, setData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!filename) return;

    const fetchExcel = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch dal mount point statico di FastAPI
        const response = await fetch(`http://localhost:5000/api/data/${filename}`);
        if (!response.ok) {
          throw new Error('Errore nel caricamento del file Excel');
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Prendiamo il primo foglio di lavoro
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertiamo in JSON (array di array per avere le colonne dinamicamente)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          let cols = [];
          
          if (headerRows === 1 || jsonData.length < headerRows) {
            cols = jsonData[0] || [];
          } else {
            // Unione delle righe di header (es. MultiIndex di pandas)
            // Troviamo il numero massimo di colonne
            const numCols = Math.max(...jsonData.slice(0, headerRows).map(r => r.length));
            for (let c = 0; c < numCols; c++) {
              let colNameParts = [];
              for (let r = 0; r < headerRows; r++) {
                const val = jsonData[r][c];
                if (val !== undefined && val !== null && val !== '') {
                  colNameParts.push(String(val).trim());
                } else if (r === 0) {
                  // Se la cella della prima riga è vuota, proviamo a guardare a sinistra (celle unite virtualmente)
                  let leftVal = '';
                  for (let i = c - 1; i >= 0; i--) {
                    if (jsonData[r][i]) {
                      leftVal = String(jsonData[r][i]).trim();
                      break;
                    }
                  }
                  if (leftVal) colNameParts.push(leftVal);
                }
              }
              // Uniamo i nomi escludendo i duplicati (es. se la seconda riga è uguale alla prima o assente)
              const uniqueParts = [...new Set(colNameParts)];
              cols.push(uniqueParts.join(' '));
            }
          }

          setColumns(cols);
          setData(jsonData.slice(headerRows, headerRows + 10)); // Mostriamo solo le prime 10 righe per l'anteprima
        } else {
          setColumns([]);
          setData([]);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExcel();
  }, [filename]);

  if (loading) return <div className="p-4 text-center text-gray-500 animate-pulse">Caricamento anteprima Excel in corso...</div>;
  if (error) return <div className="p-4 text-center text-red-500 bg-red-50 rounded">Nessuna anteprima disponibile ({error})</div>;
  if (!data || data.length === 0) return <div className="p-4 text-center text-gray-500">Il foglio Excel è vuoto.</div>;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Anteprima Dati (Prime 10 righe)</h3>
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="p-3 text-gray-800 font-semibold truncate max-w-[200px]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b hover:bg-gray-50">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="p-3 text-gray-600 truncate max-w-[200px]">
                    {row[colIdx] !== undefined ? String(row[colIdx]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
