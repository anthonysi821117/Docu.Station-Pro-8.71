
import React, { useCallback } from 'react';
import { CustomTheme } from '../../types';

export const titleCasePlaceholder = (str: string) => {
  if (!str) return '';
  return str.split(' ').map(word => {
    if (word.length === 0) return '';
    const upperWord = word.toUpperCase();
    if (['USCC', 'HS', 'EN', 'CN', 'USA', 'PCS', 'CTNS', 'PKGS', 'PLTS', 'USD', 'EUR', 'KGS', 'CBM', 'FOB', 'CIF', 'T/T', 'L/C', 'SETS'].includes(upperWord) || /^\d+\-\S+$/.test(word)) {
      return upperWord;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

export const LineInput = React.memo(({ themeMode, customTheme, className, uppercase, onChange, onBlur, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { themeMode: string, customTheme?: CustomTheme, uppercase?: boolean }) => {
  const isNight = themeMode === 'night';
  const isVibrant = themeMode === 'vibrant';
  const isCustom = themeMode === 'custom';

  const inputThemeClass = isCustom
          ? `border-[var(--theme-border)] text-[var(--theme-text)] focus:border-[var(--theme-accent)] bg-transparent placeholder-[var(--theme-text-secondary)] opacity-90`
          : isNight 
          ? 'border-slate-600 focus:bg-slate-700 focus:border-blue-500 text-slate-200 placeholder-slate-500 disabled:text-slate-600 disabled:border-slate-800'
          : isVibrant
            ? 'border-[#00A8E9] focus:bg-[#91D5F1]/30 focus:border-[#0068BA] text-black placeholder-gray-400 disabled:bg-[#CFDFEF] disabled:text-gray-500'
            : 'border-gray-300 focus:bg-blue-50 focus:border-blue-600 disabled:bg-gray-50 disabled:text-gray-400';

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
     if (uppercase) {
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        e.target.value = e.target.value.toUpperCase();
        if (start !== null && end !== null) {
            e.target.setSelectionRange(start, end);
        }
     }
     if (onChange) {
        onChange(e);
     }
  }, [uppercase, onChange]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (props.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
      }
      if (props.onKeyDown) props.onKeyDown(e);
  }, [props.type, props.onKeyDown]);

  return (
    <input 
      {...props} 
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onBlur={onBlur}
      onWheel={(e) => e.currentTarget.blur()}
      className={`w-full border-b outline-none bg-transparent px-2 py-1.5 text-sm transition-colors h-[32px] placeholder:italic placeholder:text-[11px] placeholder:font-normal ${inputThemeClass} ${uppercase ? 'uppercase' : ''} ${className || ''}`} 
    />
  );
});

export const SelectInput = React.memo(({ themeMode, customTheme, className, onChange, placeholderOptionText, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { themeMode: string, customTheme?: CustomTheme, placeholderOptionText?: string }) => {
  const isNight = themeMode === 'night';
  const isVibrant = themeMode === 'vibrant';
  const isCustom = themeMode === 'custom';
  const isPlaceholderActive = props.value === "";

  const selectThemeClass = isCustom
          ? `border-[var(--theme-border)] bg-[var(--theme-input-bg)] text-[var(--theme-text)]`
          : isNight
          ? `border-slate-600 bg-slate-700 ${isPlaceholderActive ? 'text-slate-400' : 'text-slate-200'}`
          : isVibrant
            ? `border-gray-300 bg-white ${isPlaceholderActive ? 'text-gray-400' : 'text-black'}`
            : `border-gray-300 bg-white ${isPlaceholderActive ? 'text-gray-400' : 'text-black'}`; 

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e);
    }
  }, [onChange]);

  return (
    <select
      {...props}
      onChange={handleChange}
      className={`w-full border-b outline-none px-2 py-1.5 text-sm transition-colors h-[32px] ${selectThemeClass} ${className || ''}`}
    >
      {placeholderOptionText && <option value="" disabled hidden>{placeholderOptionText}</option>}
      {props.children}
    </select>
  );
});

export const ModalInput = React.memo(({ isNight, themeMode, customTheme, className, onChange, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { isNight?: boolean, themeMode: string, customTheme?: CustomTheme }) => {
  const isVibrant = themeMode === 'vibrant';
  const isCustom = themeMode === 'custom';
  
  const inputThemeClass = isCustom
          ? `border-[var(--theme-border)] bg-[var(--theme-input-bg)] text-[var(--theme-text)] placeholder-[var(--theme-text-secondary)] focus:border-[var(--theme-accent)]`
          : isNight 
          ? 'border-slate-600 focus:bg-slate-700 focus:border-blue-500 text-slate-200 placeholder-slate-400'
          : isVibrant
            ? 'border-[#00A8E9] focus:bg-[#91D5F1]/30 focus:focus:border-[#0068BA] text-black placeholder-gray-400'
            : 'border-gray-300 focus:bg-blue-50 focus:border-blue-600';
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    }
  }, [onChange]);
  return (
    <input 
      {...props} 
      onChange={handleChange}
      className={`w-full border-b outline-none bg-transparent px-2 py-1.5 text-sm transition-colors h-[32px] placeholder:italic placeholder:text-[11px] placeholder:font-normal ${inputThemeClass} ${className || ''}`} 
    />
  );
});

export const ModalTextarea = React.memo(({ isNight, themeMode, customTheme, className, onChange, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { isNight?: boolean, themeMode: string, customTheme?: CustomTheme }) => {
  const isVibrant = themeMode === 'vibrant';
  const isCustom = themeMode === 'custom';

  const inputThemeClass = isCustom
          ? `border-[var(--theme-border)] bg-[var(--theme-input-bg)] text-[var(--theme-text)] placeholder-[var(--theme-text-secondary)] focus:border-[var(--theme-accent)]`
          : isNight 
          ? 'border-slate-600 focus:bg-slate-700 focus:border-blue-500 text-slate-200 placeholder-slate-500'
          : isVibrant
            ? 'border-[#00A8E9] focus:bg-[#91D5F1]/30 focus:focus:border-[#0068BA] text-black placeholder-gray-400'
            : 'border-gray-300 focus:bg-blue-50 focus:border-blue-600';
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e);
    }
  }, [onChange]);
  return (
    <textarea 
      {...props} 
      onChange={handleChange}
      className={`w-full border outline-none bg-transparent px-2 py-1.5 text-sm transition-colors rounded placeholder:italic placeholder:text-[11px] placeholder:font-normal ${inputThemeClass} ${className || ''}`} 
    />
  );
});
