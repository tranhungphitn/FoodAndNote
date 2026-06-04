import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Type } from 'lucide-react';

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
  const editorRef = useRef<HTMLDivElement>(null);
  const lastPropsValueRef = useRef(value);

  // Visual state indicators
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Check if Bold / Italic is active at the cursor position
  const checkCommandStates = () => {
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
    } catch (err) {
      // Ignore errors when document isn't fully ready
    }
  };

  // Convert Markdown stored in database to HTML for visual editing
  const markdownToHtml = (md: string): string => {
    if (!md) return '';
    
    // Split by newlines and format each block
    const lines = md.split('\n');
    let html = '';
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    
    const formatInline = (text: string) => {
      let safe = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      // Bold: **text** -> <strong>text</strong>
      safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic: *text* -> <em>text</em>
      safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
      return safe;
    };
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('- ')) {
        // Bullet list
        if (!inList || listType !== 'ul') {
          if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
          html += '<ul>';
          inList = true;
          listType = 'ul';
        }
        html += `<li>${formatInline(trimmed.substring(2))}</li>`;
      } else {
        // Check for numbered list (e.g., "1. step")
        const stepMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (stepMatch) {
          if (!inList || listType !== 'ol') {
            if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
            html += '<ol>';
            inList = true;
            listType = 'ol';
          }
          html += `<li>${formatInline(stepMatch[2])}</li>`;
        } else {
          // Standard text line
          if (inList) {
            html += listType === 'ul' ? '</ul>' : '</ol>';
            inList = false;
            listType = null;
          }
          if (trimmed === '') {
            html += '<br>';
          } else {
            html += `<div>${formatInline(line)}</div>`;
          }
        }
      }
    });
    
    if (inList) {
      html += listType === 'ul' ? '</ul>' : '</ol>';
    }
    
    return html;
  };

  // Convert visual HTML nodes back to Markdown format for database storage
  const domToMarkdown = (htmlContent: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    
    let markdown = '';
    
    const traverse = (node: Node) => {
      if (node.nodeType === 3) { // TEXT_NODE
        markdown += node.textContent || '';
        return;
      }
      
      if (node.nodeType === 1) { // ELEMENT_NODE
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        
        if (tag === 'strong' || tag === 'b') {
          markdown += '**';
          el.childNodes.forEach(traverse);
          markdown += '**';
        } else if (tag === 'em' || tag === 'i') {
          markdown += '*';
          el.childNodes.forEach(traverse);
          markdown += '*';
        } else if (tag === 'ul') {
          el.childNodes.forEach(child => {
            if (child.nodeType === 1 && child.nodeName.toLowerCase() === 'li') {
              markdown += '- ';
              child.childNodes.forEach(traverse);
              markdown += '\n';
            } else {
              traverse(child);
            }
          });
        } else if (tag === 'ol') {
          let index = 1;
          el.childNodes.forEach(child => {
            if (child.nodeType === 1 && child.nodeName.toLowerCase() === 'li') {
              markdown += `${index++}. `;
              child.childNodes.forEach(traverse);
              markdown += '\n';
            } else {
              traverse(child);
            }
          });
        } else if (tag === 'li') {
          markdown += '- ';
          el.childNodes.forEach(traverse);
          markdown += '\n';
        } else if (tag === 'br') {
          markdown += '\n';
        } else if (tag === 'p' || tag === 'div') {
          if (markdown && !markdown.endsWith('\n')) {
            markdown += '\n';
          }
          el.childNodes.forEach(traverse);
          if (!markdown.endsWith('\n')) {
            markdown += '\n';
          }
        } else {
          el.childNodes.forEach(traverse);
        }
      }
    };
    
    temp.childNodes.forEach(traverse);
    
    // Clean up excessive spacing while preserving newlines
    return markdown
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();
  };

  // Setup initial HTML value once on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(value);
    }
  }, []);

  // Update editor innerHTML when external state overrides value (e.g. Form cancel/reset)
  useEffect(() => {
    if (editorRef.current && !isFocused && value !== lastPropsValueRef.current) {
      editorRef.current.innerHTML = markdownToHtml(value);
      lastPropsValueRef.current = value;
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const markdown = domToMarkdown(html);
      lastPropsValueRef.current = markdown;
      onChange(markdown);
      checkCommandStates();
    }
  };

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

  const triggerCommand = (command: string) => {
    document.execCommand(command, false);
    handleInput();
  };

  const handleCapitalize = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const md = domToMarkdown(html);
      const capitalized = capitalizeFirstLetterOfLines(md);
      editorRef.current.innerHTML = markdownToHtml(capitalized);
      handleInput();
    }
  };

  return (
    <div className={`flex flex-col border rounded-2xl overflow-hidden bg-white shadow-xs focus-within:ring-4 focus-within:ring-[#FF7675]/10 focus-within:border-[#FF7675] transition-all ${className} ${
      error ? 'border-red-400' : 'border-slate-200'
    }`}>
      {/* Editor CSS Rule Injector to style lists bypass Tailwind resets */}
      <style dangerouslySetInnerHTML={{ __html: `
        .wysiwyg-editor ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .wysiwyg-editor ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .wysiwyg-editor li {
          margin-bottom: 0.25rem !important;
        }
        .wysiwyg-editor[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          cursor: text;
        }
      `}} />

      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-100/80 border-b border-slate-200 shrink-0">
        <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider select-none px-1">
          Định dạng nhanh
        </span>
        <div className="flex items-center gap-1">
          {/* Bold Button */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              triggerCommand('bold');
            }}
            className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center ${
              isBold 
                ? 'bg-[#FF7675] text-white shadow-xs' 
                : 'hover:bg-slate-200/85 text-slate-600 hover:text-slate-900'
            }`}
            title="Chữ đậm (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic Button */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              triggerCommand('italic');
            }}
            className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center ${
              isItalic 
                ? 'bg-[#FF7675] text-white shadow-xs' 
                : 'hover:bg-slate-200/85 text-slate-600 hover:text-slate-900'
            }`}
            title="Chữ nghiêng (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 mx-1" />

          {/* Bullet List Button */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              triggerCommand('insertUnorderedList');
            }}
            className="p-1.5 hover:bg-slate-200/85 text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer flex items-center justify-center"
            title="Danh sách dấu tròn"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* Number List Button */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              triggerCommand('insertOrderedList');
            }}
            className="p-1.5 hover:bg-slate-200/85 text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer flex items-center justify-center"
            title="Danh sách số"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 mx-1" />

          {/* Capitalize Button */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleCapitalize();
            }}
            className="p-1.5 hover:bg-slate-200/85 text-slate-600 hover:text-slate-900 rounded-md transition-all cursor-pointer flex items-center justify-center"
            title="Tự động viết hoa đầu dòng"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Editor Work Area (contentEditable) */}
      <div className="relative flex-1 min-h-0 bg-white">
        <div
          ref={editorRef}
          id={id}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            handleInput(); // final sync on blur to make sure data is flushed
          }}
          onKeyUp={checkCommandStates}
          onMouseUp={checkCommandStates}
          data-placeholder={placeholder}
          className={`wysiwyg-editor w-full text-sm text-slate-700 bg-transparent p-4 outline-hidden overflow-y-auto transition-all ${heightClass} ${
            error ? 'bg-red-50/5' : ''
          }`}
          style={{ minHeight: '140px' }}
        />
      </div>
    </div>
  );
}
