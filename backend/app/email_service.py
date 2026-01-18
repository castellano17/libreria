import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from pathlib import Path
import os
import re
import unicodedata
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración SMTP de Gmail
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def remove_accents(text: str) -> str:
    """Elimina acentos y caracteres especiales para nombres de archivo."""
    # Normalizar y eliminar acentos
    text = unicodedata.normalize('NFD', text)
    text = ''.join(char for char in text if unicodedata.category(char) != 'Mn')
    return text


def clean_filename(title: str, file_path: Path) -> str:
    """Limpia y valida el nombre del archivo para Kindle."""
    # Primero limpiar prefijos problemáticos
    if title:
        title = title.replace("[CORRUPTO] ", "").replace("[CORRUPTO]", "").strip()
    
    if not title or title.strip() == "" or title.lower() in ["noname", "none", "null"]:
        # Usar el nombre del archivo sin extensión como fallback
        title = file_path.stem
    
    # Limpiar caracteres problemáticos
    title = re.sub(r'[<>:"/\\|?*]', '', title)
    title = re.sub(r'\s+', ' ', title).strip()
    
    # Limitar longitud
    if len(title) > 100:
        title = title[:100].strip()
    
    # Si aún está vacío, usar nombre genérico
    if not title:
        title = f"Libro_{file_path.stem}"
    
    return title


def send_to_kindle(kindle_email: str, book_title: str, epub_path: str) -> dict:
    """Envía un EPUB al email de Kindle."""
    try:
        file_path = Path(epub_path)
        if not file_path.exists():
            return {"success": False, "error": "Archivo no encontrado"}

        # Limpiar y validar el título del libro
        clean_title = clean_filename(book_title, file_path)
        
        # DEBUG: Agregar logs para ver qué está pasando
        print(f"DEBUG - Título original: '{book_title}'")
        print(f"DEBUG - Título limpio: '{clean_title}'")
        print(f"DEBUG - Ruta archivo: '{epub_path}'")

        # Crear mensaje
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = kindle_email
        msg['Subject'] = clean_title

        # Cuerpo del mensaje
        body = f"Libro: {clean_title}"
        msg.attach(MIMEText(body, 'plain'))

        # Adjuntar EPUB
        with open(file_path, 'rb') as attachment:
            part = MIMEBase('application', 'epub+zip')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            
            # Asegurar que el nombre del archivo sea válido para Gmail/Kindle
            safe_filename = remove_accents(clean_title).replace(' ', '_').replace('/', '_').replace('\\', '_')
            if not safe_filename:
                safe_filename = remove_accents(file_path.stem)
            
            print(f"DEBUG - Nombre archivo adjunto: '{safe_filename}.epub'")
            
            part.add_header(
                'Content-Disposition',
                f'attachment; filename="{safe_filename}.epub"'
            )
            msg.attach(part)

        # Enviar
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)

        return {"success": True, "message": "Enviado correctamente"}

    except smtplib.SMTPAuthenticationError:
        return {"success": False, "error": "Error de autenticación SMTP"}
    except Exception as e:
        return {"success": False, "error": str(e)}
