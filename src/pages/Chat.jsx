import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../services/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FiSend, FiImage, FiSmile, FiEdit } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import { updateProfile } from 'firebase/auth';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(auth.currentUser?.displayName || '');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll y limpieza del mensaje
  const resetAndScroll = () => {
    setMessage('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Enviar mensaje
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !file) return;

    const user = auth.currentUser;
    let fileUrl = '';

    try {
      // Subir imagen si existe
      if (file) {
        const storageRef = ref(storage, `chat/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
      }

      // Guardar mensaje en Firestore
      await addDoc(collection(db, 'messages'), {
        text: message.trim(),
        image: fileUrl,
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        userPhoto: user.photoURL,
        timestamp: serverTimestamp(),
      });

      resetAndScroll();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  // Actualizar nombre de usuario
  const updateUserName = async () => {
    if (!newName.trim()) return;
    
    try {
      const user = auth.currentUser;
      
      // 1. Actualizar perfil en Firebase Auth
      await updateProfile(user, { displayName: newName.trim() });
      
      // 2. Actualizar mensajes existentes
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

  // Cargar mensajes
  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp // Conservamos el timestamp como objeto
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
            <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${msg.userId === auth.currentUser?.uid ? 'bg-green-100 rounded-tr-none' : 'bg-gray-100 rounded-tl-none'}`}>
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
                  className="mt-2 rounded max-h-40 max-w-full object-contain border border-gray-200"
                />
              )}
              
              <p className="text-xs text-gray-500 mt-1 text-right">
                {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de envío */}
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
          >
            <FiSmile size={20} />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          <label className="p-2 text-gray-500 hover:text-green-600 cursor-pointer">
            <FiImage size={20} />
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden" 
            />
          </label>

          <button
            type="submit"
            disabled={!message.trim() && !file}
            className="p-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition-colors"
          >
            <FiSend size={20} />
          </button>
        </div>

        {file && (
          <div className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded">
            <span className="text-sm text-green-800 truncate max-w-xs">
              {file.name}
            </span>
            <button 
              type="button" 
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-red-500 text-sm"
            >
              ✕
            </button>
          </div>
        )}
      </form>
    </div>
  );
}