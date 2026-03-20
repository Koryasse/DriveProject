import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

function Home() {

  return (
    <>
      <main>
        <section className='left-home-main'>
          <h1>Welcome to Our App</h1>
          <p>Your one-stop solution for all your needs.</p>
          <Link to='/login'>Get Started</Link>
        </section>
        <section className='right-home-main'></section>
      </main>
    </>
  )
}

export default Home
