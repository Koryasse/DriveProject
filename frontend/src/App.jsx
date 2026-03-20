import { useState } from 'react'
import Home from './pages/Home/Home.jsx'
import Drive from './pages/Drive/Drive.jsx'
import Login from './pages/Login/Login.jsx'
import Register from './pages/Register/Register.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/drive" element={<Drive />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
