from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db, Record
from pydantic import BaseModel
from typing import Optional, List
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ReorderRequest(BaseModel):
    record_ids: List[int]

# 기록 추가
@router.post("/records")
def create_record(
    book_id: int = Form(...),
    memo: str = Form(""),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ext = photo.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_path = f"{UPLOAD_DIR}/{unique_filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    # 현재 책의 마지막 순서 + 1로 설정
    last = db.query(Record).filter(Record.book_id == book_id).order_by(Record.sort_order.desc()).first()
    next_order = (last.sort_order + 1) if last else 0

    record = Record(book_id=book_id, photo_path=file_path, memo=memo, sort_order=next_order)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

# 책별 기록 조회
@router.get("/records/{book_id}")
def get_records(book_id: int, db: Session = Depends(get_db)):
    records = db.query(Record).filter(
        Record.book_id == book_id
    ).order_by(Record.sort_order.asc(), Record.created_at.asc()).all()
    return records

# 기록 순서 변경
@router.patch("/books/{book_id}/records/reorder")
def reorder_records(book_id: int, req: ReorderRequest, db: Session = Depends(get_db)):
    for i, record_id in enumerate(req.record_ids):
        db.query(Record).filter(Record.id == record_id, Record.book_id == book_id).update({"sort_order": i})
    db.commit()
    return {"success": True}

# 기록 수정 (사진 또는 멘트)
@router.patch("/records/{record_id}")
def update_record(
    record_id: int,
    memo: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        return {"success": False, "message": "기록을 찾을 수 없어요."}

    if memo is not None:
        record.memo = memo

    if photo:
        # 기존 사진 삭제
        if os.path.exists(record.photo_path):
            os.remove(record.photo_path)
        # 새 사진 저장
        ext = photo.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{ext}"
        file_path = f"{UPLOAD_DIR}/{unique_filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        record.photo_path = file_path

    db.commit()
    db.refresh(record)
    return record

# 기록 삭제
@router.delete("/records/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        return {"success": False, "message": "기록을 찾을 수 없어요."}

    if os.path.exists(record.photo_path):
        os.remove(record.photo_path)

    db.delete(record)
    db.commit()
    return {"success": True, "message": "기록이 삭제됐어요."}