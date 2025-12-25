import React from 'react';

export default function MessageContent({ content, isMinha }) {
  // Renderizar texto com links clicáveis
  const renderTextWithLinks = (text) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      // Adicionar texto antes do link
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Adicionar link
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline hover:opacity-80 ${isMinha ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}
        >
          {match[0]}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Adicionar texto restante
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end">{text.substring(lastIndex)}</span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

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
      // Adicionar texto antes do match (com links)
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {renderTextWithLinks(result.substring(lastIndex, match.index))}
          </span>
        );
      }

      // Adicionar elemento formatado
      const type = match[1];
      const content = match[3];
      
      if (type === 'BOLD') {
        parts.push(<strong key={`bold-${match[2]}`} className="font-bold">{renderTextWithLinks(content)}</strong>);
      } else if (type === 'ITALIC') {
        parts.push(<em key={`italic-${match[2]}`} className="italic">{renderTextWithLinks(content)}</em>);
      } else if (type === 'UNDERLINE') {
        parts.push(<u key={`underline-${match[2]}`} className="underline">{renderTextWithLinks(content)}</u>);
      } else if (type === 'STRIKE') {
        parts.push(<s key={`strike-${match[2]}`} className="line-through">{renderTextWithLinks(content)}</s>);
      }

      lastIndex = match.index + match[0].length;
    }

    // Adicionar texto restante (com links)
    if (lastIndex < result.length) {
      parts.push(
        <span key="text-end">{renderTextWithLinks(result.substring(lastIndex))}</span>
      );
    }

    return parts.length > 0 ? <>{parts}</> : <span>{renderTextWithLinks(text)}</span>;
  };

  return (
    <div className="text-sm whitespace-pre-wrap break-words">
      {parseMarkdown(content)}
    </div>
  );
}