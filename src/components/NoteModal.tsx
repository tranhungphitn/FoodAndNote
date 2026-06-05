import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Note } from '../types';
import { PRESET_NOTE_COLORS } from '../sampleData';
import { motion, AnimatePresence } from 'motion/react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, color: string) => void;
  initialNote: Note | null;
  mode?: 'view' | 'edit' | 'create';
  onSwitchToEdit?: (note: Note) => void;
  readOnly?: boolean;
}

export default function NoteModal({
  isOpen,
  onClose,
  onSave,
  initialNote,
  mode = 'edit',
  onSwitchToEdit,
  readOnly = false
}: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#FEF9E7'); // Default light yellow
  const [error, setError] = useState('');

  // Reset/populate fields when modal opens or initialNote changes
  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setColor(initialNote.color);
    } else {
      setTitle('');
      setContent('');
      setColor('#FEF9E7');
    }
    setError('');
  }, [initialNote, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      setError('Vui lòng nhập tiêu đề hoặc nội dung ghi chú');
      return;
    }
    onSave(title.trim(), content.trim(), color);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal content area */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{ backgroundColor: color }}
          className="relative w-full sm:max-w-xl h-[85vh] sm:h-auto max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-black/5"
          id="note-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-white/40 backdrop-blur-md">
            <h2 className="text-lg font-bold text-gray-800">
              {mode === 'view' ? 'Chi Tiết Ghi Chú' : initialNote ? 'Chỉnh sửa Ghi Chú' : 'Thêm Ghi Chú Mới'}
            </h2>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-black/5 transition-colors duration-150"
              id="btn-close-note-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {mode === 'view' && initialNote ? (
            <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5">
              {/* Note Details View */}
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
                {/* Title */}
                <h3 className="text-xl font-extrabold text-gray-900 break-words mb-3">
                  {initialNote.title || 'Ghi chú không tiêu đề'}
                </h3>
                
                {/* Time updated info */}
                <div className="text-[11px] font-bold text-gray-500 font-mono mb-4 border-b border-black/5 pb-2 flex items-center gap-1.5">
                  <span>Cập nhật lúc: {new Date(initialNote.updatedAt).toLocaleString('vi-VN')}</span>
                </div>

                {/* Content */}
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words flex-1">
                  {initialNote.content || <em className="text-slate-400">Không có nội dung</em>}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="border-t border-black/5 pt-4 mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 text-sm font-semibold rounded-2xl border border-black/10 text-gray-700 hover:bg-black/5 transition-colors cursor-pointer text-center bg-white/40"
                >
                  Đóng
                </button>
                {!readOnly && onSwitchToEdit && (
                  <button
                    type="button"
                    onClick={() => onSwitchToEdit(initialNote)}
                    className="flex-1 py-3 text-sm font-bold rounded-2xl bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-xs active:scale-98 transition-all cursor-pointer text-center"
                    id="btn-edit-note-from-view"
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
              {error && (
                <div className="text-sm font-medium text-red-600 bg-red-100/80 px-3 py-2 rounded-xl">
                  {error}
                </div>
              )}

              {/* Input Title */}
              <div className="flex flex-col gap-1">
                <label htmlFor="note-title-input" className="text-xs font-semibold text-gray-700 tracking-wider uppercase">
                  Tiêu đề
                </label>
                <input
                  id="note-title-input"
                  type="text"
                  placeholder="Ví dụ: Đi siêu thị lót lòng..."
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full text-base font-semibold text-gray-800 placeholder-gray-500 bg-white/70 backdrop-blur-xs border border-black/10 focus:border-[#4834D4] rounded-2xl px-4 py-3 outline-hidden focus:ring-2 focus:ring-[#4834D4]/10"
                  autoFocus
                />
              </div>

              {/* Input Content */}
              <div className="flex-1 flex flex-col gap-1 min-h-0">
                <label htmlFor="note-content-input" className="text-xs font-semibold text-gray-700 tracking-wider uppercase">
                  Nội dung ghi chú
                </label>
                <textarea
                  id="note-content-input"
                  placeholder="Viết nội dung hay danh mục cần lưu giữ..."
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full flex-1 min-h-[120px] text-sm text-gray-700 placeholder-gray-500 bg-white/70 backdrop-blur-xs border border-black/10 focus:border-[#4834D4] rounded-2xl p-4 outline-hidden focus:ring-2 focus:ring-[#4834D4]/10 resize-none overflow-y-auto"
                />
              </div>

              {/* Color selection row */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-700 tracking-wider uppercase">
                  Màu sắc nền
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
                  {PRESET_NOTE_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColor(preset.value)}
                      className="w-8 h-8 rounded-full border border-black/10 hover:scale-110 active:scale-95 transition-transform shrink-0 flex items-center justify-center relative cursor-pointer"
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                      id={`btn-color-${preset.value.replace('#','')}`}
                    >
                      {color === preset.value && (
                        <Check className="w-4 h-4 text-gray-800 font-bold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Bar */}
              <div className="border-t border-black/5 pt-4 mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 text-sm font-semibold rounded-2xl border border-black/10 text-gray-700 hover:bg-black/5 transition-colors cursor-pointer text-center"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold rounded-2xl bg-[#FF7675] text-white hover:bg-[#E17055] shadow-xs active:scale-98 transition-all cursor-pointer text-center"
                  id="btn-save-note"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export type { NoteModalProps };
