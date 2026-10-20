import re


SECTION_HEADING = re.compile(
    r"^(education|academic background|academic history|professional experience|"
    r"work experience|employment|projects|skills|certifications|awards|"
    r"publications|volunteer experience)\s*:?\s*$",
    re.IGNORECASE,
)
EDUCATION_HEADING = re.compile(
    r"^(education|academic background|academic history)\s*:?\s*$",
    re.IGNORECASE,
)
DEGREE = re.compile(
    r"\b(?:ph\.?\s*d\.?|doctorate|doctoral|master'?s?|m\.?\s*s\.?|m\.?\s*a\.?|"
    r"m\.?\s*b\.?\s*a\.?|m\.?sc\.?|m\.?eng\.?|m\.?pa\.?|m\.?ph\.?|ll\.?m\.?|"
    r"j\.?d\.?|m\.?d\.?|bachelor'?s?|b\.?\s*s\.?|b\.?\s*a\.?|b\.?sc\.?|"
    r"b\.?eng\.?|b\.?b\.?a\.?|associate'?s?)\b",
    re.IGNORECASE,
)
GRADUATE_DEGREE = re.compile(
    r"\b(?:ph\.?\s*d\.?|doctorate|doctoral|master'?s?|m\.?\s*s\.?|m\.?\s*a\.?|"
    r"m\.?\s*b\.?\s*a\.?|m\.?sc\.?|m\.?eng\.?|m\.?pa\.?|m\.?ph\.?|ll\.?m\.?|"
    r"j\.?d\.?|m\.?d\.?|graduate)\b",
    re.IGNORECASE,
)
UNDERGRADUATE_DEGREE = re.compile(
    r"\b(?:bachelor'?s?|b\.?\s*s\.?|b\.?\s*a\.?|b\.?sc\.?|b\.?eng\.?|"
    r"b\.?b\.?a\.?|associate'?s?|undergraduate)\b",
    re.IGNORECASE,
)
INSTITUTION = re.compile(
    r"\b(?:university|college|institute|polytechnic|academy|school of)\b",
    re.IGNORECASE,
)
GPA = re.compile(
    r"\b(?:cumulative\s+)?(?:GPA|grade point average)\s*[:-]?\s*"
    r"(\d(?:\.\d{1,2})?(?:\s*/\s*\d(?:\.\d{1,2})?)?)",
    re.IGNORECASE,
)
GPA_SUFFIX = re.compile(
    r"\b(\d(?:\.\d{1,2})?(?:\s*/\s*\d(?:\.\d{1,2})?))\s*"
    r"(?:cumulative\s+)?GPA\b",
    re.IGNORECASE,
)
GPA_SCALE = re.compile(r"\b(\d\.\d{1,2}\s*/\s*4(?:\.0)?)\b", re.IGNORECASE)
EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE = re.compile(
    r"(?<!\d)(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}(?!\d)"
)
LINKEDIN = re.compile(
    r"https?://(?:www\.)?linkedin\.com/in/[A-Z0-9_-]+/?", re.IGNORECASE
)
NAME_EXCLUSIONS = re.compile(
    r"\b(resume|curriculum vitae|software|engineer|developer|manager|designer|"
    r"analyst|scientist|consultant|student|professor|director|specialist|"
    r"experience|education)\b",
    re.IGNORECASE,
)
PROGRAM_LABEL = re.compile(
    r"\b(?:major|program|concentration|field of study)\s*[:-]\s*([^|,;]+)",
    re.IGNORECASE,
)
PROGRAM_SUBJECT = re.compile(
    r"\b(?:in|major(?:ing)? in)\s+(.+?)(?=,|;|\||\bGPA\b|$)",
    re.IGNORECASE,
)
DEGREE_END = re.compile(
    r"\b(?:in|major(?:ing)? in|program)\b|[,;|]|\bGPA\b|"
    r"\b(?:May|June|July|August|September|October|November|December|"
    r"January|February|March|April)\b",
    re.IGNORECASE,
)


def _clean(value: str) -> str:
    return re.sub(r"^[\s|,:;–—-]+|[\s|,:;–—-]+$", "", re.sub(r"\s+", " ", value)).strip()


def _education_lines(lines: list[str]) -> list[str]:
    heading_index = next(
        (index for index, line in enumerate(lines) if EDUCATION_HEADING.fullmatch(line)),
        None,
    )
    if heading_index is None:
        return lines

    end_index = next(
        (
            index
            for index in range(heading_index + 1, len(lines))
            if SECTION_HEADING.fullmatch(lines[index])
        ),
        len(lines),
    )
    return lines[heading_index + 1 : end_index]


def _find_name(lines: list[str]) -> dict[str, str]:
    for line in lines[:8]:
        candidate = _clean(re.split(r"[|•]", line, maxsplit=1)[0])
        words = candidate.split()
        if (
            2 <= len(words) <= 4
            and not NAME_EXCLUSIONS.search(candidate)
            and all(re.fullmatch(r"[A-Z][A-Za-z'’.-]*", word) for word in words)
        ):
            return {"firstName": words[0], "lastName": words[-1]}
    return {}


