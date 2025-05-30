import { Link } from "react-router-dom";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";

export default function Navigation() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Escuchar cambios en la autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMobileMenuOpen(false); // Cerrar el menú móvil al desloguearse
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <nav className="bg-green-800 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold">EcoRed</Link>
            <p className="hidden sm:inline text-xs text-green-200 italic">
              "Cada reciclaje cuenta 🌱 Únete al cambio"
            </p>
          </div>

          {/* Menú para desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/tips" className="hover:underline">Tips</Link>
            <Link to="/historial" className="hover:underline">Historial</Link>
            <Link to="/chat" className="hover:underline">Chat</Link>
            <Link to="/logros" className="hover:underline">Logros</Link>

            {/* Botón de cerrar sesión (solo visible si hay usuario) */}
            {user && (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm ml-4"
              >
                Cerrar Sesión
              </button>
            )}
          </div>

          {/* Botón del menú móvil */}
          <div className="md:hidden">
            <button 
              className="text-white focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/tips" 
                className="hover:bg-green-700 p-2 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tips
              </Link>
              <Link 
                to="/historial" 
                className="hover:bg-green-700 p-2 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Historial
              </Link>
              <Link 
                to="/chat" 
                className="hover:bg-green-700 p-2 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Chat
              </Link>
              <Link 
                to="/logros" 
                className="hover:bg-green-700 p-2 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Logros
              </Link>
              
              {user && (
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm text-left"
                >
                  Cerrar Sesión
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}