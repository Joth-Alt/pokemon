import { supabase, isSupabaseConfigured } from '../supabaseClient';

// Chave utilizada para persistência local caso o Supabase não esteja configurado
const LOCAL_STORAGE_KEY = 'cacapava_pokemons';

// Dicionário de tradução dos tipos de Pokémon da PokeAPI para Português
const TYPE_TRANSLATIONS = {
  grass: 'Planta',
  fire: 'Fogo',
  water: 'Água',
  bug: 'Inseto',
  normal: 'Normal',
  poison: 'Veneno',
  electric: 'Elétrico',
  ground: 'Terra',
  fairy: 'Fada',
  fighting: 'Lutador',
  psychic: 'Psíquico',
  rock: 'Pedra',
  ghost: 'Fantasma',
  ice: 'Gelo',
  dragon: 'Dragão',
  flying: 'Voador',
  steel: 'Aço',
  dark: 'Sombrio'
};

// Inicializa o LocalStorage com alguns Pokémons padrão geolocalizados em Caçapava para demonstração
const initLocalStorageIfNeeded = () => {
  if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
    const defaultPokemons = [
      {
        id: 1,
        name: 'Pidove',
        type: 'Voador',
        location: 'Praça da Bandeira, Centro',
        registration_date: '2026-07-25',
        hp: 50,
        attack: 55,
        defense: 50,
        latitude: -23.10252,
        longitude: -45.70851,
        pokedex_text: 'Cada um segue as ordens do seu treinador da melhor forma possível, mas às vezes eles esquecem as instruções logo em seguida.',
        observations: 'Encontrado bicando pipoca na praça. Dócil, mas se assusta fácil.',
        image_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/519.png',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Pikachu',
        type: 'Elétrico',
        location: 'Rua Capitão Carlos de Moura, Vila Paraíba',
        registration_date: '2026-07-26',
        hp: 35,
        attack: 55,
        defense: 40,
        latitude: -23.09952,
        longitude: -45.70324,
        pokedex_text: 'Quando vários desses Pokémon se reúnem, a eletricidade deles pode acumular e causar tempestades de raios.',
        observations: 'Estava roendo fios elétricos de um poste na calçada. Soltava faíscas ao ser avistado.',
        image_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultPokemons));
  }
};

/**
 * Busca todos os registros de Pokémons.
 * @param {string} search - Termo de busca por nome (filtro)
 * @returns {Promise<Array>} - Lista de Pokémons
 */
export const getPokemons = async (search = '') => {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('pokemons')
        .select('*')
        .order('created_at', { ascending: false });

      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar no Supabase, usando localStorage:', error);
    }
  }

  // Fallback LocalStorage
  initLocalStorageIfNeeded();
  const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  const sortedList = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (search.trim()) {
    const term = search.toLowerCase().trim();
    return sortedList.filter(p => p.name.toLowerCase().includes(term));
  }
  return sortedList;
};

/**
 * Salva um Pokémon (Cria ou Atualiza).
 * @param {Object} pokemonData - Dados do Pokémon
 * @returns {Promise<Object>} - Registro salvo
 */
export const savePokemon = async (pokemonData) => {
  if (!pokemonData.name || !pokemonData.name.trim()) {
    throw new Error('O nome do Pokémon é obrigatório.');
  }
  if (!pokemonData.type) {
    throw new Error('O tipo do Pokémon é obrigatório.');
  }
  if (!pokemonData.location || !pokemonData.location.trim()) {
    throw new Error('A localização é obrigatória.');
  }
  if (!pokemonData.registration_date) {
    throw new Error('A data do registro é obrigatória.');
  }

  const cleanData = {
    name: pokemonData.name.trim(),
    type: pokemonData.type,
    location: pokemonData.location.trim(),
    registration_date: pokemonData.registration_date,
    hp: pokemonData.hp ? parseInt(pokemonData.hp, 10) : null,
    attack: pokemonData.attack ? parseInt(pokemonData.attack, 10) : null,
    defense: pokemonData.defense ? parseInt(pokemonData.defense, 10) : null,
    latitude: pokemonData.latitude ? parseFloat(pokemonData.latitude) : null,
    longitude: pokemonData.longitude ? parseFloat(pokemonData.longitude) : null,
    pokedex_text: pokemonData.pokedex_text ? pokemonData.pokedex_text.trim() : '',
    observations: pokemonData.observations ? pokemonData.observations.trim() : '',
    image_url: pokemonData.image_url ? pokemonData.image_url.trim() : ''
  };

  if (isSupabaseConfigured) {
    try {
      if (pokemonData.id) {
        const { data, error } = await supabase
          .from('pokemons')
          .update(cleanData)
          .eq('id', pokemonData.id)
          .select();
        if (error) throw error;
        return data[0];
      } else {
        const { data, error } = await supabase
          .from('pokemons')
          .insert([cleanData])
          .select();
        if (error) throw error;
        return data[0];
      }
    } catch (error) {
      console.error('Erro ao salvar no Supabase, tentando localmente:', error);
    }
  }

  // Fallback LocalStorage
  initLocalStorageIfNeeded();
  const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  
  if (pokemonData.id) {
    const index = list.findIndex(p => p.id === pokemonData.id);
    if (index !== -1) {
      const updated = { 
        ...list[index], 
        ...cleanData,
      };
      list[index] = updated;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      return updated;
    }
    throw new Error('Pokémon não encontrado para atualização.');
  } else {
    const newId = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1;
    const newRecord = {
      id: newId,
      ...cleanData,
      created_at: new Date().toISOString()
    };
    list.push(newRecord);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    return newRecord;
  }
};

