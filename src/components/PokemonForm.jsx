import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Sparkles, AlertCircle, Save, Heart, Shield, Swords } from 'lucide-react';
import { fetchPokedexData } from '../utils/pokemonService';

// Cache da lista global de Pokémons da PokeAPI (evita múltiplas requisições)
let allPokemonNamesCache = null;

// Reconfigura o marcador padrão do Leaflet para o Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const POKEMON_TYPES = [
  'Planta', 'Fogo', 'Água', 'Elétrico', 'Voador', 'Inseto', 
  'Normal', 'Veneno', 'Terra', 'Fada', 'Lutador', 'Psíquico', 
  'Pedra', 'Fantasma', 'Gelo', 'Dragão', 'Aço', 'Sombrio'
];

const CACAPAVA_COORDS = [-23.1014, -45.7072];

// Ícone Pokébola customizado para o formulário
const pokeballIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
  shadowUrl: markerShadow,
  shadowSize: [28, 28],
  shadowAnchor: [8, 28]
});

export default function PokemonForm({ pokemon, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    registration_date: new Date().toISOString().split('T')[0],
    hp: '',
    attack: '',
    defense: '',
    latitude: '',
    longitude: '',
    pokedex_text: '',
    observations: '',
    image_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Autocomplete do nome
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const nameDebounceRef = useRef(null);

  const miniMapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Preenche dados para edição
  useEffect(() => {
    if (pokemon) {
      setFormData({
        id: pokemon.id,
        name: pokemon.name || '',
        type: pokemon.type || '',
        location: pokemon.location || '',
        registration_date: pokemon.registration_date || '',
        hp: pokemon.hp !== null ? pokemon.hp.toString() : '',
        attack: pokemon.attack !== null ? pokemon.attack.toString() : '',
        defense: pokemon.defense !== null ? pokemon.defense.toString() : '',
        latitude: pokemon.latitude !== null ? pokemon.latitude.toString() : '',
        longitude: pokemon.longitude !== null ? pokemon.longitude.toString() : '',
        pokedex_text: pokemon.pokedex_text || '',
        observations: pokemon.observations || '',
        image_url: pokemon.image_url || ''
      });
    }
  }, [pokemon]);

  // Inicializa o Mini-Mapa Leaflet para escolher coordenadas
  useEffect(() => {
    if (!miniMapContainerRef.current) return;

    // Pega as coordenadas iniciais
    const initialLat = pokemon?.latitude ? parseFloat(pokemon.latitude) : CACAPAVA_COORDS[0];
    const initialLng = pokemon?.longitude ? parseFloat(pokemon.longitude) : CACAPAVA_COORDS[1];

    const map = L.map(miniMapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    // Cria o marcador que indica a posição
    const marker = L.marker([initialLat, initialLng], { 
      icon: pokeballIcon, 
      draggable: true 
    }).addTo(map);

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Corrige renderização incorreta em modais
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Listener para o clique no mapa (atualiza inputs)
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setFormData(prev => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      }));
    });

    // Listener para quando arrastar o pin
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setFormData(prev => ({
        ...prev,
        latitude: pos.lat.toFixed(6),
        longitude: pos.lng.toFixed(6)
      }));
    });

    return () => {
      map.remove();
    };
  }, [pokemon]);

  // Sincroniza inputs numéricos manuais de lat/lng com o marcador no mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    const latVal = parseFloat(formData.latitude);
    const lngVal = parseFloat(formData.longitude);

    if (!isNaN(latVal) && !isNaN(lngVal) && latVal >= -90 && latVal <= 90 && lngVal >= -180 && lngVal <= 180) {
      const currentLatLng = marker.getLatLng();
      // Evita loops infinitos de movimentação se os valores forem iguais
      if (currentLatLng.lat !== latVal || currentLatLng.lng !== lngVal) {
        marker.setLatLng([latVal, lngVal]);
        map.panTo([latVal, lngVal]);
      }
    }
  }, [formData.latitude, formData.longitude]);

  // Busca sugestões de nomes na PokeAPI (com cache de sessão)
  const fetchNameSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
      return;
    }
    setFetchingSuggestions(true);
    try {
      // Só busca a lista completa uma vez por sessão
      if (!allPokemonNamesCache) {
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1302&offset=0');
        if (!res.ok) return;
        const data = await res.json();
        allPokemonNamesCache = data.results.map(
          p => p.name.charAt(0).toUpperCase() + p.name.slice(1)
        );
      }
      const lower = query.toLowerCase();
      const matches = allPokemonNamesCache
        .filter(name => name.toLowerCase().startsWith(lower))
        .slice(0, 8);
      setNameSuggestions(matches);
      setShowNameSuggestions(matches.length > 0);
    } catch {
      setNameSuggestions([]);
    } finally {
      setFetchingSuggestions(false);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');

    // Aciona autocomplete ao digitar no campo nome
    if (name === 'name') {
      clearTimeout(nameDebounceRef.current);
      nameDebounceRef.current = setTimeout(() => {
        fetchNameSuggestions(value);
      }, 280);
    }
  };

  const handleSelectNameSuggestion = (suggestedName) => {
    setFormData(prev => ({ ...prev, name: suggestedName }));
    setNameSuggestions([]);
    setShowNameSuggestions(false);
  };

  const handleAutoComplete = async () => {
    const name = formData.name.trim();
    if (!name) {
      setError('Por favor, digite o nome do Pokémon para buscar.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = await fetchPokedexData(name);
      
      setFormData(prev => ({
        ...prev,
        name: data.name,
        type: POKEMON_TYPES.includes(data.type) ? data.type : prev.type,
        hp: data.hp.toString(),
        attack: data.attack.toString(),
        defense: data.defense.toString(),
        pokedex_text: data.pokedex_text || prev.pokedex_text,
        image_url: data.image_url || prev.image_url
      }));

      if (data.isTranslated) {
        setSuccessMsg(`Dados de ${data.name} carregados com sucesso da Pokébola Global! (Pokédex em Português)`);
      } else {
        setSuccessMsg(`Dados de ${data.name} carregados da Pokébola Global! (Sem tradução PT disponível, exibindo em Inglês)`);
      }
    } catch (err) {
      setError(
        `Pokémon "${name}" não localizado nas bases de dados da PokeAPI. Você ainda pode cadastrar os dados manualmente!`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('O nome do Pokémon é obrigatório.');
      return;
    }
    if (!formData.type) {
      setError('Selecione um tipo para o Pokémon.');
      return;
    }
    if (!formData.location.trim()) {
      setError('Informe o local onde o Pokémon foi visto.');
      return;
    }
    if (!formData.registration_date) {
      setError('Selecione a data do registro.');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px' }}
      >
        <div className="modal-header">
          <div>
            <h2 className="main-title" style={{ fontSize: '1.4rem' }}>
              {pokemon ? 'Editar Pokémon Perdido' : 'Registrar Pokémon Perdido'}
            </h2>
            <p className="subtitle" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
              {pokemon ? 'Atualize as informações e coordenadas do resgate' : 'Avistou um Pokémon em Caçapava? Preencha os dados e fixe-o no mapa'}
            </p>
          </div>
          <button className="btn btn-secondary btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="db-status-banner offline" style={{ marginBottom: '1.25rem', gap: '0.5rem', justifyContent: 'flex-start' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="db-status-banner online" style={{ marginBottom: '1.25rem', gap: '0.5rem', justifyContent: 'flex-start' }}>
                <Sparkles size={18} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="form-grid">
              
              {/* Nome & Auto-completar */}
              <div className="form-group-with-action">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label" htmlFor="name">Nome do Pokémon *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => nameSuggestions.length > 0 && setShowNameSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowNameSuggestions(false), 180)}
                    placeholder="Ex: Pidove, Pikachu, Charizard"
                    className="form-input"
                    disabled={loading}
                    autoComplete="off"
                    required
                  />
                  {showNameSuggestions && nameSuggestions.length > 0 && (
                    <ul
                      ref={suggestionsRef}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        zIndex: 200,
                        background: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1.5px solid #38bdf8',
                        borderRadius: '12px',
                        padding: '6px',
                        listStyle: 'none',
                        boxShadow: '0 8px 32px rgba(14, 165, 233, 0.18), 0 2px 8px rgba(0,0,0,0.08)',
                        maxHeight: '240px',
                        overflowY: 'auto',
                        animation: 'suggestionFadeIn 0.15s ease'
                      }}
                    >
                      {nameSuggestions.map((sug) => (
                        <li
                          key={sug}
                          onMouseDown={() => handleSelectNameSuggestion(sug)}
                          style={{
                            padding: '9px 12px',
                            cursor: 'pointer',
                            fontSize: '0.84rem',
                            fontWeight: '500',
                            color: '#0f172a',
                            borderRadius: '8px',
                            transition: 'background 0.13s, color 0.13s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
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
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            flexShrink: 0
                          }}>🔴</span>
                          {sug}
                        </li>
                      ))}
                    </ul>
                  )}
                  {fetchingSuggestions && (
                    <span style={{ position: 'absolute', right: '10px', top: '38px', fontSize: '0.7rem', opacity: 0.5 }}>buscando...</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAutoComplete}
                  className="btn btn-primary"
                  style={{ height: '43px', padding: '0 1rem' }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="logo-pokeball" style={{ display: 'inline-block', animation: 'rotatePokeball 1s linear infinite' }}>⚡</span>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span style={{ fontSize: '0.85rem' }}>Auto-completar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tipo e Link Foto */}
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="type">Tipo *</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Selecione o tipo...</option>
                    {POKEMON_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="image_url">URL da Foto (Upload/Link)</label>
                  <input
                    type="url"
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://exemplo.com/foto.png"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Localização e Data */}
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="location">Nome da Localização *</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Ex: Praça da Bandeira, Centro"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="registration_date">Data do Registro *</label>
                  <input
                    type="date"
                    id="registration_date"
                    name="registration_date"
                    value={formData.registration_date}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* GEOLOCALIZAÇÃO: Inputs de Coordenadas e Mini-Mapa */}
              <div className="form-group">
                <label className="form-label">Geolocalização (Clique no mapa ou arraste o marcador para definir)</label>
                <div className="form-grid-2col" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div className="form-group">
                    <span className="form-label" style={{ fontSize: '0.75rem' }}>Latitude</span>
                    <input
                      type="number"
                      step="0.000001"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="-23.1014"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <span className="form-label" style={{ fontSize: '0.75rem' }}>Longitude</span>
                    <input
                      type="number"
                      step="0.000001"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="-45.7072"
                      className="form-input"
                    />
                  </div>
                </div>
                {/* Contêiner do mini-mapa Leaflet */}
                <div 
                  ref={miniMapContainerRef} 
                  id="form-mini-map"
                  style={{ 
                    height: '180px', 
                    borderRadius: '10px', 
                    border: '1px solid var(--border-color)', 
                    overflow: 'hidden',
                    background: '#09090f' 
                  }} 
                />
              </div>

              {/* Atributos: HP, Ataque, Defesa */}
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Atributos de Combate (Status Base)
                </label>
                <div className="form-grid-2col" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                      <Heart size={12} className="info-icon" style={{ color: 'var(--color-danger)' }} />
                      <span className="form-label" style={{ fontSize: '0.75rem' }}>HP</span>
                    </div>
                    <input
                      type="number"
                      name="hp"
                      value={formData.hp}
                      onChange={handleChange}
                      placeholder="50"
                      min="1"
                      max="999"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                      <Swords size={12} className="info-icon" style={{ color: 'var(--color-warning)' }} />
                      <span className="form-label" style={{ fontSize: '0.75rem' }}>Ataque</span>
                    </div>
                    <input
                      type="number"
                      name="attack"
                      value={formData.attack}
                      onChange={handleChange}
                      placeholder="50"
                      min="1"
                      max="999"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                      <Shield size={12} className="info-icon" style={{ color: 'var(--color-info)' }} />
                      <span className="form-label" style={{ fontSize: '0.75rem' }}>Defesa</span>
                    </div>
                    <input
                      type="number"
                      name="defense"
                      value={formData.defense}
                      onChange={handleChange}
                      placeholder="50"
                      min="1"
                      max="999"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Texto Pokedex */}
              <div className="form-group">
                <label className="form-label" htmlFor="pokedex_text">Texto Oficial da Pokédex</label>
                <textarea
                  id="pokedex_text"
                  name="pokedex_text"
                  value={formData.pokedex_text}
                  onChange={handleChange}
                  placeholder="Descrição da Pokédex do Pokémon..."
                  className="form-input"
                />
              </div>

              {/* Observações */}
              <div className="form-group">
                <label className="form-label" htmlFor="observations">Observações de Campo</label>
                <textarea
                  id="observations"
                  name="observations"
                  value={formData.observations}
                  onChange={handleChange}
                  placeholder="Temperamento, condições físicas..."
                  className="form-input"
                />
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <Save size={16} />
              <span>{pokemon ? 'Salvar Alterações' : 'Cadastrar Registro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
