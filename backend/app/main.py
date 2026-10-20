from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from backend.app.resume_parser import parse_resume_text

MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_PDF_PAGES = 30

app = FastAPI(title="Application Autofill API")

@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/resumes/parse")
async def parse_resume(file: UploadFile = File(...)) -> dict[str, dict[str, str]]:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Please upload a PDF resume.")

    contents = await file.read(MAX_FILE_SIZE + 1)
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="The resume must be smaller than 10 MB.")
    if not contents.startswith(b"%PDF-"):
        raise HTTPException(status_code=415, detail="The uploaded file is not a valid PDF.")

    try:
        reader = PdfReader(BytesIO(contents), strict=False)
        if reader.is_encrypted:
            raise HTTPException(
                status_code=422,
                detail="Password-protected PDFs are not supported.",
            )
        if len(reader.pages) > MAX_PDF_PAGES:
            raise HTTPException(
                status_code=413,
                detail=f"The resume must have {MAX_PDF_PAGES} pages or fewer.",
            )
        text = "\n".join(
            page.extract_text(extraction_mode="layout") or "" for page in reader.pages
        )
    except HTTPException:
        raise
    except (PdfReadError, ValueError) as error:
        raise HTTPException(status_code=422, detail="The PDF could not be read.") from error
    finally:
        await file.close()

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="No selectable text was found. Scanned PDFs are not supported yet.",
        )

    return {"profile": parse_resume_text(text)}
