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
        "undergraduateDegree": "B.S.",
        "graduateDegree": "M.S.",
        "undergraduateMajor": "Computer Science",
        "graduateMajor": "Artificial Intelligence",
        "undergraduateGpa": "3.8/4.0",
        "graduateGpa": "3.9/4.0",
        "school": "MIT",
        "degree": "M.S.",
        "major": "Artificial Intelligence",
        "programName": "Artificial Intelligence",
    }


def test_returns_only_detected_fields() -> None:
    assert parse_resume_text("Resume\nProfessional summary\nTeam-focused communicator") == {}


def test_extracts_profile_from_layout_preserving_resume_text() -> None:
    text = """Alex Morgan
(415) 555-0199 | alex@example.com | www.linkedin.com/in/alex-morgan/
PROFESSIONAL EXPERIENCE
EDUCATION
University of Example, Los Angeles                                      Los Angeles, CA
M.S. Financial Engineering                 GPA: 3.5/4.0          Sep 2023 – Dec 2024
University of Example, Los Angeles                                      Los Angeles, CA
B.S. Financial Mathematics, Specialization in Computing
GPA: 3.9/4.0
TECHNICAL SKILLS
Python, Scala, C++"""

    assert parse_resume_text(text) == {
        "firstName": "Alex",
        "lastName": "Morgan",
        "phone": "(415) 555-0199",
        "email": "alex@example.com",
        "linkedin": "https://www.linkedin.com/in/alex-morgan/",
        "undergraduateSchool": "University of Example, Los Angeles",
        "graduateSchool": "University of Example, Los Angeles",
        "undergraduateDegree": "B.S.",
        "graduateDegree": "M.S.",
        "undergraduateMajor": "Financial Mathematics",
        "graduateMajor": "Financial Engineering",
        "undergraduateSpecialization": "Computing",
        "undergraduateGpa": "3.9/4.0",
        "graduateGpa": "3.5/4.0",
        "school": "University of Example, Los Angeles",
        "degree": "M.S.",
        "major": "Financial Engineering",
        "programName": "Financial Engineering",
    }
