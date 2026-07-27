import React from 'react';
import { MapPin, Calendar, Heart, Shield, Swords } from 'lucide-react';

const getTypeKey = (type) => {
  if (!type) return 'normal';
  return type
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');
};

export default function PokemonCard({ pokemon, onSelect }) {
  const typeKey = getTypeKey(pokemon.type);
  const cardStyle = {
    '--type-color': `var(--color-${typeKey})`,
    '--type-glow': `var(--glow-${typeKey})`,
    padding: '0.75rem',
    cursor: 'pointer',
    border: '2px solid #cbd5e1',
    borderRadius: '10px',
    background: '#ffffff',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
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
    <div 
      className="pokemon-card-collectible" 
      style={cardStyle}
      onClick={() => onSelect && onSelect(pokemon)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
          #{String(pokemon.id || 0).padStart(3, '0')}
        </span>
        <span className="item-type-badge">{pokemon.type}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
        {pokemon.image_url ? (
          <img 
            src={pokemon.image_url} 
            alt={pokemon.name} 
            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
          />
        ) : (
          <svg viewBox="0 0 100 100" style={{ width: '40px', height: '40px', fill: 'var(--text-muted)' }}>
            <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C28 90 10 72 10 50c0-1.8.1-3.6.4-5.3h28.1c1.7 4 5.7 6.8 10.3 6.8s8.6-2.8 10.3-6.8h28.1c.3 1.7.4 3.5.4 5.3 0 22-18 40-40 40z" />
            <circle cx="50" cy="50" r="10" />
          </svg>
        )}
      </div>

      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, textAlign: 'center', color: '#0369a1' }}>
        {pokemon.name}
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <MapPin size={10} style={{ color: 'var(--type-color)' }} />
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{pokemon.location}</span>
        </div>
      </div>
    </div>
  );
}
