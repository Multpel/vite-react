import React from 'react';
import ReactDOM from 'react-dom/client';
import MaintenanceApp from './App.tsx';
import './index.css'; // Se você estiver usando Tailwind ou CSS próprio

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MaintenanceApp />
  </React.StrictMode>
);
