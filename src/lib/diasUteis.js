// Utilitário compartilhado para cálculo de dias úteis considerando:
//  - sábados/domingos
//  - feriados cadastrados na entidade Feriado (nacional, estadual, municipal, local)
//
// A abrangência é resolvida pelo almoxarifado da OS (via instalacao -> cidade/UF).

import { base44 } from '@/api/base44Client';

const norm = (s) => (s || '').toString().trim().toLowerCase();
const toYMD = (d) => {
  if (!d) return null;
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Cache em memória para evitar refetch em cada chamada
let _feriadosCache = null;
let _feriadosPromise = null;

export async function carregarFeriados(force = false) {
  if (!force && _feriadosCache) return _feriadosCache;
  if (!force && _feriadosPromise) return _feriadosPromise;
  _feriadosPromise = (async () => {
    try {
      const list = await base44.entities.Feriado.list('-data', 5000);
      _feriadosCache = (list || []).filter(f => f.ativo !== false && f.data);
      return _feriadosCache;
    } catch (e) {
      _feriadosCache = [];
      return [];
    } finally {
      _feriadosPromise = null;
    }
  })();
  return _feriadosPromise;
}

// Constrói um Set<string> "YYYY-MM-DD" com os feriados aplicáveis ao contexto fornecido.
// contexto: { estado, cidade, almoxarifado_id }
export function buildFeriadosSet(feriados, contexto = {}) {
  const uf = norm(contexto.estado);
  const cidade = norm(contexto.cidade);
  const almoxId = contexto.almoxarifado_id || null;
  const set = new Set();
  for (const f of feriados || []) {
    if (!f.data) continue;
    if (f.tipo === 'nacional') {
      set.add(f.data);
    } else if (f.tipo === 'estadual') {
      if (uf && norm(f.estado) === uf) set.add(f.data);
    } else if (f.tipo === 'municipal') {
      if (uf && norm(f.estado) === uf && cidade && norm(f.cidade) === cidade) set.add(f.data);
    } else if (f.tipo === 'local') {
      if (almoxId && f.almoxarifado_id === almoxId) set.add(f.data);
    }
  }
  return set;
}

// Calcula dias úteis (>0) entre start (exclusivo) e end (inclusivo),
// excluindo sábados/domingos e datas presentes em feriadosSet.
export function diasUteisEntreComFeriados(start, end, feriadosSet) {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  if (e < s) return null;
  let count = 0;
  const cur = new Date(s);
  while (cur < e) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow === 0 || dow === 6) continue;
    const ymd = toYMD(cur);
    if (feriadosSet && feriadosSet.has(ymd)) continue;
    count++;
  }
  return count;
}

// Resolve o contexto (UF/cidade) de uma OS a partir do seu almoxarifado.
export function contextoDaOS(os, almoxarifados, instalacoes) {
  const alm = almoxarifados?.find(a => a.id === os?.almoxarifado_id);
  const inst = alm ? instalacoes?.find(i => i.id === alm.instalacao_id) : null;
  return {
    almoxarifado_id: os?.almoxarifado_id || null,
    estado: inst?.estado || '',
    cidade: inst?.cidade || '',
  };
}