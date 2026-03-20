from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    files = relationship("File", back_populates="owner")

class File(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String)
    path = Column(String, nullable=False)
    date_upload = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="files")
