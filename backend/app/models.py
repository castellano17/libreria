from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.sql import func
from .database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    author = Column(String(300), nullable=False)
    file_path = Column(String(1000), unique=True, nullable=False)
    cover_path = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    language = Column(String(50), nullable=True)
    publisher = Column(String(300), nullable=True)
    genre = Column(String(200), nullable=True)
    file_size = Column(Integer, nullable=True)
    download_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_title", "title"),
        Index("idx_author", "author"),
        Index("idx_title_author", "title", "author"),
        Index("idx_genre", "genre"),
        Index("idx_language", "language"),
        Index("idx_publisher", "publisher"),
        Index("idx_download_count", "download_count"),
    )
