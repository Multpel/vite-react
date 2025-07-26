// 📄 Arquivo: src/App.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Monitor, Settings, Search, Plus, Edit3, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Machine {
  id: number;
  setor: string;
  maquina: string;
  etiqueta: string;
  chamado: string;
  proximaManutencao?: string;
  dataRealizacao?: string;
  status: 'pendente' | 'agendado' | 'concluido';
}

const MaintenanceApp = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(['pendente', 'agendado', 'concluido']);

  const currentDayString = new Date().toISOString().split('T')[0];

  const initialData = [/* seus dados */];

  useEffect(() => {
    const machinesWithId = initialData.map((machine, index) => ({
      ...machine,
      id: index + 1,
      status: machine.dataRealizacao ? 'concluido' : machine.proximaManutencao ? 'agendado' : 'pendente',
    }));
    setMachines(machinesWithId);
  }, []);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(machines);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Manutenção');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'manutencao.xlsx');
  };

  const filteredMachines = machines
    .filter((m) => {
      const searchMatch =
        m.maquina.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.etiqueta.toLowerCase().includes(searchTerm.toLowerCase());
      const sectorMatch = selectedSector === '' || m.setor === selectedSector;
      const statusMatch = selectedStatuses.includes(m.status);
      return searchMatch && sectorMatch && statusMatch;
    })
    .sort((a, b) => {
      if (!a.proximaManutencao) return 1;
      if (!b.proximaManutencao) return -1;
      return a.proximaManutencao.localeCompare(b.proximaManutencao);
    });

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" /> Sistema de Manutenção
        </h1>
        <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          Exportar Excel
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por máquina ou etiqueta"
          className="px-4 py-2 border rounded-md"
        />
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">Todos os Setores</option>
          {[...new Set(machines.map((m) => m.setor))].map((sector) => (
            <option key={sector}>{sector}</option>
          ))}
        </select>
        <select
          multiple
          value={selectedStatuses}
          onChange={(e) =>
            setSelectedStatuses(Array.from(e.target.selectedOptions, (option) => option.value))
          }
          className="px-4 py-2 border rounded-md"
        >
          <option value="pendente">Pendente</option>
          <option value="agendado">Agendado</option>
          <option value="concluido">Concluído</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-2">Dt Agenda</th>
              <th className="px-4 py-2">Equipamento</th>
              <th className="px-4 py-2">Setor</th>
              <th className="px-4 py-2">Dt Realização</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredMachines.map((m) => (
              <tr
                key={m.id}
                className={
                  m.proximaManutencao &&
                  new Date(m.proximaManutencao) < new Date(currentDayString) &&
                  m.status !== 'concluido'
                    ? 'bg-red-100'
                    : ''
                }
              >
                <td className="border-t px-4 py-2">{m.proximaManutencao || '-'}</td>
                <td className="border-t px-4 py-2">{m.maquina}</td>
                <td className="border-t px-4 py-2">{m.setor}</td>
                <td className="border-t px-4 py-2">{m.dataRealizacao || '-'}</td>
                <td className="border-t px-4 py-2 capitalize">{m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceApp;
