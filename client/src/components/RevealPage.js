import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.origin.includes('localhost:3000') 
    ? 'http://localhost:5000/api' 
    : window.location.origin + '/api');

function RevealPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = window.location.pathname.split('/reveal/')[1];
    if (token) {
      loadReveal(token);
    } else {
      setError('Token não encontrado');
      setLoading(false);
    }
  }, []);

  const loadReveal = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reveal/${token}`);
      
      if (response.ok) {
        const data = await response.json();
        setData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao carregar revelação');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="reveal-container">
        <div className="reveal-card">
          <div className="loading">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reveal-container">
        <div className="reveal-card">
          <h2>❌ Erro</h2>
          <div className="error-message">{error}</div>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>
            Este link pode ter sido visualizado anteriormente ou não existe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal-container">
      <div className="reveal-card">
        <h2>🎁 Amigo Secreto</h2>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Olá, <strong>{data.participante}</strong>!
        </p>
        <div style={{ margin: '2rem 0' }}>
          <p style={{ marginBottom: '0.5rem', color: '#6b7280' }}>Seu amigo secreto é:</p>
          <div className="amigo-nome">{data.amigo}</div>
        </div>
        <p style={{ marginTop: '2rem', color: '#6b7280', fontSize: '0.875rem' }}>
          Visualizado em: {new Date(data.visualizado_em).toLocaleString('pt-BR')}
        </p>
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            ⚠️ Este link foi visualizado e não pode ser acessado novamente.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RevealPage;

