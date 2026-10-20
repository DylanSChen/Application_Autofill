import { useRef, useState } from 'react'
import './App.css'

const profileFields = [
  { key: 'firstName', label: 'First name', section: 'Personal information' },
  { key: 'lastName', label: 'Last name', section: 'Personal information' },
  { key: 'email', label: 'Email address', section: 'Personal information' },
  { key: 'phone', label: 'Phone number', section: 'Personal information' },
  { key: 'linkedin', label: 'LinkedIn profile', section: 'Personal information' },
  { key: 'school', label: 'Most recent school', section: 'Education' },
  { key: 'undergraduateSchool', label: 'Undergraduate school', section: 'Education' },
  { key: 'undergraduateDegree', label: 'Undergraduate degree', section: 'Education' },
  { key: 'undergraduateMajor', label: 'Undergraduate major', section: 'Education' },
  { key: 'undergraduateSpecialization', label: 'Undergraduate specialization', section: 'Education' },
  { key: 'undergraduateGpa', label: 'Undergraduate GPA', section: 'Education' },
  { key: 'graduateSchool', label: 'Graduate school', section: 'Education' },
  { key: 'graduateDegree', label: 'Graduate degree', section: 'Education' },
  { key: 'graduateMajor', label: 'Graduate major', section: 'Education' },
  { key: 'graduateGpa', label: 'Graduate GPA', section: 'Education' },
  { key: 'degree', label: 'Degree', section: 'Education' },
  { key: 'major', label: 'Major or program', section: 'Education' },
]

function getVisibleFields(profile, detectedKeys) {
  return profileFields.filter(({ key }) => {
    const value = profile[key] || (key === 'major' ? profile.programName : '')
    const wasDetected = detectedKeys.includes(key) ||
      (key === 'major' && detectedKeys.includes('programName'))
    if (!wasDetected) {
      return false
    }
    if (
      key === 'school' &&
      value &&
      [profile.undergraduateSchool, profile.graduateSchool].includes(value)
    ) {
      return false
    }
    if (key === 'degree' && (profile.undergraduateDegree || profile.graduateDegree)) {
      return false
    }
    if (key === 'major' && (profile.undergraduateMajor || profile.graduateMajor)) {
      return false
    }
    return true
  })
}

