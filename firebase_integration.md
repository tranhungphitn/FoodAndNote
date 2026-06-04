# Hướng Dẫn Kết Nối Ứng Dụng "Leo's Ghi Chú" Với Firebase

Tài liệu này hướng dẫn chi tiết cách kết nối ứng dụng của bạn với **Firebase Firestore Database** để thay thế cho bộ lưu trữ tệp tin JSON cục bộ (`data/dishes.json` và `data/notes.json`).

Bạn có hai giải pháp tích hợp chính tùy thuộc vào nhu cầu kiến trúc:
1. **Giải pháp 1 (Serverless - Khuyên dùng cho ứng dụng nhỏ):** React Frontend kết nối trực tiếp với Firebase Cloud Firestore. Không cần chạy máy chủ Node.js/Express (`server.ts`).
2. **Giải pháp 2 (Fullstack - Giữ nguyên máy chủ):** Máy chủ Node.js/Express (`server.ts`) đóng vai trò proxy kết nối với Firebase bằng SDK Admin, các API Client giữ nguyên.

---

## 📋 Bước chuẩn bị trên Firebase Console

1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Nhấp vào **Add project** (Thêm dự án), điền tên dự án (ví dụ: `LeosGhiChu`) và tạo dự án.
3. Tại trang tổng quan dự án, chọn biểu tượng **Web `</>`** để đăng ký ứng dụng Web. Nhập tên ứng dụng và nhấp **Register app**.
4. Sao chép lại đối tượng cấu hình **`firebaseConfig`** hiển thị trên màn hình:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "leosghichu.firebaseapp.com",
     projectId: "leosghichu",
     storageBucket: "leosghichu.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. Ở menu bên trái, nhấp vào **Build** $\rightarrow$ **Firestore Database** và chọn **Create database**.
6. Chọn chế độ **Start in test mode** (Bắt đầu ở chế độ thử nghiệm) để tạm thời cho phép đọc/ghi mà không cần đăng nhập, chọn khu vực lưu trữ (Region) và nhấn **Enable**.

---

## 🛠️ Giải pháp 1: Kết nối trực tiếp từ React Frontend (Serverless)

Giải pháp này loại bỏ hoàn toàn mã nguồn máy chủ Express. React client sẽ trực tiếp đọc/ghi dữ liệu thời gian thực tới Firestore.

### Bước 1: Cài đặt Firebase SDK
Mở terminal tại thư mục gốc của dự án và chạy:
```bash
npm install firebase
```

### Bước 2: Thêm biến môi trường vào `.env.local`
Thêm thông tin Firebase của bạn vào tệp `.env.local`:
```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="leosghichu.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="leosghichu"
VITE_FIREBASE_STORAGE_BUCKET="leosghichu.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

### Bước 3: Tạo tệp cấu hình Firebase client
Tạo tệp mới `src/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### Bước 4: Cập nhật App.tsx để tương tác với Firestore
Thay thế các hàm gọi API REST trong `src/App.tsx` bằng SDK Firestore:

