import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, FileText } from 'lucide-react';
import { AXIA } from './axiaColors';

const LeadTimeCard = ({ icon: Icon, title, dias, descricao, total, color }) => (
  <Card className="bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 shadow-none">
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-semibold mt-1 tracking-tight text-slate-900 dark:text-white">
            {dias} <span className="text-base font-normal text-slate-500">dias</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">{descricao}</p>
          <p className="text-[11px] text-slate-400 mt-2">Base: {total} OS concluídas</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function RelatorioLeadTime({ leadTimeReservas, leadTimeNFEstoque }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight">Lead Time de Atendimento</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeadTimeCard
          icon={FileText}
          title="Lead Time de Reservas"
          dias={leadTimeReservas.dias}
          descricao="Tempo médio entre reserva e conclusão (OS concluídas)"
          total={leadTimeReservas.total}
          color={AXIA.primary}
        />
        <LeadTimeCard
          icon={Clock}
          title="Lead Time de Entrega (LTE)"
          dias={leadTimeNFEstoque.dias}
          descricao="Tempo médio em dias corridos: recebimento − emissão da NF"
          total={leadTimeNFEstoque.total}
          color={AXIA.accent}
        />
      </div>
    </div>
  );
}