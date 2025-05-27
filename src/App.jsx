import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Inicio from "./pages/Inicio";
import Tips from "./pages/Tips";
import Historial from "./pages/Historial";
import Logros from "./pages/Logros";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Chat from "./pages/Chat";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
             <Layout>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rutas protegidas */}
        <Route path="/tips" element={<PrivateRoute><Tips /></PrivateRoute>} />
        <Route path="/historial" element={<PrivateRoute><Historial /></PrivateRoute>} />
        <Route path="/logros" element={<PrivateRoute><Logros /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
      </Routes>
         </Layout>
    </Router>
  );
}

export default App;
