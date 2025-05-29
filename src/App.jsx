import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, createContext, useEffect } from "react";
import { auth } from "./services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Inicio from "./pages/Inicio";
import Tips from "./pages/Tips";
import Historial from "./pages/Historial";
import Logros from "./pages/Logros";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Chat from "./pages/Chat";
import Mapa from "./pages/Mapa";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";

export const AppContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [historialGlobal, setHistorialGlobal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metasUsuario] = useState({
    diaria: 3,
    semanal: 10,
    mensual: 30
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Cargando...</div>;
  }

  return (
    <AppContext.Provider value={{ 
      historialGlobal, 
      setHistorialGlobal, 
      user,
      metasUsuario
    }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/tips" element={<PrivateRoute><Tips /></PrivateRoute>} />
            <Route path="/historial" element={<PrivateRoute><Historial /></PrivateRoute>} />
            <Route path="/logros" element={<PrivateRoute><Logros /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
            <Route path="/mapa" element={<PrivateRoute><Mapa /></PrivateRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AppContext.Provider>
  );
}

export default App;