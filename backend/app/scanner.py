"""
Scanner para indexar archivos EPUB usando ThreadPoolExecutor.
"""
import os
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Optional
from dataclasses import dataclass
from datetime import datetime
import logging

from ebooklib import epub
from PIL import Image
import io

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class BookMetadata:
    title: str
    author: str
    file_path: str
    cover_path: Optional[str]
    description: Optional[str]
    language: Optional[str]
    publisher: Optional[str]
    genre: Optional[str]
    file_size: int


class EPUBScanner:
    def __init__(self, library_path: str, covers_dir: str, max_workers: int = 8):
        self.library_path = Path(library_path)
        self.covers_dir = Path(covers_dir)
        self.covers_dir.mkdir(parents=True, exist_ok=True)
        self.max_workers = max_workers
        self.status = {"total": 0, "processed": 0, "errors": 0, "running": False}
        self._cancel_requested = False

    def cancel(self):
        """Solicita cancelar el escaneo actual."""
        if self.status["running"]:
            self._cancel_requested = True
            logger.info("Cancelación solicitada...")

    def _extract_metadata_sync(self, epub_path: Path) -> Optional[BookMetadata]:
        try:
            book = epub.read_epub(str(epub_path), options={"ignore_ncx": True})
            
            title = self._get_metadata(book, "title") or epub_path.stem
            author = self._get_metadata(book, "creator") or epub_path.parent.name
            description = self._get_metadata(book, "description")
            language = self._get_metadata(book, "language")
            publisher = self._get_metadata(book, "publisher")
            genre = self._get_metadata(book, "subject")
            file_size = epub_path.stat().st_size

            cover_path = self._extract_cover(book, epub_path)

            return BookMetadata(
                title=title,
                author=author,
                file_path=str(epub_path),
                cover_path=cover_path,
                description=description,
                language=language,
                publisher=publisher,
                genre=genre,
                file_size=file_size,
            )
        except Exception as e:
            logger.error(f"Error procesando {epub_path}: {e}")
            return None

    def _get_metadata(self, book: epub.EpubBook, field: str) -> Optional[str]:
        try:
            data = book.get_metadata("DC", field)
            if data and len(data) > 0:
                return str(data[0][0])[:500]
        except Exception:
            pass
        return None

    def _extract_cover(self, book: epub.EpubBook, epub_path: Path) -> Optional[str]:
        try:
            cover_item = None
            
            # Método 1: Buscar en metadatos OPF por 'cover' content
            for meta in book.get_metadata('OPF', 'cover'):
                if meta and len(meta) > 1 and isinstance(meta[1], dict):
                    cover_content = meta[1].get('content', '')
                    if cover_content:
                        # Buscar item que coincida con el content
                        for item in book.get_items():
                            if item.get_name() and cover_content in item.get_name():
                                if item.media_type and 'image' in item.media_type:
                                    cover_item = item
                                    break
                    break
            
            # Método 2: Buscar por ID de cover
            if not cover_item:
                cover_id = None
                for meta in book.get_metadata('OPF', 'cover'):
                    if meta and len(meta) > 0:
                        cover_id = meta[0] if isinstance(meta[0], str) else None
                        break
                
                if cover_id:
                    cover_item = book.get_item_with_id(cover_id)
            
            # Método 3: Buscar por nombre de archivo que contenga 'cover'
            if not cover_item:
                for item in book.get_items():
                    name = (item.get_name() or "").lower()
                    if item.media_type and "image" in item.media_type:
                        if "cover" in name or "portada" in name or "cubierta" in name:
                            cover_item = item
                            break
            
            # Método 4: Buscar primera imagen grande (> 50KB)
            if not cover_item:
                for item in book.get_items():
                    if item.media_type and "image" in item.media_type:
                        try:
                            content = item.get_content()
                            if len(content) > 50000:
                                cover_item = item
                                break
                        except:
                            pass

            if not cover_item:
                return None

            file_hash = hashlib.md5(str(epub_path).encode()).hexdigest()[:12]
            cover_filename = f"{file_hash}.jpg"
            cover_path = self.covers_dir / cover_filename

            img = Image.open(io.BytesIO(cover_item.get_content()))
            img = img.convert("RGB")
            img.thumbnail((300, 450), Image.Resampling.LANCZOS)
            img.save(cover_path, "JPEG", quality=85, optimize=True)

            return cover_filename
        except Exception as e:
            logger.debug(f"No se pudo extraer portada de {epub_path}: {e}")
            return None

    def find_all_epubs(self) -> list[Path]:
        epubs = list(self.library_path.rglob("*.epub"))
        logger.info(f"Encontrados {len(epubs)} archivos EPUB")
        return epubs

    def scan_library_sync(self, db_session, Book, full_scan: bool = False):
        """
        Escanea la biblioteca.
        - full_scan=False: Solo archivos nuevos (no están en BD)
        - full_scan=True: Todos los archivos
        """
        if self.status["running"]:
            return {"error": "Escaneo ya en progreso"}

        self._cancel_requested = False
        self.status = {"total": 0, "processed": 0, "errors": 0, "running": True}
        
        # Obtener rutas ya indexadas
        existing_paths = set()
        if not full_scan:
            existing_paths = {row[0] for row in db_session.query(Book.file_path).all()}
            logger.info(f"Ya indexados: {len(existing_paths)} libros")

        # Encontrar EPUBs
        all_epubs = self.find_all_epubs()
        
        # Filtrar solo los nuevos
        if not full_scan:
            epub_files = [p for p in all_epubs if str(p) not in existing_paths]
            logger.info(f"Nuevos por indexar: {len(epub_files)}")
        else:
            epub_files = all_epubs

        self.status["total"] = len(epub_files)

        if len(epub_files) == 0:
            self.status["running"] = False
            return {"message": "No hay libros nuevos para indexar"}

        batch_size = 50

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            for i in range(0, len(epub_files), batch_size):
                if self._cancel_requested:
                    logger.info("Escaneo cancelado por el usuario")
                    break

                batch = epub_files[i : i + batch_size]
                
                futures = {executor.submit(self._extract_metadata_sync, path): path for path in batch}
                
                for future in as_completed(futures):
                    if self._cancel_requested:
                        break

                    metadata = future.result()
                    if metadata:
                        try:
                            db_session.add(
                                Book(
                                    title=metadata.title,
                                    author=metadata.author,
                                    file_path=metadata.file_path,
                                    cover_path=metadata.cover_path,
                                    description=metadata.description,
                                    language=metadata.language,
                                    publisher=metadata.publisher,
                                    genre=metadata.genre,
                                    file_size=metadata.file_size,
                                )
                            )
                            self.status["processed"] += 1
                        except Exception as e:
                            logger.error(f"Error guardando: {e}")
                            self.status["errors"] += 1
                    else:
                        self.status["errors"] += 1

                db_session.commit()
                logger.info(f"Progreso: {self.status['processed']}/{self.status['total']}")

        self.status["running"] = False
        self._cancel_requested = False
        return self.status

    def rescan_covers(self, db_session, Book):
        """Re-extrae portadas solo para libros que no tienen."""
        if self.status["running"]:
            return {"error": "Escaneo ya en progreso"}

        self._cancel_requested = False

        # Obtener libros sin portada
        books_without_cover = db_session.query(Book).filter(
            (Book.cover_path == None) | (Book.cover_path == "")
        ).all()

        total = len(books_without_cover)
        self.status = {"total": total, "processed": 0, "errors": 0, "running": True}
        logger.info(f"Re-escaneando portadas de {total} libros")

        # Procesar de forma secuencial para evitar crashes
        batch_size = 100
        current = 0
        
        for i in range(0, total, batch_size):
            if self._cancel_requested:
                logger.info("Re-escaneo de portadas cancelado")
                break

            batch = books_without_cover[i : i + batch_size]
            
            for book_record in batch:
                current += 1
                if self._cancel_requested:
                    break
                    
                try:
                    epub_path = Path(book_record.file_path)
                    if not epub_path.exists():
                        self.status["errors"] += 1
                        continue
                    
                    book = epub.read_epub(str(epub_path), options={"ignore_ncx": True})
                    cover_path = self._extract_cover(book, epub_path)
                    
                    if cover_path:
                        db_session.query(Book).filter(Book.id == book_record.id).update(
                            {"cover_path": cover_path}
                        )
                        self.status["processed"] += 1
                    else:
                        self.status["errors"] += 1
                        
                except Exception as e:
                    logger.debug(f"Error extrayendo portada: {e}")
                    self.status["errors"] += 1
                
                # Actualizar total procesado para el frontend
                self.status["total"] = total
                self.status["total_files"] = current

            db_session.commit()
            logger.info(f"Portadas: {current}/{total} - Encontradas: {self.status['processed']} - Errores: {self.status['errors']}")

        self.status["running"] = False
        self._cancel_requested = False
        return self.status

    def rescan_genres(self, db_session, Book):
        """Actualiza géneros de libros que no tienen."""
        if self.status["running"]:
            return {"error": "Escaneo ya en progreso"}

        self._cancel_requested = False

        # Obtener libros sin género
        books_without_genre = db_session.query(Book).filter(
            (Book.genre == None) | (Book.genre == "")
        ).all()

        total = len(books_without_genre)
        self.status = {"total": total, "processed": 0, "errors": 0, "running": True}
        logger.info(f"Actualizando géneros de {total} libros")

        batch_size = 100
        current = 0
        
        for i in range(0, total, batch_size):
            if self._cancel_requested:
                logger.info("Actualización de géneros cancelada")
                break

            batch = books_without_genre[i : i + batch_size]
            
            for book_record in batch:
                current += 1
                if self._cancel_requested:
                    break
                    
                try:
                    epub_path = Path(book_record.file_path)
                    if not epub_path.exists():
                        self.status["errors"] += 1
                        continue
                    
                    book = epub.read_epub(str(epub_path), options={"ignore_ncx": True})
                    genre = self._get_metadata(book, "subject")
                    
                    if genre:
                        db_session.query(Book).filter(Book.id == book_record.id).update(
                            {"genre": genre}
                        )
                        self.status["processed"] += 1
                    else:
                        self.status["errors"] += 1
                        
                except Exception as e:
                    logger.debug(f"Error extrayendo género: {e}")
                    self.status["errors"] += 1
                
                self.status["total"] = total
                self.status["total_files"] = current

            db_session.commit()
            logger.info(f"Géneros: {current}/{total} - Encontrados: {self.status['processed']} - Sin género: {self.status['errors']}")

        self.status["running"] = False
        self._cancel_requested = False
        return self.status
