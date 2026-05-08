import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../assets/img/nebulaLogo/nebulaBlack.svg'
import { api, saveAuth } from '../../utils/api'
import './Register.css'

function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !username || !password || !confirm) {
      setError('All fields are required')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    try {
      const response = await api.register(email, username, password)
      const data = await response.json()

      if (response.ok) {
        saveAuth(data.token, data.user)
        navigate('/dashboard')
      } else {
        setError(data.detail || 'Registration failed')
      }
    } catch (err) {
      setError('Server error, try again later')
    }
  }

  return (
    <main className='register-main'>
      <section className='register-main-content'>
        <div>
          <div>
            <img src={Logo} alt="" />
            <h2>Welcome to Nebula</h2>
            <p>Your space. Your files. Your universe.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <input type="email" placeholder='Enter email address'
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="text" placeholder="Enter username"
              value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="password" placeholder='Enter password'
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <input type="password" placeholder='Confirm password'
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button type="submit">Continue</button>
            {error && <p className="login-error">{error}</p>}
          </form>
          <div>
            <p>By continuing, you agree to our
              <Link to="/terms"> Terms </Link>
              and <Link to="/privacy">Privacy policy</Link>.
            </p>
            <p>Already have an account? <Link to="/">Sign in</Link></p>
          </div>
        </div>
      </section>
      <section className='register-bg'></section>
    </main>
  )
}

export default Register