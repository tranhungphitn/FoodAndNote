import React from 'react';
import { Pin, Trash2, Edit3, Calendar } from 'lucide-react';
import { Note } from '../types';
import { motion } from 'motion/react';

interface NoteCardProps {
  key?: React.Key;
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  readOnly?: boolean;
  onViewDetails?: (note: Note) => void;
}

export default function NoteCard({ note, onEdit, onDelete, onTogglePin, readOnly, onViewDetails }: NoteCardProps) {
  // Format dates cleanly for simple localized display
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onViewDetails?.(note)}
      className={`glass-note relative flex flex-col justify-between rounded-[24px] sm:rounded-3xl p-4 sm:p-6 border border-slate-200 ${
        onViewDetails ? 'cursor-pointer' : ''
      }`}
      style={{ backgroundColor: note.color || '#ffffff' }}
      id={`note-card-${note.id}`}
    >
      <div>
        {/* Top Header Row with Pinned Indicator */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-glass-primary text-base leading-tight break-words">
            {note.title || 'Ghi chú không tiêu đề'}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) {
                onTogglePin(note.id);
              }
            }}
            type="button"
            className={`p-2 rounded-full transition-colors duration-150 ${
              note.isPinned ? 'text-[#FF7675] scale-110' : 'text-slate-400 hover:text-slate-600'
            } ${readOnly ? 'cursor-default pointer-events-none' : 'hover:bg-black/5'}`}
            title={note.isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
            id={`btn-pin-${note.id}`}
          >
            <Pin className="w-4.5 h-4.5 fill-current" />
          </button>
        </div>

        {/* Note Body Text */}
        <div className="text-glass-secondary text-sm whitespace-pre-wrap break-words leading-relaxed mb-6 line-clamp-6">
          {note.content || <em className="text-slate-400">Không có nội dung</em>}
        </div>
      </div>

      {/* Footer Controls Row */}
      <div className="flex items-center justify-between border-t border-black/5 pt-3">
        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {formatDate(note.updatedAt)}
        </span>

        {/* Edit and Delete Buttons */}
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
              type="button"
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-150"
              title="Chỉnh sửa"
              id={`btn-edit-${note.id}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              type="button"
              className="p-2 text-slate-500 hover:text-[#FF7675] hover:bg-[#FF7675]/10 rounded-xl transition-all duration-150"
              title="Xóa"
              id={`btn-delete-${note.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
export type { NoteCardProps };
