import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../services/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc // 👈 Añadido para borrar mensajes
} from 'firebase/firestore';
import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject // 👈 Añadido para borrar imágenes
} from 'firebase/storage';
import { FiSend, FiImage, FiSmile, FiEdit, FiX } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { updateProfile } from 'firebase/auth';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(auth.currentUser?.displayName || '');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Para el lightbox
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Función para borrar mensajes (nueva)
  const deleteMessage = async (messageId, imageUrl) => {
    // Confirmación con SweetAlert
    const confirmResult = await Swal.fire({
      title: '¿Eliminar mensaje?',
      text: "¡Esta acción no se puede deshacer!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      // Borrar imagen de Storage si existe
      if (imageUrl) {
        try {
          const imagePath = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
          const imageRef = ref(storage, imagePath);
          await deleteObject(imageRef);
        } catch (imageError) {
          console.error("Error borrando imagen:", imageError);
          Swal.fire("Error", "No se pudo eliminar la imagen adjunta", "error");
          return;
        }
      }

      // Borrar mensaje de Firestore
      await deleteDoc(doc(db, 'messages', messageId));

      // Notificación de éxito
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Mensaje eliminado',
        showConfirmButton: false,
        timer: 1500,
        toast: true
      });

    } catch (error) {
      console.error("Error al borrar:", error);
      // Notificación de error personalizada
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar el mensaje: ' + error.message,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  };

  // Función para enviar mensajes (existente)
  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !file) || isSending) return;

    const user = auth.currentUser;
    if (!user) return;

    let fileUrl = '';
    setIsSending(true);

    try {
      if (file) {
        const storageRef = ref(storage, `chat/${user.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      await addDoc(collection(db, 'messages'), {
        text: message.trim(),
        image: fileUrl,
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        userPhoto: user.photoURL,
        timestamp: serverTimestamp(),
      });

      setMessage('');
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  // Actualizar nombre de usuario (existente)
  const updateUserName = async () => {
    if (!newName.trim()) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateProfile(user, { displayName: newName.trim() });

      const userMessages = messages.filter(msg => msg.userId === user.uid);
      const batch = userMessages.map(msg =>
        updateDoc(doc(db, 'messages', msg.id), { userName: newName.trim() })
      );

      await Promise.all(batch);
      setEditingName(false);
    } catch (error) {
      console.error('Error actualizando nombre:', error);
    }
  };

  // Cargar mensajes (existente)
  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp
      }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-3xl mx-auto p-4">
      {/* Cabecera */}
      <div className="bg-green-700 text-white p-3 rounded-t-lg flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Chat Comunitario ♻️</h2>
          <p className="text-sm text-green-100">Conectando recicladores</p>
        </div>

        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="p-1 text-black rounded text-sm"
              maxLength={20}
            />
            <button
              onClick={updateUserName}
              className="bg-white text-green-700 px-2 py-1 rounded text-sm"
            >
              ✅
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-800 px-2 py-1 rounded"
          >
            <FiEdit size={14} /> {auth.currentUser?.displayName || 'Mi nombre'}
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-grow bg-white p-4 overflow-y-auto space-y-3 border-x border-gray-200">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.userId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-xs md:max-w-md rounded-lg p-3 ${msg.userId === auth.currentUser?.uid ? 'bg-green-100 rounded-tr-none' : 'bg-gray-100 rounded-tl-none'}`}>

              {/* Botón de eliminar (nuevo) */}
              {msg.userId === auth.currentUser?.uid && (
                <button
                  onClick={() => deleteMessage(msg.id, msg.image)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  title="Borrar mensaje"
                >
                  <FiX size={14} />
                </button>
              )}

              <div className="flex items-center gap-2 mb-1">
                {msg.userPhoto ? (
                  <img src={msg.userPhoto} alt={msg.userName} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                    {msg.userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-green-800">{msg.userName}</span>
              </div>

              {msg.text && <p className="text-gray-800 whitespace-pre-wrap">{msg.text}</p>}

              {msg.image && (
                <img
                  src={msg.image}
                  alt="Mensaje multimedia"
                  className="mt-2 rounded max-h-40 max-w-full object-contain border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedImage(msg.image)} // 👈 Esto abre la imagen
                />
              )}

              <p className="text-xs text-gray-500 mt-1 text-right">
                {msg.timestamp?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Lightbox para imágenes (nuevo) */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
              onClick={() => setSelectedImage(null)}
            >
              <FiX size={28} />
            </button>
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Formulario de envío (existente) */}
      <form onSubmit={sendMessage} className="bg-gray-50 p-3 rounded-b-lg border border-t-0 border-gray-200">
        {showEmojiPicker && (
          <div className="absolute bottom-16 mb-2">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setMessage(prev => prev + emojiData.emoji);
                setShowEmojiPicker(false);
              }}
              width={300}
              height={350}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-green-600"
            disabled={isSending}
          >
            <FiSmile size={20} />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isSending}
          />

          <label className={`p-2 ${isSending ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-green-600 cursor-pointer'}`}>
            <FiImage size={20} />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => !isSending && setFile(e.target.files[0])}
              className="hidden"
              disabled={isSending}
            />
          </label>

          <button
            type="submit"
            disabled={(!message.trim() && !file) || isSending}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px] ${isSending ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
          >
            {isSending ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <FiSend size={20} />
            )}
          </button>
        </div>

        {file && (
          <div className="mt-2 bg-green-50 p-2 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-green-800 truncate max-w-xs">
                {file.name} {isSending && `(${Math.round(uploadProgress)}%)`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setUploadProgress(0);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-red-500 hover:text-red-700"
                disabled={isSending}
              >
                <FiX size={18} />
              </button>
            </div>

            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {file.type.startsWith('image/') && (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="mt-2 rounded max-h-20 max-w-full object-contain border border-gray-200"
              />
            )}
          </div>
        )}
      </form>
      {/* Visor de imágenes (modal) */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)} // Cierra al hacer clic fuera
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
              onClick={() => setSelectedImage(null)}
            >
              <FiX size={28} />
            </button>
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()} // Evita que el clic en la imagen cierre el modal
            />
          </div>
        </div>
      )}
    </div>
  );
}