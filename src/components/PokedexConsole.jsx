import React from 'react';
import { Heart, Shield, Swords, MapPin, Calendar, Compass, RefreshCw } from 'lucide-react';

const getTypeKey = (type) => {
  if (!type) return 'normal';
  return type
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');
};

export default function PokedexConsole({ pokemon, onUnselect, totalCount }) {
  const isSelected = !!pokemon;
  const typeKey = isSelected ? getTypeKey(pokemon.type) : 'normal';

  // Estilos de tipo injetados dinamicamente no painel da Pokédex
  const consoleStyle = {
    '--type-color': isSelected ? `var(--color-${typeKey})` : '#8b5cf6',
    '--type-glow': isSelected ? `var(--glow-${typeKey})` : 'rgba(139, 92, 246, 0.15)',
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
    <div className="pokedex-console glass-panel" style={consoleStyle}>
      {/* Luz LED da Pokédex (Canto superior esquerdo) */}
      <div className="pokedex-led-bar">
        <div className={`led-lens blue ${isSelected ? 'pulse' : ''}`} />
        <div className="led-lens red" />
        <div className="led-lens yellow" />
        <div className="led-lens green" />
      </div>

      {/* Tela Digital */}
      <div className="pokedex-screen-border">
        <div className={`pokedex-screen ${isSelected ? 'active-scan' : 'idle-radar'}`}>
          {/* Efeito de Scanlines */}
          <div className="screen-scanlines" />

          {isSelected ? (
            /* --- ESTADO: POKÉMON SELECIONADO --- */
            <div className="screen-content">
              {/* Foto com Efeito de Holograma */}
              <div className="screen-image-wrapper">
                <div className="hologram-grid-bg" />
                {pokemon.image_url ? (
                  <img 
                    src={pokemon.image_url} 
                    alt={pokemon.name} 
                    className="hologram-image" 
                  />
                ) : (
                  <svg viewBox="0 0 100 100" className="hologram-image placeholder">
                    <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C28 90 10 72 10 50c0-1.8.1-3.6.4-5.3h28.1c1.7 4 5.7 6.8 10.3 6.8s8.6-2.8 10.3-6.8h28.1c.3 1.7.4 3.5.4 5.3 0 22-18 40-40 40z" />
                    <circle cx="50" cy="50" r="10" />
                  </svg>
                )}
              </div>

              {/* Informações da Tela */}
              <div className="screen-header">
                <div className="screen-id">ID #{String(pokemon.id || 0).padStart(3, '0')}</div>
                <h2 className="screen-name">{pokemon.name}</h2>
                <div className="screen-type-badge">{pokemon.type}</div>
              </div>

              {/* Descrição oficial (Tradução limpa em PT ou aviso em EN) */}
              <div className="screen-desc-box">
                <div className="screen-desc-title">Pokédex Entry</div>
                <p className="screen-desc-text">
                  {pokemon.pokedex_text || 'Dados científicos não cadastrados para esta espécie.'}
                </p>
              </div>
            </div>
          ) : (
            /* --- ESTADO: IDLE / BUSCA POR SINAL --- */
            <div className="screen-idle-content">
              <div className="radar-circle-outer">
                <div className="radar-circle-inner" />
                <Compass size={32} className="radar-compass-icon" />
              </div>
              <h3 className="radar-title">Rastreador Ativo</h3>
              <p className="radar-status">Escaneando rede municipal...</p>
              
              <div className="radar-stats-pill">
                <span className="radar-stats-label">Total Cadastrado</span>
                <span className="radar-stats-value">{totalCount} Pokémons</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Painel Inferior: Atributos Galar (Sword/Shield) e Campo (Sempre visível se selecionado) */}
      {isSelected ? (
        <div className="pokedex-details-panel">
          {/* Status Batalha Galar - Scoreboard */}
          <div className="galar-stats-container">
            <h4 className="galar-section-title">Status de Combate</h4>
            
            <div className="galar-stats-grid">
              {/* Stat HP */}
              <div className="galar-stat-row">
                <div className="galar-stat-label-box hp">
                  <Heart size={10} style={{ marginRight: '3px' }} />
                  HP
                </div>
                <div className="galar-stat-bar-container">
                  <div 
                    className="galar-stat-bar-fill hp" 
                    style={{ width: `${Math.min(((pokemon.hp || 50) / 150) * 100, 100)}%` }} 
                  />
                </div>
                <div className="galar-stat-value">{pokemon.hp || '-'}</div>
              </div>

              {/* Stat ATK */}
              <div className="galar-stat-row">
                <div className="galar-stat-label-box atk">
                  <Swords size={10} style={{ marginRight: '3px' }} />
                  ATK
                </div>
                <div className="galar-stat-bar-container">
                  <div 
                    className="galar-stat-bar-fill atk" 
                    style={{ width: `${Math.min(((pokemon.attack || 50) / 150) * 100, 100)}%` }} 
                  />
                </div>
                <div className="galar-stat-value">{pokemon.attack || '-'}</div>
              </div>

              {/* Stat DEF */}
              <div className="galar-stat-row">
                <div className="galar-stat-label-box def">
                  <Shield size={10} style={{ marginRight: '3px' }} />
                  DEF
                </div>
                <div className="galar-stat-bar-container">
                  <div 
                    className="galar-stat-bar-fill def" 
                    style={{ width: `${Math.min(((pokemon.defense || 50) / 150) * 100, 100)}%` }} 
                  />
                </div>
                <div className="galar-stat-value">{pokemon.defense || '-'}</div>
              </div>
            </div>
          </div>

          {/* Dados do Avistamento */}
          <div className="pokedex-field-data">
            <div className="field-info-item">
              <MapPin size={12} className="field-icon" />
              <div className="field-text-box">
                <span className="field-label">Avistado em</span>
                <span className="field-value">{pokemon.location}</span>
                {pokemon.latitude !== null && pokemon.longitude !== null && (
                  <span className="field-coord-badge">
                    GPS: {pokemon.latitude.toFixed(4)}, {pokemon.longitude.toFixed(4)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="field-info-item">
              <Calendar size={12} className="field-icon" />
              <div className="field-text-box">
                <span className="field-label">Data do Registro</span>
                <span className="field-value">{formatDate(pokemon.registration_date)}</span>
              </div>
            </div>

            {pokemon.observations && (
              <div className="field-observations-box">
                <span className="field-label">Relatório Comportamental</span>
                <p className="field-observations-text">{pokemon.observations}</p>
              </div>
            )}
          </div>

          {/* Botões do Console da Pokédex */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.8rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={onUnselect}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
            >
              Fechar Scanner
            </button>
          </div>
        </div>
      ) : (
        /* Detalhe de Instruções para o usuário */
        <div className="pokedex-details-panel idle-instructions">
          <p>
            Use a barra de busca e o mapa ao lado para localizar avistamentos de Pokémons em Caçapava.
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            Selecione qualquer card ou marcador do mapa para carregar a ficha holográfica completa neste console.
          </p>
        </div>
      )}

      {/* Detalhes de botões físicos do hardware Pokédex (Aparência) */}
      <div className="pokedex-hardware-buttons">
        <div className="hardware-dpad">
          <div className="dpad-axis vertical" />
          <div className="dpad-axis horizontal" />
          <div className="dpad-center" />
        </div>
        <div className="hardware-action-buttons">
          <div className="action-circle red" />
          <div className="action-circle yellow" />
        </div>
      </div>
    </div>
  );
}
