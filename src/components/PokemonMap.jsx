import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const CACAPAVA_COORDS = [-23.1014, -45.7072];

const getTypeKey = (type) => {
  if (!type) return "normal";

  return type
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const pokeballIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  shadowUrl: markerShadow,
  shadowSize: [36, 36],
  shadowAnchor: [12, 36]
});

export default function PokemonMap({
  pokemons = [],
  onSelectPokemon,
  selectedPokemonId
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      center: CACAPAVA_COORDS,
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    ).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    (Array.isArray(pokemons) ? pokemons : []).forEach((pokemon) => {

      const {
        latitude,
        longitude,
        name,
        type,
        location,
        image_url,
        id,
      } = pokemon;

      const lat = Number(latitude);
      const lng = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return;
      }

      const typeKey = getTypeKey(type);

      const customIcon = L.divIcon({
        className: 'custom-pokemon-marker',
        html: `
          <div class="map-marker-bubble" style="--type-color: var(--color-${typeKey})">
            <img
              src="${image_url || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'}"
              class="map-marker-image"
              alt="${name}"
              onerror="this.onerror=null;this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';"
            />
            <div class="map-marker-pin"></div>
          </div>
        `,
        iconSize: [40, 48],
        iconAnchor: [20, 48],
        popupAnchor: [0, -48],
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
      });

      const popupContent = document.createElement('div');

      popupContent.style.color = '#0f172a';
      popupContent.style.fontFamily = "'Outfit', sans-serif";
      popupContent.style.textAlign = 'center';
      popupContent.style.padding = '2px';

      popupContent.innerHTML = `
        <h4 style="margin-bottom:1px;font-weight:800;font-size:.95rem;color:#0369a1;">
          ${name}
        </h4>

        <span style="font-size:.7rem;color:#64748b;font-weight:bold;text-transform:uppercase;">
          Tipo: ${type}
        </span>

        <div style="margin:6px 0;">
          <img
            src="${image_url || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'}"
            style="width:50px;height:50px;object-fit:contain;background:#f8fafc;border:1px solid #cbd5e1;border-radius:50%;padding:4px;"
          />
        </div>

        <p style="font-size:.75rem;color:#475569;max-width:140px;overflow:hidden;white-space:nowrap;">
          📍 ${location}
        </p>

        <button
          id="popup-btn-${id}"
          style="
            width:100%;
            padding:4px 8px;
            border-radius:12px;
            cursor:pointer;
            border:1px solid #38bdf8;
            background:linear-gradient(to bottom,#fff,#e0f2fe,#38bdf8);
            color:#0369a1;
            font-size:.65rem;
            font-weight:bold;
          "
        >
          Carregar Pokédex
        </button>
      `;

      // Listener para o botão dentro do popup
      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectPokemon(pokemon);
            map.closePopup();
          };
        }
      });

      markersLayer.addLayer(marker);
    });
  }, [pokemons, onSelectPokemon]);

  // Centraliza e foca no Pokémon selecionado
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPokemonId) return;

    const selectedPoke = pokemons.find(p => p.id === selectedPokemonId);
    if (selectedPoke && selectedPoke.latitude !== null && selectedPoke.longitude !== null) {
      map.flyTo([selectedPoke.latitude, selectedPoke.longitude], 16, {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedPokemonId, pokemons]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '270px', borderRadius: '10px', overflow: 'hidden' }}>
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', minHeight: '270px', background: '#f8fafc' }}
      />
      {/* Indicador de Legenda */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #cbd5e1',
        padding: '5px 8px',
        borderRadius: '6px',
        fontSize: '0.7rem',
        color: '#0f172a',
        fontWeight: 'bold',
        zIndex: 1000,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
      }}>
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" style={{ width: '14px', height: '14px' }} alt="" />
        <span>Avistamentos Caçapava</span>
      </div>
    </div>
  );
}
