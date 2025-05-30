import { useState, useEffect } from 'react';
import { 
  FaRecycle, 
  FaTrashAlt, 
  FaLeaf, 
  FaWater, 
  FaBatteryFull, 
  FaShoppingBag,
  FaArrowRight
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function Tips() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [currentFact, setCurrentFact] = useState('');
  const [factIndex, setFactIndex] = useState(0);

  // Datos de tips organizados por categoría
  const tipsData = {
    general: [
      {
        title: "Separación básica de residuos",
        content: "Divide tus residuos en 3 categorías: orgánicos (restos de comida), inorgánicos reciclables (plástico, vidrio, metal) y no reciclables (pañales, colillas).",
        icon: <FaRecycle className="text-green-500 text-2xl" />
      },
      {
        title: "Limpieza de materiales",
        content: "Enjuaga los envases de alimentos antes de reciclarlos para evitar contaminación de otros materiales y malos olores.",
        icon: <FaWater className="text-blue-500 text-2xl" />
      },
      {
        title: "Reducción de plásticos",
        content: "Usa bolsas reutilizables, evita productos sobreempaquetados y opta por alternativas sostenibles.",
        icon: <FaShoppingBag className="text-yellow-500 text-2xl" />
      },
      {
        title: "Compactación correcta",
        content: "Aplasta los envases para ocupar menos espacio, pero no los destruyas completamente para facilitar su clasificación.",
        icon: <FaTrashAlt className="text-gray-500 text-2xl" />
      }
    ],
    plastico: [
      {
        title: "Identificación de plásticos",
        content: "Busca el número dentro del símbolo de reciclaje (1-7). Los más comúnmente reciclados son PET (1) y HDPE (2).",
        icon: <FaRecycle className="text-green-500 text-2xl" />
      },
      {
        title: "Preparación de botellas",
        content: "Aplasta las botellas para ahorrar espacio y retira las tapas (se reciclan por separado).",
        icon: <FaTrashAlt className="text-gray-500 text-2xl" />
      },
      {
        title: "Bolsas plásticas",
        content: "Llévalas a puntos especiales de reciclaje, no las mezcles con otros plásticos reciclables.",
        icon: <FaShoppingBag className="text-yellow-500 text-2xl" />
      }
    ],
    vidrio: [
      {
        title: "Vidrio vs. cristal",
        content: "Solo el vidrio (envases) es reciclable. Los espejos, vasos y ventanas van a desechos especiales.",
        icon: <FaRecycle className="text-green-500 text-2xl" />
      },
      {
        title: "Preparación adecuada",
        content: "No rompas los envases y retira tapas metálicas. No es necesario quitar etiquetas.",
        icon: <FaTrashAlt className="text-gray-500 text-2xl" />
      }
    ],
    peligrosos: [
      {
        title: "Pilas y baterías",
        content: "Nunca las tires a la basura común. Busca centros de acopio especializados.",
        icon: <FaBatteryFull className="text-red-500 text-2xl" />
      },
      {
        title: "Electrónicos",
        content: "Lleva tus dispositivos viejos a puntos de reciclaje electrónico.",
        icon: <FaTrashAlt className="text-gray-500 text-2xl" />
      },
      {
        title: "Medicamentos caducos",
        content: "Entrégalos en farmacias o centros de salud autorizados.",
        icon: <FaTrashAlt className="text-gray-500 text-2xl" />
      }
    ]
  };

  // Datos curiosos sobre reciclaje
  const ecoFacts = [
    "Reciclar una lata de aluminio ahorra suficiente energía como para hacer funcionar un televisor durante 3 horas",
    "El vidrio puede reciclarse infinitamente sin perder calidad",
    "Una botella de plástico puede tardar hasta 500 años en descomponerse",
    "Reciclar papel reduce la contaminación del agua en un 35% y la del aire en un 74%",
    "México genera aproximadamente 120,000 toneladas de basura diariamente",
    "El reciclaje de una tonelada de plástico puede ahorrar hasta 5,774 kWh de energía",
    "Cada mexicano produce en promedio 1.2 kg de basura al día",
    "Reciclar el cartón de una caja de cereales puede ahorrar hasta 4 litros de agua"
  ];

  // Efecto para rotar los datos curiosos automáticamente
  useEffect(() => {
    setCurrentFact(ecoFacts[factIndex]);
    
    const interval = setInterval(() => {
      setFactIndex((prevIndex) => (prevIndex + 1) % ecoFacts.length);
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [factIndex]);

  return (
    <section className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-green-800 mb-2">Guía Completa de Reciclaje</h2>
        <p className="text-lg text-gray-600">Aprende las mejores prácticas para reciclar correctamente</p>
      </div>

      {/* Navegación por categorías */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {Object.keys(tipsData).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              activeCategory === category
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'general' && 'Consejos Generales'}
            {category === 'plastico' && 'Plásticos'}
            {category === 'vidrio' && 'Vidrio'}
            {category === 'peligrosos' && 'Materiales Peligrosos'}
          </button>
        ))}
      </div>

      {/* Grid de Tips */}
      <div className="grid gap-6 md:grid-cols-2">
        {tipsData[activeCategory].map((tip, index) => (
          <div 
            key={index}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                {tip.icon}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-700 mb-2">{tip.title}</h3>
                <p className="text-gray-600">{tip.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de Datos Curiosos */}
      <div className="mt-12 bg-green-50 p-6 rounded-xl border border-green-100">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <FaLeaf className="text-green-500 text-4xl" />
          </div>
          <div className="flex-grow">
            <h3 className="text-xl font-bold text-green-800 mb-2">¿Sabías qué?</h3>
            <p className="text-gray-700 mb-4 animate-fadeIn">
              {currentFact}
            </p>
            <Link 
              to="https://escolofi.com/las-40-curiosidades-sobre-el-reciclaje/" 
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Más datos curiosos <FaArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}