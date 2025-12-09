import React, { useState, useEffect } from 'react';
import Toast from './Toast';

function GrupoDetail({ grupo, onBack, apiBaseUrl }) {
  const [participantes, setParticipantes] = useState([]);
  const [sorteio, setSorteio] = useState(null);
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showParticipanteForm, setShowParticipanteForm] = useState(false);
  const [participanteForm, setParticipanteForm] = useState({ nome: '', telefone: '' });
  const [editingParticipante, setEditingParticipante] = useState(null);
  const [toast, setToast] = useState(null);
  const [filtroVisualizacao, setFiltroVisualizacao] = useState('todos'); // todos, visualizados, pendentes
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    loadData(true);
  }, [grupo.id]);

  // Auto-refresh dos dados a cada 10 segundos se houver sorteio
  useEffect(() => {
    if (sorteio && grupo.status === 'sorteado') {
      const interval = setInterval(() => {
        loadData(false); // false = não mostrar loading
      }, 10000); // Atualiza a cada 10 segundos

      return () => clearInterval(interval);
    }
  }, [sorteio, grupo.status]);

  const loadData = async (showLoading = true) => {
    if (showLoading && isFirstLoad) {
      setLoading(true);
    }
    try {
      const [participantesRes, sorteioRes, enviosRes] = await Promise.all([
        fetch(`${apiBaseUrl}/grupos/${grupo.id}/participantes`),
        fetch(`${apiBaseUrl}/grupos/${grupo.id}/sorteio`),
        fetch(`${apiBaseUrl}/grupos/${grupo.id}/envios`)
      ]);

      const participantesData = await participantesRes.json();
      setParticipantes(participantesData);

      if (sorteioRes.ok) {
        const sorteioData = await sorteioRes.json();
        setSorteio(sorteioData.length > 0 ? sorteioData : null);
      }

      if (enviosRes.ok) {
        const enviosData = await enviosRes.json();
        setEnvios(enviosData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  };

  const handleEditParticipante = (participante) => {
    setEditingParticipante(participante);
    setParticipanteForm({ nome: participante.nome, telefone: participante.telefone });
    setShowParticipanteForm(true);
  };

  const handleUpdateParticipante = async (e) => {
    e.preventDefault();
    if (!editingParticipante) return;

    try {
      const response = await fetch(`${apiBaseUrl}/participantes/${editingParticipante.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participanteForm)
      });

      if (response.ok) {
        setParticipanteForm({ nome: '', telefone: '' });
        setShowParticipanteForm(false);
        setEditingParticipante(null);
        loadData();
        setToast({ message: 'Participante atualizado com sucesso!', type: 'success' });
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erro ao atualizar participante', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erro ao atualizar participante', type: 'error' });
    }
  };

  const handleAddParticipante = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBaseUrl}/grupos/${grupo.id}/participantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participanteForm)
      });

      if (response.ok) {
        setParticipanteForm({ nome: '', telefone: '' });
        setShowParticipanteForm(false);
        loadData();
        setToast({ message: 'Participante adicionado com sucesso!', type: 'success' });
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erro ao adicionar participante', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erro ao adicionar participante', type: 'error' });
    }
  };

  const handleDeleteParticipante = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este participante?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/participantes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadData();
        setToast({ message: 'Participante removido com sucesso!', type: 'success' });
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erro ao remover participante', type: 'error' });
      }
    } catch (error) {
      console.error('Erro ao deletar participante:', error);
      setToast({ message: 'Erro ao remover participante', type: 'error' });
    }
  };

  const handleRealizarSorteio = async () => {
    if (participantes.length < 3) {
      setToast({ message: 'É necessário pelo menos 3 participantes para realizar o sorteio', type: 'error' });
      return;
    }

    if (!window.confirm('Tem certeza que deseja realizar o sorteio? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/grupos/${grupo.id}/sorteio`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setToast({ message: data.message, type: 'success' });
        loadData();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erro ao realizar sorteio', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erro ao realizar sorteio', type: 'error' });
    }
  };

  const handleEnviarLinks = async () => {
    if (!window.confirm('Deseja enviar os links para todos os participantes via WhatsApp?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/grupos/${grupo.id}/enviar`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        const sucessos = data.resultados?.filter(r => r.status === 'enviado').length || 0;
        const erros = data.resultados?.filter(r => r.status === 'erro').length || 0;
        
        if (erros === 0) {
          setToast({ message: `Links enviados com sucesso para ${sucessos} participantes!`, type: 'success' });
        } else {
          setToast({ message: `Enviados: ${sucessos}, Erros: ${erros}`, type: 'warning' });
        }
        loadData();
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erro ao enviar links', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erro ao enviar links', type: 'error' });
    }
  };

  const handleEnviarMensagemTeste = async () => {
    if (participantes.length === 0) {
      setToast({ message: 'Não há participantes no grupo para enviar mensagem de teste', type: 'error' });
      return;
    }

    if (!window.confirm('Deseja enviar uma mensagem de TESTE para todos os participantes via WhatsApp?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/grupos/${grupo.id}/teste-envio`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        const sucessos = data.resultados.filter(r => r.status === 'enviado').length;
        const erros = data.resultados.filter(r => r.status === 'erro').length;
        
        if (erros === 0) {
          setToast({ message: `Mensagens de teste enviadas com sucesso para ${sucessos} participantes!`, type: 'success' });
        } else {
          setToast({ message: `Enviados: ${sucessos}, Erros: ${erros}. Verifique o console (F12) para detalhes.`, type: 'warning' });
          console.error('Erros no envio:', data.resultados.filter(r => r.status === 'erro'));
        }
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erro ao enviar mensagem de teste', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erro ao enviar mensagem de teste', type: 'error' });
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2>{grupo.nome_do_grupo}</h2>
            {grupo.descricao && <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>{grupo.descricao}</p>}
          </div>
          <button className="btn btn-secondary" onClick={onBack}>Voltar</button>
        </div>
      </div>

      {/* Participantes */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Participantes ({participantes.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {participantes.length > 0 && (
              <button 
                className="btn" 
                onClick={handleEnviarMensagemTeste}
                style={{ backgroundColor: '#f59e0b', color: 'white' }}
                title="Enviar mensagem de teste para todos os participantes"
              >
                🧪 Teste Envio
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setShowParticipanteForm(!showParticipanteForm)}>
              {showParticipanteForm ? 'Cancelar' : '+ Adicionar'}
            </button>
          </div>
        </div>

        {showParticipanteForm && (
          <form onSubmit={editingParticipante ? handleUpdateParticipante : handleAddParticipante} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            {editingParticipante && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#1e40af' }}>
                ✏️ Editando: {editingParticipante.nome}
              </div>
            )}
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                value={participanteForm.nome}
                onChange={(e) => setParticipanteForm({ ...participanteForm, nome: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefone (DDI + Número) *</label>
              <input
                type="text"
                value={participanteForm.telefone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setParticipanteForm({ ...participanteForm, telefone: value });
                }}
                placeholder="Ex: 5548999999999"
                required
                maxLength="15"
              />
              {participanteForm.telefone && participanteForm.telefone.length < 10 && (
                <small style={{ color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                  Telefone deve ter pelo menos 10 dígitos
                </small>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-success">
                {editingParticipante ? 'Salvar Alterações' : 'Adicionar'}
              </button>
              {editingParticipante && (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingParticipante(null);
                    setParticipanteForm({ nome: '', telefone: '' });
                    setShowParticipanteForm(false);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}

        <div className="participantes-list">
          {participantes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280' }}>Nenhum participante adicionado ainda.</p>
          ) : (
            participantes.map(p => (
              <div key={p.id} className="participante-item">
                <div>
                  <strong>{p.nome}</strong>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{p.telefone}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {grupo.status === 'rascunho' && (
                    <>
                      <button
                        className="btn"
                        onClick={() => handleEditParticipante(p)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#3b82f6', color: 'white' }}
                        title="Editar participante"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteParticipante(p.id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        title="Remover participante"
                      >
                        🗑️ Remover
                      </button>
                    </>
                  )}
                  <button
                    className="btn"
                    onClick={async () => {
                      if (!window.confirm(`Enviar mensagem de teste para ${p.nome}?`)) return;
                      
                      try {
                        const response = await fetch(`${apiBaseUrl}/grupos/${grupo.id}/teste-envio/${p.id}`, {
                          method: 'POST'
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          setToast({ message: data.message || `Mensagem de teste enviada para ${p.nome}!`, type: 'success' });
                        } else {
                          const error = await response.json();
                          setToast({ message: error.error || 'Erro ao enviar mensagem de teste', type: 'error' });
                        }
                      } catch (error) {
                        setToast({ message: 'Erro ao enviar mensagem de teste', type: 'error' });
                      }
                    }}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#f59e0b', color: 'white' }}
                    title="Enviar mensagem de teste individual"
                  >
                    🧪 Teste
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sorteio */}
      {participantes.length >= 3 && grupo.status === 'rascunho' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Sorteio</h3>
          <button className="btn btn-success" onClick={handleRealizarSorteio}>
            Realizar Sorteio
          </button>
        </div>
      )}

      {/* Resultado do Sorteio */}
      {sorteio && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3>Resultado do Sorteio</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280',
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                fontWeight: '600'
              }}>
                {sorteio.filter(s => s.visualizacoes > 0).length} de {sorteio.length} visualizados
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280',
                padding: '0.5rem 1rem',
                backgroundColor: '#eff6ff',
                borderRadius: '8px'
              }}>
                📊 {sorteio.length} participantes
              </div>
              <button
                onClick={() => {
                  const csv = [
                    ['Participante', 'Status', 'Visualizado em'].join(','),
                    ...sorteio.map(s => [
                      `"${s.participante_nome}"`,
                      s.visualizacoes > 0 ? 'Visualizado' : 'Pendente',
                      s.visualizado_em ? new Date(s.visualizado_em).toLocaleString('pt-BR') : '-'
                    ].join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `amigo-secreto-${grupo.nome_do_grupo}-${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                  setToast({ message: 'Dados exportados com sucesso!', type: 'success' });
                }}
                className="btn"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#10b981', color: 'white' }}
              >
                📥 Exportar CSV
              </button>
            </div>
          </div>
          
          {/* Filtros */}
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>Filtrar:</span>
            <button
              onClick={() => setFiltroVisualizacao('todos')}
              className="btn"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: filtroVisualizacao === 'todos' ? '#667eea' : '#f3f4f6',
                color: filtroVisualizacao === 'todos' ? 'white' : '#6b7280'
              }}
            >
              Todos ({sorteio.length})
            </button>
            <button
              onClick={() => setFiltroVisualizacao('visualizados')}
              className="btn"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: filtroVisualizacao === 'visualizados' ? '#10b981' : '#f3f4f6',
                color: filtroVisualizacao === 'visualizados' ? 'white' : '#6b7280'
              }}
            >
              ✓ Visualizados ({sorteio.filter(s => s.visualizacoes > 0).length})
            </button>
            <button
              onClick={() => setFiltroVisualizacao('pendentes')}
              className="btn"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: filtroVisualizacao === 'pendentes' ? '#f59e0b' : '#f3f4f6',
                color: filtroVisualizacao === 'pendentes' ? 'white' : '#6b7280'
              }}
            >
              ○ Pendentes ({sorteio.filter(s => s.visualizacoes === 0).length})
            </button>
          </div>
          
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981' 
              }}></span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Visualizado</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                display: 'inline-block', 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                backgroundColor: '#e5e7eb' 
              }}></span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Não visualizado</span>
            </div>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Participante</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Link</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Visualizado em</th>
                </tr>
              </thead>
              <tbody>
                {sorteio
                  .filter(s => {
                    if (filtroVisualizacao === 'visualizados') return s.visualizacoes > 0;
                    if (filtroVisualizacao === 'pendentes') return s.visualizacoes === 0;
                    return true;
                  })
                  .map(s => (
                  <tr 
                    key={s.id} 
                    style={{ 
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: s.visualizacoes > 0 ? '#f0fdf4' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      {s.visualizacoes > 0 ? (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          color: '#10b981',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ fontSize: '1rem' }}>✓</span>
                          Visualizado
                        </span>
                      ) : (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          <span style={{ fontSize: '1rem' }}>○</span>
                          Pendente
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{s.participante_nome}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <a 
                          href={s.link_visualizacao} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            color: s.visualizacoes > 0 ? '#6b7280' : '#667eea', 
                            wordBreak: 'break-all',
                            textDecoration: s.visualizacoes > 0 ? 'line-through' : 'underline',
                            flex: 1,
                            minWidth: '200px'
                          }}
                        >
                          {s.link_visualizacao}
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(s.link_visualizacao);
                            setToast({ message: `Link de ${s.participante_nome} copiado!`, type: 'success' });
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                          title="Copiar link"
                        >
                          📋
                        </button>
                        {grupo.status === 'sorteado' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Reenviar link para ${s.participante_nome}?`)) return;
                              
                              try {
                                const response = await fetch(`${apiBaseUrl}/grupos/${grupo.id}/reenviar/${s.participante_id}`, {
                                  method: 'POST'
                                });
                                
                                if (response.ok) {
                                  setToast({ message: `Link reenviado para ${s.participante_nome}!`, type: 'success' });
                                  loadData();
                                } else {
                                  const error = await response.json();
                                  setToast({ message: error.error || 'Erro ao reenviar', type: 'error' });
                                }
                              } catch (error) {
                                setToast({ message: 'Erro ao reenviar link', type: 'error' });
                              }
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#dbeafe',
                              border: '1px solid #93c5fd',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                            title="Reenviar link"
                          >
                            🔄
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {s.visualizado_em 
                        ? new Date(s.visualizado_em).toLocaleString('pt-BR')
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Envio */}
      {grupo.status === 'sorteado' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Enviar Links via WhatsApp</h3>
          <button className="btn btn-success" onClick={handleEnviarLinks}>
            Enviar Links para Todos
          </button>
        </div>
      )}

      {/* Histórico de Envios */}
      {envios.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Histórico de Envios</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {envios.map(envio => (
              <div key={envio.id} style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{envio.participante_nome}</strong>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {new Date(envio.data_envio).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <span className={`status-badge status-${envio.status === 'enviado' ? 'links_enviados' : 'rascunho'}`}>
                    {envio.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GrupoDetail;