```typescript
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';

// 1. Tải dữ liệu khi mở ứng dụng
useEffect(() => {
  const loadData = async () => {
    try {
      // Tải Dishes
      const dishesCol = collection(db, 'dishes');
      const dishesSnapshot = await getDocs(query(dishesCol, orderBy('updatedAt', 'desc')));
      const dishesList = dishesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dish));
      setDishes(dishesList);

      // Tải Notes
      const notesCol = collection(db, 'notes');
      const notesSnapshot = await getDocs(query(notesCol, orderBy('updatedAt', 'desc')));
      const notesList = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(notesList);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu từ Firestore:", err);
    } finally {
      setIsLoading(false);
    }
  };
  loadData();
}, []);

// 2. Thêm hoặc cập nhật món ăn
const handleSaveDish = async (dishData: Omit<Dish, 'id' | 'updatedAt'>) => {
  const payload = {
    ...dishData,
    updatedAt: new Date().toISOString()
  };

  try {
    if (dishFormMode === 'edit' && selectedDish) {
      // Cập nhật
      const dishDocRef = doc(db, 'dishes', selectedDish.id);
      await updateDoc(dishDocRef, payload);
      setDishes(prev => prev.map(d => d.id === selectedDish.id ? { ...d, ...payload } : d));
    } else {
      // Thêm mới
      const dishesCol = collection(db, 'dishes');
      const docRef = await addDoc(dishesCol, payload);
      setDishes(prev => [{ id: docRef.id, ...payload }, ...prev]);
    }
  } catch (err) {
    console.error("Lỗi khi lưu món ăn:", err);
  }
  setDishFormMode(null);
  setSelectedDish(null);
};

// 3. Xóa món ăn
const handleDeleteDish = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'dishes', id));
    setDishes(prev => prev.filter(d => d.id !== id));
  } catch (err) {
    console.error("Lỗi khi xóa món ăn:", err);
  }
};
```

*(Làm tương tự đối với các hàm xử lý Ghi chú (`handleSaveNote`, `handleDeleteNote`, `handleTogglePinNote`))*

---

## 💻 Giải pháp 2: Kết nối từ Node.js Express Server (Fullstack)

Nếu bạn muốn giữ nguyên máy chủ trung gian Express (`server.ts`) để phục vụ tệp Static, bảo mật logic hoặc giấu API Key Firebase khỏi Client:

### Bước 1: Tạo khóa bí mật Admin SDK
1. Trong Firebase Console, vào **Project Settings** (Cài đặt dự án) $\rightarrow$ **Service accounts** (Tài khoản dịch vụ).
2. Nhấp chọn **Generate new private key** (Tạo khóa riêng tư mới), tệp JSON chứa khóa bảo mật sẽ được tải xuống máy của bạn.
3. Đổi tên tệp này thành `firebase-service-account.json` và lưu vào thư mục gốc của dự án.

### Bước 2: Cài đặt thư viện Firebase Admin
Tại thư mục gốc, chạy lệnh:
```bash
npm install firebase-admin
```

### Bước 3: Cấu hình kết nối Firestore trong `server.ts`
Chỉnh sửa `server.ts` để đọc/ghi qua Admin SDK thay vì đọc ghi file JSON:

```typescript
import * as admin from 'firebase-admin';

// Khởi tạo Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sửa API GET /api/dishes
app.get('/api/dishes', async (req, res) => {
  try {
    const snapshot = await db.collection('dishes').orderBy('updatedAt', 'desc').get();
    const dishes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(dishes);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tải món ăn từ Firestore.' });
  }
});

// Sửa API POST /api/dishes
app.post('/api/dishes', async (req, res) => {
  try {
    const dishData = req.body;
    const payload = {
      name: dishData.name,
      category: dishData.category,
      ingredients: dishData.ingredients,
      instructions: dishData.instructions,
      imageUrl: dishData.imageUrl,
      updatedAt: new Date().toISOString()
    };

    if (dishData.id) {
      // Edit
      await db.collection('dishes').doc(dishData.id).update(payload);
      return res.json({ id: dishData.id, ...payload });
    } else {
      // Create
      const docRef = await db.collection('dishes').add(payload);
      return res.status(201).json({ id: docRef.id, ...payload });
    }
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lưu món ăn lên Firestore.' });
  }
});

// Sửa API DELETE /api/dishes/:id
app.delete('/api/dishes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('dishes').doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa món ăn trên Firestore.' });
  }
});
```

---

> [!NOTE]  
> Cấu hình Rules trên Firestore mặc định (Test mode) sẽ hết hạn sau 30 ngày. Hãy cập nhật lại luật bảo mật (Rules) trong tab **Rules** trên Firebase Console để tránh mất kết nối dữ liệu sau khi deploy sản phẩm thực tế.
