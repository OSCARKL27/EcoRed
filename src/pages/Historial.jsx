import React, { useState } from "react";
import Swal from "sweetalert2";


export default function Historial() {
  const [historial, setHistorial] = useState([
    { fecha: "15/05/2025", material: "Papel y cartón", cantidad: "3 kg", comentario: "Material recolectado en casa", imagen: null },
    { fecha: "18/05/2025", material: "Botellas PET", cantidad: "12 unidades", comentario: "Reciclaje semanal", imagen: null }
  ]);

  const [nuevo, setNuevo] = useState({
    fecha: "",
    material: "",
    cantidad: "",
    comentario: "",
    imagen: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevo({ ...nuevo, [name]: value });
  };

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNuevo({ ...nuevo, imagen: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

const agregarRegistro = () => {
  if (
    nuevo.fecha &&
    nuevo.material &&
    nuevo.cantidad &&
    nuevo.comentario &&
    nuevo.imagen
  ) {
    setHistorial([...historial, nuevo]);
    setNuevo({
      fecha: "",
      material: "",
      cantidad: "",
      comentario: "",
      imagen: null
    });
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: 'Por favor, llena todos los campos y sube una foto de evidencia.',
      confirmButtonColor: '#2e7d32'
      });
  }
};


  return (
    <section className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Mi Historial</h2>

      <div className="mb-6 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Agregar nuevo registro</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="date"
            name="fecha"
            value={nuevo.fecha}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="material"
            value={nuevo.material}
            onChange={handleChange}
            placeholder="Material"
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="cantidad"
            value={nuevo.cantidad}
            onChange={handleChange}
            placeholder="Cantidad"
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="comentario"
            value={nuevo.comentario}
            onChange={handleChange}
            placeholder="Comentario"
            className="border p-2 rounded"
          />
        </div>
        <div className="mt-4">
          <label className="block mb-1 font-medium">Subir foto de evidencia:</label>
          <input type="file" accept="image/*" onChange={handleImagen} className="mb-2" />
          {nuevo.imagen && (
            <img src={nuevo.imagen} alt="Previsualización" className="h-24 mt-2 rounded" />
          )}
        </div>
        <button
          onClick={agregarRegistro}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Agregar
        </button>
      </div>

      <table className="w-full border border-gray-300 bg-white">
        <thead>
          <tr className="bg-green-100">
            <th className="border px-4 py-2">Fecha</th>
            <th className="border px-4 py-2">Material</th>
            <th className="border px-4 py-2">Cantidad</th>
            <th className="border px-4 py-2">Comentario</th>
            <th className="border px-4 py-2">Foto</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((item, index) => (
            <tr key={index} className="hover:bg-green-50">
              <td className="border px-4 py-2">{item.fecha}</td>
              <td className="border px-4 py-2">{item.material}</td>
              <td className="border px-4 py-2">{item.cantidad}</td>
              <td className="border px-4 py-2">{item.comentario}</td>
              <td className="border px-4 py-2">
                {item.imagen ? (
                  <img src={item.imagen} alt="Evidencia" className="h-16 rounded" />
                ) : (
                  "Sin foto"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}