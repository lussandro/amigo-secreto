import React, { useState, useEffect } from 'react';

function GrupoDetail({ grupo, onBack, apiBaseUrl }) {
  const [participantes, setParticipantes] = useState([]);
  const [sorteio, setSorteio] = useState(null);
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showParticipanteForm, setShowParticipanteForm] = useState(false);
  const [participanteForm, setParticipanteForm] = useState({ nome: '', telefone: '' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, [grupo.id]);

  const loadData = async () => {
    setLoading(true);
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
        setMessage({ type: 'success', text: 'Participante adicionado com sucesso!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Erro ao adicionar participante' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao adicionar participante' });
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
      }
    } catch (error) {
      console.error('Erro ao deletar participante:', error);
    }
  };

  const handleRealizarSorteio = async () => {
    if (participantes.length < 3) {
      setMessage({ type: 'error', text: 'É necessário pelo menos 3 participantes para realizar o sorteio' });
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
        setMessage({ type: 'success', text: data.message });
        loadData();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Erro ao realizar sorteio' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao realizar sorteio' });
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
        setMessage({ type: 'success', text: 'Links enviados com sucesso!' });
        loadData();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Erro ao enviar links' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao enviar links' });
    }
  };

  const handleEnviarMensagemTeste = async () => {
    if (participantes.length === 0) {
      setMessage({ type: 'error', text: 'Não há participantes no grupo para enviar mensagem de teste' });
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
        
        let mensagem = `Mensagens de teste enviadas! Sucessos: ${sucessos}`;
        if (erros > 0) {
          mensagem += `, Erros: ${erros}`;
        }
        
        setMessage({ type: sucessos > 0 ? 'success' : 'error', text: mensagem });
        
        // Mostrar detalhes dos erros se houver
        if (erros > 0) {
          const primeiroErro = data.resultados.find(r => r.status === 'erro');
          if (primeiroErro && primeiroErro.erro) {
            const erro = primeiroErro.erro;
            let erroMsg = '';
            
            if (erro.data) {
              erroMsg = erro.data.message || erro.data.error || JSON.stringify(erro.data);
            } else if (erro.message) {
              erroMsg = erro.message;
            } else {
              erroMsg = JSON.stringify(erro);
            }
            
            const statusInfo = erro.status ? ` (Status: ${erro.status} ${erro.statusText || ''})` : '';
            
            console.error('Detalhes do erro completo:', erro);
            
            // Mostrar erro mais detalhado na mensagem
            setMessage({ 
              type: 'error', 
              text: `${mensagem}${statusInfo}\n\nErro: ${erroMsg}\n\nVerifique o console (F12) para mais detalhes.` 
            });
          }
        }
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Erro ao enviar mensagem de teste' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao enviar mensagem de teste' });
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

        {message && (
          <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
            {message.text}
          </div>
        )}
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
          <form onSubmit={handleAddParticipante} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
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
                onChange={(e) => setParticipanteForm({ ...participanteForm, telefone: e.target.value })}
                placeholder="Ex: 5548999999999"
                required
              />
            </div>
            <button type="submit" className="btn btn-success">Adicionar</button>
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
                {grupo.status === 'rascunho' && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteParticipante(p.id)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Remover
                  </button>
                )}
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
          <h3 style={{ marginBottom: '1rem' }}>Resultado do Sorteio</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Participante</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Amigo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Link</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Visualizações</th>
                </tr>
              </thead>
              <tbody>
                {sorteio.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>{s.participante_nome}</td>
                    <td style={{ padding: '0.75rem' }}>{s.amigo_nome}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <a href={s.link_visualizacao} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', wordBreak: 'break-all' }}>
                        {s.link_visualizacao}
                      </a>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{s.visualizacoes}</td>
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

