import { useState } from 'react'

function App() {
  const [profile, setProfile] = useState(() => {
    const storedProfile = localStorage.getItem('applicationProfile')
    console.log(storedProfile)
    if (storedProfile) {
      return JSON.parse(storedProfile)
    }

    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      linkedin: '',
    }
  })

  const [savedProfile, setSavedProfile] = useState(null)

  function handleChange(event) {
    const { name, value } = event.target

    setProfile({
      ...profile,
      [name]: value,
    })
  }

  function handleSave(event) {
    event.preventDefault()

    localStorage.setItem(
      'applicationProfile',
      JSON.stringify(profile)
    )

    setSavedProfile({ ...profile })
  }

  return (
    <main style={{ maxWidth: '500px', margin: '40px auto', padding: '20px' }}>
      <h1>My Application Profile</h1>
      <p>Enter the information you want to use in job applications.</p>

      <form
        onSubmit={handleSave}
        style={{ display: 'grid', gap: '16px', textAlign: 'left' }}
      >
        <label>
          First name
          <input
            name="firstName"
            value={profile.firstName}
            onChange={handleChange}
            required
            style={{ display: 'block', padding: '8px' }}
          />
        </label>

        <label>
          Last name
          <input
            name="lastName"
            value={profile.lastName}
            onChange={handleChange}
            required
            style={{ display: 'block', padding: '8px' }}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            required
            style={{ display: 'block', padding: '8px' }}
          />
        </label>

        <label>
          Phone number
          <input
            type="tel"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            style={{ display: 'block', padding: '8px' }}
          />
        </label>

        <label>
          LinkedIn URL
          <input
            type="url"
            name="linkedin"
            value={profile.linkedin}
            onChange={handleChange}
            placeholder="https://www.linkedin.com/in/your-name"
            style={{ display: 'block', padding: '8px' }}
          />
        </label>

        <button type="submit">Save profile</button>
      </form>

      {savedProfile && (
        <section style={{ marginTop: '24px', textAlign: 'left' }}>
          <h2>Saved profile</h2>
          <p>Name: {savedProfile.firstName} {savedProfile.lastName}</p>
          <p>Email: {savedProfile.email}</p>
          <p>Phone: {savedProfile.phone}</p>
          <p>LinkedIn: {savedProfile.linkedin}</p>
        </section>
      )}
    </main>
  )
}

export default App