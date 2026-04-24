import { Link } from 'react-router-dom'
import Logo from '../../assets/img/nebulaLogo/nebulaBlack.svg'
import './Register.css'

function Register() {
  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        username,
        password
      })
    })
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
          <form action="">
            <input type="email" placeholder='Enter email address' />
            <input type="text" placeholder="Enter username" />
            <input type="password" placeholder='Enter password' />
            <input type="password" placeholder='Confirm password' />
            <button>Continue</button>
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
