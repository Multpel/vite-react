import React, { useState, useEffect } from 'react';
import { Calendar, Monitor, Settings, Search, Plus, Edit3, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const MaintenanceApp = () => {
  const [machines, setMachines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  const initialData = [{ setor: 'TI', maquina: 'infoti-pc', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'TI', maquina: 'info-pc', etiqueta: 'MA-5L6M7N8-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'DIR', maquina: 'dir-ronildo-pc', etiqueta: 'MA-1E2F3G4-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'DIR', maquina: 'ronilson-pc', etiqueta: 'MA-5H6I7J8-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'BAL', maquina: 'bal1-pc', etiqueta: 'MA-3R4S5T6-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'BAL', maquina: 'bal2-pc', etiqueta: 'MA-7U8V9W0-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'BAL', maquina: 'bal3-pc', etiqueta: 'MA-1M2N3O4-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'BAL', maquina: 'bal4-pc', etiqueta: 'MA-5P6Q7R8-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FIN', maquina: 'cobranca-pc', etiqueta: 'MA-9G0H1L2-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FAT', maquina: 'fat2-pc', etiqueta: 'MA-3G4H5I6-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'LOG', maquina: 'ctrlfrota-pc', etiqueta: 'MA-3V4W5X6-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'TLM', maquina: 'tele2-pc', etiqueta: 'MA-1T2U3V4-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'COM', maquina: 'adm-pc', etiqueta: 'MA-3N4O5P6-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'TLM', maquina: 'tele3-pc', etiqueta: 'MA-5W6X7Y8-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'TLM', maquina: 'tele5-pc', etiqueta: 'MA-3C4D5E6-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'TLM', maquina: 'telemkt1-pc', etiqueta: 'MA-7Q8R9S0-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'LOG', maquina: 'enc-pc', etiqueta: 'MA-7Y8Z9A0-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'DEP', maquina: 'ava-pc', etiqueta: 'MA-3M4N5O6-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FIN', maquina: 'camera-pc', etiqueta: 'MA-3B4C5D6-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'DEP', maquina: 'box-pc', etiqueta: 'MA-9J0K1L2-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'DEP', maquina: 'check-pc', etiqueta: 'MA-5F6G7H8I-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FAT', maquina: 'cadastro-pc', etiqueta: 'MA-7M8N9O0-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'IND', maquina: 'ind-pc', etiqueta: 'MA-7P8Q9R0-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'DP', maquina: 'dpessoal-pc', etiqueta: 'MA-3Y4Z5A6-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'TLM', maquina: 'tlm4-pc', etiqueta: 'MA-9Z0A1B2-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'WMS', maquina: 'wms-pc', etiqueta: 'MA-1B2C3D4E-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'LOG', maquina: 'log-pc', etiqueta: 'MA-9S0T1U2-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'REC', maquina: 'recep-pc', etiqueta: 'MA-5A6B7C8-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'ROT', maquina: 'roteirizador-pc', etiqueta: 'MA-1X2Y3Z4-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'TI', maquina: 'ts-server', etiqueta: 'MA-9O0P1Q2-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'COM', maquina: 'comp-pc', etiqueta: 'MA-9K0L1M2-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'DIR', maquina: 'jessica-pc', etiqueta: 'MA-7B8C9D0-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'DP', maquina: 'rh-pc', etiqueta: 'MA-9V0W1X2-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FAT', maquina: 'fiscal-pc', etiqueta: 'MA-9D0E1F2-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FIN', maquina: 'monitorcam-pc', etiqueta: 'MA-5S6T7U8-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FAT', maquina: 'entnf-pc', etiqueta: 'MA-7J8K9L0-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FIN', maquina: 'alm-pc', etiqueta: 'MA-7F8G9H0-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'DIR', maquina: 'auditoria-pc', etiqueta: 'MA-5D6E7F8-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FIN', maquina: 'acerto-pc', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FIN', maquina: 'acerto2-pc', etiqueta: 'MA-1P2Q3R4-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FIN', maquina: 'cpagar-pc', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'FIN', maquina: 'fin02-pc', etiqueta: 'MA-3J4K5L6-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'SPCOM', maquina: 'spven-pc', etiqueta: 'MA-1A2B3C4-L', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'CX', maquina: 'cxmultpel-pc', etiqueta: 'MA-9O0P1Q2-P', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'TI', maquina: 'SRV Domain', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '' },
    { setor: 'TI', maquina: 'SRVTS', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '' }];

  useEffect(() => {
    const machinesWithId = initialData.map((machine, index) => ({
      ...machine,
      id: index + 1,
      status: machine.dataRealizacao ? 'concluido' : machine.proximaManutencao ? 'agendado' : 'pendente'
    }));
    setMachines(machinesWithId);
  }, []);

  const sectors = [...new Set(machines.map(m => m.setor))].sort();

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.maquina.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          machine.etiqueta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === '' || machine.setor === selectedSector;
    return matchesSearch && matchesSector;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'concluido': return 'bg-green-100 text-green-800 border-green-200';
      case 'agendado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'concluido': return <CheckCircle className="w-4 h-4" />;
      case 'agendado': return <Calendar className="w-4 h-4" />;
      case 'pendente': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getSectorColor = (sector) => {
    const colors = {
      'TI': 'bg-purple-500',
      'DIR': 'bg-red-500',
      'BAL': 'bg-green-500',
      'FIN': 'bg-blue-500',
      'FAT': 'bg-yellow-500',
      'LOG': 'bg-indigo-500',
      'TLM': 'bg-pink-500',
      'COM': 'bg-teal-500',
      'DEP': 'bg-orange-500',
      'IND': 'bg-cyan-500',
      'DP': 'bg-lime-500',
      'WMS': 'bg-violet-500',
      'REC': 'bg-amber-500',
      'ROT': 'bg-emerald-500',
      'SPCOM': 'bg-rose-500',
      'CX': 'bg-sky-500'
    };
    return colors[sector] || 'bg-gray-500';
  };

  const handleEdit = (machine) => {
    setEditingMachine(machine);
    setShowAddForm(true);
  };

  const handleSave = (formData) => {
    if (editingMachine) {
      setMachines(machines.map(m =>
        m.id === editingMachine.id ? { ...m, ...formData } : m
      ));
    } else {
      const newMachine = {
        ...formData,
        id: Math.max(...machines.map(m => m.id)) + 1
      };
      setMachines([...machines, newMachine]);
    }
    setShowAddForm(false);
    setEditingMachine(null);
  };

  const MachineForm = ({ machine, onSave, onCancel }) => {
    const [formData, setFormData] = useState(machine || {
      setor: '',
      maquina: '',
      etiqueta: '',
      chamado: '',
      proximaManutencao: '',
      dataRealizacao: '',
      status: 'pendente'
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">
            {machine ? 'Editar Máquina' : 'Nova Máquina'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Setor</label>
              <select
                value={formData.setor}
                onChange={(e) => setFormData({...formData, setor: e.target.value})}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Selecione o setor</option>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Máquina</label>
              <input
                type="text"
                value={formData.maquina}
                onChange={(e) => setFormData({...formData, maquina: e.target.value})}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Etiqueta</label>
              <input
                type="text"
                value={formData.etiqueta}
                onChange={(e) => setFormData({...formData, etiqueta: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chamado</label>
              <input
                type="text"
                value={formData.chamado}
                onChange={(e) => setFormData({...formData, chamado: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Próxima Manutenção</label>
              <input
                type="date"
                value={formData.proximaManutencao}
                onChange={(e) => setFormData({...formData, proximaManutencao: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Realização</label>
              <input
                type="date"
                value={formData.dataRealizacao}
                onChange={(e) => setFormData({...formData, dataRealizacao: e.target.value})}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => onSave(formData)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const stats = {
    total: machines.length,
    concluido: machines.filter(m => m.status === 'concluido').length,
    agendado: machines.filter(m => m.status === 'agendado').length,
    pendente: machines.filter(m => m.status === 'pendente').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Controle de Manutenção Preventiva
                </h1>
                <p className="text-gray-600">Gestão Automatizada</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Máquina
            </button>
          </div>

          {/* Equipamentos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Equipamentos */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Equipamentos</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Monitor className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            {/* Realizadas */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Realizadas</p>
                  <p className="text-2xl font-bold">{stats.concluido}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </div>

            {/* Agendadas */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Agendadas</p>
                  <p className="text-2xl font-bold">{stats.agendado}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            {/* Pendentes */}
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pendente}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por máquina ou etiqueta..."
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
            >
              <option value="">Todos os setores</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          {/* Cards de máquinas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMachines.map((machine) => (
              <div key={machine.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getSectorColor(machine.setor)}`}></div>
                    <span className="font-medium text-gray-600">{machine.setor}</span>
                  </div>
                  <button
                    onClick={() => handleEdit(machine)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{machine.maquina}</h3>
                  <p className="text-sm text-gray-600">{machine.etiqueta}</p>
                </div>

                <div className="space-y-2 mb-4">
                  {machine.chamado && (
                    <div className="text-sm">
                      <span className="text-gray-500">Chamado:</span>
                      <span className="ml-2 text-gray-800">{machine.chamado}</span>
                    </div>
                  )}
                  {machine.proximaManutencao && (
                    <div className="text-sm">
                      <span className="text-gray-500">Próxima:</span>
                      <span className="ml-2 text-gray-800">{machine.proximaManutencao}</span>
                    </div>
                  )}
                  {machine.dataRealizacao && (
                    <div className="text-sm">
                      <span className="text-gray-500">Realizada:</span>
                      <span className="ml-2 text-gray-800">{machine.dataRealizacao}</span>
                    </div>
                  )}
                </div>

                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${getStatusColor(machine.status)}`}>
                  {getStatusIcon(machine.status)}
                  <span className="capitalize">{machine.status}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredMachines.length === 0 && (
            <div className="text-center py-12">
              <Monitor className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhuma máquina encontrada</p>
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <MachineForm
          machine={editingMachine}
          onSave={handleSave}
          onCancel={() => {
            setShowAddForm(false);
            setEditingMachine(null);
          }}
        />
      )}
    </div>
  );
};

export default MaintenanceApp;
