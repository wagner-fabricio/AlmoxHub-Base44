import React from 'react';

export default function MessageContent({ content, isMinha }) {
  // Parse formatação markdown
  const parseMarkdown = (text) => {
    if (!text) return null;

    const parts = [];
    let currentIndex = 0;
    let partKey = 0;

    // Regex para detectar formatações
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, tag: 'strong', style: 'font-bold' },
      { regex: /\*(.+?)\*/g, tag: 'em', style: 'italic' },
      { regex: /__(.+?)__/g, tag: 'u', style: 'underline' },
      { regex: /~~(.+?)~~/g, tag: 's', style: 'line-through' },
    ];

    // Criar uma cópia para trabalhar
    let processedText = text;
    const matches = [];

    // Encontrar todas as correspondências
    patterns.forEach((pattern) => {
      let match;
      const tempRegex = new RegExp(pattern.regex.source, pattern.regex.flags);
      while ((match = tempRegex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          fullMatch: match[0],
          innerText: match[1],
          tag: pattern.tag,
          style: pattern.style
        });
      }
    });

    // Ordenar por posição
    matches.sort((a, b) => a.start - b.start);

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    // Construir elementos
    const elements = [];
    let lastEnd = 0;

    matches.forEach((match, idx) => {
      // Adicionar texto antes do match
      if (match.start > lastEnd) {
        elements.push(
          <span key={`text-${idx}`}>
            {text.substring(lastEnd, match.start)}
          </span>
        );
      }

      // Adicionar texto formatado
      const Tag = match.tag;
      elements.push(
        <Tag key={`formatted-${idx}`} className={match.style}>
          {match.innerText}
        </Tag>
      );

      lastEnd = match.end;
    });

    // Adicionar texto restante
    if (lastEnd < text.length) {
      elements.push(
        <span key="text-end">{text.substring(lastEnd)}</span>
      );
    }

    return <>{elements}</>;
  };

  return (
    <div className="text-sm whitespace-pre-wrap break-words">
      {parseMarkdown(content)}
    </div>
  );
}