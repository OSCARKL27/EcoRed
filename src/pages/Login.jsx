import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { sendPasswordResetEmail } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Swal.fire("¡Bienvenido!", "", "success");
      navigate("/");
    } catch (error) {
      Swal.fire("Error", "Correo o contraseña incorrectos", "error");
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      Swal.fire("¡Bienvenido con Google!", "", "success");
      navigate("/");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  const resetPassword = async () => {
    if (!email) {
      Swal.fire("Error", "Ingresa tu correo electrónico", "warning");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Swal.fire("Correo enviado", "Revisa tu bandeja de entrada", "success");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  return (
<div className="flex-grow flex items-center justify-center p-4"> {/* Contenedor flex para centrar */}
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg"> {/* Card del formulario */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-700">EcoRed</h1>
          <p className="mt-2 text-gray-600">Inicia sesión para gestionar tu reciclaje</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@uas.edu.mx"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200"
          >
            Iniciar sesión
          </button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={resetPassword}
              className="text-sm text-green-600 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O continúa con</span>
          </div>
        </div>

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
          <span>Google</span>
        </button>

        <p className="text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-medium text-green-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}