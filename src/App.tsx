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

// Google Firebase Firestore Connection
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

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
  const [syncError, setSyncError] = useState<string | null>(null);

  // User Role/Login states
  const [userRole, setUserRole] = useState<'admin' | 'guest' | null>(() => {
    const savedRole = localStorage.getItem('sotay_user_role');
    return (savedRole === 'admin' || savedRole === 'guest') ? savedRole : null;
  });
  const [loginMode, setLoginMode] = useState<'admin' | 'guest'>('guest');
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1478965') {
      localStorage.setItem('sotay_user_role', 'admin');
      setUserRole('admin');
      setPassword('');
      setPassError('');
    } else {
      setPassError('Mật khẩu không chính xác. Vui lòng thử lại!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sotay_user_role');
    setUserRole(null);
  };

  // Load from Firebase Firestore on mount
  useEffect(() => {
    const checkAndInitData = async () => {
      try {
        const dishesCol = collection(db, 'dishes');
        const notesCol = collection(db, 'notes');
        
        const [dishesSnapshot, notesSnapshot] = await Promise.all([
          getDocs(dishesCol),
          getDocs(notesCol)
        ]);

        const fetchedDishes = dishesSnapshot.docs.map(doc => doc.data() as Dish);
        const fetchedNotes = notesSnapshot.docs.map(doc => doc.data() as Note);

        // Seeding database if empty on first startup
        if (fetchedDishes.length === 0 && fetchedNotes.length === 0) {
          await Promise.all([
            ...SAMPLE_DISHES.map(d => setDoc(doc(db, 'dishes', d.id), d)),
            ...SAMPLE_NOTES.map(n => setDoc(doc(db, 'notes', n.id), n))
          ]);
          setDishes(SAMPLE_DISHES);
          setNotes(SAMPLE_NOTES);
        } else {
          // Sort dishes by updatedAt descending
          fetchedDishes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          // Sort notes by updatedAt descending
          fetchedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setDishes(fetchedDishes);
          setNotes(fetchedNotes);
        }
        setSyncError(null);
      } catch (err: any) {
        console.error('Failed to connect to Firebase Firestore, falling back to offline cache:', err);
        setSyncError(`Lỗi kết nối Firebase (đang dùng Offline Cache): ${err.message || err}`);
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
  const [showSuggestions, setShowSuggestions] = useState(false);
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
    const targetDish: Dish = {
      id: (dishFormMode === 'edit' && selectedDish) ? selectedDish.id : `dish-${Date.now()}`,
      name: dishData.name,
      category: dishData.category,
      ingredients: dishData.ingredients,
      instructions: dishData.instructions,
      imageUrl: dishData.imageUrl,
      isFavorite: !!dishData.isFavorite,
      summary: dishData.summary || '',
      createdAt: (dishFormMode === 'edit' && selectedDish) ? (selectedDish.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Optimistic UI state update
    if (dishFormMode === 'edit' && selectedDish) {
      setDishes(prev => prev.map(d => d.id === selectedDish.id ? targetDish : d));
    } else {
      setDishes(prev => [targetDish, ...prev]);
    }

    try {
      await setDoc(doc(db, 'dishes', targetDish.id), targetDish);
      setSyncError(null);
    } catch (err: any) {
      console.error('Failed to save dish to Firestore:', err);
      setSyncError(`Không thể lưu món ăn lên Firebase: ${err.message || err}`);
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
      await deleteDoc(doc(db, 'dishes', id));
      setSyncError(null);
    } catch (err: any) {
      console.error('Failed to sync deletion to Firestore:', err);
      setSyncError(`Không thể xóa món ăn trên Firebase: ${err.message || err}`);
    }
  };

  const handleToggleFavoriteDish = async (dish: Dish) => {
    const updatedDish = { ...dish, isFavorite: !dish.isFavorite };
    setDishes(prev => prev.map(d => d.id === dish.id ? updatedDish : d));
    try {
      await setDoc(doc(db, 'dishes', dish.id), updatedDish);
      setSyncError(null);
    } catch (err: any) {
      console.error('Failed to sync favorite status to Firestore:', err);
      setSyncError(`Không thể cập nhật yêu thích trên Firebase: ${err.message || err}`);
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
    const targetNote: Note = {
      id: selectedNote ? selectedNote.id : `note-${Date.now()}`,
      title,
      content,
      color,
      isPinned: selectedNote ? selectedNote.isPinned : false,
      updatedAt: new Date().toISOString()
    };

    if (selectedNote) {
      setNotes(prev => prev.map(n => n.id === selectedNote.id ? targetNote : n));
    } else {
      setNotes(prev => [targetNote, ...prev]);
    }

    try {
      await setDoc(doc(db, 'notes', targetNote.id), targetNote);
      setSyncError(null);
    } catch (err: any) {
      console.error('Failed to save note to Firestore:', err);
      setSyncError(`Không thể lưu ghi chú lên Firebase: ${err.message || err}`);
    }
    setIsNoteModalOpen(false);
    setSelectedNote(null);
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await deleteDoc(doc(db, 'notes', id));
      setSyncError(null);
    } catch (err: any) {
      console.error('Failed to sync note delete to Firestore:', err);
      setSyncError(`Không thể xóa ghi chú trên Firebase: ${err.message || err}`);
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

    const updatedNote = { ...noteToPin, isPinned: !noteToPin.isPinned, updatedAt: new Date().toISOString() };
    setNotes(prev =>
      prev.map(n => n.id === id ? updatedNote : n)
    );

    try {
      await setDoc(doc(db, 'notes', id), updatedNote);
      setSyncError(null);
    } catch (err: any) {
      console.error('Failed to sync pin toggle to Firestore:', err);
      setSyncError(`Không thể ghim ghi chú trên Firebase: ${err.message || err}`);
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

  // Search suggestions list based on current dish search keyword (limits to 5)
  const searchSuggestions = dishSearch.trim()
    ? dishes
        .filter(dish => dish.name.toLowerCase().includes(dishSearch.toLowerCase()))
        .slice(0, 5)
    : [];

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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans relative z-10">
        <div className="glass-strong rounded-3xl p-10 flex flex-col items-center gap-5">
          <div className="w-12 h-12 border-4 border-[#686DE0] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-glass-secondary text-sm font-medium">Đang kết nối cơ sở dữ liệu ẩm thực...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/login_bg.png)' }}
      >
        {/* Soft overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-xs pointer-events-none" />

        <div className="w-full max-w-md glass-strong rounded-3xl p-8 flex flex-col items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#ec4899] p-0.5 shadow-lg overflow-hidden flex items-center justify-center">
            <img src="/avatar.png" alt="Leo's Ghi Chú Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-glass-primary tracking-tight font-sans">Leo's Ghi Chú</h1>
            <p className="text-xs text-glass-secondary font-semibold">Chào mừng bạn đến với sổ tay ẩm thực và ghi chú cá nhân</p>
          </div>

          {/* Toggle buttons for Login Mode */}
          <div className="w-full p-1 rounded-2xl flex gap-1" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => {
                setLoginMode('guest');
                setPassError('');
              }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                loginMode === 'guest'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Chỉ Xem Công Thức
            </button>
            <button
              onClick={() => {
                setLoginMode('admin');
                setPassError('');
              }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                loginMode === 'admin'
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quyền Admin
            </button>
          </div>

          <div className="w-full min-h-[140px] flex flex-col justify-center">
            {loginMode === 'guest' ? (
              <div className="text-center space-y-4 py-2">
                <p className="text-sm text-glass-secondary leading-relaxed font-medium">
                  Truy cập nhanh với chế độ <strong className="text-glass-primary">Chỉ Xem Công Thức</strong>. Bạn có thể xem toàn bộ các công thức nấu ăn ngon nhưng không thể thêm, sửa, hay xóa dữ liệu.
                </p>
                <button
                  onClick={() => {
                    localStorage.setItem('sotay_user_role', 'guest');
                    setUserRole('guest');
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-[#FF7675] to-[#E17055] text-white rounded-2xl text-sm font-black active:scale-98 transition-all shadow-md shadow-[#FF7675]/30 hover:shadow-lg hover:brightness-110 cursor-pointer"
                >
                  Vào Xem Ngay
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminLogin} className="w-full space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-glass-secondary uppercase tracking-wider">
                    Nhập mật khẩu Admin
                  </label>
                  <input
                    type="password"
                    placeholder="Mật khẩu của bạn..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passError) setPassError('');
                    }}
                    className="glass-input w-full rounded-2xl px-4 py-3.5 text-sm font-medium"
                    autoFocus
                  />
                  {passError && (
                    <p className="text-xs font-semibold text-red-600 mt-1 pl-1">
                      {passError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white rounded-2xl text-sm font-black active:scale-98 transition-all shadow-md shadow-indigo-500/30 hover:brightness-110 hover:shadow-lg cursor-pointer"
                >
                  Xác nhận Admin
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (dishFormMode) {
    return (
      <div className="min-h-screen flex flex-col font-sans pb-8 relative z-10">
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
    <div className="min-h-screen text-slate-800 flex flex-col font-sans relative pb-24 sm:pb-8">
      
      {/* 1. Header — Liquid Glass */}
      <header className="glass relative overflow-hidden shrink-0 sticky top-0 z-50" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
        {/* Subtle color tint strip */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/5 via-[#8b5cf6]/5 to-[#ec4899]/5 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="glass-card p-0.5 rounded-xl w-9 h-9 shrink-0 overflow-hidden flex items-center justify-center">
              <img src="/avatar.png" alt="Leo's Ghi Chú Logo" className="w-full h-full object-cover rounded-lg" />
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-glass-primary font-sans">
              Leo's Ghi Chú
            </h1>
          </div>

          {/* Admin status badge & logout/login trigger */}
          <div className="flex items-center gap-2">
            {userRole === 'admin' ? (
              <>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold px-3 py-1.5 rounded-2xl">
                  Admin
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-glass text-xs font-bold px-3 py-1.5 rounded-2xl active:scale-95 transition-all cursor-pointer"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <span className="btn-glass text-xs font-bold px-3 py-1.5 rounded-2xl">
                  Chỉ Xem
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-[#FF7675] to-[#E17055] text-white text-xs font-black px-3 py-1.5 rounded-2xl shadow-md shadow-[#FF7675]/25 active:scale-95 transition-all cursor-pointer hover:brightness-110"
                >
                  Đăng nhập Admin
                </button>
              </>
            )}
          </div>
        </div>
      </header>


      {/* 2. Main Content Container block */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-6">
        
        {syncError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">
              <p className="font-bold text-amber-950">Lỗi đồng bộ Firebase (Ghi chú được lưu tạm thời trên trình duyệt của bạn)</p>
              <p className="opacity-90 mt-1">{syncError}</p>
              <div className="text-xs text-amber-800/80 mt-2 space-y-1">
                <p>Vì ứng dụng có cơ chế Offline Cache, các thay đổi vẫn được cập nhật tạm thời tại giao diện, nhưng <strong>chưa đồng bộ được lên cơ sở dữ liệu Firebase</strong>.</p>
                <p className="font-semibold text-amber-950 mt-2">Cách khắc phục:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>
                    <strong>Bước 1:</strong> Truy cập vào <strong>Firebase Console</strong> -&gt; Chọn dự án <strong>foodandnote</strong>.
                  </li>
                  <li>
                    <strong>Bước 2:</strong> Vào mục <strong>Firestore Database</strong> ở cột trái -&gt; Chọn tab <strong>Rules</strong> ở trên cùng.
                  </li>
                  <li>
                    <strong>Bước 3:</strong> Thay đổi cấu hình Rules thành:
                    <pre className="bg-amber-100/60 p-2 rounded-lg mt-1 text-[11px] font-mono border border-amber-200/50">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                    </pre>
                  </li>
                  <li>
                    <strong>Bước 4:</strong> Bấm nút <strong>Publish</strong> màu xanh để lưu lại.
                  </li>
                </ul>
              </div>
            </div>
            <button 
              onClick={() => setSyncError(null)}
              className="text-amber-500 hover:text-amber-700 font-bold px-2 py-0.5 rounded-lg hover:bg-amber-100/50 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}
        
        {/* Desktop Quick Nav Tabs (Hidden on mobile as it relies on Native Bottom Bar) */}
        <div className="hidden sm:flex items-center justify-between pb-1 mb-3 font-sans">
          <div className="flex gap-1.5 p-1.5 glass rounded-2xl">
            <button
              onClick={() => setActiveTab('dishes')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
                activeTab === 'dishes'
                  ? 'bg-[#FF7675] text-white shadow-md shadow-[#FF7675]/20'
                  : 'text-glass-secondary hover:text-glass-primary hover:bg-slate-100'
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
                  ? 'bg-[#6366f1] text-white shadow-md shadow-indigo-500/20'
                  : 'text-glass-secondary hover:text-glass-primary hover:bg-slate-100'
              }`}
              id="desktop-tab-notes"
            >
              <Notebook className="w-4 h-4" />
              Ghi Chú ({totalNotesCount})
            </button>
          </div>

          {userRole === 'admin' && (
            <button
              onClick={activeTab === 'dishes' ? handleOpenCreateDish : handleOpenCreateNote}
              className={`flex items-center gap-1.5 px-5 py-3 text-white rounded-xl text-sm font-black active:scale-98 transition-all cursor-pointer shadow-md hover:brightness-110 ${
                activeTab === 'dishes' ? 'bg-gradient-to-r from-[#FF7675] to-[#E17055] shadow-[#FF7675]/25' : 'bg-gradient-to-r from-[#6366f1] to-[#4f46e5] shadow-indigo-500/25'
              }`}
              id="desktop-btn-add-primary"
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'dishes' ? 'Thêm món ăn mới' : 'Tạo ghi chú mới'}
            </button>
          )}
        </div>

        {/* =======================================
            TAB 1: RECIPES & DISHES CONTROLS PANEL
            ======================================= */}
        {activeTab === 'dishes' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Search, Filter Bar */}
            <div className="flex flex-col gap-3 sm:gap-4 glass p-3 sm:p-5 rounded-2xl sm:rounded-3xl">
              <div className="relative">
                <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm món ngon theo tên, nguyên liệu, phân loại..."
                  value={dishSearch}
                  onChange={(e) => {
                    setDishSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="glass-input w-full text-xs sm:text-sm rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3.5 font-medium"
                  id="dish-search-input"
                />
                {dishSearch && (
                  <button
                    onClick={() => {
                      setDishSearch('');
                      setShowSuggestions(false);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs px-2 py-1 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    Xóa
                  </button>
                )}

                {/* Search Suggestions Dropdown Overlay */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <>
                    <div 
                       className="fixed inset-0 z-10" 
                      onClick={() => setShowSuggestions(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-2 glass-strong rounded-2xl z-20 overflow-hidden divide-y divide-slate-100">
                      {searchSuggestions.map((dish) => (
                        <div 
                          key={dish.id}
                          className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
                          onClick={() => {
                            setDishSearch(dish.name);
                            setShowSuggestions(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                              <img 
                                src={dish.imageUrl || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=150'} 
                                alt={dish.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-glass-primary">{dish.name}</p>
                              <span className="inline-block text-[10px] text-[#FF7675] font-bold bg-[#FF7675]/10 px-2 py-0.5 rounded-md mt-0.5">
                                {dish.category}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDishDetails(dish);
                              setShowSuggestions(false);
                            }}
                            className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                          >
                            Xem nhanh
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
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
                        readOnly={userRole !== 'admin'}
                      />
                    ))}
                  </div>

                  {/* Pagination Navigation Controls */}
                  {totalDishPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                      <button
                        onClick={() => setCurrentDishPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentDishPage === 1}
                        className="px-4 py-2 text-xs font-bold btn-glass rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                              ? 'bg-[#FF7675] text-white shadow-md shadow-[#FF7675]/30'
                              : 'btn-glass'
                          }`}
                          type="button"
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentDishPage(prev => Math.min(prev + 1, totalDishPages))}
                        disabled={currentDishPage === totalDishPages}
                        className="px-4 py-2 text-xs font-bold btn-glass rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                  className="flex flex-col items-center justify-center p-12 glass rounded-3xl text-center border-dashed border border-white/20 min-h-[300px]"
                >
                  <div className="w-16 h-16 bg-[#FF7675]/15 rounded-full flex items-center justify-center mb-4 text-[#FF7675]">
                    <Utensils className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-glass-primary text-lg mb-1">
                    {dishSearch ? 'Không tìm thấy món ăn phù hợp' : 'Chưa có món ăn nào'}
                  </h3>
                  <p className="text-glass-secondary text-sm max-w-md mb-6 font-medium">
                    {dishSearch 
                      ? 'Nền tảng chưa tìm thấy món ăn khớp từ kho từ khóa tìm kiếm của bạn. Hãy thử từ khóa khác hoặc dọn lọc lại.'
                      : 'Kho công thức trống rỗng. Hãy thêm món ăn mới đầu tiên để sẵn sàng chuẩn bị nấu nướng!'}
                  </p>
                  {dishSearch ? (
                    <button
                      onClick={() => setDishSearch('')}
                      className="px-5 py-2.5 bg-[#FF7675]/15 hover:bg-[#FF7675]/25 text-[#FF7675] text-sm font-bold rounded-2xl transition-all cursor-pointer"
                    >
                      Xóa bộ lọc hành trình
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenCreateDish}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#FF7675] to-[#E17055] text-white text-sm font-extrabold rounded-2xl shadow-md shadow-[#FF7675]/30 transition-all cursor-pointer hover:brightness-110"
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
          <div className="space-y-4 sm:space-y-6">
            
            {/* Notes Search input layout */}
            <div className="glass p-3 sm:p-4 rounded-2xl sm:rounded-3xl">
              <div className="relative">
                <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nội dung ghi chú nhanh..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="glass-input w-full text-xs sm:text-sm rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3.5 font-medium"
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
                            readOnly={userRole !== 'admin'}
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
                            readOnly={userRole !== 'admin'}
                          />
                        ))}
                      </div>
                    ) : pinnedNotes.length === 0 ? (
                      <div className="text-center font-medium text-glass-secondary text-sm">Chưa có ghi chú nào khác.</div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center p-12 glass rounded-3xl text-center border-dashed border border-slate-200 min-h-[300px]"
                >
                  <div className="w-16 h-16 bg-[#6366f1]/10 rounded-full flex items-center justify-center mb-4 text-[#6366f1]">
                    <BookText className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-glass-primary text-lg mb-1">Không có ghi chú nào của bạn</h3>
                  <p className="text-glass-secondary text-sm max-w-md mb-6 font-medium">
                    {noteSearch 
                      ? 'Nền tảng kiểm tra không thấy ghi chú khớp từ khóa bạn nhập. Hãy thử lọc nhanh từ khóa khác.'
                      : 'Mục sổ tay trống trơn. Tạo ghi chú mới đầu tiên để sẵn sàng chuẩn bị đi chợ cho bếp ăn!'}
                  </p>
                  {noteSearch ? (
                    <button
                      onClick={() => setNoteSearch('')}
                      className="px-5 py-2.5 bg-[#6366f1]/10 hover:bg-[#6366f1]/20 text-[#6366f1] text-sm font-bold rounded-2xl cursor-pointer"
                    >
                      Xem tất cả ghi chú
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenCreateNote}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white text-sm font-extrabold rounded-2xl shadow-md shadow-indigo-500/25 transition-all cursor-pointer hover:brightness-110"
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
      {userRole === 'admin' && (
        <div className="sm:hidden fixed bottom-20 right-5 z-40">
          <button
            onClick={activeTab === 'dishes' ? handleOpenCreateDish : handleOpenCreateNote}
            type="button"
            className={`w-14 h-14 bg-gradient-to-tr text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
              activeTab === 'dishes' ? 'from-[#FF7675] to-[#E17055]' : 'from-[#6366f1] to-[#4f46e5]'
            }`}
            id="btn-fab-add"
            title={activeTab === 'dishes' ? 'Thêm món ăn' : 'Thêm ghi chú'}
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* 4. Fixed Native Bottom Navigation Hub (Highly Optimized for Mobile Screens) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 glass px-6 py-2.5 flex justify-around items-center z-45" style={{ borderBottom: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
        <button
          onClick={() => { setActiveTab('dishes'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          type="button"
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'dishes' ? 'text-[#FF7675] scale-105 font-black' : 'text-slate-400 font-bold'
          }`}
          id="mobile-nav-dishes"
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'dishes' ? 'bg-[#FF7675]/10' : 'bg-transparent'}`}>
            <Utensils className="w-5.5 h-5.5" />
          </div>
          <span className="text-[10px] uppercase tracking-wider">Công Thức</span>
        </button>

        <button
          onClick={() => { setActiveTab('notes'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          type="button"
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'notes' ? 'text-[#6366f1] scale-105 font-black' : 'text-slate-400 font-bold'
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
        readOnly={userRole !== 'admin'}
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
