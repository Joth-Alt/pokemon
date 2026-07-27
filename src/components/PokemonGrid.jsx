import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2, ShieldAlert } from 'lucide-react';

const FILTER_TYPES = [
  'Todos', 'Planta', 'Fogo', 'Água', 'Elétrico', 
  'Voador', 'Inseto', 'Normal', 'Veneno', 'Terra'
];

const getTypeKey = (type) => {
  if (!type) return 'normal';
  return type
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');
};

export default function PokemonGrid({ 
  pokemons, 
  search, 
  onSearchChange, 
  selectedType, 
  onTypeSelect, 
  onEdit, 
  onDelete,
  onSelect,
  selectedPokemonId
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearchChange = (value) => {
    onSearchChange(value);
    if (value.length > 0) {
      const lower = value.toLowerCase();
      const matches = pokemons
        .map(p => p.name)
        .filter(name => name.toLowerCase().startsWith(lower));
      const unique = [...new Set(matches)].slice(0, 6);
      setSuggestions(unique);
      setShowSuggestions(unique.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (name) => {
    onSearchChange(name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Filtra por tipo localmente no frontend sobre a lista retornada por busca
  const filteredPokemons = selectedType === 'Todos'
    ? pokemons
    : pokemons.filter(p => p.type === selectedType);

  return (
    <div className="pokemon-directory-box glass-panel">
      {/* Barra de Busca e Filtros de Tipo */}
      <div className="search-filter-section">
        {/* Input de Busca com Autocomplete */}
        <div className="search-box" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="search-input"
          />
          <Search size={14} className="search-icon-svg" />
          {showSuggestions && suggestions.length > 0 && (
            <ul style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 100,
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid #38bdf8',
              borderRadius: '12px',
              padding: '6px',
              listStyle: 'none',
              boxShadow: '0 8px 32px rgba(14, 165, 233, 0.18), 0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              animation: 'suggestionFadeIn 0.15s ease'
            }}>
              {suggestions.map((name) => (
                <li
                  key={name}
                  onMouseDown={() => selectSuggestion(name)}
                  style={{
                    padding: '9px 12px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: '500',
                    color: '#0f172a',
                    borderRadius: '8px',
                    transition: 'background 0.13s, color 0.13s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #e0f2fe, #f0f9ff)';
                    e.currentTarget.style.color = '#0284c7';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                >
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    flexShrink: 0
                  }}>🔴</span>
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tags de Filtros */}
        <div className="filter-tags-container">
          <span className="filter-label">
            <Filter size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
            Tipo:
          </span>
          {FILTER_TYPES.map(type => (
            <button
              key={type}
              onClick={() => onTypeSelect(type)}
              className={`tag ${selectedType === type ? 'active' : ''}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Vertical de Pokémons */}
      <div className="pokemon-vertical-list">
        {filteredPokemons.length === 0 ? (
          <div className="no-results" style={{ padding: '2rem 1rem' }}>
            <ShieldAlert size={28} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>
              Nenhum Pokémon encontrado.
            </p>
          </div>
        ) : (
          filteredPokemons.map(pokemon => {
            const typeKey = getTypeKey(pokemon.type);
            const typeVars = {
              '--type-color': `var(--color-${typeKey})`,
              '--type-glow': `var(--glow-${typeKey})`
            };
            
            return (
              <div
                key={pokemon.id}
                className={`pokemon-directory-item ${selectedPokemonId === pokemon.id ? 'active' : ''}`}
                onClick={() => onSelect(pokemon)}
                style={typeVars}
              >
                {/* Info Esquerda: Mini foto, Nome, ID */}
                <div className="item-left-info">
                  <div className="item-mini-img-frame">
                    {pokemon.image_url ? (
                      <img 
                        src={pokemon.image_url} 
                        alt={pokemon.name} 
                        className="item-mini-img"
                      />
                    ) : (
                      <svg viewBox="0 0 100 100" className="item-mini-img placeholder">
                        <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C28 90 10 72 10 50c0-1.8.1-3.6.4-5.3h28.1c1.7 4 5.7 6.8 10.3 6.8s8.6-2.8 10.3-6.8h28.1c.3 1.7.4 3.5.4 5.3 0 22-18 40-40 40z" />
                        <circle cx="50" cy="50" r="10" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="item-text-box">
                    <span className="item-id">#{String(pokemon.id || 0).padStart(3, '0')}</span>
                    <span className="item-name">{pokemon.name}</span>
                    <div>
                      <span className="item-type-badge">{pokemon.type}</span>
                    </div>
                  </div>
                </div>

                {/* Info Direita: Ações Rápidas */}
                <div className="item-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(pokemon);
                    }} 
                    className="item-action-btn"
                    title="Editar registro"
                  >
                    <Edit size={13} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(pokemon.id);
                    }} 
                    className="item-action-btn delete"
                    title="Excluir registro"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
