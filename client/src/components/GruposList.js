import React, { useState, useEffect } from 'react';

function GruposList({ onSelectGrupo, apiBaseUrl }) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome_do_grupo: '', descricao: '' });

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
      }
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      alert('Erro ao criar grupo');
    }
  };

  const handleDeleteGrupo = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este grupo?')) {
      return;
    }
    
    try {
      const response = await fetch(`${apiBaseUrl}/grupos/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadGrupos();
      }
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      alert('Erro ao deletar grupo');
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

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Grupos de Amigo Secreto</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Novo Grupo'}
          </button>
        </div>

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
      ) : (
        grupos.map(grupo => (
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
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => onSelectGrupo(grupo)}
                >
                  Abrir
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

