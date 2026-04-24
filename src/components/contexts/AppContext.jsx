import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  const [regionais, setRegionais] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [instalacoes, setInstalacoes] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [rotulos, setRotulos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlobalData();
  }, []);

  // Keep Pessoa list in sync with real-time updates
  useEffect(() => {
    const unsub = base44.entities.Pessoa.subscribe((event) => {
      if (event.type === 'create') {
        setPessoas(prev => [...prev, event.data]);
      } else if (event.type === 'update') {
        setPessoas(prev => prev.map(p => p.id === event.id ? { ...p, ...event.data } : p));
        setCurrentPessoa(prev => prev?.id === event.id ? { ...prev, ...event.data } : prev);
      } else if (event.type === 'delete') {
        setPessoas(prev => prev.filter(p => p.id !== event.id));
      }
    });
    return unsub;
  }, []);

  // Keep OrdemServico list in sync with real-time updates (shared across Dashboard + OrdensServico)
  useEffect(() => {
    const unsub = base44.entities.OrdemServico.subscribe((event) => {
      if (event.type === 'create' && event.data) {
        setOrdens(prev => prev.some(o => o.id === event.id) ? prev : [event.data, ...prev]);
      } else if (event.type === 'update' && event.data) {
        setOrdens(prev => prev.map(o => o.id === event.id ? { ...o, ...event.data } : o));
      } else if (event.type === 'delete') {
        setOrdens(prev => prev.filter(o => o.id !== event.id));
      }
    });
    return unsub;
  }, []);

  const loadGlobalData = async () => {
    try {
      const [
        user,
        regionaisData,
        pessoasData,
        categoriasData,
        subcategoriasData,
        ordensData,
        almoxarifadosData,
        instalacoesData,
        projetosData,
        rotulosData
      ] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Regional.list(),
        base44.entities.Pessoa.list(),
        base44.entities.Categoria.list(),
        base44.entities.Subcategoria.list(),
        // Carregar OS ativas (sem limite) + OS recentes (90 dias) em paralelo
        Promise.all([
          base44.entities.OrdemServico.filter({ status: 'elaboracao' }),
          base44.entities.OrdemServico.filter({ status: 'execucao' }),
          base44.entities.OrdemServico.list('-created_date', 1000),
        ]).then(([ativas1, ativas2, recentes]) => {
          const ids = new Set();
          const merged = [];
          for (const os of [...ativas1, ...ativas2, ...recentes]) {
            if (!ids.has(os.id)) { ids.add(os.id); merged.push(os); }
          }
          return merged;
        }),
        base44.entities.Almoxarifado.list(),
        base44.entities.Instalacao.list(),
        base44.entities.Projeto.list(),
        base44.entities.Rotulo.filter({ ativo: true })
      ]);

      setCurrentUser(user);
      setRegionais(regionaisData);
      setPessoas(pessoasData);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
      setOrdens(ordensData);
      setAlmoxarifados(almoxarifadosData);
      setInstalacoes(instalacoesData);
      setProjetos(projetosData);
      setRotulos(rotulosData);

      if (user) {
        const pessoa = pessoasData.find(p => p.user_id === user.id);
        setCurrentPessoa(pessoa);
      }
    } catch (error) {
      console.error('Error loading global data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPessoas = async () => {
    const pessoasData = await base44.entities.Pessoa.list();
    setPessoas(pessoasData);
    if (currentUser) {
      const pessoa = pessoasData.find(p => p.user_id === currentUser.id);
      setCurrentPessoa(pessoa);
    }
  };

  const refreshRegionais = async () => {
    const regionaisData = await base44.entities.Regional.list();
    setRegionais(regionaisData);
  };

  const refreshCategorias = async () => {
    const [categoriasData, subcategoriasData] = await Promise.all([
      base44.entities.Categoria.list(),
      base44.entities.Subcategoria.list()
    ]);
    setCategorias(categoriasData);
    setSubcategorias(subcategoriasData);
  };

  const refreshOrdens = async () => {
    const [ativas1, ativas2, recentes] = await Promise.all([
      base44.entities.OrdemServico.filter({ status: 'elaboracao' }),
      base44.entities.OrdemServico.filter({ status: 'execucao' }),
      base44.entities.OrdemServico.list('-created_date', 1000),
    ]);
    const ids = new Set();
    const merged = [];
    for (const os of [...ativas1, ...ativas2, ...recentes]) {
      if (!ids.has(os.id)) { ids.add(os.id); merged.push(os); }
    }
    setOrdens(merged);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      currentPessoa,
      regionais,
      pessoas,
      categorias,
      subcategorias,
      ordens,
      setOrdens,
      almoxarifados,
      instalacoes,
      projetos,
      rotulos,
      loading,
      refreshPessoas,
      refreshRegionais,
      refreshCategorias,
      refreshOrdens,
      loadGlobalData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}