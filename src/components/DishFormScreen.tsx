import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Camera, ListChecks, Utensils, BookOpen } from 'lucide-react';
import { Dish } from '../types';
import { PRESET_RECIPE_IMAGES, DISH_CATEGORIES } from '../sampleData';
import { motion } from 'motion/react';

interface DishFormScreenProps {
  dish: Dish | null;
  mode: 'edit' | 'create';
  onSave: (dishData: {
    name: string;
    category: string;
    ingredients: string;
    instructions: string;
    imageUrl: string;
  }) => void;
  onCancel: () => void;
}

export default function DishFormScreen({ dish, mode, onSave, onCancel }: DishFormScreenProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(DISH_CATEGORIES[1] || 'Món mặn');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (mode === 'create') {
      setName('');
      setCategory(DISH_CATEGORIES[1] || 'Món mặn');
      setIngredients('');
      setInstructions('');
      setImageUrl('');
      setErrors({});
    } else if (dish) {
      setName(dish.name);
      setCategory(dish.category);
      setIngredients(dish.ingredients);
      setInstructions(dish.instructions);
      setImageUrl(dish.imageUrl);
      setErrors({});
    }
  }, [dish, mode]);

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!name.trim()) tempErrors.name = 'Tên món ăn không được để trống';
    if (!category || category === 'Tất cả') tempErrors.category = 'Vui lòng chọn một phân loại cụ thể';
    if (!ingredients.trim()) tempErrors.ingredients = 'Vui lòng điền nguyên liệu chế biến';
    if (!instructions.trim()) tempErrors.instructions = 'Vui lòng hướng dẫn cách chế biến món';
    if (!imageUrl.trim()) tempErrors.imageUrl = 'Vui lòng điền link ảnh đại diện';

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
    if (!imageUrl.trim()) tempErrors.imageUrl = 'Vui lòng điền link ảnh đại diện';

    setErrors(tempErrors);
    const isValid = Object.keys(tempErrors).length === 0;
    if (!isValid) return;

    onSave({
      name: formattedName,
      category,
      ingredients: formattedIngredients,
      instructions: formattedInstructions,
      imageUrl: imageUrl.trim(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="w-full max-w-6xl mx-auto px-4 py-6"
    >
      {/* 1. Navigation Header Row */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onCancel}
          type="button"
          className="p-3 bg-white hover:bg-slate-100 text-slate-700 hover:text-[#FF7675] rounded-2xl shadow-xs border border-slate-100 hover:border-slate-200 transition-all flex items-center justify-center cursor-pointer"
          title="Quay lại danh sách"
          id="btn-back-to-list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[10px] sm:text-xs font-black text-[#FF7675] uppercase tracking-widest block">
            {mode === 'create' ? 'KHỞI TẠO MÓN NGON' : 'CẬP NHẬT CÔNG THỨC'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">
            {mode === 'create' ? 'Thêm mới công thức' : `Hiệu chỉnh: ${name || 'Món ăn'}`}
          </h2>
        </div>
      </div>

      {/* 2. Responsive Work Area Split Column/Grid */}
      <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Column 1: General Info */}
          <div className="space-y-6">
            {/* DIV 1: THÔNG TIN CHUNG (Tên món ăn, Phân Loại & Ảnh đại diện) */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6" id="div-general-info">
              <div className="border-b border-slate-100 pb-4 mb-2">
                <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-[#FF7675] rounded-full inline-block"></span>
                  Thông tin chung & Ảnh đại diện
                </h3>
                <p className="text-xs text-slate-400 font-medium">Nhập tên món ăn, lựa chọn phân loại và dán hình ảnh đại diện</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* A. Name Input */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="dish-name" className="text-xs font-black text-slate-700 tracking-wider uppercase">
                    Tên Món Ăn <span className="text-red-500 font-extrabold">*</span>
                  </label>
                  <input
                    id="dish-name"
                    type="text"
                    placeholder="Ví dụ: Nem cuốn tôm thịt, Bún chả HN..."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    onBlur={() => setName(capitalizeWords(name))}
                    className={`w-full text-sm font-semibold text-slate-800 bg-slate-50 border ${
                      errors.name ? 'border-red-400 ring-2 ring-red-100/50' : 'border-slate-200'
                    } focus:bg-white rounded-2xl px-5 py-4 outline-hidden focus:ring-4 focus:ring-[#FF7675]/10 focus:border-[#FF7675] transition-all`}
                  />
                  {errors.name && <span className="text-xs font-semibold text-red-500 mt-1">{errors.name}</span>}
                </div>

                {/* B. Category Select Dropdown */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="dish-category" className="text-xs font-black text-slate-700 tracking-wider uppercase">
                    Phân Loại <span className="text-red-500 font-extrabold">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="dish-category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                      }}
                      className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 focus:bg-white rounded-2xl px-5 py-4 focus:ring-4 focus:ring-[#FF7675]/10 focus:border-[#FF7675] outline-hidden transition-all cursor-pointer appearance-none"
                    >
                      <option value="" disabled>-- Chọn phân loại món ăn --</option>
                      {DISH_CATEGORIES.filter(cat => cat !== 'Tất cả').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {/* Dropdown Chevron Indicator icon */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"></path>
                      </svg>
                    </div>
                  </div>
                  {errors.category && <span className="text-xs font-semibold text-red-500 mt-1">{errors.category}</span>}
                </div>
              </div>

              {/* C. Image Input & Live Preview */}
              <div className="flex flex-col gap-6 pt-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="dish-image-url" className="text-xs font-black text-slate-700 tracking-wider uppercase">
                    Đường dẫn liên kết hình ảnh <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dish-image-url"
                    type="url"
                    placeholder="Dán link ảnh từ Unsplash, Pexels, Google..."
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      if (errors.imageUrl) setErrors(prev => ({ ...prev, imageUrl: '' }));
                    }}
                    className={`w-full text-sm text-slate-700 bg-slate-50 border ${
                      errors.imageUrl ? 'border-red-400 ring-2 ring-red-100/50' : 'border-slate-200'
                    } focus:bg-white rounded-2xl px-5 py-4 outline-hidden focus:ring-4 focus:ring-[#FF7675]/10 focus:border-[#FF7675] transition-all`}
                  />
                  <p className="text-[10px] text-slate-400 leading-snug">URL phải hợp lệ bắt đầu bằng <code>http://</code> hoặc <code>https://</code></p>
                  {errors.imageUrl && <span className="text-xs font-semibold text-red-500 mt-1">{errors.imageUrl}</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-black text-slate-700 tracking-wider uppercase">Xem trước hình ảnh</span>
                  {imageUrl ? (
                    <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-slate-100 shadow-xs group bg-slate-50">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-end p-3">
                        <span className="text-[10px] font-bold text-white bg-[#FF7675]/90 px-3 py-1 rounded-md backdrop-blur-xs uppercase tracking-wider shadow-xs">
                          Live Preview
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-4 text-center text-slate-400 text-sm font-medium">
                      Chưa có hình ảnh
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Ingredients & Instructions */}
          <div className="space-y-6">
            {/* DIV 2: THÀNH PHẦN NGUYÊN LIỆU */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs flex flex-col gap-2" id="div-ingredients-only">
              <div className="border-b border-slate-100 pb-3 mb-1">
                <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-[#00CEC9] rounded-full inline-block"></span>
                  Thành Phần Nguyên Liệu
                </h3>
                <p className="text-xs text-slate-400 font-medium">Liệt kê tất cả các gia vị, nguyên liệu thiết yếu cho món ngon này</p>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="dish-ingredients" className="text-xs font-black text-slate-500 tracking-wider uppercase">
                  Danh sách chi tiết <span className="text-red-500 font-extrabold">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Ấn phím Enter để ngăn cách dòng</span>
              </div>
              <textarea
                id="dish-ingredients"
                placeholder="- 500g cua hoàng đế hoặc thịt heo ngon&#10;- 2 bó hành hoa tỏi tây&#10;- 1 chai nước mắm cốt nhĩ..."
                value={ingredients}
                onChange={(e) => {
                  setIngredients(e.target.value);
                  if (errors.ingredients) setErrors(prev => ({ ...prev, ingredients: '' }));
                }}
                onBlur={() => setIngredients(capitalizeFirstLetterOfLines(ingredients))}
                className={`w-full h-36 text-sm text-slate-700 bg-slate-50 border ${
                  errors.ingredients ? 'border-red-400 ring-2 ring-red-100/50' : 'border-slate-200'
                } focus:bg-white rounded-2xl p-5 outline-hidden focus:ring-4 focus:ring-[#FF7675]/10 focus:border-[#FF7675] resize-y transition-all font-mono`}
              />
              {errors.ingredients && <span className="text-xs font-semibold text-red-500 mt-1">{errors.ingredients}</span>}
            </div>

            {/* DIV 3: HƯỚNG DẪN QUY TRÌNH CHẾ BIẾN */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs flex flex-col gap-2" id="div-instructions-only">
              <div className="border-b border-slate-100 pb-3 mb-1">
                <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-[#E17055] rounded-full inline-block"></span>
                  Hướng Dẫn Quy Trình Chế Biến
                </h3>
                <p className="text-xs text-slate-400 font-medium">Sắp xếp các bước thực hiện tuần tự để có kết quả mĩ vị nhất</p>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="dish-instructions" className="text-xs font-black text-slate-500 tracking-wider uppercase">
                  Cách thực hiện từng bước <span className="text-red-500 font-extrabold">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Ngăn dòng từng bước bằng phím Enter</span>
              </div>
              <textarea
                id="dish-instructions"
                placeholder="1. Sơ chế làm sạch cua ghẹ thật sạch rồi luộc qua gừng thơm...&#10;2. Ướp tẩm cùng nước mắm tỏi hành băm..."
                value={instructions}
                onChange={(e) => {
                  setInstructions(e.target.value);
                  if (errors.instructions) setErrors(prev => ({ ...prev, instructions: '' }));
                }}
                onBlur={() => setInstructions(capitalizeFirstLetterOfLines(instructions))}
                className={`w-full h-44 text-sm text-slate-700 bg-slate-50 border ${
                  errors.instructions ? 'border-red-400 ring-2 ring-red-100/50' : 'border-slate-200'
                } focus:bg-white rounded-2xl p-5 outline-hidden focus:ring-4 focus:ring-[#FF7675]/10 focus:border-[#FF7675] resize-y transition-all`}
              />
              {errors.instructions && <span className="text-xs font-semibold text-red-500 mt-1">{errors.instructions}</span>}
            </div>
          </div>
        </div>

        {/* Action Triggers Row */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center gap-4 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer text-center"
          >
            Hủy Quá Trình
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-3.5 text-sm font-black bg-[#FF7675] hover:bg-[#E17055] text-white rounded-2xl shadow-md shadow-[#FF7675]/15 hover:shadow-lg hover:shadow-[#FF7675]/25 active:scale-98 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
            id="screen-btn-save-dish"
          >
            <Check className="w-4 h-4 font-black" />
            Lưu Công Thức Này
          </button>
        </div>
      </form>
    </motion.div>
  );
}
export type { DishFormScreenProps };
