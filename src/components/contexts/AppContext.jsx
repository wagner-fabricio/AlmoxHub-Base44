import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { useOrdensQuery, ORDENS_QUERY_KEY, useOrdensRealTimeSync } from '@/hooks/useOrdensQuery';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPessoa, setCurrentPessoa] = useState(null);
  const [regionais, setRegionais] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [almoxarifados, setAlmoxarifados] = useState([]);
  const [instalacoes, setInstalacoes] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [rotulos, setRotulos] = useState([]);
  const [loadingOther, setLoadingOther] = useState(true);
  const queryClient = useQueryClient();

  // OS carregadas via React Query — cache inteligente de 2 min
  const { data: ordens = [], isLoading: isOrdensLoading } = useOrdensQuery();

  const loading = isOrdensLoading || loadingOther;

  // Setter mantém retrocompatibilidade — atualiza o cache do React Query
  const setOrdens = (updater) => {
    queryClient.setQueryData(ORDENS_QUERY_KEY, (prev = []) =>
      typeof updater === 'function' ? updater(prev) : updater
    );
  };

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

  // Keep Almoxarifado list in sync with real-time updates
  useEffect(() => {
    const unsub = base44.entities.Almoxarifado.subscribe((event) => {
      if (event.type === 'create') {
        setAlmoxarifados(prev => [...prev, event.data]);
      } else if (event.type === 'update') {
        setAlmoxarifados(prev => prev.map(a => a.id === event.id ? { ...a, ...event.data } : a));
      } else if (event.type === 'delete') {
        setAlmoxarifados(prev => prev.filter(a => a.id !== event.id));
      }
    });
    return unsub;
  }, []);

  // Sincronização real-time centralizada — atualiza global + filtradas em um único subscriber
  useOrdensRealTimeSync();

  const loadGlobalData = async () => {
    try {
      const [
        user,
        regionaisData,
        pessoasData,
        categoriasData,
        subcategoriasData,
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
      setLoadingOther(false);
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

  const refreshOrdens = () => {
    queryClient.invalidateQueries({ queryKey: ORDENS_QUERY_KEY });
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