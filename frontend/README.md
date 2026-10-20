# Frontend

The frontend starts with a PDF resume drop area. After the backend parses an upload, users can review and edit detected profile details before approving them. Approved details are saved in browser local storage; uploaded resumes are not saved by the frontend.

## Run locally

Start the backend from the repository root:

```sh
uvicorn backend.app.main:app --reload
```

Then run the frontend from `frontend/`:

```sh
npm install
npm run dev
```

The Vite development server proxies `/api` requests to `http://localhost:8000`.
