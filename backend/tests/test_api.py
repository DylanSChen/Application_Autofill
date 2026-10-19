import asyncio
from io import BytesIO

import httpx
from pypdf import PdfWriter

from backend.app.main import app


def make_request(method: str, path: str, **kwargs: object) -> httpx.Response:
    async def send_request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, **kwargs)

    return asyncio.run(send_request())


def test_health_check() -> None:
    response = make_request("GET", "/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_rejects_non_pdf_upload() -> None:
    response = make_request(
        "POST",
        "/api/resumes/parse",
        files={"file": ("resume.pdf", b"not a pdf", "application/pdf")},
    )

    assert response.status_code == 415
    assert response.json()["detail"] == "The uploaded file is not a valid PDF."


def test_rejects_pdf_without_selectable_text() -> None:
    buffer = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.write(buffer)

    response = make_request(
        "POST",
        "/api/resumes/parse",
        files={"file": ("scanned.pdf", buffer.getvalue(), "application/pdf")},
    )

    assert response.status_code == 422
    assert "Scanned PDFs" in response.json()["detail"]


def test_returns_detected_profile_fields(monkeypatch) -> None:
    class FakePage:
        def extract_text(self) -> str:
            return "Jane Doe\njane.doe@example.com"

    class FakeReader:
        is_encrypted = False
        pages = [FakePage()]

    def fake_pdf_reader(stream: BytesIO, *, strict: bool) -> FakeReader:
        assert stream.read() == b"%PDF-test"
        assert strict is False
        return FakeReader()

    monkeypatch.setattr("backend.app.main.PdfReader", fake_pdf_reader)

    response = make_request(
        "POST",
        "/api/resumes/parse",
        files={"file": ("resume.pdf", b"%PDF-test", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "profile": {
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "jane.doe@example.com",
        }
    }