def _find_program(line: str, lines: list[str], index: int) -> str:
    for nearby_line in lines[max(0, index - 1) : index + 2]:
        labeled = PROGRAM_LABEL.search(nearby_line)
        if labeled:
            return _clean(labeled.group(1))

    match = PROGRAM_SUBJECT.search(line)
    return _clean(match.group(1)) if match else ""


def _find_degree(line: str) -> str:
    match = DEGREE.search(line)
    if not match:
        return ""
    remainder = line[match.start() :]
    end_match = DEGREE_END.search(remainder)
    return _clean(remainder[: end_match.start()] if end_match else remainder)


def _find_gpa(lines: list[str], index: int) -> str:
    text = " ".join(lines[max(0, index - 1) : index + 2])
    match = GPA_SCALE.search(text) or GPA.search(text) or GPA_SUFFIX.search(text)
    return _clean(match.group(1)) if match else ""


def _institution_name(line: str) -> str:
    institution_match = INSTITUTION.search(line)
    degree_match = DEGREE.search(line)
    if not institution_match:
        return ""

    start = (
        institution_match.start()
        if degree_match and degree_match.start() < institution_match.start()
        else 0
    )
    value = line[start:]
    stops = [
        match.start()
        for pattern in (
            DEGREE,
            re.compile(r"\bGPA\b", re.IGNORECASE),
            re.compile(
                r"\b(?:May|June|July|August|September|October|November|December|"
                r"January|February|March|April)\s+\d{4}\b",
                re.IGNORECASE,
            ),
        )
        if (match := pattern.search(value))
    ]
    return _clean(value[: min(stops)] if stops else value)


def _is_institution_candidate(line: str) -> bool:
    if INSTITUTION.search(line):
        return True
    if DEGREE.search(line) or GPA.search(line) or re.search(r"\d{4}", line):
        return False
    return bool(re.fullmatch(r"[A-Z][A-Z0-9&.-]{1,11}", line))


def _education_records(lines: list[str]) -> list[dict[str, str]]:
    section_lines = _education_lines(lines)
    institutions = [
        (index, _institution_name(line) or line)
        for index, line in enumerate(section_lines)
        if _is_institution_candidate(line)
    ]
    degree_lines = [
        (index, _clean(line))
        for index, line in enumerate(section_lines)
        if DEGREE.search(line)
    ]

    records = []
    for index, line in degree_lines:
        nearby = [
            (institution_index, name)
            for institution_index, name in institutions
            if abs(institution_index - index) <= 3
        ]
        school = min(nearby, key=lambda item: abs(item[0] - index))[1] if nearby else ""
        level = (
            "graduate"
            if GRADUATE_DEGREE.search(line)
            else "undergraduate"
            if UNDERGRADUATE_DEGREE.search(line)
            else ""
        )
        records.append(
            {
                "level": level,
                "school": school,
                "degree": _find_degree(line),
                "programName": _find_program(line, section_lines, index),
                "gpa": _find_gpa(section_lines, index),
            }
        )
    return records


def parse_resume_text(text: str) -> dict[str, str]:
    """Extract likely contact and education fields from selectable resume text."""
    lines = [_clean(line) for line in text.splitlines()]
    lines = [line for line in lines if line]
    result = _find_name(lines)

    for key, pattern in (("email", EMAIL), ("phone", PHONE), ("linkedin", LINKEDIN)):
        match = pattern.search(text)
        if match:
            result[key] = _clean(match.group(0))

    records = _education_records(lines)
    undergraduate = next(
        (record for record in records if record["level"] == "undergraduate"),
        None,
    )
    graduate = next((record for record in records if record["level"] == "graduate"), None)
    best_school = next(
        (record for record in records if record["level"] == "graduate" and record["school"]),
        None,
    ) or next(
        (
            record
            for record in records
            if record["level"] == "undergraduate" and record["school"]
        ),
        None,
    ) or next((record for record in records if record["school"]), None)
    best_program = next(
        (
            record
            for record in records
            if record["level"] == "graduate" and record["programName"]
        ),
        None,
    ) or next(
        (
            record
            for record in records
            if record["level"] == "undergraduate" and record["programName"]
        ),
        None,
    ) or next((record for record in records if record["programName"]), None)
    best_record = graduate or undergraduate or (records[0] if records else None)

    extracted = {
        "undergraduateSchool": undergraduate and undergraduate["school"],
        "graduateSchool": graduate and graduate["school"],
        "undergraduateGpa": undergraduate and undergraduate["gpa"],
        "graduateGpa": graduate and graduate["gpa"],
        "school": best_school and best_school["school"],
        "degree": best_record and best_record["degree"],
        "major": best_program and best_program["programName"],
        "programName": best_program and best_program["programName"],
    }
    result.update({key: value for key, value in extracted.items() if value})
    return result
