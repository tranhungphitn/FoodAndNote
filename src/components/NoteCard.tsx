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
}

export default function NoteCard({ note, onEdit, onDelete, onTogglePin }: NoteCardProps) {
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
      className="relative flex flex-col justify-between rounded-3xl p-6 shadow-xs border border-black/5 hover:shadow-md transition-shadow duration-300"
      style={{ backgroundColor: note.color || '#F4F6F7' }}
      id={`note-card-${note.id}`}
    >
      <div>
        {/* Top Header Row with Pinned Indicator */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-gray-800 text-base leading-tight break-words">
            {note.title || 'Ghi chú không tiêu đề'}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            type="button"
            className={`p-2 rounded-full hover:bg-black/5 transition-colors duration-150 ${
              note.isPinned ? 'text-[#FF7675] scale-110' : 'text-gray-400 hover:text-gray-600'
            }`}
            title={note.isPinned ? 'Bỏ ghim' : 'Ghim ghi chú'}
            id={`btn-pin-${note.id}`}
          >
            <Pin className="w-4.5 h-4.5 fill-current" />
          </button>
        </div>

        {/* Note Body Text */}
        <div className="text-gray-700 text-sm whitespace-pre-wrap break-words leading-relaxed mb-6 line-clamp-6">
          {note.content || <em className="text-gray-400">Không có nội dung</em>}
        </div>
      </div>

      {/* Footer Controls Row */}
      <div className="flex items-center justify-between border-t border-black/5 pt-3">
        <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500 font-mono">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(note.updatedAt)}
        </span>

        {/* Edit and Delete Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(note)}
            type="button"
            className="p-2 text-slate-500 hover:text-[#4834D4] hover:bg-[#4834D4]/5 rounded-xl transition-all duration-150"
            title="Chỉnh sửa"
            id={`btn-edit-${note.id}`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              onDelete(note.id);
            }}
            type="button"
            className="p-2 text-slate-500 hover:text-[#FF7675] hover:bg-[#FF7675]/5 rounded-xl transition-all duration-150"
            title="Xóa"
            id={`btn-delete-${note.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
export type { NoteCardProps };
