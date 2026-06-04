import React, { useState, useEffect } from 'react';
import { X, Check, Camera, ListChecks, HelpCircle, Utensils, Award, BookOpen, Edit } from 'lucide-react';
import { Dish } from '../types';
import { PRESET_RECIPE_IMAGES, DISH_CATEGORIES } from '../sampleData';
import { motion, AnimatePresence } from 'motion/react';

export interface RecipePresetImage {
  url: string;
  label: string;
}

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: Dish | null;
  mode: 'view' | 'edit' | 'create';
  onSave: (dishData: {
    name: string;
    category: string;
    ingredients: string;
    instructions: string;
    imageUrl: string;
    isFavorite: boolean;
  }) => void;
  onSwitchToEdit?: (dish: Dish) => void;
}

export default function DishModal({ isOpen, onClose, dish, mode, onSave, onSwitchToEdit }: DishModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(DISH_CATEGORIES[1] || 'Món mặn');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Local ingredients checkbox list state for kitchen help view
  const [checkedIngredients, setCheckedIngredients] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        setName('');
        setCategory(DISH_CATEGORIES[1] || 'Món mặn');
        setIngredients('');
        setInstructions('');
        setImageUrl(PRESET_RECIPE_IMAGES[0]?.url || '');
        setIsFavorite(false);
        setShowManualUrlInput(false);
        setErrors({});
      } else if (dish) {
        setName(dish.name);
        setCategory(dish.category);
        setIngredients(dish.ingredients);
        setInstructions(dish.instructions);
        setImageUrl(dish.imageUrl);
        setIsFavorite(dish.isFavorite || false);
        setErrors({});

        // Determine if image URL matches one of our presets, otherwise default show manual input
        const holdsPreset = PRESET_RECIPE_IMAGES.some(p => p.url === dish.imageUrl);
        setShowManualUrlInput(!holdsPreset);

        // Reset ingredients checkbox states
        setCheckedIngredients({});
      }
    }
  }, [isOpen, dish, mode]);

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!name.trim()) tempErrors.name = 'Tên món ăn không được để trống';
    if (!category || category === 'Tất cả') tempErrors.category = 'Vui lòng chọn một phân loại cụ thể';
    if (!ingredients.trim()) tempErrors.ingredients = 'Vui lòng điền nguyên liệu chế biến';
    if (!instructions.trim()) tempErrors.instructions = 'Vui lòng hướng dẫn cách chế biến món';
    if (!imageUrl.trim()) tempErrors.imageUrl = 'Vui lòng chọn hoặc điền link ảnh đại diện';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const capitalizeWords = (str: string) => {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-capitalize fields
    const formattedName = capitalizeWords(name.trim());
    const formattedIngredients = capitalizeFirstLetterOfLines(ingredients.trim());
    const formattedInstructions = capitalizeFirstLetterOfLines(instructions.trim());
    
    setName(formattedName);
    setIngredients(formattedIngredients);
    setInstructions(formattedInstructions);

    // Validate using formatted values
    const tempErrors: { [key: string]: string } = {};
    if (!formattedName) tempErrors.name = 'Tên món ăn không được để trống';
    if (!category || category === 'Tất cả') tempErrors.category = 'Vui lòng chọn một phân loại cụ thể';
    if (!formattedIngredients) tempErrors.ingredients = 'Vui lòng điền nguyên liệu chế biến';
    if (!formattedInstructions) tempErrors.instructions = 'Vui lòng hướng dẫn cách chế biến món';
    if (!imageUrl.trim()) tempErrors.imageUrl = 'Vui lòng chọn hoặc điền link ảnh đại diện';

    setErrors(tempErrors);
    const isValid = Object.keys(tempErrors).length === 0;
    if (!isValid) return;

    onSave({
      name: formattedName,
      category,
      ingredients: formattedIngredients,
      instructions: formattedInstructions,
      imageUrl: imageUrl.trim(),
      isFavorite,
    });
    onClose();
  };

  const toggleIngredientCheck = (idx: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (!isOpen) return null;

  // Split ingredients & instructions into clean array rows for readable viewing
  const ingredientRows = dish ? dish.ingredients.split('\n').filter(r => r.trim().length > 0) : [];
  const instructionRows = dish ? dish.instructions.split('\n').filter(r => r.trim().length > 0) : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        {/* Click outside backdrop to trigger close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-pointer"
        />

        {/* Modal card wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 120 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 120 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full sm:max-w-2xl h-[92vh] sm:h-[85vh] max-h-[95vh] bg-white rounded-t-[32px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
          id="dish-modal"
        >
          {/* Cover Hero Banner Image in View Mode */}
          {mode === 'view' && dish && (
            <div className="relative h-48 sm:h-56 w-full bg-slate-100 shrink-0">
              <img
                src={dish.imageUrl}
                alt={dish.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex flex-col justify-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFEAA7] mb-1">
                  {dish.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-xs flex items-center gap-2">
                  {dish.name}
                  {dish.isFavorite && (
                    <Heart className="w-5.5 h-5.5 fill-[#FF7675] text-[#FF7675] inline-block shrink-0" />
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                type="button"
                className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-md"
                id="btn-close-dish-view"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Float edit button on detail screen */}
              {onSwitchToEdit && (
                <button
                  onClick={() => onSwitchToEdit(dish)}
                  type="button"
                  className="absolute bottom-4 right-6 flex items-center gap-1 px-4 py-2 bg-[#FF7675] hover:bg-[#E17055] text-white font-bold text-xs rounded-full shadow-md transition-all scale-100 active:scale-95 cursor-pointer"
                  id={`btn-edit-dish-from-view-${dish.id}`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  Sửa Công Thức
                </button>
              )}
            </div>
          )}

          {/* Standard Text Header in Create / Edit Mode */}
          {mode !== 'view' && (
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#FF7675]" />
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                  {mode === 'create' ? 'Tạo Công Thức Mới' : 'Sửa Công Thức Món Ăn'}
                </h2>
              </div>
              <button
                onClick={onClose}
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                id="btn-close-dish-edit"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Scrolling Content Panel */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {/* VIEW MODE DETAILS PANEL */}
            {mode === 'view' && dish && (
              <div className="space-y-6">
                {/* 1. Ingredients section as an interactive list */}
                <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3.5 border-b border-slate-200 pb-2.5">
                    <ListChecks className="w-5 h-5 text-[#FF7675]" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                      Thành phần nguyên liệu
                    </h3>
                    <span className="ml-auto text-xs font-mono font-medium text-slate-500">
                      Tích chọn để chuẩn chuẩn bị
                    </span>
                  </div>

                  {ingredientRows.length === 0 ? (
                    <p className="text-xs italic text-slate-400">Chưa viết nguyên liệu cụ thể.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {ingredientRows.map((line, idx) => {
                        const isChecked = !!checkedIngredients[idx];
                        const displayLine = line.replace(/^-\s*/, '').trim();
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleIngredientCheck(idx)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl cursor-copy transition-all ${
                              isChecked
                                ? 'bg-[#FFEAEA] opacity-80'
                                : 'hover:bg-white border border-transparent hover:border-slate-150'
                            }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? 'bg-[#FF7675] border-[#FF7675] text-white'
                                : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 font-extrabold" />}
                            </div>
                            <span className={`text-sm text-slate-700 leading-normal break-all select-none ${
                              isChecked ? 'line-through text-slate-400 font-medium' : 'font-medium'
                            }`}>
                              {displayLine}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Cooking Steps / Instructions */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5">
                    <BookOpen className="w-5 h-5 text-[#FF7675]" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                      Quy trình chế biến
                    </h3>
                  </div>

                  {instructionRows.length === 0 ? (
                    <p className="text-xs italic text-slate-400">Chưa hoàn thiện các bước.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {instructionRows.map((step, idx) => {
                        // Check if it starts with numbers, e.g. "1. Step" or "Bước 1."
                        const stepMatch = step.match(/^(\d+|\w+\s*\d+)\.\s*(.*)/);
                        const stepNum = stepMatch ? stepMatch[1] : (idx + 1).toString();
                        const stepText = stepMatch ? stepMatch[2].trim() : step.trim();

                        return (
                          <div key={idx} className="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-none last:pb-0">
                            {/* Step Indicator Badge */}
                            <div className="flex items-center justify-center w-7 h-7 bg-[#FFEAEA] text-[#FF7675] font-extrabold text-xs rounded-full shrink-0">
                              {stepNum}
                            </div>
                            {/* Detailed Instruction Text */}
                            <p className="text-sm text-slate-600 leading-relaxed break-words font-medium pt-0.5">
                              {stepText}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Last Updated Tag */}
                {dish && (
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Cập nhật cuối: {new Date(dish.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* CREATE / EDIT WRITE FORM PANEL */}
            {mode !== 'view' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Name Input */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dish-name" className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                    Tên Món Ăn <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dish-name"
                    type="text"
                    placeholder="Ví dụ: Nem cuốn tôm thịt, Thịt kho..."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    onBlur={() => setName(capitalizeWords(name))}
                    className={`w-full text-sm font-semibold text-slate-800 bg-slate-50 border ${
                      errors.name ? 'border-red-400 ring-2 ring-red-100/50' : 'border-slate-200'
                    } focus:bg-white rounded-xl px-4 py-3 outline-hidden focus:ring-4 focus:ring-[#4834D4]/10 focus:border-[#4834D4]`}
                  />
                  {errors.name && <span className="text-xs font-semibold text-red-500 mt-1">{errors.name}</span>}
                </div>

                {/* 2. Category Select Selection Grid */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                    Phân Loại Món Ăn <span className="text-red-500">*</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {DISH_CATEGORIES.filter(cat => cat !== 'Tất cả').map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                        }}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                          category === cat
                            ? 'bg-[#FF7675] border-[#FF7675] text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                        id={`btn-select-category-${cat}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {errors.category && <span className="text-xs font-semibold text-red-500 mt-1">{errors.category}</span>}
                </div>

                {/* 2b. Favorite Toggle Switch */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl mt-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Món ăn yêu thích</span>
                    <span className="text-[10px] text-slate-400">Đánh dấu vào danh sách yêu thích</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isFavorite} 
                      onChange={(e) => setIsFavorite(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7675]"></div>
                  </label>
                </div>

                {/* 3. Image Selector Gallery */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                      Ảnh Đại Diện Món Ăn <span className="text-red-500">*</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                      className="text-xs font-bold text-[#FF7675] hover:underline cursor-pointer"
                    >
                      {showManualUrlInput ? 'Chọn ảnh mẫu có sẵn' : 'Tự điền link ảnh riêng'}
                    </button>
                  </div>

                  {!showManualUrlInput ? (
                    <div>
                      <p className="text-[11px] text-slate-500 mb-2">Nhấp chọn một ảnh đại diện phù hợp nhất:</p>
                      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                        {PRESET_RECIPE_IMAGES.map((preset, index) => {
                          const isSelected = imageUrl === preset.url;
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setImageUrl(preset.url)}
                              className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                                isSelected ? 'border-[#FF7675] ring-4 ring-[#FF7675]/15' : 'border-transparent'
                              }`}
                              id={`preset-img-btn-${index}`}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                                <span className="text-[9px] font-bold text-white leading-tight truncate">
                                  {preset.label}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-[#FF7675] text-white rounded-full p-0.5">
                                  <Check className="w-2.5 h-2.5 font-bold" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <input
                        type="url"
                        placeholder="Dán link ảnh từ Unsplash/Pexels..."
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          if (errors.imageUrl) setErrors(prev => ({ ...prev, imageUrl: '' }));
                        }}
                        className={`w-full text-xs text-slate-700 bg-slate-50 border ${
                          errors.imageUrl ? 'border-red-400' : 'border-slate-200'
                        } rounded-xl px-4 py-2.5 focus:bg-white outline-hidden`}
                      />
                      <p className="text-[10px] text-slate-400">Chọn link ảnh hợp lệ bắt đầu bằng http:// hoặc https://</p>
                    </div>
                  )}

                  {/* Small Live Image Preview */}
                  {imageUrl && (
                    <div className="flex items-center gap-3 bg-[#FFEAEA]/40 rounded-xl p-2.5 border border-[#FF7675]/20 mt-1">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-md shrink-0 border"
                        onError={(e) => {
                          // Fallback to broken link default
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80';
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-xs text-slate-600">
                        <span className="font-bold text-[#E17055] text-[11px] block uppercase">Xem trước hình ảnh</span>
                        <span className="truncate text-slate-400 block max-w-sm font-mono text-[10px]">{imageUrl}</span>
                      </div>
                    </div>
                  )}

                  {errors.imageUrl && <span className="text-xs font-semibold text-red-500 mt-1">{errors.imageUrl}</span>}
                </div>

                {/* 4. Ingredients Textarea */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="dish-ingredients" className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                      Thành Phần Nguyên Liệu <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Ghi cách dòng bằng phím Enter</span>
                  </div>
                  <textarea
                    id="dish-ingredients"
                    placeholder="- 500g cua hoàng đế&#10;- 2 bó rau và mỡ&#10;- 3 củ hành tím..."
                    value={ingredients}
                    onChange={(e) => {
                      setIngredients(e.target.value);
                      if (errors.ingredients) setErrors(prev => ({ ...prev, ingredients: '' }));
                    }}
                    onBlur={() => setIngredients(capitalizeFirstLetterOfLines(ingredients))}
                    className={`w-full h-28 text-sm text-slate-700 bg-slate-50 border ${
                      errors.ingredients ? 'border-red-400 ring-2 ring-red-100/50' : 'border-slate-200'
                    } focus:bg-white rounded-xl p-4 outline-hidden focus:ring-4 focus:ring-[#4834D4]/10 focus:border-[#4834D4] resize-y`}
                  />
                  {errors.ingredients && <span className="text-xs font-semibold text-red-500 mt-1">{errors.ingredients}</span>}
                </div>

                {/* 5. Instructions Textarea */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="dish-instructions" className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                      Quy trình Các Bước Chế Biến <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Ghi bước 1, bước 2 ngăn cách dòng</span>
                  </div>
                  <textarea
                    id="dish-instructions"
                    placeholder="1. Làm sạch nguyên liệu cua sạch vị bùn&#10;2. Ướp cùng gia vị nêm đũa...&#10;3. Luộc chín cá đều hai mặt lật nhẹ tay..."
                    value={instructions}
                    onChange={(e) => {
                      setInstructions(e.target.value);
                      if (errors.instructions) setErrors(prev => ({ ...prev, instructions: '' }));
                    }}
                    onBlur={() => setInstructions(capitalizeFirstLetterOfLines(instructions))}
                    className={`w-full h-32 text-sm text-slate-700 bg-slate-50 border ${
                      errors.instructions ? 'border-red-400 ring-2 ring-red-100/50' : 'border-slate-200'
                    } focus:bg-white rounded-xl p-4 outline-hidden focus:ring-4 focus:ring-[#4834D4]/10 focus:border-[#4834D4] resize-y`}
                  />
                  {errors.instructions && <span className="text-xs font-semibold text-red-500 mt-1">{errors.instructions}</span>}
                </div>

                {/* Action Row */}
                <div className="border-t border-slate-100 pt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3.5 text-sm font-bold border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-center"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 text-sm font-extrabold bg-[#FF7675] hover:bg-[#E17055] text-white rounded-xl shadow-md shadow-[#FF7675]/15 active:scale-98 transition-all cursor-pointer text-center"
                    id="btn-save-dish"
                  >
                    Hoàn Tất Lưu
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export type { DishModalProps };
