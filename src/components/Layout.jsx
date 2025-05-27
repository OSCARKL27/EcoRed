import Navigation from "./Navigation";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra de navegación (visible en todas las páginas) */}
      <Navigation />
      
      {/* Contenido específico de cada página */}
      <main className="flex-grow bg-green-50 p-4">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer (opcional) */}
    <footer className="bg-green-700 text-white text-center p-4 mt-10">
      &copy; 2025 EcoRed - Facultad de Informática, UAS
    </footer>
    </div>
  );
}