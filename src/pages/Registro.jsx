import { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";

export default function Registro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      Swal.fire("Error", "Las contraseñas no coinciden", "error");
      return;
    }
    
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      Swal.fire("Error", "El número de teléfono debe tener 10 dígitos", "error");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar el perfil del usuario con el nombre de usuario
      await updateProfile(userCredential.user, {
        displayName: username
      });

      // Guardar datos adicionales del usuario en Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        nombre: username,
        email: email,
        telefono: phoneNumber ? `+52${phoneNumber}` : null, // Formato internacional para México
        fechaRegistro: new Date().toISOString(),
        uid: userCredential.user.uid
      });

      Swal.fire({
        title: "¡Cuenta creada!",
        text: "Ahora puedes iniciar sesión",
        icon: "success",
        confirmButtonText: "Aceptar"
      });
      navigate("/login");
    } catch (error) {
      let errorMessage = "Error al registrar";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este correo ya está registrado";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña debe tener al menos 6 caracteres";
      }
      Swal.fire("Error", errorMessage, "error");
    }
  };

  const registroWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Guardar datos del usuario de Google en Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        nombre: result.user.displayName,
        email: result.user.email,
        telefono: null, // Google no proporciona número de teléfono
        fechaRegistro: new Date().toISOString(),
        uid: result.user.uid,
        foto: result.user.photoURL
      });

      Swal.fire("¡Registro exitoso con Google!", "", "success");
      navigate("/");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-700">EcoRed</h1>
          <p className="mt-2 text-gray-600">Crea tu cuenta para comenzar</p>
        </div>

        <form onSubmit={handleRegistro} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de usuario</label>
            <input
              type="text"
              placeholder="Tu nombre de usuario"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

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
            <label className="block text-sm font-medium text-gray-700">Número de teléfono</label>
            <div className="flex items-center mt-1">
              <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">+52</span>
              <input
                type="tel"
                placeholder="10 dígitos (sin espacios)"
                className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onChange={(e) => setPhoneNumber(e.target.value)}
                pattern="\d{10}"
                maxLength="10"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Para recibir notificaciones de tus logros</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
            <input
              type="password"
              placeholder="Repite tu contraseña"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-200"
          >
            Registrarse
          </button>
        </form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O regístrate con</span>
          </div>
        </div>

        <button
          onClick={registroWithGoogle}
          className="w-full mt-6 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
          <span>Google</span>
        </button>

        <p className="text-center mt-4 text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-green-600 hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}