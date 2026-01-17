# Biblioteca EPUB - MVP

Aplicación web para gestionar bibliotecas de 100k+ libros EPUB.

## Inicio Rápido (macOS)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Indexar biblioteca

Abre http://localhost:5173 y haz clic en "Escanear" para indexar tus EPUBs.

## Docker (Ubuntu Server)

```bash
# Editar docker-compose.yml para ajustar la ruta de la biblioteca
docker-compose up -d
```

## API Endpoints

- `GET /api/books` - Lista libros (paginado, con búsqueda)
- `GET /api/books/{id}` - Detalle de un libro
- `GET /api/authors` - Lista de autores
- `POST /api/scan` - Iniciar escaneo
- `GET /api/scan/status` - Estado del escaneo
- `GET /api/stats` - Estadísticas
- `GET /covers/{filename}` - Portadas
