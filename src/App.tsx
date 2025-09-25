import { useState, useEffect, ChangeEvent } from 'react';
import { Calendar, Search, Plus, LogOut, Edit } from 'lucide-react';
import { db, auth } from './firebase-config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit  } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import AuthForm from './components/AuthForm';

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
const getNextBusinessDay = (date: Date): Date => {
  const newDate = new Date(date.getTime());
  let day = newDate.getDay();

  // 0 = Domingo, 6 = Sábado
  if (day === 6) { // Se for sábado, adiciona 2 dias
    newDate.setDate(newDate.getDate() + 2);
  } else if (day === 0) { // Se for domingo, adiciona 1 dia
    newDate.setDate(newDate.getDate() + 1);
  }
  return newDate;
};

const findNextAvailableBusinessDay = async (machineId: string, startDate: Date): Promise<string> => {
  let currentDate = new Date(startDate.getTime());
  let nextDateString = '';
  let found = false;

  while (!found) {
    currentDate = getNextBusinessDay(currentDate);
    nextDateString = currentDate.toISOString().split('T')[0];
    const isBooked = await isDateBooked(machineId, nextDateString);
    if (!isBooked) {
      found = true;
    } else {
      currentDate.setDate(currentDate.getDate() + 1); // Move to the next day if booked
    }
  }
  return nextDateString;
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
          <div>
            <label className="block text-sm font-medium mb-1">Última Manutenção</label>
            <input
              type="date"
              name="proximaManutencao"
              value={formData.proximaManutencao || ''}
              readOnly={true}
              className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
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
    // AQUI ESTÁ A VERIFICAÇÃO DO CAMPO "CHAMADO"
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
              onChange={(e) => setDateRealizacao(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nº Chamado</label>
            <input
              type="text"
              value={chamado}
              onChange={(e) => setChamado(e.target.value)}
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
  const [realizedMaintenance, setRealizedMaintenance] = useState<Machine[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estados para autenticação
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const currentDayString = new Date().toISOString().split('T')[0];

  // Efeito para monitorar o estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Efeito para carregar dados do Firestore
  useEffect(() => {
    const fetchMachines = async () => {
      if (!currentUser) {
        return;
      }
      try {
        console.log("[DEBUG] Fetching machines from Firestore...");
        const machinesCollection = collection(db, 'machines');
        const unsubscribe = onSnapshot(machinesCollection, (snapshot) => {
          const machinesList = snapshot.docs.map(doc => {
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
              status: status,
            } as Machine;
          });
          setMachines(machinesList);
          console.log(`[DEBUG] Loaded ${machinesList.length} machines.`);
        });
        return () => unsubscribe;
      } catch (error) {
        console.error("🔥 [DEBUG] Erro ao carregar máquinas do Firestore:", error);
      }
    };

    fetchMachines();
  }, [currentDayString, currentUser]);

  // NOVO useEffect para buscar o histórico de manutenções
  useEffect(() => {
    const fetchRealizedMaintenance = async () => {
      if (tab === 'realizadas' && currentUser) {
        try {
          console.log("[DEBUG] Fetching realized maintenance history...");
          const historyCollection = collection(db, 'maintenance_history');
          const unsubscribe = onSnapshot(historyCollection, (snapshot) => {
            const historyList = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                status: 'concluido',
              } as Machine;
            });
            setRealizedMaintenance(historyList.sort((a, b) => (b.dataRealizacao || '').localeCompare(a.dataRealizacao || '')));
            console.log(`[DEBUG] Loaded ${historyList.length} realized maintenances.`);
          });
          return () => unsubscribe;
        } catch (error) {
          console.error("🔥 [DEBUG] Erro ao carregar histórico de manutenções:", error);
        }
      }
    };

    fetchRealizedMaintenance();
  }, [tab, currentUser]);

  const filteredEquipamentos = machines.filter((m) => {
  const matchSearch = m.maquina.toLowerCase().includes(searchTerm.toLowerCase()) || m.etiqueta.toLowerCase().includes(searchTerm.toLowerCase());
  const matchSector = !selectedSector || m.setor === selectedSector;
  return matchSearch && matchSector;
}).sort((a, b) => {
  if (sortOrder === 'asc') {
    return a.maquina.localeCompare(b.maquina);
  } else {
    return b.maquina.localeCompare(a.maquina);
  }
});

  const agendadas = machines.filter(
    (m) => !m.dataRealizacao && m.proximaManutencao && new Date(m.proximaManutencao) >= new Date(currentDayString)
  ).sort((a, b) => (a.proximaManutencao || '').localeCompare(b.proximaManutencao || ''));

  const pendentes = machines.filter(
    (m) => !m.dataRealizacao && m.proximaManutencao && new Date(m.proximaManutencao) < new Date(currentDayString)
  ).sort((a, b) => (a.proximaManutencao || '').localeCompare(b.proximaManutencao || ''));

  const sectors = [...new Set(machines.map((m) => m.setor))].sort();

  const equipamentosCount = filteredEquipamentos.length;
  const agendadasCount = agendadas.length;
  const pendentesCount = pendentes.length;
  const realizadas = realizedMaintenance;
  const realizadasCount = realizedMaintenance.length;

  const handleSortByMaquina = () => {
  setSortOrder(prevSortOrder => (prevSortOrder === 'asc' ? 'desc' : 'asc'));
};
  
