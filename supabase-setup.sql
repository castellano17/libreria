-- Crear tabla de favoritos de usuario
CREATE TABLE IF NOT EXISTS user_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Crear tabla de descargas de usuario
CREATE TABLE IF NOT EXISTS user_downloads (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL,
  download_type VARCHAR(20) DEFAULT 'direct', -- 'direct' o 'kindle'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de configuración de usuario
CREATE TABLE IF NOT EXISTS user_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  kindle_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de progreso de lectura
CREATE TABLE IF NOT EXISTS user_reading_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL,
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Crear tabla de listas personalizadas
CREATE TABLE IF NOT EXISTS user_lists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de libros en listas
CREATE TABLE IF NOT EXISTS user_list_books (
  id BIGSERIAL PRIMARY KEY,
  list_id BIGINT REFERENCES user_lists(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, book_id)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_list_books ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para user_favorites
CREATE POLICY "Users can view their own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas de seguridad para user_downloads
CREATE POLICY "Users can view their own downloads" ON user_downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own downloads" ON user_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas de seguridad para user_settings
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas de seguridad para user_reading_progress
CREATE POLICY "Users can view their own reading progress" ON user_reading_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading progress" ON user_reading_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress" ON user_reading_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading progress" ON user_reading_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas de seguridad para user_lists
CREATE POLICY "Users can view their own lists" ON user_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lists" ON user_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON user_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON user_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas de seguridad para user_list_books
CREATE POLICY "Users can view books in their own lists" ON user_list_books
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_lists 
      WHERE user_lists.id = user_list_books.list_id 
      AND user_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert books in their own lists" ON user_list_books
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_lists 
      WHERE user_lists.id = user_list_books.list_id 
      AND user_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete books from their own lists" ON user_list_books
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_lists 
      WHERE user_lists.id = user_list_books.list_id 
      AND user_lists.user_id = auth.uid()
    )
  );

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_book_id ON user_favorites(book_id);
CREATE INDEX IF NOT EXISTS idx_user_downloads_user_id ON user_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_downloads_book_id ON user_downloads(book_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_progress_user_id ON user_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_progress_book_id ON user_reading_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON user_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_list_books_list_id ON user_list_books(list_id);
CREATE INDEX IF NOT EXISTS idx_user_list_books_book_id ON user_list_books(book_id);