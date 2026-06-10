// Utilitários de roteirização logística
// Almoxarifados = pontos de atendimento (coleta) | Instalações = pontos de entrega

// Distância em km entre dois pontos (lat/lng) — fórmula de Haversine
export function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371; // raio da Terra em km
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const coordOk = (p) => p && p.latitude != null && p.longitude != null;

// Calcula os dados de roteirização a partir das OS filtradas.
// Cada rota = almoxarifado (origem/atendimento) -> instalação de destino (entrega).
export function calcularRoteirizacao(filteredOrdens, almoxarifados, instalacoes) {
  const almoxById = new Map(almoxarifados.map((a) => [a.id, a]));
  const instById = new Map(instalacoes.map((i) => [i.id, i]));

  const rotas = [];
  let semCoordenadas = 0;

  filteredOrdens.forEach((os) => {
    // Ponto de atendimento (coleta): instalação de origem se houver, senão o almoxarifado da OS
    const origem = os.instalacao_origem_id
      ? instById.get(os.instalacao_origem_id)
      : almoxById.get(os.almoxarifado_id);
    const destino = os.instalacao_destino_id
      ? instById.get(os.instalacao_destino_id)
      : null;

    if (!destino || os.destino_externo) return; // só rotas com entrega interna mapeável
    if (!coordOk(origem) || !coordOk(destino)) {
      semCoordenadas++;
      return;
    }

    const dist = haversineKm(origem.latitude, origem.longitude, destino.latitude, destino.longitude);
    if (dist == null) return;

    rotas.push({
      os: os.codigo,
      origem: origem.nome,
      destino: destino.nome,
      distancia_km: dist,
    });
  });

  if (rotas.length === 0) {
    return { totalRotas: 0, semCoordenadas, totalKm: 0, distanciaMediaKm: 0, maiorDistanciaKm: 0, topRotasLongas: [], paresFrequentes: [] };
  }

  const totalKm = rotas.reduce((s, r) => s + r.distancia_km, 0);
  const distanciaMediaKm = Math.round(totalKm / rotas.length);
  const maiorDistanciaKm = Math.max(...rotas.map((r) => r.distancia_km));

  // Top 10 rotas mais longas (maior custo por entrega)
  const topRotasLongas = [...rotas].sort((a, b) => b.distancia_km - a.distancia_km).slice(0, 10);

  // Pares origem->destino mais frequentes (consolidação de cargas)
  const paresMap = new Map();
  rotas.forEach((r) => {
    const key = `${r.origem} → ${r.destino}`;
    const cur = paresMap.get(key) || { par: key, ocorrencias: 0, distancia_km: r.distancia_km };
    cur.ocorrencias++;
    paresMap.set(key, cur);
  });
  const paresFrequentes = [...paresMap.values()]
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .slice(0, 10);

  return {
    totalRotas: rotas.length,
    semCoordenadas,
    totalKm,
    distanciaMediaKm,
    maiorDistanciaKm,
    topRotasLongas,
    paresFrequentes,
  };
}