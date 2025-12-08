import React, { useState, useEffect } from 'react';
import Toast from './Toast';

function GruposList({ onSelectGrupo, apiBaseUrl }) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome_do_grupo: '', descricao: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadGrupos();
  }, []);

  const loadGrupos = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/grupos`);
      const data = await response.json();
      setGrupos(data);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGrupo = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBaseUrl}/grupos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setFormData({ nome_do_grupo: '', descricao: '' });
        setShowForm(false);
        loadGrupos();
        setToast({ message: 'Grupo criado com sucesso!', type: 'success' });
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erro ao criar grupo', type: 'error' });
      }
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      setToast({ message: 'Erro ao criar grupo', type: 'error' });
    }
  };

  const handleDeleteGrupo = async (id) => {
    if (!window.confirm('⚠️ ATENÇÃO: Tem certeza que deseja deletar este grupo?\n\nEsta ação não pode ser desfeita e todos os dados serão perdidos!')) {
      return;
    }
    
    try {
      const response = await fetch(`${apiBaseUrl}/grupos/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadGrupos();
        setToast({ message: 'Grupo deletado com sucesso!', type: 'success' });
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erro ao deletar grupo', type: 'error' });
      }
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      setToast({ message: 'Erro ao deletar grupo', type: 'error' });
    }
  };

  const handleDuplicarGrupo = async (id) => {
    try {
      const response = await fetch(`${apiBaseUrl}/grupos/${id}/duplicar`, {
        method: 'POST'
      });
      
      if (response.ok) {
        loadGrupos();
        setToast({ message: 'Grupo duplicado com sucesso!', type: 'success' });
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erro ao duplicar grupo', type: 'error' });
      }
    } catch (error) {
      console.error('Erro ao duplicar grupo:', error);
      setToast({ message: 'Erro ao duplicar grupo', type: 'error' });
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'rascunho': 'Rascunho',
      'sorteado': 'Sorteado',
      'links_enviados': 'Links Enviados'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="loading">Carregando grupos...</div>;
  }

  // Filtrar grupos por busca
  const gruposFiltrados = grupos.filter(grupo =>
    grupo.nome_do_grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (grupo.descricao && grupo.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Grupos de Amigo Secreto</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Novo Grupo'}
          </button>
        </div>
        
        {grupos.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="🔍 Buscar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreateGrupo} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <div className="form-group">
              <label>Nome do Grupo *</label>
              <input
                type="text"
                value={formData.nome_do_grupo}
                onChange={(e) => setFormData({ ...formData, nome_do_grupo: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows="3"
              />
            </div>
            <button type="submit" className="btn btn-success">Criar Grupo</button>
          </form>
        )}
      </div>

      {grupos.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            Nenhum grupo criado ainda. Crie um novo grupo para começar!
          </p>
        </div>
      ) : gruposFiltrados.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6b7280' }}>
            Nenhum grupo encontrado com "{searchTerm}"
          </p>
        </div>
      ) : (
        gruposFiltrados.map(grupo => (
          <div key={grupo.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '0.5rem', color: '#1f2937' }}>{grupo.nome_do_grupo}</h3>
                {grupo.descricao && (
                  <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>{grupo.descricao}</p>
                )}
                <div style={{ marginTop: '0.5rem' }}>
                  <span className={`status-badge status-${grupo.status}`}>
                    {getStatusLabel(grupo.status)}
                  </span>
                  <span style={{ marginLeft: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                    Criado em: {new Date(grupo.data_criacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => onSelectGrupo(grupo)}
                >
                  Abrir
                </button>
                <button
                  className="btn"
                  onClick={() => handleDuplicarGrupo(grupo.id)}
                  style={{ backgroundColor: '#3b82f6', color: 'white' }}
                  title="Duplicar grupo"
                >
                  📋 Duplicar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteGrupo(grupo.id)}
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default GruposList;

