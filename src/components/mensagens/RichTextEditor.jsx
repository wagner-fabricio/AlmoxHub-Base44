import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function RichTextEditor({ 
  value, 
  onChange, 
  onKeyDown, 
  placeholder,
  className 
}) {
  const [formatting, setFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false
  });
  const textareaRef = useRef(null);

  const applyFormatting = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let markers = {
      bold: ['**', '**'],
      italic: ['*', '*'],
      underline: ['__', '__'],
      strikethrough: ['~~', '~~']
    };

    const [openMarker, closeMarker] = markers[type];
    
    if (selectedText) {
      // Se há texto selecionado, aplicar formatação
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newText = `${before}${openMarker}${selectedText}${closeMarker}${after}`;
      
      onChange({ target: { value: newText } });
      
      // Restaurar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + openMarker.length,
          end + openMarker.length
        );
      }, 0);
    } else {
      // Se não há seleção, inserir marcadores e posicionar cursor
      const before = value.substring(0, start);
      const after = value.substring(start);
      const newText = `${before}${openMarker}${closeMarker}${after}`;
      
      onChange({ target: { value: newText } });
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + openMarker.length,
          start + openMarker.length
        );
      }, 0);
    }
  };

  const parseFormattedText = (text) => {
    // Converte markdown em objeto estruturado para salvar no banco
    return {
      text: text,
      entities: extractEntities(text)
    };
  };

  const extractEntities = (text) => {
    const entities = [];
    
    // Detectar links de OS (ex: /os/123 ou ordem-servico/ABC-123)
    const osLinkRegex = /(?:\/os\/|ordem-servico\/)([A-Z0-9-]+)/gi;
    let match;
    while ((match = osLinkRegex.exec(text)) !== null) {
      entities.push({
        type: 'ordem_servico',
        offset: match.index,
        length: match[0].length,
        os_id: match[1]
      });
    }

    return entities;
  };

  return (
    <div className="flex-1 flex flex-col gap-2">
      {/* Barra de Formatação */}
      <div className="flex items-center gap-1 pb-2 border-b border-slate-200 dark:border-slate-700">
        <Button
          type="button"
          variant={formatting.bold ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('bold')}
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={formatting.italic ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('italic')}
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={formatting.underline ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('underline')}
          title="Sublinhado"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={formatting.strikethrough ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => applyFormatting('strikethrough')}
          title="Tachado"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
      </div>

      {/* Área de Texto */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
        rows={1}
      />
    </div>
  );
}