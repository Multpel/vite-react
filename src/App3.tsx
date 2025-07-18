import { useState } from 'react';

type TabKey = 'dados' | 'documentos' | 'ocorrencias' | 'fotos';

interface TabButtonProps {
  label: string;
  value: TabKey;
  current: TabKey;
  setTab: (value: TabKey) => void;
}

const TabButton = ({ label, value, current, setTab }: TabButtonProps) => (
  <button
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
      current === value
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    }`}
    onClick={() => setTab(value)}
  >
    {label}
  </button>
);

function App() {
  const [tab, setTab] = useState<TabKey>('dados');

  return (
    <div className="p-4">
      <div className="flex space-x-2 mb-4">
        <TabButton
          label="Dados"
          value="dados"
          current={tab}
          setTab={setTab}
        />
        <TabButton
          label="Documentos"
          value="documentos"
          current={tab}
          setTab={setTab}
        />
        <TabButton
          label="Ocorrências"
          value="ocorrencias"
          current={tab}
          setTab={setTab}
        />
        <TabButton
          label="Fotos"
          value="fotos"
          current={tab}
          setTab={setTab}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        {tab === 'dados' && (
          <div>
            <h2 className="text-lg font-bold mb-2">Dados do Equipamento</h2>
            <p>Conteúdo da aba de dados...</p>
          </div>
        )}

        {tab === 'documentos' && (
          <div>
            <h2 className="text-lg font-bold mb-2">Documentos</h2>
            <p>Conteúdo da aba de documentos...</p>
          </div>
        )}

        {tab === 'ocorrencias' && (
          <div>
            <h2 className="text-lg font-bold mb-2">Ocorrências</h2>
            <p>Conteúdo da aba de ocorrências...</p>
          </div>
        )}

        {tab === 'fotos' && (
          <div>
            <h2 className="text-lg font-bold mb-2">Fotos</h2>
            <p>Conteúdo da aba de fotos...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;