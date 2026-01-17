from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BookBase(BaseModel):
    title: str
    author: str
    file_path: str
    cover_path: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    publisher: Optional[str] = None
    genre: Optional[str] = None
    file_size: Optional[int] = None


class BookResponse(BookBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedBooks(BaseModel):
    items: list[BookResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ScanStatus(BaseModel):
    status: str
    total_files: int
    processed: int
    errors: int
