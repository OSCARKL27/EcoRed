import React, { useContext, useEffect, useState, useMemo } from "react";
import { AppContext } from "../App";
import { db } from "../services/firebase";
import { collection, getDocs, query, where, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import Swal from "sweetalert2";

export default function Logros() {
  const { historialGlobal, user } = useContext(AppContext);
  const [logros, setLogros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoLogros, setProcesandoLogros] = useState(false);
  const [logrosDesbloqueados, setLogrosDesbloqueados] = useState([]);

  // Extender Date para obtener número de semana
  Date.prototype.getWeek = function() {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  // Cargar logros existentes
  useEffect(() => {
    const fetchLogros = async () => {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, "logros"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const datos = querySnapshot.docs.map(doc => ({
          id: doc.id.split('_')[1], // Extraemos solo la parte del ID del logro
          ...doc.data()
        }));
        setLogros(datos);
      } catch (error) {
        console.error("Error cargando logros:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogros();
  }, [user, logrosDesbloqueados]);

  // Memoizar cálculos de materiales
  const materialesCount = useMemo(() => {
    return historialGlobal?.reduce((acc, item) => {
      acc[item.material] = (acc[item.material] || 0) + 1;
      return acc;
    }, {}) || {};
  }, [historialGlobal]);

  // Función para eliminar logros inválidos
  const eliminarLogrosInvalidos = async () => {
    if (!user || !historialGlobal) return;

    try {
      const q = query(collection(db, "logros"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        const logro = docSnap.data();
        const logroId = logro.id;
        
        if (logroId.startsWith("material-")) {
          const material = logro.material;
          const countActual = historialGlobal.filter(item => item.material === material).length;
          if (countActual < 3) {
            await deleteDoc(doc(db, "logros", docSnap.id));
          }
        }
        else if (logroId === "primer-registro" && historialGlobal.length < 1) {
          await deleteDoc(doc(db, "logros", docSnap.id));
        }
        else if (logroId === "cinco-registros" && historialGlobal.length < 5) {
          await deleteDoc(doc(db, "logros", docSnap.id));
        }
        else if (logroId === "diez-registros" && historialGlobal.length < 10) {
          await deleteDoc(doc(db, "logros", docSnap.id));
        }
        else if (logroId === "veinte-registros" && historialGlobal.length < 20) {
          await deleteDoc(doc(db, "logros", docSnap.id));
        }
        else if (logroId === "tres-materiales") {
          const tiposActuales = new Set(historialGlobal.map(item => item.material)).size;
          if (tiposActuales < 3) {
            await deleteDoc(doc(db, "logros", docSnap.id));
          }
        }
        else if (logroId === "cinco-materiales") {
          const tiposActuales = new Set(historialGlobal.map(item => item.material)).size;
          if (tiposActuales < 5) {
            await deleteDoc(doc(db, "logros", docSnap.id));
          }
        }
        else if (logroId === "semana-consecutiva") {
          const semanaActual = new Date().getWeek();
          const registrosEstaSemana = historialGlobal.filter(reg => {
            const fechaReg = new Date(reg.fecha);
            return fechaReg.getWeek() === semanaActual;
          }).length;
          if (registrosEstaSemana < 3) {
            await deleteDoc(doc(db, "logros", docSnap.id));
          }
        }
      }
    } catch (error) {
      console.error("Error eliminando logros inválidos:", error);
    }
  };

  // Verificar y otorgar nuevos logros
  useEffect(() => {
    if (!user || !historialGlobal || procesandoLogros) return;

    const verificarYOtorgarLogros = async () => {
      setProcesandoLogros(true);
      const batch = writeBatch(db);
      const nuevosLogrosIds = [];

      try {
        // 1. Eliminar logros inválidos primero
        await eliminarLogrosInvalidos();

        // 2. Obtener logros actuales después de limpieza
        const q = query(collection(db, "logros"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const logrosActualesIds = querySnapshot.docs.map(doc => doc.data().id);

        // 3. Preparar datos para verificación
        const totalRegistros = historialGlobal.length;
        const tiposMateriales = new Set(historialGlobal.map(item => item.material)).size;
        const semanaActual = new Date().getWeek();
        const registrosEstaSemana = historialGlobal.filter(reg => {
          const fechaReg = new Date(reg.fecha);
          return fechaReg.getWeek() === semanaActual;
        }).length;

        // 4. Definir todos los logros posibles
        const todosLogrosPosibles = [
          {
            id: "primer-registro",
            titulo: "¡Primer paso!",
            descripcion: "Completaste tu primer registro de reciclaje",
            condicion: () => totalRegistros >= 1,
            icono: "🥳",
            nivel: "básico"
          },
          {
            id: "cinco-registros",
            titulo: "Reciclador frecuente",
            descripcion: "Completaste 5 registros de reciclaje",
            condicion: () => totalRegistros >= 5,
            icono: "♻️",
            nivel: "intermedio"
          },
          {
            id: "diez-registros",
            titulo: "Experto en reciclaje",
            descripcion: "¡10 registros completados!",
            condicion: () => totalRegistros >= 10,
            icono: "🏆",
            nivel: "avanzado"
          },
          {
            id: "tres-materiales",
            titulo: "Reciclaje diversificado",
            descripcion: "Has reciclado 3 tipos diferentes de materiales",
            condicion: () => tiposMateriales >= 3,
            icono: "🌎",
            nivel: "intermedio"
          },
          {
            id: "veinte-registros",
            titulo: "Maestro del reciclaje",
            descripcion: "¡20 registros completados!",
            condicion: () => totalRegistros >= 20,
            icono: "👑",
            nivel: "avanzado"
          },
          {
            id: "semana-consecutiva",
            titulo: "Constante ecológico",
            descripcion: "Reciclaste al menos 3 veces en una semana",
            condicion: () => registrosEstaSemana >= 3,
            icono: "📅",
            nivel: "intermedio"
          },
          {
            id: "cinco-materiales",
            titulo: "Reciclaje experto",
            descripcion: "Has reciclado 5 tipos diferentes de materiales",
            condicion: () => tiposMateriales >= 5,
            icono: "🌍",
            nivel: "avanzado"
          },
          ...Object.entries(materialesCount).map(([material, cantidad]) => ({
            id: `material-${material.toLowerCase().replace(/\s+/g, '-')}`,
            titulo: `Especialista en ${material}`,
            descripcion: `Recolectaste ${cantidad} veces ${material}`,
            condicion: () => cantidad >= 3,
            icono: "⭐",
            material,
            cantidad,
            nivel: "especialización"
          }))
        ];

        // 5. Filtrar logros que cumplen condiciones y no están obtenidos
        const logrosParaOtorgar = todosLogrosPosibles.filter(logro => {
          return logro.condicion() && !logrosActualesIds.includes(logro.id);
        });

        // 6. Procesar logros en batch
        for (const logro of logrosParaOtorgar) {
          const logroDocId = `${user.uid}_${logro.id}`;
          const logroRef = doc(db, "logros", logroDocId);
          
          const logroData = {
            id: logro.id,
            titulo: logro.titulo,
            descripcion: logro.descripcion,
            icono: logro.icono,
            nivel: logro.nivel,
            ...(logro.material && { material: logro.material }),
            ...(logro.cantidad && { cantidad: logro.cantidad }),
            userId: user.uid,
            fecha: new Date().toISOString()
          };
          
          batch.set(logroRef, logroData);
          nuevosLogrosIds.push(logro.id);
        }

        // 7. Ejecutar batch atómicamente
        if (logrosParaOtorgar.length > 0) {
          await batch.commit();
          setLogrosDesbloqueados(prev => [...prev, ...nuevosLogrosIds]);
          
          // Mostrar notificaciones
          if (nuevosLogrosIds.includes("primer-registro") && logrosActualesIds.length === 0) {
            await Swal.fire({
              title: '🌟 ¡Bienvenido a los logros!',
              text: 'Has desbloqueado tu primer logro. ¡Sigue reciclando para obtener más!',
              icon: 'success',
              confirmButtonColor: '#2e7d32',
              timer: 4000
            });
          }

          for (const logroId of nuevosLogrosIds) {
            const logro = todosLogrosPosibles.find(l => l.id === logroId);
            if (logro) {
              await Swal.fire({
                title: `¡Logro desbloqueado! ${logro.icono}`,
                html: `
                  <div class="text-center">
                    <p class="text-xl font-bold">${logro.titulo}</p>
                    <p class="text-gray-600">${logro.descripcion}</p>
                    <p class="text-sm text-green-600 mt-2">Nivel: ${logro.nivel}</p>
                  </div>
                `,
                icon: 'success',
                confirmButtonColor: '#2e7d32',
                background: '#f8fafc',
                showConfirmButton: true,
                timer: 3000
              });
            }
          }
        }
      } catch (error) {
        console.error("Error en el proceso de logros:", error);
      } finally {
        setProcesandoLogros(false);
      }
    };

    const timer = setTimeout(() => {
      verificarYOtorgarLogros();
    }, 500);

    return () => clearTimeout(timer);
  }, [historialGlobal, user, materialesCount]);

  // Calcular logros faltantes
  const logrosFaltantes = useMemo(() => {
    const totalRegistros = historialGlobal?.length || 0;
    const tiposMateriales = new Set(historialGlobal?.map(item => item.material)).size || 0;
    const semanaActual = new Date().getWeek();
    
    const registrosEstaSemana = historialGlobal?.filter(reg => {
      const fechaReg = new Date(reg.fecha);
      return fechaReg.getWeek() === semanaActual;
    }).length || 0;
    
    return [
      ...(!logros.some(l => l.id === "primer-registro") && totalRegistros < 1 ? [{
        id: "primer-registro",
        titulo: "Completa tu primer registro",
        descripcion: "Realiza tu primer registro de reciclaje",
        progreso: 0
      }] : []),
      
      ...(!logros.some(l => l.id === "cinco-registros") ? [{
        id: "cinco-registros",
        titulo: "Reciclador frecuente",
        descripcion: `Completa ${Math.max(5 - totalRegistros, 0)} registros más`,
        progreso: Math.min((totalRegistros / 5) * 100, 100)
      }] : []),
      
      ...(!logros.some(l => l.id === "diez-registros") ? [{
        id: "diez-registros",
        titulo: "Experto en reciclaje",
        descripcion: `Completa ${Math.max(10 - totalRegistros, 0)} registros más`,
        progreso: Math.min((totalRegistros / 10) * 100, 100)
      }] : []),
      
      ...(!logros.some(l => l.id === "veinte-registros") ? [{
        id: "veinte-registros",
        titulo: "Maestro del reciclaje",
        descripcion: `Completa ${Math.max(20 - totalRegistros, 0)} registros más`,
        progreso: Math.min((totalRegistros / 20) * 100, 100)
      }] : []),
      
      ...(!logros.some(l => l.id === "tres-materiales") && tiposMateriales < 3 ? [{
        id: "tres-materiales",
        titulo: "Reciclaje diversificado",
        descripcion: `Recicla ${3 - tiposMateriales} materiales más diferentes`,
        progreso: Math.min((tiposMateriales / 3) * 100, 100)
      }] : []),
      
      ...(!logros.some(l => l.id === "cinco-materiales") && tiposMateriales < 5 ? [{
        id: "cinco-materiales",
        titulo: "Reciclaje experto",
        descripcion: `Recicla ${5 - tiposMateriales} materiales más diferentes`,
        progreso: Math.min((tiposMateriales / 5) * 100, 100)
      }] : []),
      
      ...(!logros.some(l => l.id === "semana-consecutiva") ? [{
        id: "semana-consecutiva",
        titulo: "Constante ecológico",
        descripcion: `Recicla ${Math.max(3 - registrosEstaSemana, 0)} veces más esta semana`,
        progreso: Math.min((registrosEstaSemana / 3) * 100, 100)
      }] : []),
      
      ...Object.entries(materialesCount)
        .filter(([material, count]) => 
          !logros.some(l => l.id === `material-${material.toLowerCase().replace(/\s+/g, '-')}`) && 
          count < 3
        )
        .map(([material, count]) => ({
          id: `material-${material.toLowerCase().replace(/\s+/g, '-')}`,
          titulo: `Especialista en ${material}`,
          descripcion: `Recicla ${3 - count} veces más ${material}`,
          progreso: Math.min((count / 3) * 100, 100)
        }))
    ];
  }, [logros, historialGlobal, materialesCount]);

  // Calcular porcentaje de completado
  const porcentajeCompletado = useMemo(() => {
    const totalLogrosPosibles = 7 + Object.keys(materialesCount).length;
    return logros.length > 0 
      ? Math.min(Math.floor((logros.length / totalLogrosPosibles) * 100), 100)
      : 0;
  }, [logros, materialesCount]);

  if (loading) {
    return (
      <section className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-green-800 mb-4">Mis Logros</h2>
        <p>Cargando...</p>
      </section>
    );
  }

  return (
    <section className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-green-800 mb-4">Mis Logros</h2>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-2">📊 Tu progreso</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-3 rounded text-center">
            <p className="text-2xl font-bold">{historialGlobal?.length || 0}</p>
            <p className="text-sm">Registros totales</p>
          </div>
          <div className="bg-blue-50 p-3 rounded text-center">
            <p className="text-2xl font-bold">{logros.length}</p>
            <p className="text-sm">Logros obtenidos</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded text-center">
            <p className="text-2xl font-bold">{porcentajeCompletado}%</p>
            <p className="text-sm">Completado</p>
          </div>
        </div>
      </div>

      {logros.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-center">
          <p>¡Sigue reciclando para desbloquear tus primeros logros!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {logros
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map((logro) => (
              <div 
                key={logro.id} 
                className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{logro.icono || "✅"}</span>
                  <div>
                    <h3 className="font-bold text-green-700">{logro.titulo}</h3>
                    <p className="text-gray-600">{logro.descripcion}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Obtenido el {new Date(logro.fecha).toLocaleDateString()}
                    </p>
                    {logro.material && (
                      <p className="text-sm text-blue-500 mt-1">
                        Material: {logro.material} (x{logro.cantidad})
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Nivel: {logro.nivel}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {logrosFaltantes.length > 0 && (
        <div className="mt-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">🚀 Próximos logros</h3>
          <ul className="space-y-3">
            {logrosFaltantes.map((logro, index) => (
              <li key={logro.id} className="flex items-center">
                <span className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center mr-2">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{logro.titulo}</p>
                  <p className="text-sm text-gray-600">{logro.descripcion}</p>
                  {logro.progreso > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${logro.progreso}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}