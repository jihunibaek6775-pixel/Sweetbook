from fastapi import APIRouter
import requests
import os

router = APIRouter()

BASE_URL = "https://api-sandbox.sweetbook.com/v1"

def get_headers():
    api_key = os.getenv("SWEETBOOK_API_KEY")
    return {"Authorization": f"Bearer {api_key}"}

@router.get("/templates/list")
def get_templates(templateKind: str = "content"):
    res = requests.get(
        f"{BASE_URL}/templates",
        headers=get_headers(),
        params={
            "bookSpecUid": "SQUAREBOOK_HC",
            "templateKind": templateKind
        }
    )
    return res.json()

@router.get("/templates/detail/{template_uid}")
def get_template(template_uid: str):
    res = requests.get(
        f"{BASE_URL}/templates/{template_uid}",
        headers=get_headers()
    )
    print("템플릿 상세:", res.status_code, res.text)
    return res.json()