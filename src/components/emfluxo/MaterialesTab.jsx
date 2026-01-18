import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, 
  Check, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Eye,
  Zap
} from 'lucide-react';

export default function MaterialesTab({ os, onClose }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'wms'
  const [itemsStatus, setItemsStatus] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [quantidadeSeparada, setQuantidadeSeparada] = useState('');
  const [showQuantityInput, setShowQuantityInput] = useState(false);

  // Ordenar itens por endereço para modo WMS
  const sortedItems = (os.itens_documento || [])
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item => item.codigo)
    .sort((a, b) => (a.endereco || '').localeCompare(b.endereco || ''));

  useEffect(() => {
    // Inicializar status dos itens
    const initialStatus = sortedItems.map(item => ({
      checked: item.separado || false,
      quantidadeSeparada: item.separado ? item.quantidade : null
    }));
    setItemsStatus(initialStatus);
  }, [os]);

  const totalItems = sortedItems.length;
  const completedCount = itemsStatus.filter(s => s.checked).length;
  const currentItem = sortedItems[currentItemIndex];

  // ============ Modo Lista ============
  const handleToggleItem = (index) => {
    const newStatus = [...itemsStatus];
    newStatus[index].checked = !newStatus[index].checked;
    if (newStatus[index].checked && !newStatus[index].quantidadeSeparada) {
      newStatus[index].quantidadeSeparada = sortedItems[index].quantidade;
    }
    setItemsStatus(newStatus);
  };

  // ============ Modo WMS ============
  const handleConfirmQuantity = (type) => {
    const newStatus = [...itemsStatus];
    
    if (type === 'igual') {
      newStatus[currentItemIndex] = { 
        checked: true, 
        quantidadeSeparada: currentItem.quantidade 
      };
    } else {
      setShowQuantityInput(true);
      return;
    }
    
    setItemsStatus(newStatus);
    moveToNextPending(newStatus);
  };

  const handleQuantitySubmit = () => {
    const qtd = parseFloat(quantidadeSeparada);
    if (isNaN(qtd) || qtd < 0) return;

    const newStatus = [...itemsStatus];
    newStatus[currentItemIndex] = { 
      checked: true, 
      quantidadeSeparada: qtd 
    };
    
    setItemsStatus(newStatus);
    setShowQuantityInput(false);
    setQuantidadeSeparada('');
    moveToNextPending(newStatus);
  };

  const moveToNextPending = (status) => {
    const nextPendingIndex = status.findIndex((s, i) => i > currentItemIndex && !s.checked);
    if (nextPendingIndex !== -1) {
      setCurrentItemIndex(nextPendingIndex);
    } else if (currentItemIndex < totalItems - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
      setShowQuantityInput(false);
      setQuantidadeSeparada('');
    }
  };

  const handleSkip = () => {
    if (currentItemIndex < totalItems - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      setShowQuantityInput(false);
      setQuantidadeSeparada('');
    }
  };

  if (!currentItem && viewMode === 'wms') {
    setViewMode('list');
  }

  // ============ Renderização Modo Lista ============
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {/* Botão alternar para WMS */}
        {sortedItems.length > 0 && (
          <Button
            onClick={() => setViewMode('wms')}
            className="w-full text-white py-6 rounded-xl font-semibold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0000FF 0%, #FF6B00 100%)' }}
          >
            <Zap className="w-5 h-5" />
            Modo WMS
          </Button>
        )}

        {/* Progresso */}
        {sortedItems.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Progresso</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{completedCount} de {totalItems}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalItems) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista de Itens */}
        <div className="space-y-2">
          {sortedItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum material cadastrado</p>
            </div>
          ) : (
            sortedItems.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border-l-4 transition-all"
                style={{ borderLeftColor: item.endereco ? '#0000FF' : '#888' }}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={itemsStatus[index]?.checked || false}
                    onCheckedChange={() => handleToggleItem(index)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                          {item.codigo}
                        </p>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                          {item.descricao}
                        </h4>
                        {item.endereco && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mb-2">
                            <MapPin className="w-3 h-3" />
                            {item.endereco}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {itemsStatus[index]?.quantidadeSeparada || item.quantidade} {item.unidade || 'UN'}
                          </Badge>
                          {itemsStatus[index]?.checked && (
                            <Badge className="bg-green-500 text-white text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Conferido
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ============ Renderização Modo WMS ============
  const saldoAposSeparacao = currentItem?.saldo ? currentItem.saldo - currentItem.quantidade : null;
  const allCompleted = itemsStatus.every(s => s.checked);

  return (
    <div className="space-y-4">
      {/* Header WMS */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Progresso</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{completedCount} de {totalItems}</span>
        </div>
        <div className="flex gap-1 mb-2">
          {sortedItems.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full ${
                itemsStatus[index]?.checked 
                  ? 'bg-green-500' 
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Tarefa {currentItemIndex + 1} de {totalItems}
        </p>
      </div>

      {/* Card do Item Atual */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-lg">
        {/* Endereço */}
        <div className="mb-4 text-center pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Endereço</span>
          </div>
          <p className="text-3xl font-bold text-orange-500 tracking-wider break-all">
            {currentItem?.endereco || 'N/A'}
          </p>
          {currentItem?.deposito && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dep: {currentItem.deposito}
            </p>
          )}
        </div>

        {/* Código e Descrição */}
        <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4" style={{ color: '#0000FF' }} />
            <span className="text-xs text-slate-600 dark:text-slate-400">Produto</span>
          </div>
          <p className="font-mono font-bold text-slate-900 dark:text-white text-sm break-all mb-1">
            {currentItem?.codigo}
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 break-words">
            {currentItem?.descricao}
          </p>
        </div>

        {/* Quantidade a Separar */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3">
            <span className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Quantidade</span>
            <p className="text-2xl font-bold" style={{ color: '#0000FF' }}>
              {currentItem?.quantidade}
            </p>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {currentItem?.unidade || 'UN'}
            </span>
          </div>
          
          {saldoAposSeparacao !== null && (
            <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3">
              <span className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Saldo</span>
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                {saldoAposSeparacao}
              </p>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {currentItem?.unidade || 'UN'}
              </span>
            </div>
          )}
        </div>

        {/* Confirmação de Quantidade */}
        {!showQuantityInput ? (
          <div className="space-y-2">
            {itemsStatus[currentItemIndex]?.checked && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2 mb-2 text-center border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 text-xs font-medium">
                  <Check className="w-4 h-4" />
                  Conferido: {itemsStatus[currentItemIndex]?.quantidadeSeparada} {currentItem?.unidade || 'UN'}
                </div>
              </div>
            )}
            <p className="text-center text-xs text-slate-600 dark:text-slate-400 mb-2">
              {itemsStatus[currentItemIndex]?.checked ? 'Alterar confirmação' : 'Confirmar quantidade'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleConfirmQuantity('menor')}
                className="py-5 px-2 rounded-xl text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-bold leading-tight">Menor</span>
              </Button>
              <Button
                onClick={() => handleConfirmQuantity('igual')}
                className="py-5 px-2 rounded-xl text-white flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                <Check className="w-4 h-4" />
                <span className="text-xs font-bold leading-tight">Igual</span>
              </Button>
            </div>
            <Button
              onClick={() => setShowQuantityInput(true)}
              variant="outline"
              className="w-full py-3 text-sm text-slate-900 dark:text-white"
            >
              Digitar Quantidade
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">Digite a quantidade</p>
            <div className="flex gap-2">
              <Input
                type="number"
                value={quantidadeSeparada}
                onChange={(e) => setQuantidadeSeparada(e.target.value)}
                placeholder="0"
                className="text-center text-xl font-bold py-4 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                autoFocus
              />
              <Button
                onClick={handleQuantitySubmit}
                className="px-4 py-4 text-white"
                style={{ backgroundColor: '#0000FF' }}
              >
                <Check className="w-5 h-5" />
              </Button>
            </div>
            <Button
              onClick={() => {
                setShowQuantityInput(false);
                setQuantidadeSeparada('');
              }}
              variant="outline"
              className="w-full py-2 text-sm"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className="flex gap-2">
        <Button
          onClick={handlePrevious}
          disabled={currentItemIndex === 0}
          variant="outline"
          className="flex-1 py-4 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        <Button
          onClick={handleSkip}
          disabled={currentItemIndex === totalItems - 1}
          variant="outline"
          className="flex-1 py-4 disabled:opacity-30"
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Botão Voltar para Lista */}
      <Button
        onClick={() => setViewMode('list')}
        variant="outline"
        className="w-full py-4 text-slate-900 dark:text-white"
      >
        <Eye className="w-4 h-4 mr-2" />
        Visualizar Lista
      </Button>

      {/* Botão Finalizar */}
      {allCompleted && (
        <Button
          className="w-full py-6 text-white font-bold rounded-xl shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0000FF 0%, #FF6B00 100%)' }}
          onClick={onClose}
        >
          <Check className="w-5 h-5 mr-2" />
          Finalizar Conferência
        </Button>
      )}
    </div>
  );
}