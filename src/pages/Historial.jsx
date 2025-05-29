import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../App";
import { db, storage } from "../services/firebase";
import { collection, getDocs, query, where, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import Swal from "sweetalert2";

export default function Historial() {
  const { user } = useContext(AppContext);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo] = useState({
    fecha: "",
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
  }, [user]);

  // Función para subir imágenes CORREGIDA
  const handleImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Formato incorrecto',
        text: 'Por favor, selecciona un archivo de imagen (JPEG, PNG)',
        confirmButtonColor: '#2e7d32'
      });
      return;
    }

    // Validar tamaño (2MB máximo)
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
      
      // 1. Crear referencia única en Storage
      const imageName = uuidv4();
      const storageRef = ref(storage, `evidencias/${user.uid}/${imageName}`);
      
      // 2. Subir el archivo
      await uploadBytes(storageRef, file);
      
      // 3. Obtener URL pública
      const downloadURL = await getDownloadURL(storageRef);
      
      // 4. Actualizar estado con la URL
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
        
        setHistorial(historial.map(item => 
          item.id === editandoId ? { ...nuevo, id: editandoId } : item
        ));
        
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'Registro actualizado correctamente',
          confirmButtonColor: '#2e7d32'
        });
      } else {
        // Crear nuevo registro
        const docRef = await addDoc(collection(db, "historial"), {
          ...nuevo,
          userId: user.uid,
          createdAt: new Date()
        });
        
        setHistorial([...historial, { ...nuevo, id: docRef.id }]);
        
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: 'Nuevo registro agregado al historial',
          confirmButtonColor: '#2e7d32'
        });
      }
      
      // Limpiar formulario
      setNuevo({
        fecha: "",
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
      comentario: registro.comentario,
      imagenURL: registro.imagenURL
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
        setHistorial(historial.filter(item => item.id !== id));
        
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
        <p>Cargando...</p>
      </section>
    );
  }

  return (
    <section className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Mi Historial</h2>

      {/* Formulario con diseño anterior */}
      <div className="mb-6 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">
          {editandoId ? "Editar registro" : "Agregar nuevo registro"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="date"
            name="fecha"
            value={nuevo.fecha}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="material"
            value={nuevo.material}
            onChange={handleChange}
            placeholder="Material"
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="cantidad"
            value={nuevo.cantidad}
            onChange={handleChange}
            placeholder="Cantidad"
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="comentario"
            value={nuevo.comentario}
            onChange={handleChange}
            placeholder="Comentario (opcional)"
            className="border p-2 rounded"
          />
        </div>
        <div className="mt-4">
          <label className="block mb-1 font-medium">Subir foto de evidencia:</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImagen} 
            className="mb-2"
            disabled={subiendoImagen}
          />
          {subiendoImagen && (
            <p className="text-sm text-green-600">Subiendo imagen, por favor espera...</p>
          )}
          {nuevo.imagenURL && (
            <div className="mt-2">
              <img 
                src={nuevo.imagenURL} 
                alt="Previsualización" 
                className="h-24 rounded border"
              />
              <button
                onClick={() => setNuevo({...nuevo, imagenURL: ""})}
                className="mt-1 text-sm text-red-500"
              >
                Eliminar imagen
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={subiendoImagen}
        >
          {editandoId ? "Actualizar" : "Agregar"}
        </button>
        {editandoId && (
          <button
            onClick={() => {
              setNuevo({
                fecha: "",
                material: "",
                cantidad: "",
                comentario: "",
                imagenURL: ""
              });
              setEditandoId(null);
            }}
            className="mt-4 ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Tabla de registros con diseño anterior */}
      {historial.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
          <p>No hay registros en tu historial aún. ¡Agrega tu primer registro!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 bg-white">
            <thead>
              <tr className="bg-green-100">
                <th className="border px-4 py-2">Fecha</th>
                <th className="border px-4 py-2">Material</th>
                <th className="border px-4 py-2">Cantidad</th>
                <th className="border px-4 py-2">Comentario</th>
                <th className="border px-4 py-2">Foto</th>
                <th className="border px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((item) => (
                <tr key={item.id} className="hover:bg-green-50">
                  <td className="border px-4 py-2">{item.fecha}</td>
                  <td className="border px-4 py-2">{item.material}</td>
                  <td className="border px-4 py-2">{item.cantidad}</td>
                  <td className="border px-4 py-2">{item.comentario || "-"}</td>
                  <td className="border px-4 py-2">
                    {item.imagenURL ? (
                      <img 
                        src={item.imagenURL} 
                        alt="Evidencia" 
                        className="h-16 rounded mx-auto"
                      />
                    ) : (
                      "Sin foto"
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleEditar(item)}
                      className="bg-blue-500 text-white px-2 py-1 rounded mr-2 hover:bg-blue-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(item.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Eliminar
                    </button>
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