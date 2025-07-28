import { useState, useEffect, ChangeEvent } from 'react';
import { Calendar, Settings, Search, Plus } from 'lucide-react';
import { db, auth } from './firebase-config'; // Importe 'auth' do seu firebase-config
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth'; // Importe onAuthStateChanged, signOut, User

// Importe seu novo componente de autenticação
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
      className={`flex flex-col items-center p-3 rounded-lg w-full sm:w-auto min-w-[100px] transition-all duration-300 ease-in-out
        ${current === value ? `${activeColorClass} text-white shadow-lg` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      onClick={() => setTab(value)}
    >
      <span className="text-lg sm:text-xl font-bold">{count}</span>
      <span className="text-xs sm:text-sm mt-1">{label}</span>
    </button>
  );
};

// --- COMPONENTES MODAIS (MachineForm, AppointmentForm, CompletionForm, EditAppointmentForm) ---
// Certifique-se de que estes componentes estão definidos em arquivos separados (ex: MachineForm.tsx, etc.)
// e importados aqui, ou definidos neste mesmo arquivo se preferir.
// O código abaixo assume que eles estão importados ou definidos em App.tsx.

interface MachineFormProps {
  machine: Machine | null;
  onSave: (machine: Omit<Machine, 'id' | 'status'>, id?: string) => void;
  onCancel: () => void;
  sectors: string[];
}

const MachineForm: React.FC<MachineFormProps> = ({ machine, onSave, onCancel, sectors }) => {
  const [setor, setSetor] = useState(machine?.setor || '');
  const [maquina, setMaquina] = useState(machine?.maquina || '');
  const [etiqueta, setEtiqueta] = useState(machine?.etiqueta || '');
  const [chamado, setChamado] = useState(machine?.chamado || '');
  const [proximaManutencao, setProximaManutencao] = useState(machine?.proximaManutencao || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ setor, maquina, etiqueta, chamado, proximaManutencao }, machine?.id);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{machine ? 'Editar Máquina' : 'Adicionar Nova Máquina'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Setor</label>
            <select
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Selecione um setor</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Máquina</label>
            <input type="text" value={maquina} onChange={(e) => setMaquina(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" required />
          </div>
          <div>
            <label className="block text-gray-700">Etiqueta</label>
            <input type="text" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" required />
          </div>
          <div>
            <label className="block text-gray-700">Chamado</label>
            <input type="text" value={chamado} onChange={(e) => setChamado(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-gray-700">Próxima Manutenção</label>
            <input type="date" value={proximaManutencao} onChange={(e) => setProximaManutencao(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};


interface AppointmentFormProps {
  machines: Machine[];
  onSave: (machineId: string, proximaManutencao: string, chamado: string) => void;
  onCancel: () => void;
  today: string;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ machines, onSave, onCancel, today }) => {
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [proximaManutencao, setProximaManutencao] = useState('');
  const [chamado, setChamado] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMachineId && proximaManutencao) {
      onSave(selectedMachineId, proximaManutencao, chamado);
    }
  };

  const getNextBusinessDay = (date: Date): Date => {
    const newDate = new Date(date.getTime());
    let day = newDate.getDay();

    if (day === 6) { // Sábado
      newDate.setDate(newDate.getDate() + 2);
    } else if (day === 0) { // Domingo
      newDate.setDate(newDate.getDate() + 1);
    }
    return newDate;
  };

  useEffect(() => {
    // Define a data padrão para o próximo dia útil a partir de 'today'
    const todayDate = new Date(today);
    const nextBusinessDay = getNextBusinessDay(todayDate);
    const formattedNextBusinessDay = nextBusinessDay.toISOString().split('T')[0];
    setProximaManutencao(formattedNextBusinessDay);
  }, [today]);

  const availableMachines = machines.filter(m => m.status === 'pendente' || m.status === 'equipamentos');

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Agendar Manutenção</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Máquina</label>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
              required
            >
              <option value="">Selecione uma máquina</option>
              {availableMachines.map(m => (
                <option key={m.id} value={m.id}>{m.maquina} ({m.etiqueta})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Próxima Manutenção</label>
            <input
              type="date"
              value={proximaManutencao}
              onChange={(e) => setProximaManutencao(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Chamado (Opcional)</label>
            <input type="text" value={chamado} onChange={(e) => setChamado(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Agendar</button>
          </div>
        </form>
      </div>
    </div>
  );
};


interface CompletionFormProps {
  machineId: string;
  currentDateRealizacao: string;
  currentChamado: string;
  onSave: (machineId: string, dataRealizacao: string, chamado: string) => void;
  onCancel: () => void;
}

const CompletionForm: React.FC<CompletionFormProps> = ({ machineId, currentDateRealizacao, currentChamado, onSave, onCancel }) => {
  const [dataRealizacao, setDataRealizacao] = useState(currentDateRealizacao || new Date().toISOString().split('T')[0]);
  const [chamado, setChamado] = useState(currentChamado || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (machineId && dataRealizacao) {
      onSave(machineId, dataRealizacao, chamado);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Concluir Manutenção</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Data de Realização</label>
            <input
              type="date"
              value={dataRealizacao}
              onChange={(e) => setDataRealizacao(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Chamado (Opcional)</label>
            <input type="text" value={chamado} onChange={(e) => setChamado(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Concluir</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditAppointmentFormProps {
  machineId: string;
  currentProximaManutencao: string;
  onSave: (machineId: string, newProximaManutencao: string) => void;
  onCancel: () => void;
  referenceDate: string; // Para calcular o próximo dia útil
}

const EditAppointmentForm: React.FC<EditAppointmentFormProps> = ({
  machineId,
  currentProximaManutencao,
  onSave,
  onCancel,
  referenceDate
}) => {
  const [newProximaManutencao, setNewProximaManutencao] = useState(currentProximaManutencao || '');

  // Define o valor inicial do input para o próximo dia útil se não houver um agendamento atual
  useEffect(() => {
    if (!currentProximaManutencao) {
      const todayDate = new Date(referenceDate);
      const nextBusinessDay = getNextBusinessDay(todayDate);
      const formattedNextBusinessDay = nextBusinessDay.toISOString().split('T')[0];
      setNewProximaManutencao(formattedNextBusinessDay);
    }
  }, [currentProximaManutencao, referenceDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (machineId && newProximaManutencao) {
      onSave(machineId, newProximaManutencao);
    }
  };

  const getNextBusinessDay = (date: Date): Date => {
    const newDate = new Date(date.getTime());
    let day = newDate.getDay();

    if (day === 6) { // Sábado
      newDate.setDate(newDate.getDate() + 2);
    } else if (day === 0) { // Domingo
      newDate.setDate(newDate.getDate() + 1);
    }
    return newDate;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Editar Agendamento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Nova Data de Manutenção</label>
            <input
              type="date"
              value={newProximaManutencao}
              onChange={(e) => setNewProximaManutencao(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
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


// --- COMPONENTE PRINCIPAL (MaintenanceApp) ---
const MaintenanceApp = () => {
  // --- NOVOS ESTADOS PARA AUTENTICAÇÃO ---
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Armazena o usuário logado
  const [loadingAuth, setLoadingAuth] = useState(true); // Indica se a verificação inicial de autenticação terminou

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

  // --- Efeito para MONITORAR o estado de autenticação ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false); // A verificação inicial terminou
      console.log("[DEBUG] Estado de autenticação alterado:", user ? user.email : "Nenhum usuário");
    });

    // Limpeza do listener quando o componente é desmontado
    return () => unsubscribe();
  }, []); // Array de dependências vazio para rodar apenas uma vez na montagem

  // --- Efeito para CARREGAR dados do Firestore (só se o usuário estiver logado) ---
  useEffect(() => {
    const fetchMachines = async () => {
      if (!currentUser) { // Não tenta carregar se não houver usuário logado
        setMachines([]); // Limpa as máquinas se o usuário deslogar
        return;
      }
      try {
        console.log("[DEBUG] Fetching machines from Firestore for user:", currentUser.email);
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
  }, [currentUser, currentDayString]); // Depende de currentUser e currentDayString

  // Função para fazer logout
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('Usuário deslogado com sucesso!');
      // O `onAuthStateChanged` vai detectar a mudança e atualizar `currentUser` para null
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  // --- Seus filtros e contadores existentes ---
  const sectors = Array.from(new Set(machines.map(m => m.setor)));

  const filteredEquipamentos = machines.filter(machine =>
    (searchTerm === '' ||
      machine.maquina.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.etiqueta.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedSector === '' || machine.setor === selectedSector)
  );

  const agendadas = machines.filter(m => m.status === 'agendado').sort((a, b) => {
    if (!a.proximaManutencao || !b.proximaManutencao) return 0;
    return new Date(a.proximaManutencao).getTime() - new Date(b.proximaManutencao).getTime();
  });
  const pendentes = machines.filter(m => m.status === 'pendente').sort((a, b) => {
    if (!a.proximaManutencao || !b.proximaManutencao) return 0;
    return new Date(a.proximaManutencao).getTime() - new Date(b.proximaManutencao).getTime();
  });
  const realizadas = machines.filter(m => m.status === 'concluido').sort((a, b) => {
    if (!a.dataRealizacao || !b.dataRealizacao) return 0;
    return new Date(b.dataRealizacao).getTime() - new Date(a.dataRealizacao).getTime(); // Mais recente primeiro
  });

  const equipamentosCount = filteredEquipamentos.length;
  const agendadasCount = agendadas.length;
  const pendentesCount = pendentes.length;
  const realizadasCount = realizadas.length;


  // --- Seus handlers de CRUD existentes ---
  const handleSave = async (newMachineData: Omit<Machine, 'id' | 'status'>, id?: string) => {
    try {
      if (id) {
        const machineRef = doc(db, 'machines', id);
        await updateDoc(machineRef, newMachineData);
        console.log(`Máquina ${id} atualizada com sucesso!`);
      } else {
        await addDoc(collection(db, 'machines'), {
          ...newMachineData,
          status: 'pendente' // Nova máquina começa como pendente
        });
        console.log("Nova máquina adicionada com sucesso!");
      }
      setShowMachineForm(false);
      setEditingMachine(null);
      // Recarregar máquinas após salvar
      // Este useEffect já será acionado quando currentUser mudar, mas podemos forçar um recarregamento se necessário.
      // Ou, melhor, atualizar o estado localmente. Por simplicidade, faremos um fetch completo.
      // O `useEffect` com `currentUser` já fará isso indiretamente se o usuário estiver logado.
    } catch (error) {
      console.error("Erro ao salvar máquina:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta máquina?")) {
      try {
        await deleteDoc(doc(db, 'machines', id));
        console.log(`Máquina ${id} excluída com sucesso!`);
        // Recarregar máquinas após excluir
        setMachines(machines.filter(m => m.id !== id));
      } catch (error) {
        console.error("Erro ao excluir máquina:", error);
      }
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setShowMachineForm(true);
  };

  const handleNewAppointmentSave = async (machineId: string, proximaManutencao: string, chamado: string) => {
    try {
      const machineRef = doc(db, 'machines', machineId);
      await updateDoc(machineRef, {
        proximaManutencao: proximaManutencao,
        chamado: chamado, // Atualiza o chamado ao agendar
        dataRealizacao: null, // Garante que a data de realização é nula ao agendar
      });
      console.log(`Agendamento para máquina ${machineId} salvo com sucesso!`);
      setShowNewAppointmentForm(false);
      // Recarregar máquinas
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
    }
  };

  const startCompletion = (machine: Machine) => {
    setShowCompletionForm(machine);
  };

  const handleCompleteMaintenance = async (machineId: string, dataRealizacao: string, chamado: string) => {
    try {
      const machineRef = doc(db, 'machines', machineId);
      await updateDoc(machineRef, {
        dataRealizacao: dataRealizacao,
        chamado: chamado, // Atualiza ou define o chamado ao concluir
      });
      console.log(`Manutenção para máquina ${machineId} concluída em ${dataRealizacao}!`);
      setShowCompletionForm(null);
      // Recarregar máquinas
    } catch (error) {
      console.error("Erro ao concluir manutenção:", error);
    }
  };

  const handleEditAppointmentDate = async (machineId: string, newProximaManutencao: string) => {
    try {
      const machineRef = doc(db, 'machines', machineId);
      await updateDoc(machineRef, {
        proximaManutencao: newProximaManutencao,
      });
      console.log(`Data de agendamento para máquina ${machineId} atualizada para ${newProximaManutencao}!`);
      setShowEditAppointmentForm(null);
      // Recarregar máquinas
    } catch (error) {
      console.error("Erro ao editar data de agendamento:", error);
    }
  };

  // --- RENDERIZAÇÃO CONDICIONAL BASEADA NO ESTADO DE AUTENTICAÇÃO ---
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg">
        Carregando autenticação...
      </div>
    );
  }

  if (!currentUser) {
    // Se não houver usuário logado, mostre o formulário de autenticação
    return (
      <AuthForm onAuthSuccess={() => { /* O useEffect de onAuthStateChanged já vai lidar com a navegação */ }} />
    );
  }

  // Se o usuário estiver logado, renderize o seu MaintenanceApp completo
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
            {/* NOVO: BOTÃO DE LOGOUT */}
            <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base w-full sm:w-auto"
            >
                Sair ({currentUser.email}) {/* Exibe o e-mail do usuário logado */}
            </button>
            {/* RESTO DOS SEUS BOTÕES DE ADICIONAR MÁQUINA/AGENDAMENTO */}
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

          {/* RESTO DO SEU CÓDIGO DO APP (Tabs, Tabela, Formulários Modais) */}
          {/* Mantenha o resto do seu código inalterado a partir daqui */}
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