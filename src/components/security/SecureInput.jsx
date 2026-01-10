import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { sanitizeText } from '@/components/utils/sanitize';

/**
 * Input seguro que sanitiza entrada automaticamente
 */
export default function SecureInput({ 
  value, 
  onChange, 
  maxLength = 500,
  allowedChars = null,
  ...props 
}) {
  const handleChange = useCallback((e) => {
    let newValue = e.target.value;
    
    // Limitar tamanho
    if (maxLength) {
      newValue = newValue.substring(0, maxLength);
    }
    
    // Filtrar caracteres permitidos
    if (allowedChars) {
      const regex = new RegExp(`[^${allowedChars}]`, 'g');
      newValue = newValue.replace(regex, '');
    }
    
    // Sanitizar
    newValue = sanitizeText(newValue);
    
    onChange({ ...e, target: { ...e.target, value: newValue } });
  }, [onChange, maxLength, allowedChars]);
  
  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      maxLength={maxLength}
    />
  );
}