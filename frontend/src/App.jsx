import { useState } from 'react'
import Drive from './pages/Drive/Drive.jsx'
import Login from './pages/Login/Login.jsx'
import Register from './pages/Register/Register.jsx'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/drive" element={
          <ProtectedRoute>
            <Drive />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
