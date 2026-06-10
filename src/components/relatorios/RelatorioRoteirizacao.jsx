import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Route, MapPin, Ruler, TrendingUp, Repeat } from 'lucide-react';

const Stat = ({ icon: Icon, label, value, suffix, color }) => (
  <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
    <CardContent className="p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}{suffix && <span className="text-sm font-medium text-slate-500 ml-1">{suffix}</span>}
      </p>
    </CardContent>
  </Card>
);

export default function RelatorioRoteirizacao({ roteirizacao }) {
  if (!roteirizacao || roteirizacao.totalRotas === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
        <Route className="w-5 h-5" style={{ color: '#0000FF' }} /> Roteirização e Distâncias
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={MapPin} label="Rotas mapeadas" value={roteirizacao.totalRotas} color="#0000FF" />
        <Stat icon={Ruler} label="Distância total" value={roteirizacao.totalKm.toLocaleString('pt-BR')} suffix="km" color="#6366f1" />
        <Stat icon={TrendingUp} label="Distância média" value={roteirizacao.distanciaMediaKm} suffix="km" color="#10b981" />
        <Stat icon={Ruler} label="Maior distância" value={roteirizacao.maiorDistanciaKm} suffix="km" color="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top rotas mais longas */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-red-500" /> Rotas mais longas (maior custo)
            </h3>
            <ul className="space-y-2">
              {roteirizacao.topRotasLongas.map((r, i) => (
                <li key={i} className="flex items-center justify-between text-sm gap-3">
                  <span className="text-slate-700 dark:text-slate-300 truncate">{r.origem} → {r.destino}</span>
                  <span className="font-semibold text-slate-900 dark:text-white shrink-0">{r.distancia_km.toLocaleString('pt-BR')} km</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pares mais frequentes */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Repeat className="w-4 h-4" style={{ color: '#0000FF' }} /> Trajetos mais frequentes (consolidação)
            </h3>
            <ul className="space-y-2">
              {roteirizacao.paresFrequentes.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm gap-3">
                  <span className="text-slate-700 dark:text-slate-300 truncate">{p.par}</span>
                  <span className="font-semibold text-slate-900 dark:text-white shrink-0">{p.ocorrencias}x · {p.distancia_km} km</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {roteirizacao.semCoordenadas > 0 && (
        <p className="text-xs text-slate-400">
          {roteirizacao.semCoordenadas} rota(s) ignorada(s) por falta de coordenadas (latitude/longitude) nos pontos de origem ou destino.
        </p>
      )}
    </div>
  );
}