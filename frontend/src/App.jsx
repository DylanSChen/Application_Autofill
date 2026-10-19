import { useRef, useState } from 'react'
import './App.css'

const emptyProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  linkedin: '',
  school: '',
  degree: '',
  major: '',
  undergraduateSchool: '',
  graduateSchool: '',
  undergraduateGpa: '',
  graduateGpa: '',
  programName: '',
}

function readStoredProfile() {
  const storedProfile = localStorage.getItem('applicationProfile')

  if (!storedProfile) {
    return null
  }

  return {
    ...emptyProfile,
    ...JSON.parse(storedProfile),
  }
}

function App() {
  const [profile, setProfile] = useState(() => readStoredProfile() ?? emptyProfile)
  const [savedProfile, setSavedProfile] = useState(() => readStoredProfile())
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const [resumeStatus, setResumeStatus] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const resumeInputRef = useRef(null)
  const parseRequestRef = useRef(0)

  function handleChange(event) {
    const { name, value } = event.target

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }))
  }

  async function handleResumeFile(file) {
    if (!file) {
      return
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setResumeError('Please choose a PDF file.')
      return
    }

    const requestId = parseRequestRef.current + 1
    parseRequestRef.current = requestId
    setResumeFile(file)
    setResumeError('')
    setResumeStatus('')
    setIsParsing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/resumes/parse', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.detail || 'The resume could not be parsed.')
      }

      const parsedProfile = result.profile
      if (requestId !== parseRequestRef.current) {
        return
      }

      const parsedEntries = Object.entries(parsedProfile)
      if (parsedEntries.length === 0) {
        setResumeError('No supported profile details were found. You can enter them manually.')
        return
      }

      setProfile((currentProfile) => {
        const updatedProfile = { ...currentProfile }
        parsedEntries.forEach(([key, value]) => {
          if (value && !String(updatedProfile[key] ?? '').trim()) {
            updatedProfile[key] = value
          }
        })
        return updatedProfile
      })
      setResumeError('')
      setResumeStatus('Resume parsed by the backend. Review detected details below; existing entries are preserved.')
    } catch (error) {
      if (requestId !== parseRequestRef.current) {
        return
      }
      setResumeError(
        error instanceof Error
          ? error.message
          : 'The resume could not be parsed. Please try another PDF.',
      )
    } finally {
      if (requestId === parseRequestRef.current) {
        setIsParsing(false)
      }
    }
  }

  function handleResumeChange(event) {
    handleResumeFile(event.target.files?.[0])
    event.target.value = ''
  }

  function handleResumeDrop(event) {
    event.preventDefault()
    handleResumeFile(event.dataTransfer.files[0])
  }

  function handleSave(event) {
    event.preventDefault()

    localStorage.setItem('applicationProfile', JSON.stringify(profile))
    setSavedProfile({ ...profile })
  }

  function handleRemoveResume() {
    parseRequestRef.current += 1
    setResumeFile(null)
    setResumeError('')
    setResumeStatus('')
    setIsParsing(false)
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">A</div>
        <span className="brand-name">Application Autofill</span>
      </header>

      <div className="content">
        <div className="page-intro">
          <p className="eyebrow">YOUR PROFILE</p>
          <h1>Make applying feel effortless.</h1>
          <p className="intro-copy">
            Add your details once, or upload a resume to fill in what we can recognize.
          </p>
        </div>

        <form className="profile-card" onSubmit={handleSave}>
          <section className="form-section" aria-labelledby="personal-heading">
            <div className="section-heading">
              <div>
                <h2 id="personal-heading">Personal information</h2>
                <p>The basics employers need to know.</p>
              </div>
              <span className="section-number">01</span>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>First name</span>
                <input
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Alex"
                  autoComplete="given-name"
                  required
                />
              </label>

              <label className="field">
                <span>Last name</span>
                <input
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Morgan"
                  autoComplete="family-name"
                  required
                />
              </label>

              <label className="field">
                <span>Email address</span>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="field">
                <span>Phone number <span className="optional-label">Optional</span></span>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  autoComplete="tel"
                />
              </label>

              <label className="field field-full">
                <span>LinkedIn profile <span className="optional-label">Optional</span></span>
                <input
                  type="url"
                  name="linkedin"
                  value={profile.linkedin}
                  onChange={handleChange}
                  placeholder="https://www.linkedin.com/in/your-name"
                  autoComplete="url"
                />
              </label>
            </div>
          </section>

          <section className="form-section" aria-labelledby="education-heading">
            <div className="section-heading">
              <div>
                <h2 id="education-heading">Education</h2>
                <p>Add your undergraduate, graduate, and program details.</p>
              </div>
              <span className="section-number">02</span>
            </div>

            <div className="field-grid">
              <label className="field field-full">
                <span>Most recent school</span>
                <input
                  name="school"
                  value={profile.school}
                  onChange={handleChange}
                  placeholder="University or institution"
                  autoComplete="organization"
                />
              </label>

              <label className="field field-full">
                <span>Undergraduate school</span>
                <input
                  name="undergraduateSchool"
                  value={profile.undergraduateSchool}
                  onChange={handleChange}
                  placeholder="Undergraduate university or college"
                />
              </label>

              <label className="field">
                <span>Undergraduate GPA</span>
                <input
                  name="undergraduateGpa"
                  value={profile.undergraduateGpa}
                  onChange={handleChange}
                  placeholder="e.g. 3.8 / 4.0"
                />
              </label>

              <label className="field field-full">
                <span>Graduate school</span>
                <input
                  name="graduateSchool"
                  value={profile.graduateSchool}
                  onChange={handleChange}
                  placeholder="Graduate university or college"
                />
              </label>

              <label className="field">
                <span>Graduate GPA</span>
                <input
                  name="graduateGpa"
                  value={profile.graduateGpa}
                  onChange={handleChange}
                  placeholder="e.g. 3.9 / 4.0"
                />
              </label>

              <label className="field">
                <span>Program name</span>
                <input
                  name="programName"
                  value={profile.programName}
                  onChange={handleChange}
                  placeholder="e.g. Data Science"
                />
              </label>

              <label className="field">
                <span>Degree</span>
                <input
                  name="degree"
                  value={profile.degree}
                  onChange={handleChange}
                  placeholder="e.g. Bachelor of Science"
                />
              </label>

              <label className="field">
                <span>Major</span>
                <input
                  name="major"
                  value={profile.major}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                />
              </label>
            </div>
          </section>

          <section className="form-section resume-section" aria-labelledby="resume-heading">
            <div className="section-heading">
              <div>
                <h2 id="resume-heading">Resume</h2>
                <p>Upload a resume to automatically fill in matching profile details.</p>
              </div>
              <span className="section-number">03</span>
            </div>

            <input
              ref={resumeInputRef}
              className="visually-hidden"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleResumeChange}
              aria-label="Choose a PDF resume"
            />

            {resumeFile ? (
              <div className="resume-file">
                <div className="pdf-icon" aria-hidden="true">PDF</div>
                <div className="resume-file-details">
                  <span className="resume-file-name">{resumeFile.name}</span>
                  <span className="resume-file-status">
                    {isParsing ? 'Reading PDF and extracting details…' : 'Selected for this session'}
                  </span>
                </div>
                <div className="resume-actions">
                  <button
                    className="remove-file-button"
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                  >
                    Replace
                  </button>
                  <button
                    className="remove-file-button"
                    type="button"
                    onClick={handleRemoveResume}
                    aria-label={`Remove ${resumeFile.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="resume-dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleResumeDrop}
              >
                <div className="upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
                  </svg>
                </div>
                <div className="upload-copy">
                  <p><strong>Drop your resume here</strong> or</p>
                  <button
                    className="browse-button"
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                  >
                    Browse files
                  </button>
                  <span className="upload-hint">PDF format only</span>
                </div>
              </div>
            )}
            {resumeError && <p className="upload-error" role="alert">{resumeError}</p>}
            {resumeStatus && <p className="upload-status" role="status">{resumeStatus}</p>}
            <p className="privacy-note">Your PDF is sent to the Application Autofill backend for in-memory processing and isn&apos;t stored. Scanned PDFs aren&apos;t supported yet.</p>
          </section>

          <div className="form-footer">
            <span className="save-note">Your profile is saved on this device.</span>
            <button className="save-button" type="submit">
              Save profile
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>

        {savedProfile && (
          <section className="saved-card" aria-labelledby="saved-heading">
            <div className="saved-heading">
              <div className="saved-check" aria-hidden="true">✓</div>
              <div>
                <h2 id="saved-heading">Profile saved</h2>
                <p>Your details are ready for your next application.</p>
              </div>
            </div>
            <div className="saved-details">
              <p><span>Name</span>{savedProfile.firstName} {savedProfile.lastName}</p>
              <p><span>Email</span>{savedProfile.email}</p>
              <p><span>Phone</span>{savedProfile.phone || '—'}</p>
              <p><span>LinkedIn</span>{savedProfile.linkedin || '—'}</p>
              <p><span>School</span>{savedProfile.school || '—'}</p>
              <p><span>Undergraduate school</span>{savedProfile.undergraduateSchool || '—'}</p>
              <p><span>Undergraduate GPA</span>{savedProfile.undergraduateGpa || '—'}</p>
              <p><span>Graduate school</span>{savedProfile.graduateSchool || '—'}</p>
              <p><span>Graduate GPA</span>{savedProfile.graduateGpa || '—'}</p>
              <p><span>Program</span>{savedProfile.programName || '—'}</p>
              <p><span>Degree</span>{savedProfile.degree || '—'}</p>
              <p><span>Major</span>{savedProfile.major || '—'}</p>
            </div>
          </section>
        )}
      </div>
      <footer className="page-footer">A little less busywork. A little more you.</footer>
    </main>
  )
}

export default App