const handleEdit = async (machineToEdit: Machine) => {
    let lastChamado = '';
    
    try {
      const historyCollection = collection(db, 'maintenance_history');
      const q = query(
        historyCollection,
        where('maquina', '==', machineToEdit.maquina),
        where('setor', '==', machineToEdit.setor),
        orderBy('timestampConclusao', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const lastMaintenance = querySnapshot.docs[0].data();
        // Concatena o número do chamado e a data de realização
        lastChamado = `${lastMaintenance.chamado} - ${lastMaintenance.dataRealizacao}`;
      }
    } catch (error) {
      console.error("Erro ao buscar histórico de manutenção:", error);
    }

    const machineWithLastChamado = {
      ...machineToEdit,
      // Atribui o valor formatado ao campo 'chamado'
      chamado: lastChamado, 
    };
    
    setEditingMachine(machineWithLastChamado);
    setShowMachineForm(true);
};
  
const handleUpdate = async (id: string, formData: Omit<Machine, 'id'>) => {
  try {
    const machineDocRef = doc(db, 'machines', id);

    const calculatedStatus: 'pendente' | 'agendado' | 'concluido' = formData.dataRealizacao
      ? 'concluido'
      : formData.proximaManutencao
      ? new Date(formData.proximaManutencao) < new Date(currentDayString)
        ? 'pendente'
        : 'agendado'
      : 'pendente';

    // 🔑 mantém o chamado já gravado se o formData vier vazio
    const dataToUpdate = {
      ...formData,
      chamado: formData.chamado || (machines.find(m => m.id === id)?.chamado ?? ''),
      status: calculatedStatus,
      timestampUltimaAtualizacao: new Date(),
    };

    await updateDoc(machineDocRef, dataToUpdate);

    setMachines((prev) =>
      prev.map((m) =>
        m.id === id ? { id: id, ...dataToUpdate } as Machine : m
      )
    );
    console.log("Máquina atualizada no Firestore com ID:", id);
  } catch (error) {
    console.error("Erro ao atualizar máquina no Firestore:", error);
  } finally {
    setEditingMachine(null);
    setShowMachineForm(false);
  }
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
  
      const newMachineData = {
        ...formData,
        status: calculatedStatus,
        timestampCriacao: new Date(),
      };
      
      const newDocRef = await addDoc(collection(db, 'machines'), newMachineData);
      const machineWithId = { id: newDocRef.id, ...newMachineData } as Machine;
      setMachines((prev) => [...prev, machineWithId]);
      console.log("Máquina salva no Firestore com ID:", newDocRef.id);
      
    } catch (error) {
      console.error("Erro ao salvar máquina no Firestore:", error);
    } finally {
      setEditingMachine(null);
      setShowMachineForm(false);
    }
  };

  const handleCreateAppointment = async (machineId: string, appointmentDate: string) => {
    try {
      const machineDocRef = doc(db, 'machines', machineId);
      const dataToUpdate = {
        proximaManutencao: appointmentDate,
        status: new Date(appointmentDate) < new Date(currentDayString) ? 'pendente' : 'agendado',
        timestampAgendamento: new Date(),
      };
      await updateDoc(machineDocRef, dataToUpdate);
      setMachines((prev) =>
        prev.map((m) =>
          m.id === machineId ? { ...m, ...dataToUpdate } as Machine : m
        )
      );
      console.log("Agendamento criado ou atualizado com sucesso para o ID:", machineId);
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
    } finally {
      setShowNewAppointmentForm(false);
    }
  };

  const handleEditAppointmentDate = async (machineId: string, newProximaManutencao: string) => {
    try {
      const machineDocRef = doc(db, 'machines', machineId);
      const dataToUpdate = {
        proximaManutencao: newProximaManutencao,
        status: new Date(newProximaManutencao) < new Date(currentDayString) ? 'pendente' : 'agendado',
        timestampUltimaAtualizacao: new Date(),
      };
      await updateDoc(machineDocRef, dataToUpdate);

      setMachines((prev) =>
        prev.map((m) =>
          m.id === machineId ? { ...m, ...dataToUpdate } as Machine : m
        )
      );
      console.log("Data de agendamento atualizada com sucesso para o ID:", machineId);
    } catch (error) {
      console.error("Erro ao atualizar data de agendamento:", error);
    } finally {
      setShowEditAppointmentForm(null);
    }
  };

