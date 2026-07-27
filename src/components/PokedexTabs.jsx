import React, { useState } from 'react';
import { Heart, Shield, Swords, MapPin, Calendar, Compass, Sparkles, BookOpen, BarChart3, Info } from 'lucide-react';

const getTypeKey = (type) => {
  if (!type) return 'normal';
  return type
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');
};

export default function PokedexTabs({ pokemon, onUnselect }) {
  const [activeTab, setActiveTab] = useState('ficha');

  if (!pokemon) {
    return (
      <div className="pokedex-tabs-container glass-panel idle-state">
        <div className="pokedex-welcome-card">
          <div className="spinning-pokeball-container">
            <svg viewBox="0 0 100 100" className="welcome-pokeball-svg">
              <circle cx="50" cy="50" r="45" stroke="#0ea5e9" strokeWidth="4" fill="none" />
              <line x1="5" y1="50" x2="95" y2="50" stroke="#0ea5e9" strokeWidth="4" />
              <circle cx="50" cy="50" r="15" fill="#fff" stroke="#0ea5e9" strokeWidth="4" />
            </svg>
            <Compass size={24} className="welcome-compass-icon" />
          </div>
          <h3 className="welcome-title">Scanner da Pokédex</h3>
          <p className="welcome-instructions">
            Selecione um Pokémon no menu à esquerda ou clique em um marcador no mapa para carregar a ficha técnica completa nesta tela.
          </p>
        </div>
      </div>
    );
  }

  const typeKey = getTypeKey(pokemon.type);
  const typeStyle = {
    '--type-color': `var(--color-${typeKey})`,
    '--type-glow': `var(--glow-${typeKey})`
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="pokedex-tabs-container glass-panel active-state" style={typeStyle}>
      {/* Botão de Fechar no Canto Superior Direito */}
      <button className="pokedex-close-btn" onClick={onUnselect} title="Fechar Ficha">
        &times;
      </button>

      {/* Identificação Geral do Pokémon */}
      <div className="pokedex-profile-header">
        <span className="pokedex-profile-id">#{String(pokemon.id || 0).padStart(3, '0')}</span>
        <h2 className="pokedex-profile-name">{pokemon.name}</h2>
        <span className="pokedex-profile-type-badge">{pokemon.type}</span>
      </div>

      {/* Abas Skeuomórficas Glossy (Guias) */}
      <div className="pokedex-tabs-header">
        <button 
          className={`pokedex-tab-btn ${activeTab === 'ficha' ? 'active' : ''}`}
          onClick={() => setActiveTab('ficha')}
        >
          <Info size={14} />
          <span>Ficha</span>
        </button>
        <button 
          className={`pokedex-tab-btn ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          <BarChart3 size={14} />
          <span>Status</span>
        </button>
        <button 
          className={`pokedex-tab-btn ${activeTab === 'ocorrencia' ? 'active' : ''}`}
          onClick={() => setActiveTab('ocorrencia')}
        >
          <MapPin size={14} />
          <span>Ocorrência</span>
        </button>
      </div>

      {/* Conteúdo das Abas com Efeito de Transição */}
      <div className="pokedex-tab-content">
        
        {/* GUIA 1: FICHA GERAL */}
        {activeTab === 'ficha' && (
          <div className="tab-pane fade-in">
            <div className="pokedex-profile-image-container">
              <div className="pokedex-profile-image-glow"></div>
              {pokemon.image_url ? (
                <img 
                  src={pokemon.image_url} 
                  alt={pokemon.name} 
                  className="pokedex-profile-image" 
                />
              ) : (
                <svg viewBox="0 0 100 100" className="pokedex-profile-image placeholder">
                  <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C28 90 10 72 10 50c0-1.8.1-3.6.4-5.3h28.1c1.7 4 5.7 6.8 10.3 6.8s8.6-2.8 10.3-6.8h28.1c.3 1.7.4 3.5.4 5.3 0 22-18 40-40 40z" />
                  <circle cx="50" cy="50" r="10" />
                </svg>
              )}
            </div>

            <div className="pokedex-desc-box">
              <div className="pokedex-desc-title">
                <BookOpen size={12} style={{ color: 'var(--type-color)' }} />
                <span>Descrição da Pokédex</span>
              </div>
              <p className="pokedex-desc-text">
                {pokemon.pokedex_text || 'Esta espécie ainda não possui uma descrição oficial cadastrada.'}
              </p>
            </div>
          </div>
        )}

        {/* GUIA 2: STATUS / ATRIBUTOS */}
        {activeTab === 'status' && (
          <div className="tab-pane fade-in">
            <div className="pokedex-stats-group">
              {/* HP Stat */}
              <div className="pokedex-stat-bar-wrapper">
                <div className="pokedex-stat-info">
                  <span className="pokedex-stat-label">
                    <Heart size={13} style={{ color: '#ef4444', marginRight: '4px', verticalAlign: 'middle' }} />
                    HP
                  </span>
                  <span className="pokedex-stat-value">{pokemon.hp || '-'}</span>
                </div>
                <div className="pokedex-stat-bar-outer">
                  <div 
                    className="pokedex-stat-bar-inner hp" 
                    style={{ width: `${Math.min(((pokemon.hp || 50) / 150) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              {/* Attack Stat */}
              <div className="pokedex-stat-bar-wrapper">
                <div className="pokedex-stat-info">
                  <span className="pokedex-stat-label">
                    <Swords size={13} style={{ color: '#f59e0b', marginRight: '4px', verticalAlign: 'middle' }} />
                    Ataque
                  </span>
                  <span className="pokedex-stat-value">{pokemon.attack || '-'}</span>
                </div>
                <div className="pokedex-stat-bar-outer">
                  <div 
                    className="pokedex-stat-bar-inner attack" 
                    style={{ width: `${Math.min(((pokemon.attack || 50) / 150) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              {/* Defense Stat */}
              <div className="pokedex-stat-bar-wrapper">
                <div className="pokedex-stat-info">
                  <span className="pokedex-stat-label">
                    <Shield size={13} style={{ color: '#0ea5e9', marginRight: '4px', verticalAlign: 'middle' }} />
                    Defesa
                  </span>
                  <span className="pokedex-stat-value">{pokemon.defense || '-'}</span>
                </div>
                <div className="pokedex-stat-bar-outer">
                  <div 
                    className="pokedex-stat-bar-inner defense" 
                    style={{ width: `${Math.min(((pokemon.defense || 50) / 150) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GUIA 3: OCORRÊNCIA / AVISTAMENTO */}
        {activeTab === 'ocorrencia' && (
          <div className="tab-pane fade-in">
            <div className="pokedex-occurrence-grid">
              
              <div className="pokedex-occurrence-item">
                <span className="occurrence-label">📍 Local Encontrado</span>
                <span className="occurrence-value">{pokemon.location}</span>
                {pokemon.latitude !== null && pokemon.longitude !== null && (
                  <span className="occurrence-coords">
                    GPS: {pokemon.latitude.toFixed(6)}, {pokemon.longitude.toFixed(6)}
                  </span>
                )}
              </div>

              <div className="pokedex-occurrence-item">
                <span className="occurrence-label">📅 Data de Registro</span>
                <span className="occurrence-value">{formatDate(pokemon.registration_date)}</span>
              </div>

              {pokemon.observations && (
                <div className="pokedex-occurrence-item span-all">
                  <span className="occurrence-label">📝 Relato comportamental</span>
                  <p className="occurrence-obs-text">{pokemon.observations}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
