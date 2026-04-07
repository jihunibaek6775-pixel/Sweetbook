from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./sweetbook.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    sweetbook_book_uid = Column(String)  # 스위트북 bookUid
    template_uid = Column(String)        # 선택한 내지 템플릿
    cover_photo_path = Column(String)    # 표지 사진 경로
    created_at = Column(DateTime, default=datetime.now)
    records = relationship("Record", back_populates="book")
    orders = relationship("Order", back_populates="book")

class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=True)
    photo_path = Column(String)
    memo = Column(String)
    sort_order = Column(Integer, default=0)  # 페이지 순서
    created_at = Column(DateTime, default=datetime.now)
    book = relationship("Book", back_populates="records")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"))
    sweetbook_order_uid = Column(String)  # 스위트북 orderUid
    status = Column(String, default="결제완료")
    created_at = Column(DateTime, default=datetime.now)
    book = relationship("Book", back_populates="orders")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)