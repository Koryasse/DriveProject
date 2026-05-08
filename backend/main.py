from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from pydantic import BaseModel
from passlib.context import CryptContext
import jwt, os, shutil
from datetime import datetime, timedelta
from pathlib import Path

# ---------------- CONFIG ----------------
SECRET_KEY = "change-this-secret-key-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

DATABASE_URL = "sqlite:///./nebula.db"
STORAGE_ROOT = "storage"

# ---------------- DB ----------------
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)

Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- AUTH ----------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ---------------- APP ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://10.5.40.250:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- HELPERS ----------------
def get_file_type(filename: str) -> str:
    ext = filename.split(".")[-1].lower() if "." in filename else "other"
    mapping = {
        "pdf": "pdf", "doc": "doc", "docx": "doc",
        "xls": "sheet", "xlsx": "sheet",
        "ppt": "ppt", "pptx": "ppt",
        "txt": "txt",
        "jpg": "image", "jpeg": "image", "png": "image",
        "gif": "image", "svg": "image", "webp": "image",
        "mp4": "video", "mov": "video", "avi": "video", "mkv": "video",
        "mp3": "audio", "wav": "audio", "ogg": "audio",
        "zip": "archive", "rar": "archive", "tar": "archive", "gz": "archive",
        "js": "code", "ts": "code", "py": "code",
        "html": "code", "css": "code", "json": "code",
    }
    return mapping.get(ext, "other")

def user_storage_path(user_id: int) -> str:
    path = os.path.join(STORAGE_ROOT, str(user_id))
    os.makedirs(path, exist_ok=True)
    return path

# ---------------- MODELS ----------------
class RegisterData(BaseModel):
    email: str
    username: str
    password: str

class LoginData(BaseModel):
    email: str
    password: str

# ---------------- REGISTER ----------------
@app.post("/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "email": user.email, "username": user.username}}

# ---------------- LOGIN ----------------
@app.post("/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "email": user.email, "username": user.username}}

# ---------------- FILES ----------------
@app.get("/api/files")
def get_files(current_user: User = Depends(get_current_user)):
    folder = user_storage_path(current_user.id)
    files = []

    for i, filename in enumerate(os.listdir(folder)):
        path = os.path.join(folder, filename)
        stat = os.stat(path)
        files.append({
            "id": i,
            "name": filename,
            "type": get_file_type(filename),
            "date": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")
        })

    return files

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    folder = user_storage_path(current_user.id)
    file_path = os.path.join(folder, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"message": "File uploaded successfully"}

@app.delete("/api/files/{filename}")
def delete_file(filename: str, current_user: User = Depends(get_current_user)):
    folder = user_storage_path(current_user.id)
    file_path = os.path.join(folder, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(file_path)
    return {"message": "File deleted successfully"}

@app.put("/api/files/rename")
def rename_file(old_name: str, new_name: str, current_user: User = Depends(get_current_user)):
    folder = user_storage_path(current_user.id)
    old_path = os.path.join(folder, old_name)
    new_path = os.path.join(folder, new_name)

    if not os.path.exists(old_path):
        raise HTTPException(status_code=404, detail="File not found")
    if os.path.exists(new_path):
        raise HTTPException(status_code=400, detail="File already exists")

    os.rename(old_path, new_path)
    return {"message": "File renamed successfully"}

@app.get("/api/files/download/{filename}")
def download_file(filename: str, current_user: User = Depends(get_current_user)):
    folder = user_storage_path(current_user.id)
    file_path = os.path.join(folder, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, filename=filename)

@app.get("/api/storage")
def get_storage(current_user: User = Depends(get_current_user)):
    folder = user_storage_path(current_user.id)
    total_storage = 10 * 1024 ** 3

    used_bytes = sum(
        os.path.getsize(os.path.join(folder, f))
        for f in os.listdir(folder)
    )

    return {
        "used_gb": round(used_bytes / (1024 ** 3), 4),
        "total_gb": total_storage / (1024 ** 3),
        "percent": round((used_bytes / total_storage) * 100, 2)
    }