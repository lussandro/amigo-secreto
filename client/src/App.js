import React, { useState, useEffect } from 'react';
import './App.css';
import GruposList from './components/GruposList';
import GrupoDetail from './components/GrupoDetail';
import RevealPage from './components/RevealPage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.origin.includes('localhost:3000') 
    ? 'http://localhost:5000/api' 
    : window.location.origin + '/api');

function App() {
  const [view, setView] = useState('grupos');
  const [selectedGrupo, setSelectedGrupo] = useState(null);

  useEffect(() => {
    // Verificar se estamos na rota /reveal
    const path = window.location.pathname;
    if (path.startsWith('/reveal/')) {
      setView('reveal');
    } else {
      setView('grupos');
    }
  }, []);

  const handleSelectGrupo = (grupo) => {
    setSelectedGrupo(grupo);
    setView('grupo-detail');
    // Atualizar URL sem recarregar
    window.history.pushState({}, '', `/grupo/${grupo.id}`);
  };

  const handleBack = () => {
    setView('grupos');
    setSelectedGrupo(null);
    window.history.pushState({}, '', '/');
  };

  if (view === 'reveal') {
    return <RevealPage />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎁 Amigo Secreto</h1>
      </header>
      
      {view === 'grupos' && (
        <GruposList 
          onSelectGrupo={handleSelectGrupo}
          apiBaseUrl={API_BASE_URL}
        />
      )}
      
      {view === 'grupo-detail' && selectedGrupo && (
        <GrupoDetail 
          grupo={selectedGrupo}
          onBack={handleBack}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </div>
  );
}

export default App;
