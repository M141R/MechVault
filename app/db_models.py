"""MechVault database models (SQLAlchemy 2.0, SQLite)."""
from sqlalchemy import (create_engine, Column, Integer, String, Text, Boolean,
                        DateTime, ForeignKey, UniqueConstraint)
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime, os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "mechvault.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "uploads")

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
Base = declarative_base()


def now():
    return datetime.datetime.utcnow()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, default="")
    password_hash = Column(String)
    role = Column(String, default="student")  # owner | student
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now)


class Semester(Base):
    __tablename__ = "semesters"
    id = Column(Integer, primary_key=True)
    number = Column(Integer)
    name = Column(String)


class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"))
    name = Column(String)
    code = Column(String, default="")


class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    number = Column(Integer)
    name = Column(String)


class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True)
    module_id = Column(Integer, ForeignKey("modules.id"))
    name = Column(String)
    description = Column(Text, default="")


class Resource(Base):
    """Extracted-text source for a topic (book/ppt/syllabus/other). Binary discarded after extract."""
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    kind = Column(String)  # book | ppt | syllabus | other
    filename = Column(String)
    extracted_text = Column(Text, default="")
    created_at = Column(DateTime, default=now)


class Paper(Base):
    """PYQ or Tutorial sheet — BINARY KEPT for display + watermarked download."""
    __tablename__ = "papers"
    id = Column(Integer, primary_key=True)
    kind = Column(String)  # pyq | tutorial
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    title = Column(String)
    file_path = Column(String)  # binary kept for display
    extracted_text = Column(Text, default="")
    solutions_markdown = Column(Text, default="")
    created_at = Column(DateTime, default=now)


class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), unique=True)
    content_markdown = Column(Text, default="")
    status = Column(String, default="draft")  # draft | published
    model = Column(String, default="")
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)


class Progress(Base):
    __tablename__ = "progress"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"))
    mastery = Column(Integer, default=0)  # 0-5 self-assessed
    completed = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=now, onupdate=now)
    __table_args__ = (UniqueConstraint("user_id", "topic_id"),)


class StudySession(Base):
    __tablename__ = "study_sessions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    minutes = Column(Integer, default=0)
    source = Column(String, default="auto")  # auto | manual
    note = Column(String, default="")
    created_at = Column(DateTime, default=now)


class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True)
    kind = Column(String)
    ref_id = Column(Integer)
    status = Column(String, default="pending")  # pending|running|done|error
    message = Column(Text, default="")
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)


def init_db():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    Base.metadata.create_all(engine)
