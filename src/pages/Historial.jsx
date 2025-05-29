import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../App";
import { db, storage } from "../services/firebase";
import { collection, getDocs, query, where, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import Swal from "sweetalert2";

export default function Historial() {
  const { user, historialGlobal, setHistorialGlobal, metasUsuario } = useContext(AppContext);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo] = useState({
    fecha: new Date().toISOString().split('T')[0],
    material: "",
    cantidad: "",
    comentario: "",
    imagenURL: ""
  });
  const [editandoId, setEditandoId] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Cargar historial del usuario
  useEffect(() => {
    const fetchHistorial = async () => {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, "historial"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const datos = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHistorial(datos);
        setHistorialGlobal(datos);
      } catch (error) {
        console.error("Error al cargar historial:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el historial',
          confirmButtonColor: '#2e7d32'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, [user, setHistorialGlobal]);

  // Función para subir imágenes
  const handleImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Formato incorrecto',
        text: 'Por favor, selecciona un archivo de imagen (JPEG, PNG)',
        confirmButtonColor: '#2e7d32'
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo muy grande',
        text: 'La imagen no debe superar los 2MB',
        confirmButtonColor: '#2e7d32'
      });
      return;
    }

    try {
      setSubiendoImagen(true);
      const imageName = uuidv4();
      const storageRef = ref(storage, `evidencias/${user.uid}/${imageName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setNuevo({ 
        ...nuevo, 
        imagenURL: downloadURL 
      });
      
      Swal.fire({
        icon: 'success',
        title: '¡Imagen subida!',
        text: 'La evidencia se cargó correctamente',
        confirmButtonColor: '#2e7d32',
        timer: 1500
      });
      
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo subir la imagen: ' + error.message,
        confirmButtonColor: '#2e7d32'
      });
    } finally {
      setSubiendoImagen(false);
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevo({ ...nuevo, [name]: value });
  };

  // Verificar metas alcanzadas
  const verificarMetas = (historialActual) => {
    if (!metasUsuario) return;
    
    // Meta diaria
    const hoy = new Date().toISOString().split('T')[0];
    const registrosHoy = historialActual.filter(reg => reg.fecha === hoy);
    
    if (metasUsuario.diaria && registrosHoy.length === metasUsuario.diaria) {
      Swal.fire({
        title: '🎉 ¡Meta diaria alcanzada!',
        html: `
          <div class="text-center">
            <p class="text-lg font-semibold">¡Has completado ${metasUsuario.diaria} registros hoy!</p>
            <p class="text-gray-600">¡Felicidades por tu compromiso diario!</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#2e7d32',
        timer: 5000,
        background: '#f0fdf4'
      });
    }
    
    // Meta semanal (últimos 7 días)
    const semanaPasada = new Date();
    semanaPasada.setDate(semanaPasada.getDate() - 7);
    const registrosSemana = historialActual.filter(reg => 
      new Date(reg.fecha) >= semanaPasada
    );
    
    if (metasUsuario.semanal && registrosSemana.length === metasUsuario.semanal) {
      Swal.fire({
        title: '🌟 ¡Excelente semana!',
        html: `
          <div class="text-center">
            <p class="text-lg font-semibold">¡Has completado ${metasUsuario.semanal} registros esta semana!</p>
            <p class="text-gray-600">Tu esfuerzo está marcando la diferencia.</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#2e7d32',
        timer: 6000,
        background: '#eff6ff'
      });
    }
    
    // Notificación cada 5 registros
    if (historialActual.length > 0 && historialActual.length % 5 === 0) {
      Swal.fire({
        title: `✅ ${historialActual.length} registros completados`,
        text: `¡Sigue así! Cada registro cuenta para un planeta más verde.`,
        icon: 'info',
        confirmButtonColor: '#2e7d32',
        timer: 3000
      });
    }
  };

  // Guardar registro (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nuevo.fecha || !nuevo.material || !nuevo.cantidad) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Debes completar fecha, material y cantidad',
        confirmButtonColor: '#2e7d32'
      });
      return;
    }

    try {
      if (editandoId) {
        // Actualizar registro existente
        await updateDoc(doc(db, "historial", editandoId), {
          ...nuevo,
          updatedAt: new Date(),
          userId: user.uid
        });
        
        const historialActualizado = historial.map(item => 
          item.id === editandoId ? { ...nuevo, id: editandoId } : item
        );
        
        setHistorial(historialActualizado);
        setHistorialGlobal(historialActualizado);
        
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'Registro actualizado correctamente',
          confirmButtonColor: '#2e7d32',
          timer: 2000
        });
      } else {
        // Crear nuevo registro
        const docRef = await addDoc(collection(db, "historial"), {
          ...nuevo,
          userId: user.uid,
          createdAt: new Date()
        });
        
        const nuevoRegistro = { ...nuevo, id: docRef.id };
        const nuevoHistorial = [...historial, nuevoRegistro];
        
        setHistorial(nuevoHistorial);
        setHistorialGlobal(nuevoHistorial);
        
        // Verificar metas después de agregar
        verificarMetas(nuevoHistorial);
        
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: 'Nuevo registro agregado al historial',
          confirmButtonColor: '#2e7d32',
          timer: 2000
        });
      }
      
      // Limpiar formulario
      setNuevo({
        fecha: new Date().toISOString().split('T')[0],
        material: "",
        cantidad: "",
        comentario: "",
        imagenURL: ""
      });
      setEditandoId(null);
      
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el registro',
        confirmButtonColor: '#2e7d32'
      });
    }
  };

  // Editar registro existente
  const handleEditar = (registro) => {
    setNuevo({
      fecha: registro.fecha,
      material: registro.material,
      cantidad: registro.cantidad,
      comentario: registro.comentario || "",
      imagenURL: registro.imagenURL || ""
    });
    setEditandoId(registro.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Eliminar registro
  const handleEliminar = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás revertir esta acción!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2e7d32',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar!'
      });
      
      if (result.isConfirmed) {
        await deleteDoc(doc(db, "historial", id));
        const nuevoHistorial = historial.filter(item => item.id !== id);
        setHistorial(nuevoHistorial);
        setHistorialGlobal(nuevoHistorial);
        
        Swal.fire(
          '¡Eliminado!',
          'El registro ha sido eliminado.',
          'success'
        );
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el registro',
        confirmButtonColor: '#2e7d32'
      });
    }
  };

  if (loading) {
    return (
      <section className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-green-800 mb-4">Mi Historial</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Mi Historial</h2>

      {/* Formulario */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          {editandoId ? "✏️ Editar registro" : "➕ Agregar nuevo registro"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={nuevo.fecha}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <input
              type="text"
              name="material"
              value={nuevo.material}
              onChange={handleChange}
              placeholder="Ej. Plástico, Vidrio"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="text"
              name="cantidad"
              value={nuevo.cantidad}
              onChange={handleChange}
              placeholder="Ej. 2 kg, 5 unidades"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
            <input
              type="text"
              name="comentario"
              value={nuevo.comentario}
              onChange={handleChange}
              placeholder="Notas adicionales"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {nuevo.imagenURL ? "✅ Evidencia subida" : "Subir foto de evidencia"}
          </label>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-green-100 text-green-800 px-4 py-2 rounded-md hover:bg-green-200 transition">
              <span>{nuevo.imagenURL ? "Cambiar imagen" : "Seleccionar imagen"}</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImagen} 
                className="hidden"
                disabled={subiendoImagen}
              />
            </label>
            {subiendoImagen && (
              <span className="text-sm text-gray-500">Subiendo imagen...</span>
            )}
          </div>
          
          {nuevo.imagenURL && (
            <div className="mt-3">
              <img 
                src={nuevo.imagenURL} 
                alt="Previsualización" 
                className="h-24 rounded-md border border-gray-200 object-cover"
              />
              <button
                onClick={() => setNuevo({...nuevo, imagenURL: ""})}
                className="mt-1 text-sm text-red-500 hover:text-red-700"
              >
                Eliminar imagen
              </button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-1"
            disabled={subiendoImagen}
          >
            {editandoId ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                Actualizar
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Agregar
              </>
            )}
          </button>
          
          {editandoId && (
            <button
              onClick={() => {
                setNuevo({
                  fecha: new Date().toISOString().split('T')[0],
                  material: "",
                  cantidad: "",
                  comentario: "",
                  imagenURL: ""
                });
                setEditandoId(null);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Resumen de progreso */}
      <div className="bg-green-50 p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-3 text-green-800">📊 Tu progreso</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-green-100">
            <p className="text-2xl font-bold text-green-600">{historial?.length || 0}</p>
            <p className="text-sm text-gray-600">Registros totales</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-green-100">
            <p className="text-2xl font-bold text-blue-600">
              {historial.filter(item => item.fecha === new Date().toISOString().split('T')[0]).length}
            </p>
            <p className="text-sm text-gray-600">Hoy</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-green-100">
            <p className="text-2xl font-bold text-yellow-600">
              {new Set(historial.map(item => item.material)).size}
            </p>
            <p className="text-sm text-gray-600">Materiales distintos</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-green-100">
            <p className="text-2xl font-bold text-purple-600">
              {historial.filter(item => item.imagenURL).length}
            </p>
            <p className="text-sm text-gray-600">Con evidencia</p>
          </div>
        </div>
      </div>

      {/* Tabla de registros */}
      {historial.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
          <p className="text-yellow-800">No hay registros en tu historial aún. ¡Agrega tu primer registro!</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Material</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Cantidad</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Comentario</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Evidencia</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historial
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .map((item) => (
                  <tr key={item.id} className="hover:bg-green-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{item.material}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.cantidad}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.comentario || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.imagenURL ? (
                        <a href={item.imagenURL} target="_blank" rel="noopener noreferrer" className="inline-block">
                          <img 
                            src={item.imagenURL} 
                            alt="Evidencia" 
                            className="h-12 w-12 rounded-md object-cover border border-gray-200 hover:border-green-300 transition"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Sin imagen</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditar(item)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(item.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}