import React from 'react';
import { Heart, Trash2, Edit, Eye, ListChecks } from 'lucide-react';
import { Dish } from '../types';
import { motion } from 'motion/react';

interface DishCardProps {
  key?: React.Key;
  dish: Dish;
  onViewDetails: (dish: Dish) => void;
  onEdit: (dish: Dish) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (dish: Dish) => void;
  readOnly?: boolean;
}

export default function DishCard({ dish, onViewDetails, onEdit, onDelete, onToggleFavorite, readOnly }: DishCardProps) {
  // Simple check helper for fallback images
  const itemImage = dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

  // Format ingredient snippets to be comma-separated horizontally for secondary visual rhythm
  const getIngredientsSummary = (text: string) => {
    if (!text) return '';
    return text
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0)
      .join(' • ');
  };

  // Dynamic badge color classes matching the vibrant palette
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Món mặn':
        return 'bg-[#FFEAEA] text-[#FF7675] border-[#FFD2D2]';
      case 'Món nước':
        return 'bg-[#FFF2E6] text-[#E17055] border-[#FFE0C4]';
      case 'Món canh':
        return 'bg-[#E6F9F5] text-[#00CEC9] border-[#B2FCF8]';
      case 'Tráng miệng':
        return 'bg-[#FEF9E7] text-[#D59F0B] border-[#F9E79F]';
      default:
        return 'bg-[#F4ECF7] text-[#76448A] border-[#D7BDE2]';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="group glass-card glass-shimmer rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-between h-[240px] sm:h-[330px]"
      id={`dish-card-${dish.id}`}
    >
      {/* Visual Header / Cover Photo */}
      <div 
        onClick={() => onViewDetails(dish)}
        className="relative h-24 sm:h-44 w-full overflow-hidden bg-slate-100 shrink-0 cursor-pointer"
      >
        <img
          src={itemImage}
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {/* Category sticker floating over top-left */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
          <span className={`text-[9px] sm:text-[11px] font-black tracking-wide uppercase px-2 py-0.5 sm:px-3 sm:py-1 bg-white/95 backdrop-blur-md rounded-full border shadow-xs ${getCategoryStyles(dish.category)}`}>
            {dish.category}
          </span>
        </div>

        {/* Quick action triggers floating over top-right */}
        {!readOnly && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1 sm:gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(dish);
              }}
              type="button"
              className="p-1.5 sm:p-2.5 bg-white/95 backdrop-blur-md hover:bg-[#6366f1] text-slate-700 hover:text-white rounded-full shadow-sm transition-all cursor-pointer"
              title="Sửa công thức"
              id={`btn-edit-dish-${dish.id}`}
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(dish.id);
              }}
              type="button"
              className="p-1.5 sm:p-2.5 bg-white/95 backdrop-blur-md hover:bg-[#FF7675] text-slate-700 hover:text-white rounded-full shadow-sm transition-all cursor-pointer"
              title="Xóa món ăn"
              id={`btn-delete-dish-${dish.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Body Column */}
      <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between min-h-0">
        <div>
          {/* Dish name with line clamps to support multi-line title heights */}
          <h3 
            onClick={() => onViewDetails(dish)}
            className="font-extrabold text-glass-primary text-xs sm:text-base leading-tight tracking-tight mb-1 group-hover:text-[#FF7675] hover:underline transition-colors line-clamp-1 cursor-pointer"
          >
            {dish.name}
          </h3>
          {/* Dish summary (if present) */}
          {dish.summary ? (
            <p className="text-[10px] sm:text-xs font-semibold text-glass-secondary italic leading-relaxed break-words line-clamp-2">
              {dish.summary}
            </p>
          ) : (
            <p className="text-[10px] sm:text-xs italic text-slate-400 leading-relaxed font-medium">
              Chưa cập nhật tóm tắt.
            </p>
          )}
        </div>

        {/* Footer click actions */}
        <div className="border-t border-slate-100 pt-2 sm:pt-3 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!readOnly) {
                  onToggleFavorite(dish);
                }
              }}
              type="button"
              className={`flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl transition-all duration-200 ${readOnly ? 'cursor-default pointer-events-none' : 'hover:bg-slate-50 cursor-pointer'}`}
              title={dish.isFavorite ? "Bỏ yêu thích" : "Yêu thích món ăn"}
              id={`btn-fav-toggle-dish-${dish.id}`}
            >
              <Heart 
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 active:scale-125 ${
                  dish.isFavorite 
                    ? 'fill-[#FF7675] text-[#FF7675]' 
                    : 'text-slate-300 hover:text-[#FF7675]'
                }`} 
              />
            </button>
            <span className="text-[8px] sm:text-[10px] text-slate-400 font-mono whitespace-nowrap">
              {dish.createdAt ? new Date(dish.createdAt).toLocaleDateString('vi-VN') : new Date(dish.updatedAt).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <button
            onClick={() => onViewDetails(dish)}
            type="button"
            className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-[#FFEAEA] text-[#FF7675] text-[10px] sm:text-xs font-black hover:bg-[#FF7675] hover:text-white transition-all duration-200 cursor-pointer shadow-xs"
            id={`btn-view-dish-${dish.id}`}
          >
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Xem</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
export type { DishCardProps };
