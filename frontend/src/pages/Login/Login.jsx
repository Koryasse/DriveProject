import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../assets/img/nebulaLogo/nebulaBlack.svg'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        navigate('/dashboard')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      console.error(err)
      setError('Server error, try again later')
    }
  }

  return (
    <main className='login-main'>
      <section className='login-main-content'>
        <div>
          <div>
            <img src={Logo} alt="Nebula Logo" />
            <h2>Welcome back</h2>
          </div>
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="Enter email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" 
              placeholder='Password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Continue</button>
            {error && <p className="login-error">{error}</p>}
          </form>
          <div>
            <p>By continuing, you agree to our 
              <Link to="/terms"> Terms </Link>
              and <Link to="/privacy">Privacy policy</Link>.
            </p>
            <p>Don't have an account? <Link to="/register">Sign up</Link></p>
          </div>
        </div>
      </section>
      <section className='login-bg'></section>
    </main>
  )
}

export default Login
