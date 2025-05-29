import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Solución para los iconos rotos en producción
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

const customIcon = new L.Icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Datos de puntos de reciclaje en Culiacán
const recyclingPoints = [
  { 
    id: 1, 
    name: "Centro de Acopio Municipal", 
    position: [24.8064, -107.3938],
    address: "Blvd. Pedro Infante 1000, Las Quintas",
    materials: ["PET", "Cartón", "Vidrio", "Aluminio"],
    schedule: "Lunes a Viernes 8:00 - 18:00",
    phone: "667 123 4567"
  },
  { 
    id: 2, 
    name: "Recicladora Sinaloa", 
    position: [24.8123, -107.4021],
    address: "Callejón del Reciclaje 250, Centro",
    materials: ["Electrónicos", "Baterías", "Metales"],
    schedule: "Martes a Sábado 9:00 - 17:00",
    phone: "667 234 5678"
  },
  { 
    id: 3, 
    name: "EcoPoint Culiacán", 
    position: [24.7992, -107.3887],
    address: "Av. Universidad 3455, Col. Universitarios",
    materials: ["PET", "Tetrapack", "Papel"],
    schedule: "Todos los días 7:00 - 20:00",
    phone: "667 345 6789"
  },
];

export default function Mapa() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-800 mb-2">Mapa de Reciclaje en Culiacán</h1>
        <p className="text-lg text-gray-600">
          Encuentra los centros de reciclaje más cercanos a tu ubicación
        </p>
      </div>

      <div className="mb-8 rounded-xl overflow-hidden shadow-lg border border-gray-200 h-[500px]">
        <MapContainer 
          center={[24.8064, -107.3938]} 
          zoom={13} 
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {recyclingPoints.map(point => (
            <Marker 
              key={point.id} 
              position={point.position}
              icon={customIcon}
            >
              <Popup>
                <div className="max-w-xs">
                  <h3 className="font-bold text-lg text-green-700">{point.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{point.address}</p>
                  
                  <div className="mt-2">
                    <p className="font-semibold text-sm">Materiales aceptados:</p>
                    <ul className="list-disc list-inside text-sm">
                      {point.materials.map((material, index) => (
                        <li key={index}>{material}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <p className="text-sm mt-2">
                    <span className="font-semibold">Horario:</span> {point.schedule}
                  </p>
                  
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Teléfono:</span> {point.phone}
                  </p>
                  
                  <div className="mt-3 flex justify-between">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${point.position[0]},${point.position[1]}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Cómo llegar
                    </a>
                    <Link 
                      to={`/punto-reciclaje/${point.id}`}
                      className="text-green-600 hover:underline text-sm"
                    >
                      Más detalles
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="text-center">
        <Link 
          to="/" 
          className="inline-block bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}