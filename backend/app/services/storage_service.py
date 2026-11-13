import os
import uuid
import shutil
from abc import ABC, abstractmethod
from typing import Optional
from fastapi import UploadFile
from app.config import settings


class StorageService(ABC):
    @abstractmethod
    async def save_image(self, file: UploadFile) -> str:
        """Saves uploaded image file and returns the relative file path."""
        pass

    @abstractmethod
    async def save_image_bytes(self, image_bytes: bytes, filename: str) -> str:
        """Saves raw image bytes and returns the relative file path."""
        pass

    @abstractmethod
    def get_image_path(self, relative_path: str) -> Optional[str]:
        """Resolves absolute path on disk."""
        pass

    @abstractmethod
    def delete_image(self, relative_path: str) -> bool:
        """Deletes file from storage."""
        pass


class LocalStorageService(StorageService):
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = base_dir or settings.STORAGE_DIR
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_image(self, file: UploadFile) -> str:
        extension = os.path.splitext(file.filename or "")[1].lower()
        if not extension or extension not in [".jpg", ".jpeg", ".png", ".webp"]:
            extension = ".jpg"
        
        unique_name = f"{uuid.uuid4().hex}{extension}"
        target_path = os.path.join(self.base_dir, unique_name)
        
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return unique_name

    async def save_image_bytes(self, image_bytes: bytes, filename: str) -> str:
        extension = os.path.splitext(filename)[1].lower()
        if not extension:
            extension = ".jpg"
        unique_name = f"{uuid.uuid4().hex}{extension}"
        target_path = os.path.join(self.base_dir, unique_name)

        with open(target_path, "wb") as buffer:
            buffer.write(image_bytes)

        return unique_name

    def get_image_path(self, relative_path: str) -> Optional[str]:
        if not relative_path:
            return None
        full_path = os.path.join(self.base_dir, os.path.basename(relative_path))
        if os.path.exists(full_path):
            return full_path
        return None

    def delete_image(self, relative_path: str) -> bool:
        path = self.get_image_path(relative_path)
        if path and os.path.exists(path):
            try:
                os.remove(path)
                return True
            except Exception:
                return False
        return False


storage_service = LocalStorageService()
