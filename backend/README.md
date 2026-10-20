# Backend

The FastAPI service receives PDF resumes and extracts selectable text and likely profile fields. Resume content is processed in memory and is not stored.

## Run locally

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements-dev.txt
uvicorn backend.app.main:app --reload
```

The frontend's Vite development server proxies `/api` to `http://localhost:8000`. Run it separately from `frontend/` with `npm run dev`.

## API

- `GET /api/health` checks service availability.
- `POST /api/resumes/parse` accepts a multipart PDF in the `file` field and returns `{"profile": {...}}`.

Uploads are limited to 10 MB and 30 pages. PDFs are extracted in layout mode to preserve resume rows and columns. Scanned PDFs, which need OCR, and password-protected PDFs are not supported. Field extraction uses heuristics, so users should review the suggested values before saving.

Run backend tests from the repository root with `pytest backend/tests`.