const handleCompleteMaintenance = async (
  id: string,
  newDateRealizacao: string,
  newChamado: string
) => {
  try {
    const machineDocRef = doc(db, 'machines', id);
    const machineToUpdate = machines.find(m => m.id === id);

    if (!machineToUpdate) {
      console.error("Máquina não encontrada para concluir manutenção.");
      return;
    }

    // Salva no histórico
    const historyData = {
      machineId: id,
      setor: machineToUpdate.setor,
      maquina: machineToUpdate.maquina,
      etiqueta: machineToUpdate.etiqueta,
      chamado: newChamado,
      dataRealizacao: newDateRealizacao,
      timestampConclusao: new Date(),
    };
    await addDoc(collection(db, 'maintenance_history'), historyData);
    console.log("Histórico de manutenção salvo com sucesso!");

    // Calcula próxima manutenção (90 dias úteis depois)
    const [year, month, day] = newDateRealizacao.split('-').map(Number);
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    let initialNextMaintenanceDate = new Date(baseDate.setDate(baseDate.getDate() + 90));
    const nextMaintenanceDate = await findNextAvailableBusinessDay(id, initialNextMaintenanceDate);

    const newStatus: 'pendente' | 'agendado' | 'concluido' =
      new Date(nextMaintenanceDate) < new Date(currentDayString) ? 'pendente' : 'agendado';

    // Atualiza o documento da máquina com o chamado formatado
    const dataToUpdate = {
      proximaManutencao: nextMaintenanceDate,
      dataRealizacao: newDateRealizacao,
      chamado: `${newChamado} - ${newDateRealizacao}`, // ✅ Corrigido
      status: newStatus,
      timestampUltimaAtualizacao: new Date(),
    };

    await updateDoc(machineDocRef, dataToUpdate);

    setMachines((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, ...dataToUpdate, status: newStatus } : m
      )
    );

    console.log("Registro da máquina atualizado com último chamado e próximo ciclo. ID:", id);

  } catch (error) {
    console.error("Erro ao finalizar manutenção ou criar histórico:", error);
  } finally {
    setShowCompletionForm(null);
  }
};

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Usuário desconectado.");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow mb-4">
          <div className="flex items-center mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold text-gray-800">Manutenção Preventiva</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowMachineForm(true)}
              className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition"
              aria-label="Adicionar Máquina"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => handleLogout()}
              className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow mb-4">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por Máquina ou Etiqueta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Todos os Setores</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end w-full sm:w-auto">
              <button
                onClick={() => setShowNewAppointmentForm(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition font-semibold w-full sm:w-auto"
              >
                Agendar
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-4 justify-between bg-white p-4 rounded-xl shadow mb-4">
            <TabButton
              label="Equipamentos"
              value="equipamentos"
              current={tab}
              setTab={setTab}
              count={equipamentosCount}
              activeColorClass="bg-blue-600"
            />
            <TabButton
              label="Agendadas"
              value="agendadas"
              current={tab}
              setTab={setTab}
              count={agendadasCount}
              activeColorClass="bg-yellow-600"
            />
            <TabButton
              label="Pendentes"
              value="pendentes"
              current={tab}
              setTab={setTab}
              count={pendentesCount}
              activeColorClass="bg-red-600"
            />
            <TabButton
              label="Realizadas"
              value="realizadas"
              current={tab}
              setTab={setTab}
              count={realizadasCount}
              activeColorClass="bg-green-600"
            />
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 capitalize">{tab}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Setor</th>
                    <th
  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
  onClick={handleSortByMaquina}
>
  <div className="flex items-center">
    Máquina
    {tab === 'equipamentos' && (
      <span className="ml-2">
        {sortOrder === 'asc' ? '▲' : '▼'}
      </span>
    )}
  </div>
</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiqueta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {tab === 'realizadas' ? 'Realização' : 'Próxima Manutenção'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(tab === 'equipamentos' ? filteredEquipamentos :
                    tab === 'agendadas' ? agendadas :
                    tab === 'pendentes' ? pendentes :
                    realizadas
                  ).map((m) => (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{m.setor}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{m.maquina}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{m.etiqueta}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tab === 'realizadas' ? m.dataRealizacao : m.proximaManutencao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${m.status === 'agendado' ? 'bg-yellow-100 text-yellow-800' :
                              m.status === 'pendente' ? 'bg-red-100 text-red-800' :
                              'bg-green-100 text-green-800'
                            }`}
                        >
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {tab === 'pendentes' || tab === 'agendadas' ? (
                          <>
                            <button
                              onClick={() => setShowCompletionForm(m)}
                              className="text-green-600 hover:text-green-900 mx-2"
                              title="Finalizar Manutenção"
                            >
                              <Calendar size={20} />
                            </button>
                            <button
                              onClick={() => setShowEditAppointmentForm(m)}
                              className="text-blue-600 hover:text-blue-900 mx-2"
                              title="Alterar Agendamento"
                            >
                              <Edit size={20} />
                            </button>
                          </>
                        ) : tab === 'equipamentos' ? (
                          <>
                            <button
                              onClick={() => handleEdit(m)}
                              className="text-indigo-600 hover:text-indigo-900 mx-2"
                              title="Editar Máquina"
                            >
                              <Edit size={20} />
                            </button>
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="text-red-600 hover:text-red-900 mx-2"
                              title="Excluir Máquina"
                            >
                              <LogOut size={20} />
                            </button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showMachineForm && (
        <MachineForm
          machine={editingMachine}
          onSave={editingMachine ? (formData) => handleUpdate(editingMachine.id, formData) : handleSave}
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
          onSave={handleCreateAppointment}
          onCancel={() => setShowNewAppointmentForm(false)}
          today={currentDayString}
        />
      )}

      {showCompletionForm && (
        <CompletionForm
          machineId={showCompletionForm.id}
          currentDateRealizacao={showCompletionForm.dataRealizacao || currentDayString}
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
  );
};

export default MaintenanceApp;

const isDateBooked = async (machineId: string, date: string): Promise<boolean> => {
  const q = query(
    collection(db, 'machines'),
    where('id', '!=', machineId), // Excluir a própria máquina se estiver sendo atualizada
    where('proximaManutencao', '==', date)
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

