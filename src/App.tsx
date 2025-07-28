import { useState, useEffect, ChangeEvent } from 'react';
import { Calendar, Settings, Search, Plus } from 'lucide-react';
import { db } from './firebase-config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

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
  id: string;
  setor: string;
  maquina: string;
  etiqueta: string;
  chamado: string;
  proximaManutencao?: string;
  dataRealizacao?: string;
  status: 'pendente' | 'agendado' | 'concluido';
};

// --- FUNÇÕES AUXILIARES PARA VERIFICAR DIA ÚTIL ---
/**
 * Retorna o próximo dia útil a partir de uma data.
 * Se a data já for um dia útil, retorna a própria data.
 * Se for fim de semana, avança para a próxima segunda-feira.
 * @param date O objeto Date inicial.
 * @returns O objeto Date correspondente ao próximo dia útil.
 */
const getNextBusinessDay = (date: Date): Date => {
  const newDate = new Date(date.getTime()); // Cria uma cópia para não modificar o original
  let day = newDate.getDay();

  // Se for sábado (6), adiciona 2 dias para chegar na segunda
  // Se for domingo (0), adiciona 1 dia para chegar na segunda
  if (day === 6) { // Sábado
    newDate.setDate(newDate.getDate() + 2);
  } else if (day === 0) { // Domingo
    newDate.setDate(newDate.getDate() + 1);
  }
  return newDate;
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
      className={`flex flex-col items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
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
      id: '',
      setor: '',
      maquina: '',
      etiqueta: '',
      chamado: '',
      proximaManutencao: '',
      dataRealizacao: '',
      status: 'pendente',
    }
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          {/* CAMPO 'Chamado' AGORA É SOMENTE LEITURA E ALIMENTADO PELO AGENDAMENTO */}
          <div>
            <label className="block text-sm font-medium mb-1">Último Chamado</label>
            <input
              type="text"
              name="chamado"
              value={formData.chamado}
              readOnly={true}
              className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
          {/* CAMPO 'Última Manutenção' AGORA É SOMENTE LEITURA */}
          <div>
            <label className="block text-sm font-medium mb-1">Última Manutenção</label>
            <input
              type="date"
              name="proximaManutencao"
              value={formData.proximaManutencao || ''} // Handle undefined
              readOnly={true} // Mantido readOnly como combinado
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

// COMPONENTE: Formulário para Novo Agendamento
const AppointmentForm = ({
    machines,
    onSave,
    onCancel,
    today
}: {
    machines: Machine[];
    onSave: (machineId: string, appointmentDate: string) => void | Promise<void>;
    onCancel: () => void;
    today: string;
}) => {
    const [selectedMachineId, setSelectedMachineId] = useState<string | ''>('');
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

        onSave(selectedMachineId, appointmentDate);
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
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedMachineId(e.target.value)}
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
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setAppointmentDate(e.target.value)}
                            min={today}
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

// COMPONENTE: Formulário para Finalizar Manutenção
const CompletionForm = ({
  machineId,
  currentDateRealizacao,
  currentChamado,
  onSave,
  onCancel,
}: {
  machineId: string;
  currentDateRealizacao: string;
  currentChamado: string;
  onSave: (machineId: string, dateRealizacao: string, chamado: string) => void | Promise<void>;
  onCancel: () => void;
}) => {
  const [dateRealizacao, setDateRealizacao] = useState(currentDateRealizacao);
  const [chamado, setChamado] = useState(currentChamado);
  const [error, setError] = useState<string | null>(null);

  const currentDateString = new Date().toISOString().split('T')[0];

  const handleSubmit = () => {
    setError(null);
    if (!dateRealizacao) {
      setError('Por favor, informe a Data de Realização.');
      return;
    }
    if (new Date(dateRealizacao) > new Date(currentDateString)) {
        setError('A Data de Realização não pode ser futura.');
        return;
    }
    if (!chamado.trim()) {
      setError('Por favor, informe o Número do Chamado.');
      return;
    }
    onSave(machineId, dateRealizacao, chamado);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Finalizar Manutenção</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data de Realização</label>
            <input
              type="date"
              value={dateRealizacao}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDateRealizacao(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nº Chamado</label>
            <input
              type="text"
              value={chamado}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setChamado(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Ex: CH00123"
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

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

// NOVO COMPONENTE: Formulário para Editar Agendamento
const EditAppointmentForm = ({
  machineId,
  currentProximaManutencao,
  onSave,
  onCancel,
  referenceDate,
}: {
  machineId: string;
  currentProximaManutencao: string;
  onSave: (machineId: string, newProximaManutencao: string) => void | Promise<void>;
  onCancel: () => void;
  referenceDate: string;
}) => {
  const [newProximaManutencao, setNewProximaManutencao] = useState(currentProximaManutencao);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    if (!newProximaManutencao) {
      setError('Por favor, selecione uma nova Data de Agendamento.');
      return;
    }
    if (new Date(newProximaManutencao) < new Date(referenceDate)) {
        setError('A nova Data de Agendamento não pode ser no passado.');
        return;
    }
    onSave(machineId, newProximaManutencao);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Alterar Data de Agendamento</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nova Data de Agendamento</label>
            <input
              type="date"
              value={newProximaManutencao}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewProximaManutencao(e.target.value)}
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

// --- 3. COMPONENTE PRINCIPAL (MaintenanceApp) ---
const MaintenanceApp = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [tab, setTab] = useState<'equipamentos' | 'agendadas' | 'pendentes' | 'realizadas'>('equipamentos');
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState<Machine | null>(null);
  const [showEditAppointmentForm, setShowEditAppointmentForm] = useState<Machine | null>(null);

  const currentDayString = new Date().toISOString().split('T')[0];

  // --- Efeito para CARREGAR dados do Firestore (NÃO POPULAR MAIS AQUI) ---
 useEffect(() => {
  const fetchMachines = async () => {
    try {
      console.log("[DEBUG] Fetching machines from Firestore...");
      const machinesCollection = collection(db, 'machines');
      const machineSnapshot = await getDocs(machinesCollection);

      const machinesList = machineSnapshot.docs.map(doc => {
        const data = doc.data();
        const status: 'pendente' | 'agendado' | 'concluido' = data.dataRealizacao
          ? 'concluido'
          : data.proximaManutencao
          ? new Date(data.proximaManutencao) < new Date(currentDayString)
            ? 'pendente'
            : 'agendado'
          : 'pendente';

        return {
          id: doc.id,
          ...data,
          status,
        } as Machine;
      });
      setMachines(machinesList);
      console.log(`[DEBUG] Loaded ${machinesList.length} machines from Firestore.`);

    } catch (error) {
      console.error("🔥 [DEBUG] Erro ao carregar máquinas do Firestore:", error);
    }
  };

  fetchMachines();
}, [currentDayString]);

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
      new Date(m.proximaManutencao) >= new Date(currentDayString)
  ).sort((a, b) => (a.proximaManutencao || '').localeCompare(b.proximaManutencao || ''));

  const pendentes = machines.filter(
    (m) =>
      !m.dataRealizacao &&
      m.proximaManutencao &&
      new Date(m.proximaManutencao) < new Date(currentDayString)
  ).sort((a, b) => (a.proximaManutencao || '').localeCompare(b.proximaManutencao || ''));

  const realizadas = machines.filter((m) => m.dataRealizacao)
    .sort((a, b) => (b.dataRealizacao || '').localeCompare(a.dataRealizacao || ''));

  const sectors = [...new Set(machines.map((m) => m.setor))].sort();

  const equipamentosCount = filteredEquipamentos.length;
  const agendadasCount = agendadas.length;
  const pendentesCount = pendentes.length;
  const realizadasCount = realizadas.length;

  const handleEdit = (machineToEdit: Machine) => { // Renomeado para clareza
    // Encontrar a última manutenção realizada para esta máquina
    const lastCompletedMaintenance = machines
      .filter(m =>
        m.maquina === machineToEdit.maquina && // Mesma máquina
        m.setor === machineToEdit.setor &&   // Mesmo setor (ou use etiqueta se for mais único)
        m.dataRealizacao                     // Que tenha data de realização (foi concluída)
      )
      .sort((a, b) => {
        // Ordena para encontrar a MAIS RECENTE
        const dateA = new Date(a.dataRealizacao || '1970-01-01').getTime();
        const dateB = new Date(b.dataRealizacao || '1970-01-01').getTime();
        return dateB - dateA; // Ordem decrescente (mais recente primeiro)
      })[0]; // Pega o primeiro (o mais recente)

    // Cria um objeto de máquina temporário para preencher o formulário
    const machineWithLastChamado = {
      ...machineToEdit,
      // Se encontrou a última manutenção concluída, usa o chamado dela; caso contrário, usa o chamado atual da máquina sendo editada (que pode estar vazio)
      chamado: lastCompletedMaintenance ? lastCompletedMaintenance.chamado : machineToEdit.chamado
    };

    setEditingMachine(machineWithLastChamado);
    setShowMachineForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
      try {
        const machineDocRef = doc(db, 'machines', id);
        await deleteDoc(machineDocRef);

        setMachines((prev) => prev.filter((machine) => machine.id !== id));
        console.log("Máquina deletada do Firestore e do estado local com ID:", id);
      } catch (error) {
        console.error("Erro ao deletar máquina do Firestore:", error);
      }
    }
  };

const handleSave = async (formData: Omit<Machine, 'id'>) => {
    try {
      const calculatedStatus: 'pendente' | 'agendado' | 'concluido' = formData.dataRealizacao
        ? 'concluido'
        : formData.proximaManutencao
        ? new Date(formData.proximaManutencao) < new Date(currentDayString)
          ? 'pendente'
          : 'agendado'
        : 'pendente';

      if (editingMachine) {
        const machineDocRef = doc(db, 'machines', editingMachine.id);

        const dataToUpdate = {
          ...formData,
          status: calculatedStatus,
          timestamp: new Date(),
        };

        await updateDoc(machineDocRef, dataToUpdate);

        setMachines((prev) =>
          prev.map((m) =>
            m.id === editingMachine.id ? { ...m, ...formData, status: calculatedStatus } as Machine : m
          )
        );
        console.log("Máquina atualizada no Firestore e no estado local!");

      } else {
        const newMachineData = {
          ...formData,
          status: calculatedStatus,
          timestamp: new Date(),
        };

        const docRef = await addDoc(collection(db, 'machines'), newMachineData);

        const newMachineWithId: Machine = {
          id: docRef.id,
          ...newMachineData,
        };
        setMachines((prev) => [...prev, newMachineWithId]);
        console.log("Nova máquina adicionada ao Firestore e ao estado local com ID:", docRef.id);
      }
      setShowMachineForm(false);
      setEditingMachine(null);
    } catch (error) {
      console.error("Erro ao salvar máquina no Firestore:", error);
    }
  };

  const startCompletion = (machine: Machine) => {
    setShowCompletionForm(machine);
  };

const handleCompleteMaintenance = async (
    id: string,
    newDateRealizacao: string,
    newChamado: string
  ) => {
    try {
      const machineDocRef = doc(db, 'machines', id);
      const dataToUpdate: {
        dataRealizacao: string;
        chamado: string;
        status: 'concluido';
        timestampConclusao: Date;
      } = {
        dataRealizacao: newDateRealizacao,
        chamado: newChamado,
        status: 'concluido',
        timestampConclusao: new Date(),
      };
      await updateDoc(machineDocRef, dataToUpdate);

      const completedMachine = machines.find(m => m.id === id);

      if (completedMachine && newDateRealizacao) {
        let calculatedNextMaintenanceDateObj = new Date(newDateRealizacao);
        calculatedNextMaintenanceDateObj.setDate(calculatedNextMaintenanceDateObj.getDate() + 90);

        // --- NOVO: Verificação e ajuste para dia útil ---
        calculatedNextMaintenanceDateObj = getNextBusinessDay(calculatedNextMaintenanceDateObj);
        // --- FIM NOVO ---

        const nextMaintenanceDate = calculatedNextMaintenanceDateObj.toISOString().split('T')[0];

        const newCycleStatus: 'pendente' | 'agendado' | 'concluido' =
          new Date(nextMaintenanceDate) < new Date(currentDayString) ? 'pendente' : 'agendado';

        const newCycleMachineData = {
          setor: completedMachine.setor,
          maquina: completedMachine.maquina,
          etiqueta: completedMachine.etiqueta,
          chamado: '', // O chamado do novo ciclo é vazio, o anterior é pego via handleEdit
          proximaManutencao: nextMaintenanceDate,
          dataRealizacao: '',
          status: newCycleStatus,
          timestampCriacaoCiclo: new Date(),
        };

        const newDocRef = await addDoc(collection(db, 'machines'), newCycleMachineData);

        let updatedMachines = machines.map((machine) => {
          if (machine.id === id) {
            return {
              ...machine,
              dataRealizacao: newDateRealizacao,
              chamado: newChamado,
              status: 'concluido',
            } as Machine;
          }
          return machine;
        });

        const newCycleMachineWithId: Machine = {
          id: newDocRef.id,
          ...newCycleMachineData,
        };
        updatedMachines = [...updatedMachines, newCycleMachineWithId];

        setMachines(updatedMachines);
        console.log("Manutenção concluída e novo ciclo criado no Firestore e no estado local. ID original:", id, "Novo ciclo ID:", newDocRef.id);

      } else {
        console.warn("Máquina não encontrada ou data de realização não fornecida para completar manutenção.");
      }
    } catch (error) {
      console.error("Erro ao finalizar manutenção ou criar novo ciclo no Firestore:", error);
    } finally {
      setShowCompletionForm(null);
    }
  };

  const handleEditAppointmentDate = async (
    id: string,
    newProximaManutencao: string
  ) => {
    try {
      const machineDocRef = doc(db, 'machines', id);

      const newStatus: 'pendente' | 'agendado' | 'concluido' =
        new Date(newProximaManutencao) < new Date(currentDayString) ? 'pendente' : 'agendado';

      const dataToUpdate = {
        proximaManutencao: newProximaManutencao,
        status: newStatus,
        timestampUltimaAtualizacao: new Date(),
      };

      await updateDoc(machineDocRef, dataToUpdate);

      setMachines((prevMachines) => {
        return prevMachines.map((machine) => {
          if (machine.id === id) {
            return {
              ...machine,
              ...dataToUpdate,
            } as Machine;
          }
          return machine;
        });
      });
      console.log("Data de agendamento atualizada no Firestore e no estado local. ID:", id);
    } catch (error) {
      console.error("Erro ao editar data de agendamento no Firestore:", error);
    } finally {
      setShowEditAppointmentForm(null);
    }
  };


  const handleNewAppointmentSave = async (
    machineId: string,
    appointmentDate: string
  ) => {
    try {
      const machineDocRef = doc(db, 'machines', machineId);

      const newStatus: 'pendente' | 'agendado' | 'concluido' =
        new Date(appointmentDate) < new Date(currentDayString) ? 'pendente' : 'agendado';

      const dataToUpdate = {
        proximaManutencao: appointmentDate,
        status: newStatus,
        dataRealizacao: '',
        timestampUltimaAtualizacao: new Date(),
      };

      await updateDoc(machineDocRef, dataToUpdate);

      setMachines((prevMachines) => {
        return prevMachines.map((m) => {
          if (m.id === machineId) {
            return {
              ...m,
              ...dataToUpdate,
            } as Machine;
          }
          return m;
        });
      });
      console.log("Novo agendamento salvo no Firestore e no estado local para ID:", machineId);
    } catch (error) {
      console.error("Erro ao salvar novo agendamento no Firestore:", error);
    } finally {
      setShowNewAppointmentForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* ALTERAÇÃO: Padding responsivo para o container principal */}
      <div className="container mx-auto px-2 sm:px-4 md:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-0">
              <div className="bg-blue-600 p-2 sm:p-3 rounded-xl">
                <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                  Controle de Manutenção
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Visualização por Status</p>
              </div>
            </div>
            {/* BOTÃO DE POPULAÇÃO MANUAL REMOVIDO */}
            {tab === 'equipamentos' && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setEditingMachine(null);
                            setShowMachineForm(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        Nova Máquina
                    </button>
                </div>
            )}
            {tab === 'agendadas' && (
              <button
                onClick={() => setShowNewAppointmentForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base w-full sm:w-auto"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                Novo Agendamento
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            <TabButton label="Equipamentos" value="equipamentos" current={tab} setTab={setTab} count={equipamentosCount} activeColorClass="bg-blue-600" />
            <TabButton label="Agendadas" value="agendadas" current={tab} setTab={setTab} count={agendadasCount} activeColorClass="bg-purple-600" />
            <TabButton label="Pendentes" value="pendentes" current={tab} setTab={setTab} count={pendentesCount} activeColorClass="bg-orange-600" />
            <TabButton label="Realizadas" value="realizadas" current={tab} setTab={setTab} count={realizadasCount} activeColorClass="bg-green-600" />
          </div>

          {tab === 'equipamentos' && (
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative w-full md:w-auto">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por máquina ou etiqueta..."
                  className="w-full pl-10 pr-4 py-3 border rounded-xl"
                  value={searchTerm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-3 border rounded-xl w-full md:w-auto"
                value={selectedSector}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedSector(e.target.value)}
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
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  {/* ALTERAÇÃO: Usando ternário para garantir que sempre há um retorno JSX ou null */}
                  {tab === 'equipamentos' ? (
                    <>
                      <th className="p-2">Setor</th>
                      <th className="p-2">Máquina</th>
                      <th className="p-2">Etiqueta</th>
                      <th className="p-2 text-right">Ações</th>
                    </>
                  ) : tab === 'agendadas' ? (
                    <>
                      <th className="p-2">Data Agendamento</th>
                      <th className="p-2">Máquina</th>
                      <th className="p-2">Data Realização</th>
                    </>
                  ) : tab === 'pendentes' ? (
                    <>
                      <th className="p-2">Data Agendamento</th>
                      <th className="p-2">Máquina</th>
                      <th className="p-2">Data Realização</th>
                    </>
                  ) : tab === 'realizadas' ? (
                    <>
                      <th className="p-2">Data Agendamento</th>
                      <th className="p-2">Data Realização</th>
                      <th className="p-2">Máquina</th>
                      <th className="p-2">Status</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {(tab === 'equipamentos' ? filteredEquipamentos :
                  tab === 'agendadas' ? agendadas :
                  tab === 'pendentes' ? pendentes :
                  realizadas
                ).map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    {/* ALTERAÇÃO: Usando ternário para garantir que sempre há um retorno JSX ou null para as células */}
                    {tab === 'equipamentos' ? (
                      <>
                        <td className="p-2">{m.setor}</td>
                        <td className="p-2">{m.maquina}</td>
                        <td className="p-2">{m.etiqueta}</td>
                        <td className="p-2 text-right space-x-2">
                          <button onClick={() => handleEdit(m)} className="text-blue-600 hover:underline">Editar</button>
                          <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:underline">Excluir</button>
                        </td>
                      </>
                    ) : tab === 'agendadas' ? (
                      <>
                        <td className="p-2">
                          <span
                            onClick={() => setShowEditAppointmentForm(m)}
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded-md block"
                          >
                            {m.proximaManutencao || '—'}
                          </span>
                        </td>
                        <td className="p-2">
                            {m.maquina}
                            {m.chamado && <span className="text-xs text-gray-500 block">Chamado: {m.chamado}</span>}
                        </td>
                        <td className="p-2">
                          <span
                            onClick={() => startCompletion(m)}
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded-md block"
                          >
                            {m.dataRealizacao || '—'}
                          </span>
                        </td>
                      </>
                    ) : tab === 'pendentes' ? (
                      <>
                        <td className="p-2">{m.proximaManutencao}</td>
                        <td className="p-2">
                            {m.maquina}
                            {m.chamado && <span className="text-xs text-gray-500 block">Chamado: {m.chamado}</span>}
                        </td>
                        <td className="p-2">
                          <span
                            onClick={() => startCompletion(m)}
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded-md block"
                          >
                            {m.dataRealizacao || '—'}
                          </span>
                        </td>
                      </>
                    ) : tab === 'realizadas' ? (
                      <>
                        <td className="p-2">{m.proximaManutencao || '—'}</td>
                        <td className="p-2">{m.dataRealizacao}</td>
                        <td className="p-2">
                            {m.maquina}
                            {m.chamado && <span className="text-xs text-gray-500 block">Chamado: {m.chamado}</span>}
                        </td>
                        <td className="p-2">
                          {m.proximaManutencao && m.dataRealizacao && new Date(m.dataRealizacao) > new Date(m.proximaManutencao)
                            ? 'Com Atraso'
                            : 'Em Dia'}
                        </td>
                      </>
                    ) : null}
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
              today={currentDayString}
            />
          )}

          {showCompletionForm && (
            <CompletionForm
              machineId={showCompletionForm.id}
              currentDateRealizacao={showCompletionForm.dataRealizacao || ''}
              currentChamado={showCompletionForm.chamado || ''}
              onSave={handleCompleteMaintenance}
              onCancel={() => setShowCompletionForm(null)}
            />
          )}

          {showEditAppointmentForm && (
            <EditAppointmentForm
              machineId={showEditAppointmentForm.id}
              currentProximaManutencao={showEditAppointmentForm.proximaManutencao || ''}
              onSave={handleEditAppointmentDate}
              onCancel={() => setShowEditAppointmentForm(null)}
              referenceDate={currentDayString}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceApp;