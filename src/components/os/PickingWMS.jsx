import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, MapPin, Package, Check, X, AlertCircle } from 'lucide-react';

export default function PickingWMS({ os, onComplete }) {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [itemsStatus, setItemsStatus] = useState([]);
  const [quantidadeSeparada, setQuantidadeSeparada] = useState('');
  const [showQuantityInput, setShowQuantityInput] = useState(false);

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
    if (isNaN(qtd) || qtd <= 0) return;

    const newStatus = [...itemsStatus];
    
    if (qtd === currentItem.quantidade) {
      newStatus[currentItemIndex] = { status: 'completed', quantidadeSeparada: qtd };
    } else if (qtd < currentItem.quantidade) {
      newStatus[currentItemIndex] = { status: 'partial', quantidadeSeparada: qtd };
    } else {
      newStatus[currentItemIndex] = { status: 'excess', quantidadeSeparada: qtd };
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
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl mb-4 border border-slate-200 dark:border-slate-700">
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
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              <span className="text-slate-600 dark:text-slate-400 text-sm">Vá para o endereço</span>
            </div>
            <div className="text-6xl font-bold text-orange-500 tracking-wider">
              {currentItem.endereco || 'N/A'}
            </div>
            {currentItem.deposito && (
              <div className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                Depósito: {currentItem.deposito}
              </div>
            )}
          </div>

          {/* Produto */}
          <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5" style={{ color: '#0000FF' }} />
              <span className="text-slate-600 dark:text-slate-400 text-xs">Produto</span>
            </div>
            <div className="text-slate-900 dark:text-white text-2xl font-bold font-mono mb-1">
              SKU - {currentItem.codigo}
            </div>
            <div className="text-slate-700 dark:text-slate-300 text-sm">
              {currentItem.descricao}
            </div>
          </div>

          {/* Quantidade a Separar */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-4">
              <span className="text-slate-600 dark:text-slate-400 text-xs block mb-1">Quantidade a Separar</span>
              <div className="text-4xl font-bold" style={{ color: '#0000FF' }}>
                {currentItem.quantidade}
              </div>
              <span className="text-slate-600 dark:text-slate-400 text-sm">{currentItem.unidade || 'UN'}</span>
            </div>

            {saldoAposSeparacao !== null && (
              <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-4">
                <span className="text-slate-600 dark:text-slate-400 text-xs block mb-1">Saldo após retirada</span>
                <div className="text-4xl font-bold text-slate-700 dark:text-slate-300">
                  {saldoAposSeparacao}
                </div>
                <span className="text-slate-600 dark:text-slate-400 text-sm">{currentItem.unidade || 'UN'}</span>
              </div>
            )}
          </div>

          {/* Confirmação de Quantidade */}
          {!showQuantityInput ? (
            <div className="space-y-3">
              {itemsStatus[currentItemIndex]?.status !== 'pending' && (
                <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 mb-3 text-center">
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
              <p className="text-center text-slate-600 dark:text-slate-400 text-sm mb-3">
                {itemsStatus[currentItemIndex]?.status === 'pending' ? 'Confirmar quantidade separada' : 'Alterar confirmação'}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleConfirmQuantity('menor')}
                  className="py-6 rounded-xl bg-red-500 hover:bg-red-600 text-white flex flex-col gap-1"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-xs">Menor</span>
                </Button>
                <Button
                  onClick={() => handleConfirmQuantity('igual')}
                  className="py-6 rounded-xl text-white flex flex-col gap-1"
                  style={{ backgroundColor: '#0000FF' }}
                >
                  <Check className="w-5 h-5" />
                  <span className="text-xs">Igual</span>
                </Button>
                <Button
                  onClick={() => handleConfirmQuantity('maior')}
                  className="py-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white flex flex-col gap-1"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-xs">Maior</span>
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

        {/* Lista de Picking - Lateral */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-slate-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Lista de Picking
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentItemIndex(index)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  currentItemIndex === index 
                    ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-blue-500' 
                    : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getStatusColor(itemsStatus[index]?.status || 'pending')}`}>
                    {itemsStatus[index]?.status === 'pending' ? (
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    ) : (
                      getStatusIcon(itemsStatus[index]?.status)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-900 dark:text-white text-sm font-medium font-mono truncate">
                      SKU-{item.codigo}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span>{item.endereco || 'N/A'}</span>
                      <span>•</span>
                      <span>{itemsStatus[index]?.quantidadeSeparada || item.quantidade}/{item.quantidade}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
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
    </div>
  );
}