import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  BookText, 
  Utensils, 
  Notebook, 
  Plus, 
  Search, 
  Sparkles, 
  ChefHat, 
  Calendar,
  Layers,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { Note, Dish } from './types';
import { SAMPLE_NOTES, SAMPLE_DISHES, DISH_CATEGORIES } from './sampleData';

import NoteCard from './components/NoteCard';
import NoteModal from './components/NoteModal';
import DishCard from './components/DishCard';
import DishModal from './components/DishModal';
import DishFormScreen from './components/DishFormScreen';

import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Current tab: 'dishes' (Công thức) | 'notes' (Ghi chú)
  const [activeTab, setActiveTab] = useState<'dishes' | 'notes'>(() => {
    const savedTab = localStorage.getItem('sotay_active_tab');
    return (savedTab === 'dishes' || savedTab === 'notes') ? savedTab : 'dishes';
  });

  // Persist activeTab to localStorage
  useEffect(() => {
    localStorage.setItem('sotay_active_tab', activeTab);
  }, [activeTab]);

  // Core Data Lists
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from server-side JSON REST API on mount
  useEffect(() => {
    const checkAndInitData = async () => {
      try {
        const [dishesRes, notesRes] = await Promise.all([
          fetch('/api/dishes'),
          fetch('/api/notes')
        ]);
        
        if (dishesRes.ok && notesRes.ok) {
          const fetchedDishes = await dishesRes.json();
          const fetchedNotes = await notesRes.json();
          setDishes(fetchedDishes);
          setNotes(fetchedNotes);
        } else {
          // Fallback to localStorage if server returns non-200
          const localDishes = localStorage.getItem('sotay_dishes');
          const localNotes = localStorage.getItem('sotay_notes');
          setDishes(localDishes ? JSON.parse(localDishes) : SAMPLE_DISHES);
          setNotes(localNotes ? JSON.parse(localNotes) : SAMPLE_NOTES);
        }
      } catch (err) {
        console.error('Failed to connect to API, initializing with local offline data:', err);
        const localDishes = localStorage.getItem('sotay_dishes');
        const localNotes = localStorage.getItem('sotay_notes');
        setDishes(localDishes ? JSON.parse(localDishes) : SAMPLE_DISHES);
        setNotes(localNotes ? JSON.parse(localNotes) : SAMPLE_NOTES);
      } finally {
        setIsLoading(false);
      }
    };
    checkAndInitData();
  }, []);

  // Search & Filter State
  const [dishSearch, setDishSearch] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const [currentDishPage, setCurrentDishPage] = useState(1);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentDishPage(1);
  }, [dishSearch]);

  // Modals/Pages Controller State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [dishModalMode, setDishModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [dishFormMode, setDishFormMode] = useState<'create' | 'edit' | null>(null);

  // App-level Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: 'dish' | 'note';
    title: string;
  } | null>(null);

  // Redundant client-side offline cache
  useEffect(() => {
    if (dishes.length > 0) {
      localStorage.setItem('sotay_dishes', JSON.stringify(dishes));
    }
  }, [dishes]);

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('sotay_notes', JSON.stringify(notes));
    }
  }, [notes]);

  // Date strings
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDateFormatted(new Date().toLocaleDateString('vi-VN', options));
  }, []);

  // Dish database actions
  const handleSaveDish = async (dishData: {
    name: string;
    category: string;
    ingredients: string;
    instructions: string;
    imageUrl: string;
    isFavorite?: boolean;
    summary?: string;
  }) => {
    const targetDish: Partial<Dish> = {
      name: dishData.name,
      category: dishData.category,
      ingredients: dishData.ingredients,
      instructions: dishData.instructions,
      imageUrl: dishData.imageUrl,
      isFavorite: dishData.isFavorite,
      summary: dishData.summary || '',
    };
    
    if (dishFormMode === 'edit' && selectedDish) {
      targetDish.id = selectedDish.id;
      targetDish.createdAt = selectedDish.createdAt;
    } else {
      targetDish.createdAt = new Date().toISOString();
    }

    try {
      const res = await fetch('/api/dishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(targetDish)
      });

      if (res.ok) {
        const savedDish = await res.json();
        if (dishFormMode === 'edit' && selectedDish) {
          setDishes(prev => prev.map(d => d.id === selectedDish.id ? savedDish : d));
        } else {
          setDishes(prev => [savedDish, ...prev]);
        }
      } else {
        throw new Error('Server side write error');
      }
    } catch (err) {
      console.error('Optimistic local save due to API error:', err);
      // Fallback local save
      if (dishFormMode === 'edit' && selectedDish) {
        setDishes(prev =>
          prev.map(d =>
            d.id === selectedDish.id
              ? { ...d, ...dishData, updatedAt: new Date().toISOString() }
              : d
          )
        );
      } else {
        const newDish: Dish = {
          id: `dish-${Date.now()}`,
          ...dishData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setDishes(prev => [newDish, ...prev]);
      }
    }
    setDishFormMode(null);
    setSelectedDish(null);
  };

  const handleDeleteDish = async (id: string) => {
    setDishes(prev => prev.filter(d => d.id !== id));
    if (selectedDish?.id === id) {
      setIsDishModalOpen(false);
      setSelectedDish(null);
    }

    try {
      await fetch(`/api/dishes/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to sync deletion to server:', err);
    }
  };

  const handleToggleFavoriteDish = async (dish: Dish) => {
    const updatedDish = { ...dish, isFavorite: !dish.isFavorite };
    setDishes(prev => prev.map(d => d.id === dish.id ? updatedDish : d));
    try {
      await fetch('/api/dishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedDish)
      });
    } catch (err) {
      console.error('Failed to sync favorite status to server:', err);
    }
  };

  const requestDeleteDish = (id: string) => {
    const item = dishes.find(d => d.id === id);
    if (item) {
      setDeleteConfirm({
        id,
        type: 'dish',
        title: item.name
      });
    }
  };

  const handleOpenCreateDish = () => {
    setDishFormMode('create');
    setSelectedDish(null);
  };

  const handleOpenEditDish = (dish: Dish) => {
    setDishFormMode('edit');
    setSelectedDish(dish);
  };

  const handleViewDishDetails = (dish: Dish) => {
    setDishModalMode('view');
    setSelectedDish(dish);
    setIsDishModalOpen(true);
  };

  const handleSwitchToEditDish = (dish: Dish) => {
    setIsDishModalOpen(false);
    setSelectedDish(dish);
    setDishFormMode('edit');
  };

  // Note database actions
  const handleSaveNote = async (title: string, content: string, color: string) => {
    const targetNote: Partial<Note> = {
      title,
      content,
      color
    };
    if (selectedNote) {
      targetNote.id = selectedNote.id;
      targetNote.isPinned = selectedNote.isPinned;
    }

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(targetNote)
      });

      if (res.ok) {
        const savedNote = await res.json();
        if (selectedNote) {
          setNotes(prev => prev.map(n => n.id === selectedNote.id ? savedNote : n));
        } else {
          setNotes(prev => [savedNote, ...prev]);
        }
      } else {
        throw new Error('Server side write error');
      }
    } catch (err) {
      console.error('Optimistic local save due to API error:', err);
      if (selectedNote) {
        setNotes(prev =>
          prev.map(n =>
            n.id === selectedNote.id
              ? { ...n, title, content, color, updatedAt: new Date().toISOString() }
              : n
          )
        );
      } else {
        const newNote: Note = {
          id: `note-${Date.now()}`,
          title,
          content,
          color,
          isPinned: false,
          updatedAt: new Date().toISOString()
        };
        setNotes(prev => [newNote, ...prev]);
      }
    }
    setIsNoteModalOpen(false);
    setSelectedNote(null);
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to sync note delete to server:', err);
    }
  };

  const requestDeleteNote = (id: string) => {
    const item = notes.find(n => n.id === id);
    if (item) {
      setDeleteConfirm({
        id,
        type: 'note',
        title: item.title || 'Ghi chú không tiêu đề'
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    if (type === 'dish') {
      handleDeleteDish(id);
    } else if (type === 'note') {
      handleDeleteNote(id);
    }
    setDeleteConfirm(null);
  };

  const handleOpenCreateNote = () => {
    setSelectedNote(null);
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsNoteModalOpen(true);
  };

  const handleTogglePinNote = async (id: string) => {
    const noteToPin = notes.find(n => n.id === id);
    if (!noteToPin) return;

    const updatedNote = { ...noteToPin, isPinned: !noteToPin.isPinned };
    setNotes(prev =>
      prev.map(n => n.id === id ? updatedNote : n)
    );

    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedNote)
      });
    } catch (err) {
      console.error('Failed to sync pin toggle to server:', err);
    }
  };

  // Recipe filtration and sorting logic (Favorite first, then sorted by newest updatedAt)
  const filteredDishes = dishes
    .filter(dish => {
      return dish.name.toLowerCase().includes(dishSearch.toLowerCase()) || 
             dish.ingredients.toLowerCase().includes(dishSearch.toLowerCase()) ||
             dish.category.toLowerCase().includes(dishSearch.toLowerCase());
    })
    .sort((a, b) => {
      const favA = a.isFavorite ? 1 : 0;
      const favB = b.isFavorite ? 1 : 0;
      if (favA !== favB) {
        return favB - favA; // Favorite (1) before non-favorite (0)
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); // Newest first
    });

  // Pagination config
  const ITEMS_PER_PAGE = 8;
  const totalDishPages = Math.ceil(filteredDishes.length / ITEMS_PER_PAGE);
  const paginatedDishes = filteredDishes.slice(
    (currentDishPage - 1) * ITEMS_PER_PAGE,
    currentDishPage * ITEMS_PER_PAGE
  );

  // Notes sorting and filtration logic (Pinned always floats first, then sorted by newest updatedAt)
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
    note.content.toLowerCase().includes(noteSearch.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(n => n.isPinned).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Count metrics for header overview
  const totalDishesCount = dishes.length;
  const totalNotesCount = notes.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Đang kết nối cơ sở dữ liệu ẩm thực...</p>
        </div>
      </div>
    );
  }

  if (dishFormMode) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-8">
        <DishFormScreen
          dish={selectedDish}
          mode={dishFormMode}
          onSave={handleSaveDish}
          onCancel={() => {
            setDishFormMode(null);
            setSelectedDish(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative pb-24 sm:pb-8">
      
      {/* 1. Header Banner Panel */}
      <header className="bg-gradient-to-r from-[#4834D4] via-[#686DE0] to-[#E056FD] text-white shadow-md relative overflow-hidden shrink-0">
        {/* Subtle decorative vector circles overlaying visually in background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF7675]/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-0.5 rounded-2xl border border-white/25 backdrop-blur-md w-14 h-14 shrink-0 overflow-hidden flex items-center justify-center shadow-md">
              <img src="/avatar.png" alt="Leo's Ghi Chú Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-1.5 font-sans">
                Leo's Ghi Chú
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 border-t border-white/5 pt-3 md:border-none md:pt-0">
            {/* Quick status counters */}
            <div className="flex items-center gap-4 bg-black/15 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/5 text-xs">
              <div className="flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-[#FF7675]" />
                <span className="font-semibold">{totalDishesCount}</span>
                <span className="text-purple-200">món ăn</span>
              </div>
              <div className="h-4 w-[1px] bg-white/20" />
              <div className="flex items-center gap-1.5 justify-center">
                <Notebook className="w-4 h-4 text-[#FFEAA7]" />
                <span className="font-semibold">{totalNotesCount}</span>
                <span className="text-amber-200/80">ghi chú</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Main Content Container block */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        
        {/* Desktop Quick Nav Tabs (Hidden on mobile as it relies on Native Bottom Bar) */}
        <div className="hidden sm:flex items-center justify-between border-b border-slate-200 pb-4 mb-6 font-sans">
          <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl">
            <button
              onClick={() => setActiveTab('dishes')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
                activeTab === 'dishes'
                  ? 'bg-[#FF7675] text-white shadow-sm shadow-[#FF7675]/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="desktop-tab-dishes"
            >
              <Utensils className="w-4 h-4" />
              Kho Công Thức ({totalDishesCount})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-[#4834D4] text-white shadow-sm shadow-[#4834D4]/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="desktop-tab-notes"
            >
              <Notebook className="w-4 h-4" />
              Sổ Tay Ghi Chú ({totalNotesCount})
            </button>
          </div>

          <button
            onClick={activeTab === 'dishes' ? handleOpenCreateDish : handleOpenCreateNote}
            className={`flex items-center gap-1.5 px-5 py-3 text-white rounded-xl text-sm font-black active:scale-98 transition-all cursor-pointer shadow-xs ${
              activeTab === 'dishes' ? 'bg-[#FF7675] hover:bg-[#E17055]' : 'bg-[#4834D4] hover:bg-[#3B2BB0]'
            }`}
            id="desktop-btn-add-primary"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'dishes' ? 'Thêm món ăn mới' : 'Tạo ghi chú mới'}
          </button>
        </div>

        {/* =======================================
            TAB 1: RECIPES & DISHES CONTROLS PANEL
            ======================================= */}
        {activeTab === 'dishes' && (
          <div className="space-y-6">
            
            {/* Search, Filter Bar */}
            <div className="flex flex-col gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm món ngon theo tên, nguyên liệu, phân loại..."
                  value={dishSearch}
                  onChange={(e) => setDishSearch(e.target.value)}
                  className="w-full text-sm placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-10 py-3.5 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#4834D4]/10 focus:border-[#4834D4] font-medium"
                  id="dish-search-input"
                />
                {dishSearch && (
                  <button
                    onClick={() => setDishSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs px-2 py-1 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    Xóa
                  </button>
                )}
              </div>

            </div>

            {/* Dish cards list grid layout */}
            <AnimatePresence mode="popLayout">
              {filteredDishes.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {paginatedDishes.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        onViewDetails={handleViewDishDetails}
                        onEdit={handleOpenEditDish}
                        onDelete={requestDeleteDish}
                        onToggleFavorite={handleToggleFavoriteDish}
                      />
                    ))}
                  </div>

                  {/* Pagination Navigation Controls */}
                  {totalDishPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                      <button
                        onClick={() => setCurrentDishPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentDishPage === 1}
                        className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer"
                        type="button"
                      >
                        Trước
                      </button>
                      
                      {Array.from({ length: totalDishPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentDishPage(page)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                            currentDishPage === page
                              ? 'bg-[#FF7675] text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                          type="button"
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentDishPage(prev => Math.min(prev + 1, totalDishPages))}
                        disabled={currentDishPage === totalDishPages}
                        className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all cursor-pointer"
                        type="button"
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-xs text-center border-dashed border-2 min-h-[300px]"
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-[#FF7675]/80">
                    <Utensils className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-slate-700 text-lg mb-1">
                    {dishSearch ? 'Không tìm thấy món ăn phù hợp' : 'Chưa có món ăn nào'}
                  </h3>
                  <p className="text-slate-400 text-sm max-w-md mb-6 font-medium">
                    {dishSearch 
                      ? 'Nền tảng chưa tìm thấy món ăn khớp từ kho từ khóa tìm kiếm của bạn. Hãy thử từ khóa khác hoặc dọn lọc lại.'
                      : 'Kho công thức trống rỗng. Hãy thêm món ăn mới đầu tiên để sẵn sàng chuẩn bị nấu nướng!'}
                  </p>
                  {dishSearch ? (
                    <button
                      onClick={() => setDishSearch('')}
                      className="px-5 py-2.5 bg-red-50 hover:bg-[#FFEAEA] text-[#FF7675] text-sm font-bold rounded-2xl transition-all cursor-pointer"
                    >
                      Xóa bộ lọc hành trình
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenCreateDish}
                      className="px-5 py-2.5 bg-[#FF7675] hover:bg-[#E17055] text-white text-sm font-extrabold rounded-2xl shadow-md transition-all cursor-pointer"
                    >
                      Thêm món ăn mới
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* =======================================
            TAB 2: HANDY NOTES & WISHLISTS PANEL
            ======================================= */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            
            {/* Notes Search input layout */}
            <div className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nội dung ghi chú nhanh..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full text-sm placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-10 py-3.5 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-[#4834D4]/10 focus:border-[#4834D4] font-medium"
                  id="note-search-input"
                />
                {noteSearch && (
                  <button
                    onClick={() => setNoteSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-semibold text-xs px-2.5 py-1"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>

            {/* Note lists (with Pinned separating at the top exactly like Google Keep) */}
            <AnimatePresence mode="popLayout">
              {filteredNotes.length > 0 ? (
                <div className="space-y-8">
                  {/* Pinned section header line */}
                  {pinnedNotes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <span>📌 Ghi chú cố định được ghim</span>
                        <div className="h-[1px] bg-slate-200 flex-1 ml-2" />
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {pinnedNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onEdit={handleOpenEditNote}
                            onDelete={requestDeleteNote}
                            onTogglePin={handleTogglePinNote}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other standard unpinned notes */}
                  <div className="space-y-3">
                    {pinnedNotes.length > 0 && unpinnedNotes.length > 0 && (
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <span>Khác</span>
                        <div className="h-[1px] bg-slate-200 flex-1 ml-2" />
                      </h4>
                    )}
                    {unpinnedNotes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {unpinnedNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onEdit={handleOpenEditNote}
                            onDelete={requestDeleteNote}
                            onTogglePin={handleTogglePinNote}
                          />
                        ))}
                      </div>
                    ) : pinnedNotes.length === 0 ? (
                      <div className="text-center font-medium text-slate-400 text-sm">Chưa có ghi chú nào khác.</div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-xs text-center border-dashed border-2 min-h-[300px]"
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-[#4834D4]/80">
                    <BookText className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-slate-700 text-lg mb-1">Không có ghi chú nào của bạn</h3>
                  <p className="text-slate-400 text-sm max-w-md mb-6 font-medium">
                    {noteSearch 
                      ? 'Nền tảng kiểm tra không thấy ghi chú khớp từ khóa bạn nhập. Hãy thử lọc nhanh từ khóa khác.'
                      : 'Mục sổ tay trống trơn. Tạo ghi chú mới đầu tiên để sẵn sàng chuẩn bị đi chợ cho bếp ăn!'}
                  </p>
                  {noteSearch ? (
                    <button
                      onClick={() => setNoteSearch('')}
                      className="px-5 py-2.5 bg-[#4834D4]/10 hover:bg-[#4834D4]/20 text-[#4834D4] text-sm font-bold rounded-2xl cursor-pointer"
                    >
                      Xem tất cả ghi chú
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenCreateNote}
                      className="px-5 py-2.5 bg-[#4834D4] hover:bg-[#3B2BB0] text-white text-sm font-extrabold rounded-2xl shadow-md transition-all cursor-pointer"
                    >
                      Tạo ghi chú đầu tiên
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </main>

      {/* 3. Floating Action Buttons (FABs) for Mobile Sizing */}
      <div className="sm:hidden fixed bottom-20 right-5 z-40">
        <button
          onClick={activeTab === 'dishes' ? handleOpenCreateDish : handleOpenCreateNote}
          type="button"
          className={`w-14 h-14 bg-gradient-to-tr text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
            activeTab === 'dishes' ? 'from-[#FF7675] to-[#E17055]' : 'from-[#4834D4] to-[#686DE0]'
          }`}
          id="btn-fab-add"
          title={activeTab === 'dishes' ? 'Thêm món ăn' : 'Thêm ghi chú'}
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* 4. Fixed Native Bottom Navigation Hub (Highly Optimized for Mobile Screens) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-6 py-2.5 flex justify-around items-center z-45 shadow-2xl">
        <button
          onClick={() => { setActiveTab('dishes'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          type="button"
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'dishes' ? 'text-[#FF7675] scale-105 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'
          }`}
          id="mobile-nav-dishes"
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'dishes' ? 'bg-[#FFEAEA]' : 'bg-transparent'}`}>
            <Utensils className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] uppercase tracking-wider">Công Thức</span>
        </button>

        <button
          onClick={() => { setActiveTab('notes'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          type="button"
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'notes' ? 'text-[#4834D4] scale-105 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'
          }`}
          id="mobile-nav-notes"
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'notes' ? 'bg-indigo-50' : 'bg-transparent'}`}>
            <BookText className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] uppercase tracking-wider">Ghi Chú</span>
        </button>
      </nav>

      {/* =======================================
          MODAL VIEWS MANAGER (COMPONENTS OUTLETS)
          ======================================= */}
      {/* A. Note creation and editing panel */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => { setIsNoteModalOpen(false); setSelectedNote(null); }}
        onSave={handleSaveNote}
        initialNote={selectedNote}
      />

      {/* B. Dish details inspection, adding, and editing wizard */}
      <DishModal
        isOpen={isDishModalOpen}
        onClose={() => { setIsDishModalOpen(false); setSelectedDish(null); }}
        dish={selectedDish}
        mode={dishModalMode}
        onSave={handleSaveDish}
        onSwitchToEdit={handleSwitchToEditDish}
      />

      {/* C. Clean, elegant, in-app Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0"
            />

            {/* Dialog Content Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden border border-slate-100"
              id="delete-confirmation-dialog"
            >
              <div className="w-14 h-14 bg-red-100/70 text-[#FF7675]/90 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg tracking-tight mb-2">
                Xác nhận hành động xóa
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                Bạn có chắc chắn muốn xóa {deleteConfirm.type === 'dish' ? 'món ăn' : 'ghi chú'}{' '}
                <strong className="text-slate-800 font-bold break-all bg-slate-50 border border-slate-200/50 px-1.5 py-0.5 rounded-lg">
                  {deleteConfirm.title}
                </strong>
                ? Hành động này sẽ loại bỏ dữ liệu vĩnh viễn khỏi kho lưu trữ và không thể hoàn tác.
              </p>

              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Hủy thao tác
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 bg-[#FF7675] hover:bg-[#E17055] text-white rounded-2xl text-xs font-black transition-all cursor-pointer text-center shadow-xs"
                  id="btn-confirm-delete"
                >
                  Đồng ý xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
