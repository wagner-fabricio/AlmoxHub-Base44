import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, FileText } from 'lucide-react';

const LeadTimeCard = ({ icon: Icon, title, dias, descricao, total, color }) => (
  <Card className="bg-white dark:bg-slate-800 border-l-4" style={{ borderLeftColor: color }}>
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold mt-1" style={{ color }}>{dias} <span className="text-base font-normal text-slate-500">dias</span></p>
          <p className="text-xs text-slate-500 mt-1">{descricao}</p>
          <p className="text-xs text-slate-400 mt-2">Base: {total} OS analisadas</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function RelatorioLeadTime({ leadTimeReservas, leadTimeNFEstoque }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">⏱️ Lead Time de Atendimento</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeadTimeCard
          icon={FileText}
          title="Lead Time de Reservas"
          dias={leadTimeReservas.dias}
          descricao="Tempo médio entre data de reserva e conclusão"
          total={leadTimeReservas.total}
          color="#0000FF"
        />
        <LeadTimeCard
          icon={Clock}
          title="Lead Time de NF de Estoque"
          dias={leadTimeNFEstoque.dias}
          descricao="Tempo médio entre emissão da NF e recebimento"
          total={leadTimeNFEstoque.total}
          color="#FF6B00"
        />
      </div>
    </div>
  );
}