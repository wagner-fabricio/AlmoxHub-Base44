import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, MapPin, Package, Check, X, AlertCircle } from 'lucide-react';

export default function PickingWMS({ os, onComplete }) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [itemsStatus, setItemsStatus] = useState([]);
  const [quantidadeSeparada, setQuantidadeSeparada] = useState('');
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [showExcessAlert, setShowExcessAlert] = useState(false);
  const [excessJustification, setExcessJustification] = useState('');
  const [pendingExcessQuantity, setPendingExcessQuantity] = useState(null);

  // Ordenar itens por endereço
  const sortedItems = (os.itens_documento || [])
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item => item.codigo)
    .sort((a, b) => (a.endereco || '').localeCompare(b.endereco || ''));

  useEffect(() => {
    // Inicializar status dos itens
    const initialStatus = sortedItems.map(item => {
      if (item.separado) {
        return { status: 'completed', quantidadeSeparada: item.quantidade };
      }
      return { status: 'pending', quantidadeSeparada: null };
    });
    setItemsStatus(initialStatus);
  }, []);

  const currentItem = sortedItems[currentItemIndex];
  const totalItems = sortedItems.length;
  const completedCount = itemsStatus.filter(s => s.status !== 'pending').length;

  const handleConfirmQuantity = (type) => {
    const newStatus = [...itemsStatus];
    
    if (type === 'igual') {
      newStatus[currentItemIndex] = { status: 'completed', quantidadeSeparada: currentItem.quantidade };
    } else {
      setShowQuantityInput(true);
      return;
    }
    
    setItemsStatus(newStatus);
    
    // Avançar automaticamente para o próximo item pendente
    const nextPendingIndex = newStatus.findIndex((s, i) => i > currentItemIndex && s.status === 'pending');
    if (nextPendingIndex !== -1) {
      setCurrentItemIndex(nextPendingIndex);
    } else if (currentItemIndex < totalItems - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handleQuantitySubmit = () => {
    const qtd = parseFloat(quantidadeSeparada);
    if (isNaN(qtd) || qtd < 0) return;

    // Se quantidade for maior que a esperada, mostrar alerta
    if (qtd > currentItem.quantidade) {
      setPendingExcessQuantity(qtd);
      setShowExcessAlert(true);
      return;
    }

    const newStatus = [...itemsStatus];
    
    if (qtd === currentItem.quantidade) {
      newStatus[currentItemIndex] = { status: 'completed', quantidadeSeparada: qtd };
    } else if (qtd < currentItem.quantidade) {
      newStatus[currentItemIndex] = { status: 'partial', quantidadeSeparada: qtd };
    }
    
    setItemsStatus(newStatus);
    setShowQuantityInput(false);
    setQuantidadeSeparada('');
    
    // Avançar para próximo item pendente
    const nextPendingIndex = newStatus.findIndex((s, i) => i > currentItemIndex && s.status === 'pending');
    if (nextPendingIndex !== -1) {
      setCurrentItemIndex(nextPendingIndex);
    } else if (currentItemIndex < totalItems - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handleExcessCorrect = () => {
    setShowExcessAlert(false);
    setPendingExcessQuantity(null);
    setExcessJustification('');
    // Mantém o input aberto para o usuário corrigir
  };

  const handleExcessContinue = () => {
    if (!excessJustification.trim()) {
      alert('Por favor, insira uma justificativa para continuar.');
      return;
    }

    const qtd = pendingExcessQuantity;
    const newStatus = [...itemsStatus];
    
    newStatus[currentItemIndex] = { 
      status: 'excess', 
      quantidadeSeparada: qtd,
      justificativa: excessJustification
    };
    
    setItemsStatus(newStatus);
    setShowQuantityInput(false);
    setQuantidadeSeparada('');
    setShowExcessAlert(false);
    setPendingExcessQuantity(null);
    setExcessJustification('');
    
    // Avançar para próximo item pendente
    const nextPendingIndex = newStatus.findIndex((s, i) => i > currentItemIndex && s.status === 'pending');
    if (nextPendingIndex !== -1) {
      setCurrentItemIndex(nextPendingIndex);
    } else if (currentItemIndex < totalItems - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handleSkip = () => {
    const nextIndex = currentItemIndex + 1;
    if (nextIndex < totalItems) {
      setCurrentItemIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentItemIndex - 1;
    if (prevIndex >= 0) {
      setCurrentItemIndex(prevIndex);
    }
  };

  const handleFinish = async () => {
    // Todos os itens devem estar marcados
    const allMarked = itemsStatus.every(s => s.status !== 'pending');
    if (!allMarked) {
      alert('Todos os itens devem ser separados antes de finalizar!');
      return;
    }

    // Atualizar OS com status dos itens e mudar status de separação
    await onComplete(itemsStatus, sortedItems);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'partial': return 'bg-red-500';
      case 'excess': return 'bg-blue-500';
      default: return 'bg-slate-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4 text-white" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-white" />;
      case 'excess': return <AlertCircle className="w-4 h-4 text-white" />;
      default: return null;
    }
  };

  if (!currentItem) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-600">Nenhum item para separar</p>
      </div>
    );
  }

  const saldoAposSeparacao = currentItem.saldo ? currentItem.saldo - currentItem.quantidade : null;
  const allCompleted = itemsStatus.every(s => s.status !== 'pending');

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header - Progresso */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-900 dark:text-white text-sm font-medium">Ordem: {os.codigo}</span>
          <span className="text-slate-900 dark:text-white text-sm font-bold">{completedCount} de {totalItems}</span>
        </div>
        <div className="flex gap-1">
          {sortedItems.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full ${getStatusColor(itemsStatus[index]?.status || 'pending')}`}
            />
          ))}
        </div>
      </div>

      {/* Tarefa Atual - Card Grande */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-2xl mb-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <Badge className="bg-blue-500 text-white px-3 py-1 text-sm">
              Tarefa {currentItemIndex + 1}/{totalItems}
            </Badge>
            {itemsStatus[currentItemIndex]?.status !== 'pending' && (
              <div className={`${getStatusColor(itemsStatus[currentItemIndex]?.status)} rounded-full p-2`}>
                {getStatusIcon(itemsStatus[currentItemIndex]?.status)}
              </div>
            )}
          </div>

          {/* Endereço em Destaque */}
          <div className="mb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="text-slate-600 dark:text-slate-400 text-xs">Vá para o endereço</span>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-orange-500 tracking-wider break-all px-2">
              {currentItem.endereco || 'N/A'}
            </div>
            {currentItem.deposito && (
              <div className="mt-1 text-slate-600 dark:text-slate-400 text-xs">
                Depósito: {currentItem.deposito}
              </div>
            )}
          </div>

          {/* Produto */}
          <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4" style={{ color: '#0000FF' }} />
              <span className="text-slate-600 dark:text-slate-400 text-xs">Produto</span>
            </div>
            <div className="text-slate-900 dark:text-white text-lg sm:text-xl font-bold font-mono mb-1 break-all">
              {currentItem.codigo}
            </div>
            <div className="text-slate-700 dark:text-slate-300 text-xs break-words">
              {currentItem.descricao}
            </div>
          </div>

          {/* Quantidade a Separar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3">
              <span className="text-slate-600 dark:text-slate-400 text-xs block mb-1">Quantidade a Separar</span>
              <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#0000FF' }}>
                {currentItem.quantidade}
              </div>
              <span className="text-slate-600 dark:text-slate-400 text-xs">{currentItem.unidade || 'UN'}</span>
            </div>

            {saldoAposSeparacao !== null && (
              <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3">
                <span className="text-slate-600 dark:text-slate-400 text-xs block mb-1">Saldo após retirada</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-300">
                  {saldoAposSeparacao}
                </div>
                <span className="text-slate-600 dark:text-slate-400 text-xs">{currentItem.unidade || 'UN'}</span>
              </div>
            )}
          </div>

          {/* Confirmação de Quantidade */}
          {!showQuantityInput ? (
            <div className="space-y-2">
              {itemsStatus[currentItemIndex]?.status !== 'pending' && (
                <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-2 mb-2 text-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(itemsStatus[currentItemIndex]?.status)} text-white text-sm`}>
                    {getStatusIcon(itemsStatus[currentItemIndex]?.status)}
                    <span className="font-medium">
                      {itemsStatus[currentItemIndex]?.status === 'completed' && 'Quantidade Confirmada'}
                      {itemsStatus[currentItemIndex]?.status === 'partial' && `Separado: ${itemsStatus[currentItemIndex]?.quantidadeSeparada}`}
                      {itemsStatus[currentItemIndex]?.status === 'excess' && `Separado: ${itemsStatus[currentItemIndex]?.quantidadeSeparada}`}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-center text-slate-600 dark:text-slate-400 text-xs mb-2 font-medium">
                {itemsStatus[currentItemIndex]?.status === 'pending' ? 'Confirmar quantidade separada' : 'Alterar confirmação'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleConfirmQuantity('menor')}
                  className="py-4 sm:py-6 px-2 rounded-xl text-white flex flex-col items-center justify-center gap-1 sm:gap-1.5 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 min-h-[75px] sm:min-h-[85px]"
                  style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                >
                  <div className="bg-white/20 rounded-full p-1.5 sm:p-2">
                    <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[10px] sm:text-sm font-bold leading-tight">Menor</span>
                </Button>
                <Button
                  onClick={() => handleConfirmQuantity('igual')}
                  className="py-5 sm:py-8 px-2 rounded-2xl text-white flex flex-col items-center justify-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 min-h-[90px] sm:min-h-[110px]"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <div className="bg-white/20 rounded-full p-1.5 sm:p-2">
                    <Check className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[10px] sm:text-sm font-bold leading-tight">Igual</span>
                </Button>
                <Button
                  onClick={() => handleConfirmQuantity('maior')}
                  className="py-5 sm:py-8 px-2 rounded-2xl text-white flex flex-col items-center justify-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 min-h-[90px] sm:min-h-[110px]"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                >
                  <div className="bg-white/20 rounded-full p-1.5 sm:p-2">
                    <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-[10px] sm:text-sm font-bold leading-tight">Maior</span>
                </Button>
              </div>
            </div>
          ) : showQuantityInput ? (
            <div className="space-y-3">
              <p className="text-center text-slate-600 dark:text-slate-400 text-sm">Digite a quantidade separada</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={quantidadeSeparada}
                  onChange={(e) => setQuantidadeSeparada(e.target.value)}
                  placeholder="Quantidade"
                  className="text-center text-2xl font-bold py-6 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  autoFocus
                />
                <Button
                  onClick={handleQuantitySubmit}
                  className="px-6 py-6 text-white"
                  style={{ backgroundColor: '#0000FF' }}
                >
                  <Check className="w-6 h-6" />
                </Button>
              </div>
              <Button
                onClick={() => {
                  setShowQuantityInput(false);
                  setQuantidadeSeparada('');
                }}
                variant="outline"
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Cancelar
              </Button>
            </div>
          ) : null}
        </div>

        {/* Lista de Picking - Tabela */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              Lista de Separação
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left p-3 text-slate-600 dark:text-slate-400 font-semibold">Código</th>
                  <th className="text-left p-3 text-slate-600 dark:text-slate-400 font-semibold">Descrição</th>
                  <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-semibold">Qtd Solicitada</th>
                  <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-semibold">Qtd Separada</th>
                  <th className="text-center p-3 text-slate-600 dark:text-slate-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item, index) => {
                  const status = itemsStatus[index];
                  const qtdRecebida = status?.quantidadeSeparada ?? 0;
                  const qtdEsperada = item.quantidade;
                  
                  return (
                    <tr 
                      key={index}
                      onClick={() => setCurrentItemIndex(index)}
                      className={`border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors ${
                        currentItemIndex === index 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-mono font-semibold text-slate-900 dark:text-white text-xs sm:text-sm break-all">
                          {item.codigo}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm max-w-[150px] sm:max-w-[200px] truncate">
                          {item.descricao}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {qtdEsperada}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className={`font-bold ${
                          status?.status === 'completed' ? 'text-green-600' :
                          status?.status === 'partial' ? 'text-orange-500' :
                          status?.status === 'excess' ? 'text-red-600' :
                          'text-slate-400'
                        }`}>
                          {status?.status === 'pending' || !status ? '-' : qtdRecebida}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center">
                          {status?.status === 'completed' && (
                            <Badge className="bg-green-500 text-white">Completo</Badge>
                          )}
                          {status?.status === 'partial' && (
                            <Badge className="bg-orange-500 text-white">Parcial</Badge>
                          )}
                          {status?.status === 'excess' && (
                            <Badge className="bg-red-500 text-white">Excedente</Badge>
                          )}
                          {(status?.status === 'pending' || !status) && (
                            <Badge className="bg-slate-400 text-white">Pendente</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
              Progresso: <span className="text-slate-900 dark:text-white font-bold">{completedCount} de {totalItems} itens</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Navegação */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={handlePrevious}
            disabled={currentItemIndex === 0}
            variant="outline"
            className="flex-1 py-6 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Anterior
          </Button>
          <Button
            onClick={handleSkip}
            disabled={currentItemIndex === totalItems - 1}
            variant="outline"
            className="flex-1 py-6 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30"
          >
            Pular
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
        
        {allCompleted && (
          <Button
            onClick={handleFinish}
            className="w-full py-6 text-white font-bold text-lg rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0000FF 0%, #FF6B00 100%)' }}
          >
            <Check className="w-6 h-6 mr-2" />
            Finalizar Separação
          </Button>
        )}
      </div>

      {/* Modal de Alerta para Quantidade Excedente */}
      <Dialog open={showExcessAlert} onOpenChange={setShowExcessAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-6 h-6" />
              Quantidade Diferente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300">
              A quantidade separada <span className="font-bold text-red-600">{pendingExcessQuantity}</span> é maior que a solicitada <span className="font-bold">{currentItem?.quantidade}</span>.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              O que deseja fazer?
            </p>
            
            {/* Campo de Justificativa (aparece quando não está vazio ou após clicar em continuar sem preencher) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Justificativa (obrigatória para continuar):
              </label>
              <Textarea
                value={excessJustification}
                onChange={(e) => setExcessJustification(e.target.value)}
                placeholder="Digite o motivo da divergência..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              onClick={handleExcessCorrect}
              variant="outline"
              className="flex-1"
            >
              Corrigir
            </Button>
            <Button
              onClick={handleExcessContinue}
              className="flex-1"
              style={{ backgroundColor: '#0000FF' }}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}