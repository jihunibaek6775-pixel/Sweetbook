from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from database import init_db
from routers import records
from routers import books
from routers import orders
from routers import templates
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("SWEETBOOK_API_KEY")
BASE_URL = "https://api-sandbox.sweetbook.com/v1"

@app.on_event("startup")
def startup():
    init_db()
    # 기존 DB에 새 컬럼 마이그레이션
    from sqlalchemy import text
    from database import engine
    with engine.connect() as conn:
        for sql in [
            "ALTER TABLE books ADD COLUMN cover_photo_path VARCHAR",
            "ALTER TABLE records ADD COLUMN sort_order INTEGER DEFAULT 0",
        ]:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass  # 이미 존재하는 컬럼이면 무시

app.include_router(records.router)
app.include_router(books.router)
app.include_router(orders.router)
app.include_router(templates.router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "Sweetbook API 서버 실행 중"}