/**
 * Remove um Pokémon por ID.
 * @param {string|number} id - ID do Pokémon
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export const deletePokemon = async (id) => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('pokemons')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar no Supabase, tentando localmente:', error);
    }
  }

  // Fallback LocalStorage
  initLocalStorageIfNeeded();
  const list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  const filtered = list.filter(p => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

/**
 * Obtém estatísticas rápidas dos Pokémons cadastrados.
 * @returns {Promise<Object>} - Estatísticas consolidadas
 */
export const getStatistics = async () => {
  const allPokemons = await getPokemons();
  
  const total = allPokemons.length;
  if (total === 0) {
    return {
      total: 0,
      byType: {},
      mostCommonLocation: 'Nenhum registro',
      avgHp: 0,
      avgAttack: 0,
      avgDefense: 0
    };
  }

  const byType = {};
  const locations = {};
  let sumHp = 0, sumAttack = 0, sumDefense = 0;
  let countHp = 0, countAttack = 0, countDefense = 0;

  allPokemons.forEach(p => {
    const t = p.type || 'Desconhecido';
    byType[t] = (byType[t] || 0) + 1;

    const loc = p.location ? p.location.split(',').pop().trim() : 'Desconhecido';
    locations[loc] = (locations[loc] || 0) + 1;

    if (p.hp !== null && p.hp !== undefined) {
      sumHp += p.hp;
      countHp++;
    }
    if (p.attack !== null && p.attack !== undefined) {
      sumAttack += p.attack;
      countAttack++;
    }
    if (p.defense !== null && p.defense !== undefined) {
      sumDefense += p.defense;
      countDefense++;
    }
  });

  let mostCommonLocation = 'Nenhum registro';
  let maxCount = 0;
  Object.entries(locations).forEach(([loc, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonLocation = loc;
    }
  });

  return {
    total,
    byType,
    mostCommonLocation,
    avgHp: countHp > 0 ? Math.round(sumHp / countHp) : 0,
    avgAttack: countAttack > 0 ? Math.round(sumAttack / countAttack) : 0,
    avgDefense: countDefense > 0 ? Math.round(sumDefense / countDefense) : 0
  };
};

/**
 * Busca dados detalhados na PokeAPI para auto-preenchimento
 * @param {string} name - Nome do Pokémon
 * @returns {Promise<Object>} - Dados extraídos e formatados
 */
export const fetchPokedexData = async (name) => {
  if (!name || !name.trim()) {
    throw new Error('Nome do Pokémon não fornecido.');
  }

  const cleanName = name.toLowerCase().trim();
  
  try {
    // 1. Busca os detalhes básicos (sprites, atributos, tipos)
    const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${cleanName}`);
    if (!pokemonRes.ok) {
      throw new Error(`Pokémon "${name}" não foi encontrado na base global de Pokémons.`);
    }
    const pokemonData = await pokemonRes.json();

    // 2. Tenta buscar os dados da espécie (descrição da pokedex)
    let pokedex_text = '';
    let isTranslated = false;
    
    try {
      const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${cleanName}`);
      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        
        // Busca estritamente por Português (pt ou pt-BR)
        let flavorEntry = speciesData.flavor_text_entries.find(
          entry => entry.language.name === 'pt' || entry.language.name === 'pt-BR'
        );
        
        if (flavorEntry) {
          isTranslated = true;
          pokedex_text = flavorEntry.flavor_text;
        } else {
          // Se não houver português, tenta inglês
          flavorEntry = speciesData.flavor_text_entries.find(
            entry => entry.language.name === 'en'
          );
          if (flavorEntry) {
            pokedex_text = flavorEntry.flavor_text;
          }
        }

        if (pokedex_text) {
          // Limpa caracteres especiais de quebra de linha comuns na PokeAPI
          pokedex_text = pokedex_text
            .replace(/\n/g, ' ')
            .replace(/\f/g, ' ')
            .replace(/\r/g, ' ');
        }
      }
    } catch (err) {
      console.warn('Não foi possível obter descrição da espécie na PokeAPI.', err);
    }

    const hp = pokemonData.stats.find(s => s.stat.name === 'hp')?.base_stat || 50;
    const attack = pokemonData.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
    const defense = pokemonData.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;

    const rawType = pokemonData.types[0]?.type?.name || 'normal';
    const type = TYPE_TRANSLATIONS[rawType] || rawType.charAt(0).toUpperCase() + rawType.slice(1);

    const image_url = pokemonData.sprites.other?.['official-artwork']?.front_default || pokemonData.sprites.front_default || '';

    return {
      name: pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1),
      type,
      hp,
      attack,
      defense,
      pokedex_text,
      image_url,
      isTranslated
    };
  } catch (error) {
    console.error('Erro ao buscar na PokeAPI:', error);
    throw error;
  }
};
