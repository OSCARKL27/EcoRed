import { Navigate } from "react-router-dom";
import { auth } from "../services/firebase";

export default function PrivateRoute({ children }) {
  return auth.currentUser ? children : <Navigate to="/login" />;
}