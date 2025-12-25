import React from 'react';

export default function MessageContent({ content, isMinha }) {
  // Parse formatação markdown
  const parseMarkdown = (text) => {
    if (!text) return null;

    let result = text;
    const elements = [];
    let key = 0;

    // Processar em ordem: negrito primeiro, depois itálico, etc
    // Substituir por componentes React temporários com marcadores únicos
    
    // 1. Processar negrito **texto**
    result = result.replace(/\*\*(.+?)\*\*/g, (match, content) => {
      return `<BOLD_${key++}>${content}</BOLD_${key - 1}>`;
    });

    // 2. Processar itálico *texto*
    result = result.replace(/\*(.+?)\*/g, (match, content) => {
      return `<ITALIC_${key++}>${content}</ITALIC_${key - 1}>`;
    });

    // 3. Processar sublinhado __texto__
    result = result.replace(/__(.+?)__/g, (match, content) => {
      return `<UNDERLINE_${key++}>${content}</UNDERLINE_${key - 1}>`;
    });

    // 4. Processar tachado ~~texto~~
    result = result.replace(/~~(.+?)~~/g, (match, content) => {
      return `<STRIKE_${key++}>${content}</STRIKE_${key - 1}>`;
    });

    // Agora converter os marcadores em elementos React
    const parts = [];
    let lastIndex = 0;
    const regex = /<(BOLD|ITALIC|UNDERLINE|STRIKE)_(\d+)>(.+?)<\/\1_\2>/g;
    let match;

    while ((match = regex.exec(result)) !== null) {
      // Adicionar texto antes do match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {result.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Adicionar elemento formatado
      const type = match[1];
      const content = match[3];
      
      if (type === 'BOLD') {
        parts.push(<strong key={`bold-${match[2]}`} className="font-bold">{content}</strong>);
      } else if (type === 'ITALIC') {
        parts.push(<em key={`italic-${match[2]}`} className="italic">{content}</em>);
      } else if (type === 'UNDERLINE') {
        parts.push(<u key={`underline-${match[2]}`} className="underline">{content}</u>);
      } else if (type === 'STRIKE') {
        parts.push(<s key={`strike-${match[2]}`} className="line-through">{content}</s>);
      }

      lastIndex = match.index + match[0].length;
    }

    // Adicionar texto restante
    if (lastIndex < result.length) {
      parts.push(
        <span key="text-end">{result.substring(lastIndex)}</span>
      );
    }

    return parts.length > 0 ? <>{parts}</> : <span>{text}</span>;
  };

  return (
    <div className="text-sm whitespace-pre-wrap break-words">
      {parseMarkdown(content)}
    </div>
  );
}