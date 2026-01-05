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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    try {
      const [user, regionaisData, pessoasData, categoriasData, subcategoriasData] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.Regional.list(),
        base44.entities.Pessoa.list(),
        base44.entities.Categoria.list(),
        base44.entities.Subcategoria.list()
      ]);

      setCurrentUser(user);
      setRegionais(regionaisData);
      setPessoas(pessoasData);
      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);

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

  return (
    <AppContext.Provider value={{
      currentUser,
      currentPessoa,
      regionais,
      pessoas,
      categorias,
      subcategorias,
      loading,
      refreshPessoas,
      refreshRegionais,
      refreshCategorias,
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