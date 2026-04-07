from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db, Record, Book
from pydantic import BaseModel
from typing import Optional
import requests
import os
import json
import uuid
import shutil
from datetime import datetime

router = APIRouter()

BASE_URL = "https://api-sandbox.sweetbook.com/v1"

def get_headers():
    api_key = os.getenv("SWEETBOOK_API_KEY")
    return {"Authorization": f"Bearer {api_key}"}

def build_params(template_uid: str, record) -> tuple:
    date_str = record.created_at.strftime("%m.%d")
    month_str = record.created_at.strftime("%m")
    day_str = record.created_at.strftime("%d")
    memo = record.memo if record.memo else ""
    title = memo[:20] if len(memo) > 20 else memo

    if template_uid in ["2R8uMwVgTrpc", "3FhSEhJ94c0T"]:
        params = {
            "date": date_str,
            "title": title if title else "기억",
            "diaryText": memo if memo else " ",
            "photo1": "$upload"
        }
        file_field = "photo1"
    elif template_uid in ["46VqZhVNOfAp", "5B4ds6i0Rywx"]:
        params = {
            "monthNum": month_str,
            "dayNum": day_str,
            "diaryText": memo if memo else " ",
            "photo": "$upload"
        }
        file_field = "photo"
    else:
        params = {
            "date": date_str,
            "title": title if title else "기억",
            "diaryText": memo if memo else " ",
            "photo1": "$upload"
        }
        file_field = "photo1"

    return params, file_field

class BookRequest(BaseModel):
    title: str
    record_ids: list[int]
    template_uid: str
    book_id: int

class BookTitleUpdate(BaseModel):
    title: str

UPLOAD_DIR = "uploads"

# 책 초안 생성
@router.post("/books/draft")
def create_book_draft(title: str, db: Session = Depends(get_db)):
    new_book = Book(title=title)
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return {"success": True, "bookId": new_book.id}

# 책 목록 조회
@router.get("/books")
def get_books(db: Session = Depends(get_db)):
    books = db.query(Book).order_by(Book.created_at.desc()).all()
    return [
        {
            "id": book.id,
            "title": book.title,
            "sweetbook_book_uid": book.sweetbook_book_uid,
            "template_uid": book.template_uid,
            "recordCount": len(book.records),
            "createdAt": book.created_at
        }
        for book in books
    ]

# 표지 사진 업로드
@router.post("/books/{book_id}/cover-photo")
def upload_cover_photo(book_id: int, photo: UploadFile = File(...), db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        return {"success": False, "message": "책을 찾을 수 없어요."}

    # 기존 표지 사진 삭제
    if book.cover_photo_path and os.path.exists(book.cover_photo_path):
        os.remove(book.cover_photo_path)

    ext = photo.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_path = f"{UPLOAD_DIR}/{unique_filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    book.cover_photo_path = file_path
    db.commit()
    return {"success": True, "cover_photo_path": file_path}

# 책 이름 수정
@router.patch("/books/{book_id}/title")
def update_book_title(book_id: int, body: BookTitleUpdate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        return {"success": False, "message": "책을 찾을 수 없어요."}
    book.title = body.title
    db.commit()
    return {"success": True, "message": "책 이름이 수정됐어요."}

# 책 삭제
@router.delete("/books/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        return {"success": False, "message": "책을 찾을 수 없어요."}

    # 연결된 기록 사진 파일도 삭제
    for record in book.records:
        if os.path.exists(record.photo_path):
            os.remove(record.photo_path)
        db.delete(record)

    db.delete(book)
    db.commit()
    return {"success": True, "message": "책이 삭제됐어요."}

# 스위트북 API로 책 최종 생성 + 주문
@router.post("/books/create")
def create_book(req: BookRequest, db: Session = Depends(get_db)):
    book_res = requests.post(
        f"{BASE_URL}/books",
        headers=get_headers(),
        json={"title": req.title, "bookSpecUid": "SQUAREBOOK_HC"}
    )
    book_data = book_res.json()
    if not book_data["success"]:
        return {"success": False, "message": "책 생성 실패"}

    book_uid = book_data["data"]["bookUid"]

    cover_params = {
        "spineTitle": req.title,
        "dateRange": datetime.now().strftime("%Y.%m.%d"),
    }

    # 표지 사진: 업로드된 파일 우선, 없으면 기본 이미지
    book_for_cover = db.query(Book).filter(Book.id == req.book_id).first()
    cover_photo_path = book_for_cover.cover_photo_path if book_for_cover else None

    if cover_photo_path and os.path.exists(cover_photo_path):
        with open(cover_photo_path, "rb") as cover_file:
            filename = os.path.basename(cover_photo_path)
            ext = filename.split(".")[-1].lower()
            mime_types = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
            mime_type = mime_types.get(ext, "image/jpeg")
            cover_res = requests.post(
                f"{BASE_URL}/books/{book_uid}/cover",
                headers=get_headers(),
                data={"templateUid": "4MY2fokVjkeY", "parameters": json.dumps(cover_params)},
                files={"frontPhoto": (filename, cover_file, mime_type)}
            )
    else:
        cover_params["frontPhoto"] = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
        cover_res = requests.post(
            f"{BASE_URL}/books/{book_uid}/cover",
            headers=get_headers(),
            files=[
                ("templateUid", (None, "4MY2fokVjkeY")),
                ("parameters", (None, json.dumps(cover_params)))
            ]
        )
    print("표지 추가 응답:", cover_res.status_code, cover_res.text)

    records = db.query(Record).filter(Record.id.in_(req.record_ids)).all()
    for record in records:
        with open(record.photo_path, "rb") as f:
            params, file_field = build_params(req.template_uid, record)
            filename = os.path.basename(record.photo_path)
            ext = filename.split(".")[-1].lower()
            mime_types = {
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "png": "image/png",
                "webp": "image/webp",
                "gif": "image/gif"
            }
            mime_type = mime_types.get(ext, "image/jpeg")
            content_res = requests.post(
                f"{BASE_URL}/books/{book_uid}/contents",
                headers=get_headers(),
                data={
                    "templateUid": req.template_uid,
                    "parameters": json.dumps(params)
                },
                files={file_field: (filename, f, mime_type)}
            )
            print("내지 추가 응답:", content_res.status_code, content_res.text)

    for _ in range(24):
        blank_res = requests.post(
            f"{BASE_URL}/books/{book_uid}/contents?breakBefore=page",
            headers=get_headers(),
            files=[
                ("templateUid", (None, "2mi1ao0Z4Vxl")),
            ]
        )
        print("빈 내지 추가 응답:", blank_res.status_code, blank_res.text)

    finalize_res = requests.post(
        f"{BASE_URL}/books/{book_uid}/finalization",
        headers=get_headers()
    )
    print("최종화 응답:", finalize_res.status_code, finalize_res.text)

    # 우리 DB에 책 정보 업데이트
    book = db.query(Book).filter(Book.id == req.book_id).first()
    if book:
        book.sweetbook_book_uid = book_uid
        book.template_uid = req.template_uid
        db.commit()

    return {"success": True, "bookUid": book_uid, "bookId": req.book_id}