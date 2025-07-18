import React from 'react';
import ReactDOM from 'react-dom/client';
import MaintenanceApp from './App.tsx'; // Importe seu componente principal aqui
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MaintenanceApp /> {/* Renderize seu componente principal aqui */}
  </React.StrictMode>,
);