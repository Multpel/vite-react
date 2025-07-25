import React, { useState, useEffect, ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { Calendar, Settings, Search, Plus} from 'lucide-react';

// --- 1. DEFINIÇÕES DE TIPOS E INTERFACES ---
interface TabButtonProps {
  label: string;
  value: 'equipamentos' | 'agendadas' | 'pendentes' | 'realizadas';
  current: string;
  setTab: (value: 'equipamentos' | 'agendadas' | 'pendentes' | 'realizadas') => void;
  count: number;
  activeColorClass: string;
}

type Machine = {
  id: number;
  setor: string;
  maquina: string;
  etiqueta: string;
  chamado: string;
  proximaManutencao: string;
  dataRealizacao: string;
  status: 'pendente' | 'agendado' | 'concluido';
};

// --- 2. COMPONENTES AUXILIARES ---
const TabButton = ({
  label,
  value,
  current,
  setTab,
  count,
  activeColorClass
}: TabButtonProps) => {
  return (
    <button
      className={`flex flex-col items-center px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
        current === value
          ? `${activeColorClass} text-white`
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      onClick={() => setTab(value)}
    >
      <span>{label}</span>
      <span className={`text-xs mt-1 ${current === value ? 'text-white' : 'text-gray-500'}`}>
        ({count})
      </span>
    </button>
  );
};

const MachineForm = ({
  machine,
  onSave,
  onCancel,
  sectors,
}: {
  machine: Machine | null;
  onSave: (formData: Machine) => void;
  onCancel: () => void;
  sectors: string[];
}) => {
  const [formData, setFormData] = useState<Machine>(
    machine || {
      id: 0,
      setor: '',
      maquina: '',
      etiqueta: '',
      chamado: '',
      proximaManutencao: '',
      dataRealizacao: '',
      status: 'pendente',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

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
              name="setor"
              value={formData.setor}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Selecione o setor</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Máquina</label>
            <input
              type="text"
              name="maquina"
              value={formData.maquina}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Etiqueta</label>
            <input
              type="text"
              name="etiqueta"
              value={formData.etiqueta}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Chamado</label>
            <input
              type="text"
              name="chamado"
              value={formData.chamado}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          {/* CAMPO 'Próxima Manutenção' AGORA É SOMENTE LEITURA */}
          <div>
            <label className="block text-sm font-medium mb-1">Próxima Manutenção</label>
            <input
              type="date"
              name="proximaManutencao"
              value={formData.proximaManutencao}
              onChange={handleChange}
              readOnly={true}
              className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
          {/* CAMPO 'Data Realização' REMOVIDO */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// NOVO COMPONENTE: Formulário para Novo Agendamento
const AppointmentForm = ({
    machines,
    onSave,
    onCancel,
    today
}: {
    machines: Machine[];
    onSave: (machineId: number, appointmentDate: string) => void;
    onCancel: () => void;
    today: string;
}) => {
    const [selectedMachineId, setSelectedMachineId] = useState<number | ''>('');
    const [appointmentDate, setAppointmentDate] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const availableMachines = machines.filter(m =>
        !m.dataRealizacao && (!m.proximaManutencao || new Date(m.proximaManutencao) < new Date(today))
    );

    const handleSubmit = () => {
        setError(null);

        if (!selectedMachineId) {
            setError('Por favor, selecione uma máquina.');
            return;
        }
        if (!appointmentDate) {
            setError('Por favor, selecione uma data de agendamento.');
            return;
        }
        if (new Date(appointmentDate) < new Date(today)) {
            setError('A data de agendamento não pode ser no passado.');
            return;
        }

        onSave(Number(selectedMachineId), appointmentDate);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Novo Agendamento</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Selecionar Máquina</label>
                        <select
                            value={selectedMachineId}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedMachineId(Number(e.target.value))} // Tipo explícito
                            className="w-full p-2 border rounded-lg"
                        >
                            <option value="">Selecione uma máquina</option>
                            {availableMachines.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.maquina} ({m.setor}) - {m.etiqueta || 'Sem Etiqueta'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Data de Agendamento</label>
                        <input
                            type="date"
                            value={appointmentDate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppointmentDate(e.target.value)} // Tipo explícito
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                        >
                            Agendar
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 3. COMPONENTE PRINCIPAL (MaintenanceApp) ---
const MaintenanceApp = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [tab, setTab] = useState<'equipamentos' | 'agendadas' | 'pendentes' | 'realizadas'>('equipamentos');
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);

  const [editingDateId, setEditingDateId] = useState<number | null>(null);
  const [currentEditingDateValue, setCurrentEditingDateValue] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
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
    { setor: 'TI', maquina: 'ts-server', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '' },
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
    
    // Explicitamente tipar machinesWithId como Machine[]
    const machinesWithId: Machine[] = initialData.map((machine, index) => {
      const status: 'pendente' | 'agendado' | 'concluido' = machine.dataRealizacao
        ? 'concluido'
        : machine.proximaManutencao
        ? new Date(machine.proximaManutencao) < new Date(today)
          ? 'pendente'
          : 'agendado'
        : 'pendente';

      return {
        ...machine,
        id: index + 1,
        status: status,
      };
    });
    setMachines(machinesWithId);
  }, []);

  const filteredEquipamentos = machines.filter((m) => {
    const matchSearch =
      m.maquina.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.etiqueta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSector = !selectedSector || m.setor === selectedSector;
    return matchSearch && matchSector;
  });

  const agendadas = machines.filter(
    (m) =>
      !m.dataRealizacao &&
      m.proximaManutencao &&
      new Date(m.proximaManutencao) >= new Date(today)
  ).sort((a, b) => a.proximaManutencao.localeCompare(b.proximaManutencao));

  const pendentes = machines.filter(
    (m) =>
      !m.dataRealizacao &&
      m.proximaManutencao &&
      new Date(m.proximaManutencao) < new Date(today)
  ).sort((a, b) => a.proximaManutencao.localeCompare(b.proximaManutencao));

  const realizadas = machines.filter((m) => m.dataRealizacao)
    .sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao));

  const sectors = [...new Set(machines.map((m) => m.setor))].sort();

  const equipamentosCount = filteredEquipamentos.length;
  const agendadasCount = agendadas.length;
  const pendentesCount = pendentes.length;
  const realizadasCount = realizadas.length;

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setShowMachineForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
      setMachines((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleSave = (formData: Machine) => {
    const calculatedStatus: 'pendente' | 'agendado' | 'concluido' = formData.proximaManutencao
        ? new Date(formData.proximaManutencao) >= new Date(today) ? 'agendado' : 'pendente'
        : 'pendente';

    if (editingMachine) {
      setMachines((prev) =>
        prev.map((m) => (m.id === editingMachine.id ? { ...m, ...formData, status: calculatedStatus } : m))
      );
    } else {
      const newMachine: Machine = { // Explicitamente tipar newMachine
        ...formData,
        id: Math.max(...machines.map((m) => m.id), 0) + 1,
        status: calculatedStatus,
      };
      setMachines((prev) => [...prev, newMachine]);
    }
    setShowMachineForm(false);
    setEditingMachine(null);
  };

  const handleDateRealizacaoChange = (id: number, newCompletionDate: string) => {
    setMachines((prevMachines) => {
        let updatedMachines = prevMachines;
        const completedMachine = prevMachines.find(m => m.id === id);

        if (completedMachine) {
            updatedMachines = prevMachines.map((machine) => {
                if (machine.id === id) {
                    return {
                        ...machine,
                        dataRealizacao: newCompletionDate,
                        status: 'concluido',
                    };
                }
                return machine;
            });

            if (newCompletionDate) {
                const completedDateObj = new Date(newCompletionDate);
                completedDateObj.setDate(completedDateObj.getDate() + 90);

                const nextMaintenanceDate = completedDateObj.toISOString().split('T')[0];

                const newMachineId = Math.max(...prevMachines.map((m) => m.id), 0) + 1;

                const newCycleMachine: Machine = {
                    ...completedMachine,
                    id: newMachineId,
                    proximaManutencao: nextMaintenanceDate,
                    dataRealizacao: '',
                    status: new Date(nextMaintenanceDate) < new Date(today) ? 'pendente' : 'agendado',
                };
                updatedMachines = [...updatedMachines, newCycleMachine];
            }
        }
        return updatedMachines;
    });
    setEditingDateId(null);
  };

  const startEditingDate = (id: number, currentValue: string) => {
    setEditingDateId(id);
    setCurrentEditingDateValue(currentValue);
  };

  const handleNewAppointmentSave = (machineId: number, appointmentDate: string) => {
    setMachines((prevMachines) => {
        return prevMachines.map((m) => {
            if (m.id === machineId) {
                return {
                    ...m,
                    proximaManutencao: appointmentDate,
                    status: new Date(appointmentDate) < new Date(today) ? 'pendente' : 'agendado',
                };
            }
            return m;
        });
    });
    setShowNewAppointmentForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Controle de Manutenção
                </h1>
                <p className="text-gray-600">Visualização por Status</p>
              </div>
            </div>
            {tab === 'equipamentos' && (
              <button
                onClick={() => {
                  setEditingMachine(null);
                  setShowMachineForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nova Máquina
              </button>
            )}

            {tab === 'agendadas' && (
              <button
                onClick={() => setShowNewAppointmentForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Novo Agendamento
              </button>
            )}
          </div>

          <div className="flex gap-4 mb-8">
            <TabButton label="Equipamentos" value="equipamentos" current={tab} setTab={setTab} count={equipamentosCount} activeColorClass="bg-blue-600" />
            <TabButton label="Agendadas" value="agendadas" current={tab} setTab={setTab} count={agendadasCount} activeColorClass="bg-purple-600" />
            <TabButton label="Pendentes" value="pendentes" current={tab} setTab={setTab} count={pendentesCount} activeColorClass="bg-orange-600" />
            <TabButton label="Realizadas" value="realizadas" current={tab} setTab={setTab} count={realizadasCount} activeColorClass="bg-green-600" />
          </div>

          {tab === 'equipamentos' && (
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por máquina ou etiqueta..."
                  className="w-full pl-10 pr-4 py-3 border rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-3 border rounded-xl"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="">Todos os setores</option>
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  {tab === 'equipamentos' && (
                    <>
                      <th className="p-2">Setor</th>
                      <th className="p-2">Máquina</th>
                      <th className="p-2">Etiqueta</th>
                      <th className="p-2 text-right">Ações</th>
                    </>
                  )}
                  {tab === 'agendadas' && (
                    <>
                      <th className="p-2">Data Agendamento</th>
                      <th className="p-2">Máquina</th>
                      <th className="p-2">Data Realização</th>
                    </>
                  )}
                  {tab === 'pendentes' && (
                    <>
                      <th className="p-2">Data Agendamento</th>
                      <th className="p-2">Máquina</th>
                      <th className="p-2">Data Realização</th>
                    </>
                  )}
                  {tab === 'realizadas' && (
                    <>
                      <th className="p-2">Data Agendamento</th>
                      <th className="p-2">Data Realização</th>
                      <th className="p-2">Máquina</th>
                      <th className="p-2">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {(tab === 'equipamentos' ? filteredEquipamentos :
                  tab === 'agendadas' ? agendadas :
                  tab === 'pendentes' ? pendentes :
                  realizadas
                ).map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    {tab === 'equipamentos' && (
                      <>
                        <td className="p-2">{m.setor}</td>
                        <td className="p-2">{m.maquina}</td>
                        <td className="p-2">{m.etiqueta}</td>
                        <td className="p-2 text-right space-x-2">
                          <button onClick={() => handleEdit(m)} className="text-blue-600 hover:underline">Editar</button>
                          <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:underline">Excluir</button>
                        </td>
                      </>
                    )}
                    {tab === 'agendadas' && (
                      <>
                        <td className="p-2">{m.proximaManutencao}</td>
                        <td className="p-2">{m.maquina}</td>
                        <td className="p-2">
                          {editingDateId === m.id ? (
                            <input
                              type="date"
                              value={currentEditingDateValue}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentEditingDateValue(e.target.value)} // Tipo explícito
                              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                handleDateRealizacaoChange(m.id, e.target.value);
                                setEditingDateId(null);
                              }}
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter') {
                                  handleDateRealizacaoChange(m.id, e.target.value);
                                  setEditingDateId(null);
                                }
                              }}
                              autoFocus
                              className="w-full p-1 border rounded-md text-sm"
                            />
                          ) : (
                            <span
                              onClick={() => startEditingDate(m.id, m.dataRealizacao)}
                              className="cursor-pointer hover:bg-gray-100 p-1 rounded-md block"
                            >
                              {m.dataRealizacao || '—'}
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    {tab === 'pendentes' && (
                      <>
                        <td className="p-2">{m.proximaManutencao}</td>
                        <td className="p-2">{m.maquina}</td>
                        <td className="p-2">
                          {editingDateId === m.id ? (
                            <input
                              type="date"
                              value={currentEditingDateValue}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentEditingDateValue(e.target.value)} // Tipo explícito
                              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                handleDateRealizacaoChange(m.id, e.target.value);
                                setEditingDateId(null);
                              }}
                              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter') {
                                  handleDateRealizacaoChange(m.id, e.target.value);
                                  setEditingDateId(null);
                                }
                              }}
                              autoFocus
                              className="w-full p-1 border rounded-md text-sm"
                            />
                          ) : (
                            <span
                              onClick={() => startEditingDate(m.id, m.dataRealizacao)}
                              className="cursor-pointer hover:bg-gray-100 p-1 rounded-md block"
                            >
                              {m.dataRealizacao || '—'}
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    {tab === 'realizadas' && (
                      <>
                        <td className="p-2">{m.proximaManutencao || '—'}</td>
                        <td className="p-2">{m.dataRealizacao}</td>
                        <td className="p-2">{m.maquina}</td>
                        <td className="p-2">
                          {m.proximaManutencao && m.dataRealizacao && new Date(m.dataRealizacao) > new Date(m.proximaManutencao)
                            ? 'Com Atraso'
                            : 'Em Dia'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showMachineForm && (
            <MachineForm
              machine={editingMachine}
              onSave={handleSave}
              onCancel={() => {
                setShowMachineForm(false);
                setEditingMachine(null);
              }}
              sectors={sectors}
            />
          )}

          {showNewAppointmentForm && (
            <AppointmentForm
              machines={machines}
              onSave={handleNewAppointmentSave}
              onCancel={() => setShowNewAppointmentForm(false)}
              today={today}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceApp;