from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os, shutil
from datetime import datetime

app = FastAPI()

# Autoriser le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_FOLDER = "storage"
os.makedirs(STORAGE_FOLDER, exist_ok=True)

# ----------------- Liste des fichiers -----------------
@app.get("/api/files")
def get_files():
    files = []
    for i, filename in enumerate(os.listdir(STORAGE_FOLDER)):
        path = os.path.join(STORAGE_FOLDER, filename)
        stat = os.stat(path)
        files.append({
            "id": i,
            "name": filename,
            "type": filename.split(".")[-1],
            "date": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")
        })
    return files

# ----------------- Upload -----------------
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(STORAGE_FOLDER, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"message": "File uploaded successfully"}

# ----------------- Delete -----------------
@app.delete("/api/files/{filename}")
def delete_file(filename: str):
    file_path = os.path.join(STORAGE_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(file_path)
    return {"message": "File deleted successfully"}

# ----------------- Rename -----------------
@app.put("/api/files/rename")
def rename_file(old_name: str, new_name: str):
    old_path = os.path.join(STORAGE_FOLDER, old_name)
    new_path = os.path.join(STORAGE_FOLDER, new_name)
    if not os.path.exists(old_path):
        raise HTTPException(status_code=404, detail="File not found")
    if os.path.exists(new_path):
        raise HTTPException(status_code=400, detail="New file name already exists")
    os.rename(old_path, new_path)
    return {"message": "File renamed successfully"}

# ----------------- Download -----------------
@app.get("/api/files/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(STORAGE_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=filename)

# ----------------- Stockage -----------------
@app.get("/api/storage")
def get_storage():
    total_storage = 10 * 1024 ** 3  # 10 Go
    used_bytes = sum(
        os.path.getsize(os.path.join(STORAGE_FOLDER, f))
        for f in os.listdir(STORAGE_FOLDER)
    )
    used_gb = used_bytes / (1024 ** 3)
    total_gb = total_storage / (1024 ** 3)
    percent = (used_bytes / total_storage) * 100

    return {
        "used_gb": round(used_gb, 2),
        "total_gb": total_gb,
        "percent": round(percent, 2)
    }