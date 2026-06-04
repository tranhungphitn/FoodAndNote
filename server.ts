import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { SAMPLE_DISHES, SAMPLE_NOTES } from './src/sampleData';
import { Dish, Note } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 4123;

  // Mount JSON parser body limit
  app.use(express.json({ limit: '10mb' }));

  // Ensure persistent data directory exists at project root
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dishesPath = path.join(dataDir, 'dishes.json');
  const notesPath = path.join(dataDir, 'notes.json');

  // Helper functions for reading/writing persistent JSON files
  const readDishes = (): Dish[] => {
    try {
      if (fs.existsSync(dishesPath)) {
        const fileContent = fs.readFileSync(dishesPath, 'utf8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.error('Error reading dishes.json, reverting to sample data:', err);
    }
    // Write sample dishes to file if not present
    fs.writeFileSync(dishesPath, JSON.stringify(SAMPLE_DISHES, null, 2), 'utf8');
    return SAMPLE_DISHES;
  };

  const writeDishes = (dishes: Dish[]) => {
    fs.writeFileSync(dishesPath, JSON.stringify(dishes, null, 2), 'utf8');
  };

  const readNotes = (): Note[] => {
    try {
      if (fs.existsSync(notesPath)) {
        const fileContent = fs.readFileSync(notesPath, 'utf8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.error('Error reading notes.json, reverting to sample data:', err);
    }
    // Write sample notes to file if not present
    fs.writeFileSync(notesPath, JSON.stringify(SAMPLE_NOTES, null, 2), 'utf8');
    return SAMPLE_NOTES;
  };

  const writeNotes = (notes: Note[]) => {
    fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2), 'utf8');
  };

  // Initialize data files if not already present on start
  readDishes();
  readNotes();

  // ----- REST API routes -----

  // 1. DISHES ENDPOINTS
  app.get('/api/dishes', (req, res) => {
    try {
      const dishes = readDishes();
      res.json(dishes);
    } catch (err) {
      res.status(500).json({ error: 'Failed to read dishes.' });
    }
  });

  app.post('/api/dishes', (req, res) => {
    try {
      const dishes = readDishes();
      const dishData = req.body;

      if (dishData.id) {
        // Edit mode
        const index = dishes.findIndex(d => d.id === dishData.id);
        if (index !== -1) {
          dishes[index] = {
            ...dishes[index],
            ...dishData,
            updatedAt: new Date().toISOString()
          };
          writeDishes(dishes);
          return res.json(dishes[index]);
        }
      }

      // Create mode
      const newDish: Dish = {
        id: dishData.id || `dish-${Date.now()}`,
        name: dishData.name || 'Món ăn mới',
        category: dishData.category || 'Linh Tinh',
        ingredients: dishData.ingredients || '',
        instructions: dishData.instructions || '',
        imageUrl: dishData.imageUrl || '',
        isFavorite: !!dishData.isFavorite,
        summary: dishData.summary || '',
        updatedAt: new Date().toISOString()
      };
      dishes.unshift(newDish);
      writeDishes(dishes);
      res.status(201).json(newDish);
    } catch (err) {
      res.status(500).json({ error: 'Failed to save dish.' });
    }
  });

  app.delete('/api/dishes/:id', (req, res) => {
    try {
      const { id } = req.params;
      let dishes = readDishes();
      dishes = dishes.filter(d => d.id !== id);
      writeDishes(dishes);
      res.json({ success: true, message: `Dish ${id} deleted successfully.` });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete dish.' });
    }
  });

  // 2. NOTES ENDPOINTS
  app.get('/api/notes', (req, res) => {
    try {
      const notes = readNotes();
      res.json(notes);
    } catch (err) {
      res.status(500).json({ error: 'Failed to read notes.' });
    }
  });

  app.post('/api/notes', (req, res) => {
    try {
      const notes = readNotes();
      const noteData = req.body;

      if (noteData.id) {
        // Edit mode
        const index = notes.findIndex(n => n.id === noteData.id);
        if (index !== -1) {
          notes[index] = {
            ...notes[index],
            ...noteData,
            updatedAt: new Date().toISOString()
          };
          writeNotes(notes);
          return res.json(notes[index]);
        }
      }

      // Create mode
      const newNote: Note = {
        id: noteData.id || `note-${Date.now()}`,
        title: noteData.title || 'Ghi chú mới',
        content: noteData.content || '',
        color: noteData.color || '#FEF9E7',
        isPinned: noteData.isPinned !== undefined ? noteData.isPinned : false,
        updatedAt: new Date().toISOString()
      };
      notes.unshift(newNote);
      writeNotes(notes);
      res.status(201).json(newNote);
    } catch (err) {
      res.status(500).json({ error: 'Failed to save note.' });
    }
  });

  app.delete('/api/notes/:id', (req, res) => {
    try {
      const { id } = req.params;
      let notes = readNotes();
      notes = notes.filter(n => n.id !== id);
      writeNotes(notes);
      res.json({ success: true, message: `Note ${id} deleted successfully.` });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete note.' });
    }
  });

  app.post('/api/restore', (req, res) => {
    try {
      writeDishes(SAMPLE_DISHES);
      writeNotes(SAMPLE_NOTES);
      res.json({ dishes: SAMPLE_DISHES, notes: SAMPLE_NOTES });
    } catch (err) {
      res.status(500).json({ error: 'Failed to restore default sample data.' });
    }
  });

  // Mount Vite middleware for development or serve custom built target for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FULLSTACK] Server running on http://localhost:${PORT}`);
  });
}

startServer();
