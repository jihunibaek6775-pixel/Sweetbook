from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Order
from pydantic import BaseModel
from typing import Optional
import requests
import os
import uuid

router = APIRouter()

BASE_URL = "https://api-sandbox.sweetbook.com/v1"

def get_headers():
    api_key = os.getenv("SWEETBOOK_API_KEY")
    return {"Authorization": f"Bearer {api_key}"}

class ShippingInfo(BaseModel):
    recipientName: str
    recipientPhone: str
    postalCode: str
    address1: str
    address2: str = ""
    memo: str = ""

class OrderRequest(BaseModel):
    bookUid: str
    bookId: int
    quantity: int = 1
    shipping: ShippingInfo

class ShippingUpdate(BaseModel):
    recipientName: Optional[str] = None
    recipientPhone: Optional[str] = None
    postalCode: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    shippingMemo: Optional[str] = None

# 가격 견적 조회
@router.get("/orders/estimate/{book_uid}")
def get_estimate(book_uid: str):
    res = requests.post(
        f"{BASE_URL}/orders/estimate",
        headers=get_headers(),
        json={"items": [{"bookUid": book_uid, "quantity": 1}]}
    )
    return res.json()

# 주문 생성
@router.post("/orders")
def create_order(req: OrderRequest, db: Session = Depends(get_db)):
    idempotency_key = str(uuid.uuid4())

    res = requests.post(
        f"{BASE_URL}/orders",
        headers={**get_headers(), "Idempotency-Key": idempotency_key},
        json={
            "items": [
                {"bookUid": req.bookUid, "quantity": req.quantity}
            ],
            "shipping": {
                "recipientName": req.shipping.recipientName,
                "recipientPhone": req.shipping.recipientPhone,
                "postalCode": req.shipping.postalCode,
                "address1": req.shipping.address1,
                "address2": req.shipping.address2,
                "memo": req.shipping.memo
            }
        }
    )

    print("Orders API 응답:", res.status_code, res.text)
    order_data = res.json()

    # 주문 성공 시 우리 DB에 저장
    if order_data["success"]:
        new_order = Order(
            book_id=req.bookId,
            sweetbook_order_uid=order_data["data"]["orderUid"],
            status=order_data["data"]["orderStatusDisplay"]
        )
        db.add(new_order)
        db.commit()

    return order_data

# 주문 목록 조회
@router.get("/orders")
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return {
        "success": True,
        "data": {
            "items": [
                {
                    "orderUid": order.sweetbook_order_uid,
                    "orderStatusDisplay": order.status,
                    "orderedAt": order.created_at,
                    "bookId": order.book_id,
                    "bookTitle": order.book.title if order.book else ""
                }
                for order in orders
            ]
        }
    }

# 주문 상세 조회
@router.get("/orders/{order_uid}")
def get_order(order_uid: str):
    res = requests.get(
        f"{BASE_URL}/orders/{order_uid}",
        headers=get_headers()
    )
    data = res.json()

    # 스윗북 API 응답을 정리해서 반환
    if data.get("success") and data.get("data"):
        order = data["data"]
        return {
            "success": True,
            "data": {
                "orderUid": order.get("orderUid"),
                "orderStatusDisplay": order.get("orderStatusDisplay"),
                "orderedAt": order.get("orderedAt"),
                "items": [
                    {
                        "bookUid": item.get("bookUid"),
                        "title": item.get("bookTitle"),
                        "pages": item.get("pageCount"),
                        "quantity": item.get("quantity", 1),
                        "unitPrice": item.get("unitPrice"),
                        "subtotalPrice": item.get("itemAmount")
                    }
                    for item in order.get("items", [])
                ],
                "payment": {
                    "productPrice": order.get("totalProductAmount"),
                    "shippingPrice": order.get("totalShippingFee"),
                    "packagingPrice": order.get("totalPackagingFee"),
                    "totalPrice": order.get("totalAmount"),
                    "vat": None
                },
                "shipping": {
                    "recipientName": order.get("recipientName"),
                    "recipientPhone": order.get("recipientPhone"),
                    "postalCode": order.get("postalCode"),
                    "address1": order.get("address1"),
                    "address2": order.get("address2"),
                    "memo": order.get("shippingMemo")
                },
                "timeline": order.get("timeline", [])
            }
        }

    return data

# 배송지 수정
@router.patch("/orders/{order_uid}/shipping")
def update_shipping(order_uid: str, body: ShippingUpdate):
    update_data = {k: v for k, v in body.dict().items() if v is not None}
    res = requests.patch(
        f"{BASE_URL}/orders/{order_uid}/shipping",
        headers=get_headers(),
        json=update_data
    )
    return res.json()