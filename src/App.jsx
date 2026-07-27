import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Database, RefreshCw } from 'lucide-react';
import { getPokemons, savePokemon, deletePokemon, getStatistics } from './utils/pokemonService';
import { isSupabaseConfigured } from './supabaseClient';
import PokedexTabs from './components/PokedexTabs';
import PokemonMap from './components/PokemonMap';
import PokemonGrid from './components/PokemonGrid';
import PokemonForm from './components/PokemonForm';
import StatsPanel from './components/StatsPanel';

export default function App() {
  const [pokemons, setPokemons] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    byType: {},
    mostCommonLocation: 'Nenhum registro',
    avgHp: 0,
    avgAttack: 0,
    avgDefense: 0
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPokemon, setEditingPokemon] = useState(null);
  
  // Pokémon selecionado para exibição nas abas centrais
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce para barra de busca
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Carrega dados da tabela
  const loadData = useCallback(async (searchQuery = '') => {
    setIsLoading(true);
    try {
      const data = await getPokemons(searchQuery);
      const safeData = Array.isArray(data) ? data : [];
      setPokemons(safeData);

      const stats = await getStatistics();
      setStatistics(stats || {
        total: 0,
        byType: {},
        mostCommonLocation: 'Nenhum registro',
        avgHp: 0,
        avgAttack: 0,
        avgDefense: 0
      });

      setSelectedPokemon((currentSelected) => {
        if (currentSelected) {
          const stillExists = safeData.some((pokemon) => pokemon.id === currentSelected.id);
          if (stillExists) {
            return currentSelected;
          }
        }

        if (!currentSelected && safeData.length > 0) {
          return safeData[0];
        }

        return null;
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carrega ao mudar a busca
  useEffect(() => {
    loadData(debouncedSearch);
  }, [debouncedSearch]);

  const handleSave = async (formData) => {
    try {
      const savedRecord = await savePokemon(formData);
      setIsFormOpen(false);
      setEditingPokemon(null);
      
      // Atualiza o painel de abas se for o mesmo Pokémon que estava aberto
      if (selectedPokemon && selectedPokemon.id === formData.id) {
        setSelectedPokemon(savedRecord);
      }
      
      loadData(debouncedSearch);
    } catch (error) {
      alert(error.message || 'Erro ao salvar Pokémon.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja mesmo excluir o registro deste Pokémon de Caçapava?')) {
      try {
        await deletePokemon(id);
        if (selectedPokemon && selectedPokemon.id === id) {
          setSelectedPokemon(null);
        }
        loadData(debouncedSearch);
      } catch (error) {
        alert('Erro ao excluir Pokémon.');
      }
    }
  };

  const handleEdit = (pokemon) => {
    setEditingPokemon(pokemon);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingPokemon(null);
    setIsFormOpen(true);
  };

  return (
    <div className="container">
      {/* Cabeçalho */}
      <header className="main-header">
        <div className="logo-container">
          <svg className="logo-pokeball" width="34" height="34" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5zm0 8c19.1 0 34.8 14.3 36.8 33H68.3c-1.8-6.2-7.5-10.8-14.3-10.8-6.8 0-12.5 4.6-14.3 10.8H13.2C15.2 27.3 30.9 13 50 13zm0 74c-19.1 0-34.8-14.3-36.8-33h20.5c1.8 6.2 7.5 10.8 14.3 10.8 6.8 0 12.5-4.6 14.3-10.8h20.5C84.8 72.7 69.1 87 50 87zm0-27c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z" />
          </svg>
          <div>
            <h1 className="main-title">Caçapava Pokémon Finder</h1>
            <p className="subtitle">Mapeamento e Fichamento de Espécies Perdidas</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary btn-icon-only" 
            onClick={() => loadData(debouncedSearch)}
            disabled={isLoading}
            title="Recarregar"
          >
            <RefreshCw size={16} className={isLoading ? 'logo-pokeball' : ''} />
          </button>
          <button className="btn btn-primary" onClick={handleCreateNew}>
            <Plus size={16} />
            <span>Registrar Avistamento</span>
          </button>
        </div>
      </header>



      {/* Status da Conexão */}
      {isSupabaseConfigured ? (
        <div className="db-status-banner online">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={14} />
            <span>Conexão Ativa: <strong>Supabase (PostgreSQL)</strong></span>
          </div>
          <span style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 'bold' }}>Segurança contra SQL Injection Habilitada</span>
        </div>
      ) : (
        <div className="db-status-banner offline">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={14} />
            <span>Base Local: <strong>LocalStorage fallback</strong> (Edite o `.env` para conectar online)</span>
          </div>
          <span style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 'bold' }}>Modo Offline</span>
        </div>
      )}

      {/* Estrutura de 3 Colunas (Dashboard Grid) */}
      <div className="dashboard-grid">
        
        {/* Coluna 1 (Esquerda): Diretório, Busca e Lista */}
        <aside className="left-panel-grid">
          <PokemonGrid
            pokemons={pokemons}
            search={search}
            onSearchChange={setSearch}
            selectedType={selectedType}
            onTypeSelect={setSelectedType}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelect={setSelectedPokemon}
            selectedPokemonId={selectedPokemon?.id}
          />
        </aside>

        {/* Coluna 2 (Centro): Detalhes do Pokémon selecionado em Abas */}
        <section>
          <PokedexTabs 
            pokemon={selectedPokemon} 
            onUnselect={() => setSelectedPokemon(null)}
          />
        </section>

        {/* Coluna 3 (Direita): Mapa Global e Estatísticas */}
        <aside className="right-panel-dashboard">
          {/* Mapa Global de Avistamentos */}
          <div className="map-dashboard-wrapper">
            <PokemonMap 
              pokemons={pokemons} 
              onSelectPokemon={setSelectedPokemon} 
              selectedPokemonId={selectedPokemon?.id}
            />
          </div>

          {/* Estatísticas Consolidadas */}
          <div className="glass-panel" style={{ padding: '0.85rem' }}>
            <StatsPanel statistics={statistics} />
          </div>
        </aside>

      </div>

      {/* Modal de Formulário */}
      {isFormOpen && (
        <PokemonForm
          pokemon={editingPokemon}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPokemon(null);
          }}
        />
      )}
    </div>
  );
}
