import React from 'react';
import { BarChart3, HelpCircle, MapPin, Activity, Heart, Swords, Shield } from 'lucide-react';

// Função para converter o tipo em português para a chave CSS correspondente sem acentos
const getTypeKey = (type) => {
  if (!type) return 'normal';
  return type
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');
};

export default function StatsPanel({ statistics }) {
  const { total, byType, mostCommonLocation, avgHp, avgAttack, avgDefense } = statistics;

  // Encontra o maior valor para servir de escala 100% no gráfico de barras
  const maxCount = Math.max(...Object.values(byType || {}), 1);

  // Ordena os tipos por contagem descrescente
  const sortedTypes = Object.entries(byType || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="stats-panel-container">
      {/* Bloco 1: Métricas Gerais */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 className="panel-header-title">
          <Activity size={18} style={{ color: '#8b5cf6' }} />
          <span>Visão Geral</span>
        </h3>
        
        <div className="stats-card-grid">
          <div className="stat-metric-card">
            <span className="metric-title">Total Encontrados</span>
            <div className="metric-number">{total}</div>
          </div>
          
          <div className="stat-metric-card">
            <span className="metric-title">Foco de Avistamentos</span>
            <div className="metric-text" title={mostCommonLocation}>
              <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: '#06b6d4' }} />
              {mostCommonLocation}
            </div>
          </div>
        </div>
      </div>

      {/* Bloco 2: Médias de Atributos */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 className="panel-header-title">
          <BarChart3 size={18} style={{ color: '#06b6d4' }} />
          <span>Médias da Região</span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
          {/* Média HP */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                <Heart size={12} style={{ color: '#ef4444' }} />
                Média HP
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{avgHp} pts</span>
            </div>
            <div className="chart-bar-outer">
              <div 
                className="chart-bar-inner" 
                style={{ 
                  width: `${Math.min((avgHp / 150) * 100, 100)}%`, 
                  background: 'linear-gradient(90deg, #ef4444, #f87171)' 
                }}
              ></div>
            </div>
          </div>

          {/* Média Ataque */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                <Swords size={12} style={{ color: '#f59e0b' }} />
                Média Ataque
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{avgAttack} pts</span>
            </div>
            <div className="chart-bar-outer">
              <div 
                className="chart-bar-inner" 
                style={{ 
                  width: `${Math.min((avgAttack / 150) * 100, 100)}%`, 
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' 
                }}
              ></div>
            </div>
          </div>

          {/* Média Defesa */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                <Shield size={12} style={{ color: '#0ea5e9' }} />
                Média Defesa
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{avgDefense} pts</span>
            </div>
            <div className="chart-bar-outer">
              <div 
                className="chart-bar-inner" 
                style={{ 
                  width: `${Math.min((avgDefense / 150) * 100, 100)}%`, 
                  background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bloco 3: Gráfico de Distribuição por Tipo */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 className="panel-header-title">
          <HelpCircle size={18} style={{ color: '#10b981' }} />
          <span>Frequência por Tipo</span>
        </h3>
        
        {sortedTypes.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
            Nenhum Pokémon catalogado para exibir o gráfico.
          </p>
        ) : (
          <div className="chart-container">
            {sortedTypes.map(([type, count]) => {
              const pct = (count / maxCount) * 100;
              const typeKey = getTypeKey(type);
              
              return (
                <div key={type} className="chart-bar-wrapper">
                  <div className="chart-bar-labels">
                    <span className="chart-bar-name" style={{ color: `var(--color-${typeKey})` }}>
                      {type}
                    </span>
                    <span className="chart-bar-value">
                      {count} {count === 1 ? 'encontrado' : 'encontrados'}
                    </span>
                  </div>
                  <div className="chart-bar-outer">
                    <div 
                      className="chart-bar-inner" 
                      style={{ 
                        '--bar-color': `var(--color-${typeKey})`,
                        width: `${pct}%`,
                        boxShadow: `0 0 10px var(--glow-${typeKey})`
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
