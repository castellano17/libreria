from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Usar DB_PATH del .env o valor por defecto
DB_PATH = os.getenv("DB_PATH", "./library.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_db():
    """Ejecuta migraciones manuales necesarias."""
    with engine.connect() as conn:
        # Verificar si las columnas existen
        try:
            result = conn.execute(text("PRAGMA table_info(books)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'download_count' not in columns:
                print("Agregando columna download_count...")
                conn.execute(text("ALTER TABLE books ADD COLUMN download_count INTEGER DEFAULT 0 NOT NULL"))
                conn.commit()
                print("Columna download_count agregada exitosamente")
            else:
                print("Columna download_count ya existe")
                
            if 'kindle_sends' not in columns:
                print("Agregando columna kindle_sends...")
                conn.execute(text("ALTER TABLE books ADD COLUMN kindle_sends INTEGER DEFAULT 0 NOT NULL"))
                conn.commit()
                print("Columna kindle_sends agregada exitosamente")
            else:
                print("Columna kindle_sends ya existe")
                
        except Exception as e:
            print(f"Error en migración: {e}")


def init_db():
    Base.metadata.create_all(bind=engine)
    migrate_db()
