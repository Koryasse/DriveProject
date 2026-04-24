from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from pydantic import BaseModel
import os, shutil
from datetime import datetime
from pathlib import Path

# ---------------- ENV ----------------
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

DEFAULT_EMAIL = os.getenv("DEFAULT_USER_EMAIL")
DEFAULT_PASSWORD = os.getenv("DEFAULT_USER_PASSWORD")

print("EMAIL ENV:", DEFAULT_EMAIL)
print("PASSWORD ENV:", DEFAULT_PASSWORD)

# ---------------- APP ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://10.5.40.250:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- LOGIN MODEL ----------------
class LoginData(BaseModel):
    email: str
    password: str

# ---------------- LOGIN ----------------
@app.post("/login")
def login(user: LoginData):

    if user.email == DEFAULT_EMAIL and user.password == DEFAULT_PASSWORD:
        return {
            "message": "Login success",
            "user": user.email
        }

    raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
    )

# ---------------- STORAGE ----------------
STORAGE_FOLDER = "storage"
os.makedirs(STORAGE_FOLDER, exist_ok=True)

def get_file_type(filename):
    ext = filename.split(".")[-1].lower() if "." in filename else "other"
    mapping = {
        "pdf":"pdf","doc":"doc","docx":"doc",
        "xls":"sheet","xlsx":"sheet",
        "ppt":"ppt","pptx":"ppt",
        "txt":"txt",
        "jpg":"image","jpeg":"image","png":"image","gif":"image","svg":"image","webp":"image",
        "mp4":"video","mov":"video","avi":"video","mkv":"video",
        "mp3":"audio","wav":"audio","ogg":"audio",
        "zip":"archive","rar":"archive","tar":"archive","gz":"archive",
        "js":"code","ts":"code","py":"code","html":"code","css":"code","json":"code",
    }
    return mapping.get(ext, "other")

# ---------------- FILE LIST ----------------
@app.get("/api/files")
def get_files():
    files = []

    for i, filename in enumerate(os.listdir(STORAGE_FOLDER)):
        path = os.path.join(STORAGE_FOLDER, filename)
        stat = os.stat(path)

        files.append({
            "id": i,
            "name": filename,
            "type": get_file_type(filename),
            "date": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")
        })

    return files

# ---------------- UPLOAD ----------------
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(STORAGE_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"message": "File uploaded successfully"}

# ---------------- DELETE ----------------
@app.delete("/api/files/{filename}")
def delete_file(filename: str):

    file_path = os.path.join(STORAGE_FOLDER, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(file_path)

    return {"message": "File deleted successfully"}

# ---------------- RENAME ----------------
@app.put("/api/files/rename")
def rename_file(old_name: str, new_name: str):

    old_path = os.path.join(STORAGE_FOLDER, old_name)
    new_path = os.path.join(STORAGE_FOLDER, new_name)

    if not os.path.exists(old_path):
        raise HTTPException(status_code=404, detail="File not found")

    if os.path.exists(new_path):
        raise HTTPException(status_code=400, detail="File already exists")

    os.rename(old_path, new_path)

    return {"message": "File renamed successfully"}

# ---------------- DOWNLOAD ----------------
@app.get("/api/files/download/{filename}")
def download_file(filename: str):

    file_path = os.path.join(STORAGE_FOLDER, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, filename=filename)

# ---------------- STORAGE INFO ----------------
@app.get("/api/storage")
def get_storage():

    total_storage = 10 * 1024 ** 3

    used_bytes = sum(
        os.path.getsize(os.path.join(STORAGE_FOLDER, f))
        for f in os.listdir(STORAGE_FOLDER)
    )

    return {
        "used_gb": round(used_bytes / (1024 ** 3), 4),
        "total_gb": total_storage / (1024 ** 3),
        "percent": round((used_bytes / total_storage) * 100, 2)
    }
