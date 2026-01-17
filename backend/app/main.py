"""
FastAPI Backend para la Biblioteca EPUB.
"""
import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Depends, Query, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

from .database import get_db, init_db
from .models import Book
from .schemas import BookResponse, PaginatedBooks, ScanStatus
from .scanner import EPUBScanner

# Rutas dinámicas desde variables de entorno
LIBRARY_PATH = os.getenv("LIBRARY_PATH", "/Volumes/EsmirSD/biblioteca_libros")
COVERS_DIR = os.getenv("COVERS_PATH", "./covers")

scanner = EPUBScanner(LIBRARY_PATH, COVERS_DIR)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="EPUB Library API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(COVERS_DIR, exist_ok=True)
app.mount("/covers", StaticFiles(directory=COVERS_DIR), name="covers")


@app.get("/api/books", response_model=PaginatedBooks)
def get_books(
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    search: str = Query(None, max_length=200),
    author: str = Query(None, max_length=200),
    genre: str = Query(None, max_length=200),
    language: str = Query(None, max_length=50),
    publisher: str = Query(None, max_length=200),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * page_size
    query = db.query(Book)
    count_query = db.query(func.count(Book.id))

    if search:
        search_filter = or_(
            Book.title.ilike(f"%{search}%"),
            Book.author.ilike(f"%{search}%"),
        )
        query = query.filter(search_filter)
        count_query = count_query.filter(search_filter)

    if author:
        query = query.filter(Book.author.ilike(f"%{author}%"))
        count_query = count_query.filter(Book.author.ilike(f"%{author}%"))

    if genre:
        query = query.filter(Book.genre.ilike(f"%{genre}%"))
        count_query = count_query.filter(Book.genre.ilike(f"%{genre}%"))

    if language:
        query = query.filter(Book.language == language)
        count_query = count_query.filter(Book.language == language)

    if publisher:
        query = query.filter(Book.publisher.ilike(f"%{publisher}%"))
        count_query = count_query.filter(Book.publisher.ilike(f"%{publisher}%"))

    total = count_query.scalar()
    books = query.order_by(Book.author, Book.title).offset(offset).limit(page_size).all()

    return PaginatedBooks(
        items=books,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@app.get("/api/books/{book_id}", response_model=BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    return book


@app.get("/api/books/{book_id}/download")
def download_book(book_id: int, db: Session = Depends(get_db)):
    """Descarga el archivo EPUB."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    
    file_path = Path(book.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    return FileResponse(
        path=file_path,
        filename=f"{book.title}.epub",
        media_type="application/epub+zip"
    )


@app.post("/api/books/{book_id}/send-kindle")
def send_to_kindle(book_id: int, data: dict, db: Session = Depends(get_db)):
    """Envía el libro al email de Kindle."""
    from .email_service import send_to_kindle as send_email
    
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email requerido")
    
    result = send_email(email, book.title, book.file_path)
    
    if result["success"]:
        return {"message": "Enviado a Kindle correctamente"}
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Error al enviar"))


@app.get("/api/authors")
def get_authors(
    search: str = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Book.author, func.count(Book.id).label("count")).group_by(Book.author)
    
    if search:
        query = query.filter(Book.author.ilike(f"%{search}%"))
    
    query = query.order_by(func.count(Book.id).desc()).limit(limit)
    
    return [{"author": row[0], "count": row[1]} for row in query.all()]


@app.get("/api/filters/genres")
def get_genres(db: Session = Depends(get_db)):
    """Obtiene lista de géneros únicos."""
    query = db.query(Book.genre, func.count(Book.id).label("count"))\
        .filter(Book.genre != None, Book.genre != "")\
        .group_by(Book.genre)\
        .order_by(func.count(Book.id).desc())\
        .limit(100)
    
    return [{"value": row[0], "count": row[1]} for row in query.all()]


@app.get("/api/filters/languages")
def get_languages(db: Session = Depends(get_db)):
    """Obtiene lista de idiomas únicos."""
    query = db.query(Book.language, func.count(Book.id).label("count"))\
        .filter(Book.language != None, Book.language != "")\
        .group_by(Book.language)\
        .order_by(func.count(Book.id).desc())\
        .limit(50)
    
    return [{"value": row[0], "count": row[1]} for row in query.all()]


@app.get("/api/filters/publishers")
def get_publishers(db: Session = Depends(get_db)):
    """Obtiene lista de editoriales únicas."""
    query = db.query(Book.publisher, func.count(Book.id).label("count"))\
        .filter(Book.publisher != None, Book.publisher != "")\
        .group_by(Book.publisher)\
        .order_by(func.count(Book.id).desc())\
        .limit(100)
    
    return [{"value": row[0], "count": row[1]} for row in query.all()]


@app.post("/api/scan")
def start_scan(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if scanner.status["running"]:
        return {"message": "Escaneo ya en progreso", "status": scanner.status}
    
    background_tasks.add_task(scanner.scan_library_sync, db, Book, False)
    return {"message": "Escaneo iniciado", "status": scanner.status}


@app.post("/api/scan/cancel")
def cancel_scan():
    """Cancela el escaneo en progreso."""
    if not scanner.status["running"]:
        return {"message": "No hay escaneo en progreso"}
    
    scanner.cancel()
    return {"message": "Cancelación solicitada"}


@app.post("/api/scan/covers")
def rescan_covers(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Re-extrae portadas de libros que no tienen."""
    if scanner.status["running"]:
        return {"message": "Escaneo ya en progreso", "status": scanner.status}
    
    background_tasks.add_task(scanner.rescan_covers, db, Book)
    return {"message": "Re-escaneo de portadas iniciado"}


@app.post("/api/scan/genres")
def rescan_genres(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Actualiza géneros de libros que no tienen."""
    if scanner.status["running"]:
        return {"message": "Escaneo ya en progreso", "status": scanner.status}
    
    background_tasks.add_task(scanner.rescan_genres, db, Book)
    return {"message": "Actualización de géneros iniciada"}


@app.get("/api/scan/status", response_model=ScanStatus)
def get_scan_status():
    return ScanStatus(
        status="running" if scanner.status["running"] else "idle",
        total_files=scanner.status["total"],
        processed=scanner.status["processed"],
        errors=scanner.status["errors"],
    )


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_books = db.query(func.count(Book.id)).scalar() or 0
    total_authors = db.query(func.count(func.distinct(Book.author))).scalar() or 0
    total_size = db.query(func.sum(Book.file_size)).scalar() or 0

    return {
        "total_books": total_books,
        "total_authors": total_authors,
        "total_size_gb": round(total_size / (1024**3), 2),
    }


@app.get("/api/health")
def health_check():
    """Endpoint de diagnóstico para verificar conexiones al disco externo."""
    from .database import DB_PATH
    
    db_path = Path(DB_PATH)
    covers_path = Path(COVERS_DIR)
    library_path = Path(LIBRARY_PATH)
    
    result = {
        "status": "ok",
        "checks": {
            "database": {
                "path": str(db_path),
                "exists": db_path.exists(),
                "readable": os.access(db_path, os.R_OK) if db_path.exists() else False,
                "writable": os.access(db_path, os.W_OK) if db_path.exists() else False,
                "size_mb": round(db_path.stat().st_size / (1024*1024), 2) if db_path.exists() else 0,
            },
            "covers": {
                "path": str(covers_path),
                "exists": covers_path.exists(),
                "readable": os.access(covers_path, os.R_OK) if covers_path.exists() else False,
                "writable": os.access(covers_path, os.W_OK) if covers_path.exists() else False,
                "sample_files": [],
            },
            "library": {
                "path": str(library_path),
                "exists": library_path.exists(),
                "readable": os.access(library_path, os.R_OK) if library_path.exists() else False,
            },
        },
        "errors": [],
    }
    
    # Listar primeros 5 archivos de covers
    if covers_path.exists():
        try:
            files = list(covers_path.iterdir())[:5]
            result["checks"]["covers"]["sample_files"] = [f.name for f in files]
            result["checks"]["covers"]["total_files"] = len(list(covers_path.iterdir()))
        except PermissionError:
            result["errors"].append(f"Permiso denegado para leer {covers_path}")
    
    # Verificar errores
    if not result["checks"]["database"]["exists"]:
        result["errors"].append(f"Base de datos no encontrada: {db_path}")
        result["status"] = "error"
    
    if not result["checks"]["covers"]["exists"]:
        result["errors"].append(f"Carpeta de portadas no encontrada: {covers_path}")
        result["status"] = "warning"
    
    if not result["checks"]["library"]["exists"]:
        result["errors"].append(f"Carpeta de biblioteca no encontrada: {library_path}")
        result["status"] = "warning"
    
    return result
