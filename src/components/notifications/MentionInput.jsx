import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

export default function MentionInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  pessoas,
  textareaRef,
  className,
  onMentionsChange
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const suggestionsRef = useRef(null);

  const filteredPessoas = pessoas.filter(p => 
    p.nome?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(mentionSearch.toLowerCase())
  ).slice(0, 5);

  useEffect(() => {
    if (showSuggestions) {
      setSelectedIndex(0);
    }
  }, [showSuggestions, mentionSearch]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(e);

    // Detectar @ e começar sugestões
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      
      // Se não tem espaço depois do @, mostrar sugestões
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt);
        setMentionStartPos(lastAtSymbol);
        setShowSuggestions(true);
        return;
      }
    }
    
    setShowSuggestions(false);
  };

  const extractMentionedPeopleIds = (text) => {
    const mentionedIds = [];
    pessoas.forEach(pessoa => {
      if (text.includes(`@${pessoa.nome}`)) {
        mentionedIds.push(pessoa.id);
      }
    });
    return mentionedIds;
  };

  const insertMention = (pessoa) => {
    if (mentionStartPos === null) return;

    const textBefore = value.slice(0, mentionStartPos);
    const textAfter = value.slice(textareaRef.current.selectionStart);
    const newText = `${textBefore}@${pessoa.nome} ${textAfter}`;
    
    onChange({ target: { value: newText } });
    setShowSuggestions(false);
    setMentionStartPos(null);
    
    // Atualizar lista de mencionados
    if (onMentionsChange) {
      const mentionedIds = extractMentionedPeopleIds(newText);
      onMentionsChange(mentionedIds);
    }
    
    // Focar de volta no textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartPos + pessoa.nome.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDownInternal = (e) => {
    if (showSuggestions && filteredPessoas.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredPessoas.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredPessoas.length) % filteredPessoas.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(filteredPessoas[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="relative flex-1 w-full">
      <Textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDownInternal}
        className={`w-full ${className}`}
        rows={1}
      />
      
      {showSuggestions && filteredPessoas.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto z-50"
        >
          <Command>
            <CommandList>
              <CommandGroup heading="Mencionar pessoa">
                {filteredPessoas.map((pessoa, idx) => (
                  <CommandItem
                    key={pessoa.id}
                    onSelect={() => insertMention(pessoa)}
                    className={`cursor-pointer ${idx === selectedIndex ? 'bg-slate-100 dark:bg-slate-700' : ''}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="w-8 h-8">
                        {pessoa.foto_perfil && (
                          <AvatarImage src={pessoa.foto_perfil} alt={pessoa.nome} />
                        )}
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {pessoa.nome?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{pessoa.nome}</p>
                        <p className="text-xs text-slate-500 truncate">{pessoa.email}</p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}