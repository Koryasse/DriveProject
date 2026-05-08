import { Navigate } from 'react-router-dom'
import { isLoggedIn } from '../../utils/api'

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/" replace />
}

export default ProtectedRoute