import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import Correct from './pages/Correct';
import ManualCorrection from './pages/ManualCorrection';
import Mark from './pages/Mark';
import Moodle from './pages/Moodle';
import Backup from './pages/Backup';
import Cleanup from './pages/Cleanup';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/correct" element={<Correct />} />
          <Route path="/manual_correction" element={<ManualCorrection />} />
          <Route path="/mark" element={<Mark />} />
          <Route path="/moodle" element={<Moodle />} />
          <Route path="/backup" element={<Backup />} />
          <Route path="/cleanup" element={<Cleanup />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;