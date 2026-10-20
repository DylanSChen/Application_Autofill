from backend.app.resume_parser import parse_resume_text


def test_extracts_contact_and_undergraduate_and_graduate_education() -> None:
    text = """Jane Doe
jane.doe@example.com
(415) 555-0199
https://www.linkedin.com/in/janedoe
EDUCATION
Stanford University, B.S. in Computer Science, GPA: 3.8/4.0
MIT
M.S. in Artificial Intelligence, 3.9/4.0 GPA
EXPERIENCE
Software Engineer"""

    assert parse_resume_text(text) == {
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane.doe@example.com",
        "phone": "(415) 555-0199",
        "linkedin": "https://www.linkedin.com/in/janedoe",
        "undergraduateSchool": "Stanford University",
        "graduateSchool": "MIT",
        "undergraduateGpa": "3.8/4.0",
        "graduateGpa": "3.9/4.0",
        "school": "MIT",
        "degree": "M.S.",
        "major": "Artificial Intelligence",
        "programName": "Artificial Intelligence",
    }


def test_returns_only_detected_fields() -> None:
    assert parse_resume_text("Resume\nProfessional summary\nTeam-focused communicator") == {}
