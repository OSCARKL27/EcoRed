import { Link } from "react-router-dom";

export default function Inicio() {
  return (
    <>
      {/* Contenido principal - Ya no necesita contenedor de página completo */}
      <section className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-800 mb-4">Transforma tu impacto ambiental</h1>
          <p className="text-xl text-gray-600">
            Con EcoRed, convierte el reciclaje en un hábito sencillo y gratificante
          </p>
        </div>

        {/* Video explicativo */}
        <div className="mb-12 rounded-xl overflow-hidden shadow-lg">
          <div className="aspect-w-16 aspect-h-9 bg-black">
            <iframe 
              className="w-full h-96"
              src="https://www.youtube.com/embed/[TU_ID_DE_VIDEO]"
              title="Video sobre reciclaje"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/* Sección de beneficios */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-700 mb-3">🌱 Tips prácticos</h3>
            <p>Aprende las mejores técnicas para clasificar tus residuos correctamente.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-700 mb-3">📊 Tu impacto</h3>
            <p>Registra tu actividad y visualiza cuánto estás contribuyendo al planeta.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-700 mb-3">💬 Comunidad</h3>
            <p>Conecta con otros usuarios y comparte tus logros.</p>
          </div>
        </div>

        {/* Llamado a la acción */}
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-green-800 mb-4">¡Únete al cambio hoy mismo!</h2>
          <div className="flex justify-center gap-4">
            <Link 
              to="/registro" 
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition text-lg font-medium"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}