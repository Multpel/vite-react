import { useState, useEffect, ChangeEvent } from 'react';
import { Calendar, Settings, Search, Plus } from 'lucide-react';
import { db } from './firebase-config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import initialMachines from './Data/initialMachines'; // ⬅️ Adicione esta linha

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
  id: string; // <<< CORRIGIDO: DEVE SER STRING!
  setor: string;
  maquina: string;
  etiqueta: string;
  chamado: string;
  proximaManutencao?: string; // <<< DEVE SER OPCIONAL
  dataRealizacao?: string;    // <<< DEVE SER OPCIONAL
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
      id: '', // <<< CORRIGIDO: Era 0, agora string vazia
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
          {/* CAMPO 'Próxima Manutenção' AGORA É SOMENTE LEITURA */}
          <div>
            <label className="block text-sm font-medium mb-1">Próxima Manutenção</label>
            <input
              type="date"
              name="proximaManutencao"
              value={formData.proximaManutencao || ''} // Handle undefined
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
    const [selectedMachineId, setSelectedMachineId] = useState<string | ''>(''); // <<< CORRIGIDO: number para string
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
                            min={today} // <<<<< ADICIONE ESTA LINHA AQUI
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
  machineId: string; // <<< CORRIGIDO: number para string
  currentDateRealizacao: string;
  currentChamado: string;
  onSave: (machineId: string, dateRealizacao: string, chamado: string) => void | Promise<void>;
  onCancel: () => void;
}) => {
  const [dateRealizacao, setDateRealizacao] = useState(currentDateRealizacao);
  const [chamado, setChamado] = useState(currentChamado);
  const [error, setError] = useState<string | null>(null);

  // CORREÇÃO: Variável renomeada para evitar conflito com 'today' de MaintenanceApp
  const currentDateString = new Date().toISOString().split('T')[0];

  const handleSubmit = () => {
    setError(null);
    if (!dateRealizacao) {
      setError('Por favor, informe a Data de Realização.');
      return;
    }
    if (new Date(dateRealizacao) > new Date(currentDateString)) { // Usando a nova variável
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
  referenceDate, // 'today' é uma prop aqui, renomeada para evitar conflito
}: {
  machineId: string; // <<< CORRIGIDO: number para string
  currentProximaManutencao: string;
  onSave: (machineId: string, newProximaManutencao: string) => void | Promise<void>;
  onCancel: () => void;
  referenceDate: string; // Renomeado
}) => {
  const [newProximaManutencao, setNewProximaManutencao] = useState(currentProximaManutencao);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    if (!newProximaManutencao) {
      setError('Por favor, selecione uma nova Data de Agendamento.');
      return;
    }
    if (new Date(newProximaManutencao) < new Date(referenceDate)) { // Usando referenceDate
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
  // NOVO ESTADO: Para controlar o formulário de edição de agendamento
  const [showEditAppointmentForm, setShowEditAppointmentForm] = useState<Machine | null>(null);

  const currentDayString = new Date().toISOString().split('T')[0];

  // --- Efeito para carregar dados do LocalStorage ou dados iniciais ---
 useEffect(() => {
  const fetchOrInitializeMachines = async () => {
    try {
      const machinesCollection = collection(db, 'machines');
      const machineSnapshot = await getDocs(machinesCollection);

      if (machineSnapshot.empty) {
        console.log("⚠️ Nenhuma máquina encontrada. Populando banco com initialMachines...");
        for (const machine of initialMachines) {
          await addDoc(machinesCollection, machine);
        }

        // Após inserir, buscar novamente
        const updatedSnapshot = await getDocs(machinesCollection);
        const machinesList = updatedSnapshot.docs.map(doc => {
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
      } else {
        // Banco já contém dados: carregar normalmente
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
      }
    } catch (error) {
      console.error("Erro ao buscar ou inicializar máquinas do Firestore:", error);
    }
  };

  fetchOrInitializeMachines();
}, [currentDayString]); // Adicione currentDayString nas dependências para recalcular se o dia mudar


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
  ).sort((a, b) => (a.proximaManutencao || '').localeCompare(b.proximaManutencao || '')); // Handle undefined

  const pendentes = machines.filter(
    (m) =>
      !m.dataRealizacao &&
      m.proximaManutencao &&
      new Date(m.proximaManutencao) < new Date(currentDayString)
  ).sort((a, b) => (a.proximaManutencao || '').localeCompare(b.proximaManutencao || '')); // Handle undefined

  const realizadas = machines.filter((m) => m.dataRealizacao)
    .sort((a, b) => (b.dataRealizacao || '').localeCompare(a.dataRealizacao || '')); // Handle undefined

  const sectors = [...new Set(machines.map((m) => m.setor))].sort();

  const equipamentosCount = filteredEquipamentos.length;
  const agendadasCount = agendadas.length;
  const pendentesCount = pendentes.length;
  const realizadasCount = realizadas.length;

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setShowMachineForm(true);
  };

  const handleDelete = async (id: string) => { // A função agora é async e o ID é string
    if (confirm('Tem certeza que deseja excluir este equipamento?')) { // Mantém a confirmação
      try {
        const machineDocRef = doc(db, 'machines', id); // Cria uma referência ao documento no Firestore
        await deleteDoc(machineDocRef); // Deleta o documento no Firestore

        // Atualiza o estado local APÓS a exclusão bem- sucedida no Firestore
        setMachines((prev) => prev.filter((machine) => machine.id !== id));
        console.log("Máquina deletada do Firestore e do estado local com ID:", id);
      } catch (error) {
        console.error("Erro ao deletar máquina do Firestore:", error);
        // Opcional: Adicionar feedback visual para o usuário em caso de erro
      }
    }
  };

const handleSave = async (formData: Omit<Machine, 'id'>) => { // Tornamos a função async
    try {
      const calculatedStatus: 'pendente' | 'agendado' | 'concluido' = formData.dataRealizacao
        ? 'concluido'
        : formData.proximaManutencao
        ? new Date(formData.proximaManutencao) < new Date(currentDayString)
          ? 'pendente'
          : 'agendado'
        : 'pendente';

      if (editingMachine) {
        // Lógica de EDIÇÃO para o Firestore
        const machineDocRef = doc(db, 'machines', editingMachine.id); // Cria uma referência ao documento Firestore

        // Os dados a serem atualizados no Firestore
        const dataToUpdate = {
          ...formData,
          status: calculatedStatus, // Salva o status calculado no Firestore
          timestamp: new Date(), // Opcional: atualiza o timestamp
        };

        await updateDoc(machineDocRef, dataToUpdate); // Atualiza o documento no Firestore

        // Atualiza o estado local APÓS a operação no Firestore
        setMachines((prev) =>
          prev.map((m) =>
            m.id === editingMachine.id ? { ...m, ...formData, status: calculatedStatus } as Machine : m // Explicitly cast to Machine
          )
        );
        console.log("Máquina atualizada no Firestore e no estado local!");

      } else {
        // Lógica de ADICIONAR NOVA MÁQUINA para o Firestore
        const newMachineData = {
          ...formData,
          status: calculatedStatus, // Salva o status calculado no Firestore
          timestamp: new Date(), // Adicione um timestamp para ordenação
        };

        // Adiciona um novo documento à coleção 'machines' no Firestore
        const docRef = await addDoc(collection(db, 'machines'), newMachineData);

        // Adiciona a nova máquina ao estado local com o ID gerado pelo Firestore
        const newMachineWithId: Machine = {
          id: docRef.id, // Use o ID gerado pelo Firestore
          ...newMachineData,
        };
        setMachines((prev) => [...prev, newMachineWithId]);
        console.log("Nova máquina adicionada ao Firestore e ao estado local com ID:", docRef.id);
      }
      setShowMachineForm(false);
      setEditingMachine(null);
    } catch (error) {
      console.error("Erro ao salvar máquina no Firestore:", error);
      // Opcional: Adicionar feedback visual para o usuário em caso de erro
    }
  };

  // Função para iniciar a finalização da manutenção (abre o formulário)
  const startCompletion = (machine: Machine) => {
    setShowCompletionForm(machine);
  };

  // Função para finalizar a manutenção com data e chamado
const handleCompleteMaintenance = async (
    id: string,
    newDateRealizacao: string,
    newChamado: string
  ) => {
    try {
      // --- 1. Atualizar a máquina concluída no Firestore ---
      const machineDocRef = doc(db, 'machines', id);
      const dataToUpdate: { // Explicitly type dataToUpdate for clarity
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

      // --- 2. Preparar e adicionar a nova máquina (próximo ciclo) no Firestore ---
      const completedMachine = machines.find(m => m.id === id);

      if (completedMachine && newDateRealizacao) {
        const completedDateObj = new Date(newDateRealizacao);
        completedDateObj.setDate(completedDateObj.getDate() + 90);

        const nextMaintenanceDate = completedDateObj.toISOString().split('T')[0];

        const newCycleStatus: 'pendente' | 'agendado' | 'concluido' =
          new Date(nextMaintenanceDate) < new Date(currentDayString) ? 'pendente' : 'agendado';

        const newCycleMachineData = {
          setor: completedMachine.setor,
          maquina: completedMachine.maquina,
          etiqueta: completedMachine.etiqueta,
          chamado: '',
          proximaManutencao: nextMaintenanceDate,
          dataRealizacao: '',
          status: newCycleStatus,
          timestampCriacaoCiclo: new Date(),
        };

        const newDocRef = await addDoc(collection(db, 'machines'), newCycleMachineData);

        // --- 3. Atualizar o estado local 'machines' ---
        let updatedMachines = machines.map((machine) => {
          if (machine.id === id) {
            return {
              ...machine,
              dataRealizacao: newDateRealizacao, // Directly use the new value
              chamado: newChamado, // Directly use the new value
              status: 'concluido', // Explicitly assign the literal type here
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

  // NOVO: Função para salvar a nova data de agendamento
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-3 border rounded-xl"
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
                    )}
                    {tab === 'pendentes' && (
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
                    )}
                    {tab === 'realizadas' && (
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

          {/* NOVO: Renderização condicional do formulário de edição de agendamento */}
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