function App() {
  const [resumeFile, setResumeFile] = useState(null)
  const [profile, setProfile] = useState(null)
  const [detectedKeys, setDetectedKeys] = useState([])
  const [isParsing, setIsParsing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [isApproved, setIsApproved] = useState(false)
  const uploadInputRef = useRef(null)
  const parseRequestRef = useRef(0)

  async function handleResumeFile(file) {
    if (!file) {
      return
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.')
      return
    }

    const requestId = parseRequestRef.current + 1
    parseRequestRef.current = requestId
    setResumeFile(file)
    setProfile(null)
    setIsApproved(false)
    setError('')
    setIsParsing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/resumes/parse', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.detail || 'The resume could not be parsed.')
      }

      if (requestId !== parseRequestRef.current) {
        return
      }

      const parsedProfile = result.profile
      if (!parsedProfile || getVisibleFields(parsedProfile, Object.keys(parsedProfile)).length === 0) {
        setError('We couldn’t identify any supported profile details in this resume. Try another PDF.')
        return
      }

      setDetectedKeys(Object.keys(parsedProfile))
      setProfile({
        ...parsedProfile,
        major: parsedProfile.major || parsedProfile.programName || '',
      })
    } catch (parseError) {
      if (requestId !== parseRequestRef.current) {
        return
      }
      setError(
        parseError instanceof Error
          ? parseError.message
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

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    handleResumeFile(event.dataTransfer.files[0])
  }

  function handleFieldChange(event) {
    const { name, value } = event.target
    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }))
  }

  function handleApprove(event) {
    event.preventDefault()
    try {
      localStorage.setItem('applicationProfile', JSON.stringify(profile))
      setError('')
      setIsApproved(true)
    } catch {
      setError('Your details couldn’t be saved on this device. Please check your browser storage settings and try again.')
    }
  }

  function handleStartOver() {
    parseRequestRef.current += 1
    setResumeFile(null)
    setProfile(null)
    setDetectedKeys([])
    setIsParsing(false)
    setIsApproved(false)
    setError('')
    if (uploadInputRef.current) {
      uploadInputRef.current.value = ''
    }
  }

  const visibleFields = profile ? getVisibleFields(profile, detectedKeys) : []
  const reviewFields = visibleFields.reduce((sections, field) => {
    sections[field.section] ??= []
    sections[field.section].push(field)
    return sections
  }, {})

  return (
    <main className="page-shell">
      <div className="content">
        {!profile && !isApproved && (
          <section className="upload-stage" aria-labelledby="upload-heading">
            <div className="brand-mark" aria-hidden="true">A</div>
            <p className="eyebrow">APPLICATION AUTOFILL</p>
            <h1 id="upload-heading">Start with your resume</h1>
            <p className="intro-copy">Upload a PDF and we’ll pull out your profile details for you to review.</p>

            <input
              ref={uploadInputRef}
              className="visually-hidden"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleResumeChange}
              aria-label="Choose a PDF resume"
            />
            <div
              className={`resume-dropzone${isDragging ? ' is-dragging' : ''}${isParsing ? ' is-parsing' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsDragging(false)
                }
              }}
              onDrop={handleDrop}
            >
              <div className="upload-icon" aria-hidden="true">
                {isParsing ? (
                  <span className="spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
                  </svg>
                )}
              </div>
              <p className="drop-title">
                {isParsing ? `Reading ${resumeFile?.name}` : 'Drop your resume here'}
              </p>
              <p className="drop-copy">
                {isParsing ? 'Extracting your profile details…' : 'or choose a file from your device'}
              </p>
              {!isParsing && (
                <button
                  className="browse-button"
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  Browse files
                </button>
              )}
              {!isParsing && <span className="upload-hint">PDF only · up to 10 MB</span>}
            </div>
            {error && <p className="feedback error-message" role="alert">{error}</p>}
            <p className="privacy-note">Your resume is processed securely and isn’t stored.</p>
          </section>
        )}

        {profile && !isApproved && (
          <section className="review-stage" aria-labelledby="review-heading">
            <div className="review-topline">
              <div className="brand-mark small-mark" aria-hidden="true">A</div>
              <span>Resume parsed</span>
            </div>
            <p className="eyebrow">PROFILE REVIEW</p>
            <h1 id="review-heading">Check your details</h1>
            <p className="intro-copy">
              We found these details in <strong>{resumeFile?.name}</strong>. Edit anything that needs a correction, then approve your profile.
            </p>

            <form className="review-card" onSubmit={handleApprove}>
              {Object.entries(reviewFields).map(([section, fields]) => (
                <section className="review-section" key={section}>
                  <h2>{section}</h2>
                  <div className="field-grid">
                    {fields.map(({ key, label }) => (
                      <label className="field" key={key}>
                        <span>{label}</span>
                        <input
                          name={key}
                          value={profile[key] || (key === 'major' ? profile.programName : '') || ''}
                          onChange={handleFieldChange}
                          type={key === 'email' ? 'email' : key === 'linkedin' ? 'url' : 'text'}
                        />
                      </label>
                    ))}
                  </div>
                </section>
              ))}
              {error && <p className="feedback error-message" role="alert">{error}</p>}
              <div className="review-footer">
                <button className="text-button" type="button" onClick={handleStartOver}>
                  Use a different resume
                </button>
                <button className="approve-button" type="submit">
                  Approve details <span aria-hidden="true">✓</span>
                </button>
              </div>
            </form>
            <p className="privacy-note">Nothing is saved until you approve your details.</p>
          </section>
        )}

        {isApproved && profile && (
          <section className="approved-stage" aria-labelledby="approved-heading">
            <div className="brand-mark" aria-hidden="true">A</div>
            <div className="approved-icon" aria-hidden="true">✓</div>
            <p className="eyebrow">PROFILE APPROVED</p>
            <h1 id="approved-heading">You’re all set</h1>
            <p className="intro-copy">Your reviewed details are saved on this device and ready for your next application.</p>
            <div className="approved-summary">
              {visibleFields.map(({ key, label }) => (
                <p key={key}>
                  <span>{label}</span>
                  {profile[key] || (key === 'major' ? profile.programName : '') || '—'}
                </p>
              ))}
            </div>
            <button className="text-button restart-button" type="button" onClick={handleStartOver}>
              Upload another resume
            </button>
          </section>
        )}
      </div>
    </main>
  )
}

export default App
