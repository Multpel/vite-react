// src/data/initialMachines.ts

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

export const initialMachines: Omit<Machine, 'id'>[] = [
  { setor: 'TI', maquina: 'infoti-pc', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'TI', maquina: 'info-pc', etiqueta: 'MA-5L6M7N8-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'DIR', maquina: 'dir-ronildo-pc', etiqueta: 'MA-1E2F3G4-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'DIR', maquina: 'ronilson-pc', etiqueta: 'MA-5H6I7J8-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'BAL', maquina: 'bal1-pc', etiqueta: 'MA-3R4S5T6-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'BAL', maquina: 'bal2-pc', etiqueta: 'MA-7U8V9W0-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'BAL', maquina: 'bal3-pc', etiqueta: 'MA-1M2N3O4-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'BAL', maquina: 'bal4-pc', etiqueta: 'MA-5P6Q7R8-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FIN', maquina: 'cobranca-pc', etiqueta: 'MA-9G0H1L2-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FAT', maquina: 'fat2-pc', etiqueta: 'MA-3G4H5I6-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'LOG', maquina: 'ctrlfrota-pc', etiqueta: 'MA-3V4W5X6-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'TLM', maquina: 'tele2-pc', etiqueta: 'MA-1T2U3V4-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'COM', maquina: 'adm-pc', etiqueta: 'MA-3N4O5P6-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'TLM', maquina: 'tele3-pc', etiqueta: 'MA-5W6X7Y8-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'TLM', maquina: 'tele5-pc', etiqueta: 'MA-3C4D5E6-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'TLM', maquina: 'telemkt1-pc', etiqueta: 'MA-7Q8R9S0-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'LOG', maquina: 'enc-pc', etiqueta: 'MA-7Y8Z9A0-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'DEP', maquina: 'ava-pc', etiqueta: 'MA-3M4N5O6-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FIN', maquina: 'camera-pc', etiqueta: 'MA-3B4C5D6-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'DEP', maquina: 'box-pc', etiqueta: 'MA-9J0K1L2-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'DEP', maquina: 'check-pc', etiqueta: 'MA-5F6G7H8I-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FAT', maquina: 'cadastro-pc', etiqueta: 'MA-7M8N9O0-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'IND', maquina: 'ind-pc', etiqueta: 'MA-7P8Q9R0-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'DP', maquina: 'dpessoal-pc', etiqueta: 'MA-3Y4Z5A6-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'TLM', maquina: 'tlm4-pc', etiqueta: 'MA-9Z0A1B2-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'WMS', maquina: 'wms-pc', etiqueta: 'MA-1B2C3D4E-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'LOG', maquina: 'log-pc', etiqueta: 'MA-9S0T1U2-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'REC', maquina: 'recep-pc', etiqueta: 'MA-5A6B7C8-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'ROT', maquina: 'roteirizador-pc', etiqueta: 'MA-1X2Y3Z4-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'TI', maquina: 'ts-server', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'COM', maquina: 'comp-pc', etiqueta: 'MA-9K0L1M2-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'DIR', maquina: 'jessica-pc', etiqueta: 'MA-7B8C9D0-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'DP', maquina: 'rh-pc', etiqueta: 'MA-9V0W1X2-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FAT', maquina: 'fiscal-pc', etiqueta: 'MA-9D0E1F2-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FIN', maquina: 'monitorcam-pc', etiqueta: 'MA-5S6T7U8-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FAT', maquina: 'entnf-pc', etiqueta: 'MA-7J8K9L0-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FIN', maquina: 'alm-pc', etiqueta: 'MA-7F8G9H0-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'DIR', maquina: 'auditoria-pc', etiqueta: 'MA-5D6E7F8-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FIN', maquina: 'acerto-pc', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FIN', maquina: 'acerto2-pc', etiqueta: 'MA-1P2Q3R4-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FIN', maquina: 'cpagar-pc', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'FIN', maquina: 'fin02-pc', etiqueta: 'MA-3J4K5L6-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'SPCOM', maquina: 'spven-pc', etiqueta: 'MA-1A2B3C4-L', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'CX', maquina: 'cxmultpel-pc', etiqueta: 'MA-9O0P1Q2-P', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'TI', maquina: 'SRV Domain', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' },
  { setor: 'TI', maquina: 'SRVTS', etiqueta: '', chamado: '', proximaManutencao: '', dataRealizacao: '', status: 'pendente' }
];