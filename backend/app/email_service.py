import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from pathlib import Path
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración SMTP de Gmail
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_to_kindle(kindle_email: str, book_title: str, epub_path: str) -> dict:
    """Envía un EPUB al email de Kindle."""
    try:
        file_path = Path(epub_path)
        if not file_path.exists():
            return {"success": False, "error": "Archivo no encontrado"}

        # Crear mensaje
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = kindle_email
        msg['Subject'] = book_title

        # Cuerpo del mensaje
        body = f"Libro: {book_title}"
        msg.attach(MIMEText(body, 'plain'))

        # Adjuntar EPUB
        with open(file_path, 'rb') as attachment:
            part = MIMEBase('application', 'epub+zip')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename="{book_title}.epub"'
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
