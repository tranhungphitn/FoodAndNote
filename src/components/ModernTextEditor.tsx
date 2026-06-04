import React, { useState, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Type, Eye, Edit } from 'lucide-react';

interface ModernTextEditorProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  heightClass?: string;
  error?: boolean;
}

export default function ModernTextEditor({
  id,
  value,
  onChange,
  placeholder = '',
  className = '',
  heightClass = 'h-48',
  error = false,
}: ModernTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const capitalizeFirstLetterOfLines = (str: string) => {
    if (!str) return '';
    return str
      .split('\n')
      .map(line => {
        const match = line.match(/\p{L}/u);
        if (match && match.index !== undefined) {
          const idx = match.index;
          return line.slice(0, idx) + line.charAt(idx).toUpperCase() + line.slice(idx + 1);
        }
        return line;
      })
      .join('\n');
  };

  const handleFormatting = (type: 'bold' | 'italic' | 'bullet' | 'number' | 'capitalize') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);

    if (type === 'bold') {
      const prefix = '**';
      const suffix = '**';
      const placeholderText = selected || 'in đậm';
      const replacement = prefix + placeholderText + suffix;
      const newVal = text.substring(0, start) + replacement + text.substring(end);
      onChange(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, start + prefix.length + placeholderText.length);
      }, 10);
    } else if (type === 'italic') {
      const prefix = '*';
      const suffix = '*';
      const placeholderText = selected || 'in nghiêng';
      const replacement = prefix + placeholderText + suffix;
      const newVal = text.substring(0, start) + replacement + text.substring(end);
      onChange(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, start + prefix.length + placeholderText.length);
      }, 10);
    } else if (type === 'bullet') {
      if (selected.includes('\n')) {
        const formatted = selected
          .split('\n')
          .map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('-')) return line;
            return `- ${line}`;
          })
          .join('\n');
        const newVal = text.substring(0, start) + formatted + text.substring(end);
        onChange(newVal);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start, start + formatted.length);
        }, 10);
      } else {
        const prefix = '- ';
        const placeholderText = selected || 'nguyên liệu';
        const replacement = prefix + placeholderText;
        const newVal = text.substring(0, start) + replacement + text.substring(end);
        onChange(newVal);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start + prefix.length, start + prefix.length + placeholderText.length);
        }, 10);
      }
    } else if (type === 'number') {
      if (selected.includes('\n')) {
        let step = 1;
        const formatted = selected
          .split('\n')
          .map(line => {
            const trimmed = line.trim();
            if (trimmed.match(/^\d+\./)) return line;
            return `${step++}. ${line}`;
          })
          .join('\n');
        const newVal = text.substring(0, start) + formatted + text.substring(end);
        onChange(newVal);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start, start + formatted.length);
        }, 10);
      } else {
        const prefix = '1. ';
        const placeholderText = selected || 'bước thực hiện';
        const replacement = prefix + placeholderText;
        const newVal = text.substring(0, start) + replacement + text.substring(end);
        onChange(newVal);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start + prefix.length, start + prefix.length + placeholderText.length);
        }, 10);
      }
    } else if (type === 'capitalize') {
      const newVal = capitalizeFirstLetterOfLines(text);
      onChange(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start, end);
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleFormatting('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        handleFormatting('italic');
      }
    }
  };

  const renderPreview = (text: string) => {
    if (!text) {
      return (
        <div className="flex items-center justify-center h-full min-h-[120px] text-slate-400 italic text-xs">
          Chưa soạn nội dung...
        </div>
      );
    }

    const lines = text.split('\n');
    return (
      <div className="space-y-2.5 text-slate-700 text-sm leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded-b-2xl h-full overflow-y-auto max-h-[400px]">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          const formatLine = (t: string) => {
            let safe = t
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
            return safe;
          };

          if (trimmed.startsWith('-')) {
            const content = trimmed.substring(1).trim();
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#FF7675] font-extrabold select-none">•</span>
                <span className="font-medium text-slate-700" dangerouslySetInnerHTML={{ __html: formatLine(content) }} />
              </div>
            );
          }

          const stepMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
          if (stepMatch) {
            const stepNum = stepMatch[1];
            const content = stepMatch[2];
            return (
              <div key={idx} className="flex items-start gap-3 pl-1">
                <span className="flex items-center justify-center w-5 h-5 bg-[#FFEAEA] text-[#FF7675] font-extrabold text-[11px] rounded-full shrink-0 mt-0.5 select-none">
                  {stepNum}
                </span>
                <span className="font-medium text-slate-700" dangerouslySetInnerHTML={{ __html: formatLine(content) }} />
              </div>
            );
          }

          return (
            <p
              key={idx}
              className={`font-medium text-slate-700 ${trimmed === '' ? 'h-3' : ''}`}
              dangerouslySetInnerHTML={{ __html: formatLine(line) }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col border rounded-2xl overflow-hidden bg-slate-50/50 shadow-xs focus-within:ring-4 focus-within:ring-[#FF7675]/10 focus-within:border-[#FF7675] transition-all ${className} ${
      error ? 'border-red-400' : 'border-slate-200'
    }`}>
      {/* Editor Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-100/80 border-b border-slate-200 shrink-0">
        {/* Tabs Group */}
        <div className="flex items-center gap-1 bg-slate-200/50 p-0.5 rounded-lg border border-slate-200/20">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'write'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit className="w-3 h-3" />
            <span>Soạn thảo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-md text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Xem trước</span>
          </button>
        </div>

        {/* Formatting Buttons (Only show when editing) */}
        {activeTab === 'write' && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatting('bold');
              }}
              className="p-1.5 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer flex items-center justify-center"
              title="Chữ đậm (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatting('italic');
              }}
              className="p-1.5 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer flex items-center justify-center"
              title="Chữ nghiêng (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-slate-300 mx-1" />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatting('bullet');
              }}
              className="p-1.5 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer flex items-center justify-center"
              title="Danh sách dấu tròn (-)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatting('number');
              }}
              className="p-1.5 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer flex items-center justify-center"
              title="Danh sách số (1.)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-slate-300 mx-1" />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormatting('capitalize');
              }}
              className="p-1.5 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer flex items-center justify-center"
              title="Tự động viết hoa đầu dòng"
            >
              <Type className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 min-h-0 bg-white">
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full text-sm text-slate-700 bg-transparent p-4 outline-hidden border-0 focus:ring-0 resize-y transition-all ${heightClass} ${
              error ? 'bg-red-50/5' : ''
            }`}
          />
        ) : (
          <div className={`w-full overflow-y-auto ${heightClass}`}>
            {renderPreview(value)}
          </div>
        )}
      </div>
    </div>
  );
}
