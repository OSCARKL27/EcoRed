import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../services/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !file) || isSending) return;

    const user = auth.currentUser;
    if (!user) return;

    let fileUrl = '';
    setIsSending(true);

    try {
      // Subir imagen si existe
      if (file) {
        const storageRef = ref(storage, `chat/${user.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Esperar a que se complete la subida
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

      // Guardar mensaje en Firestore
      await addDoc(collection(db, 'messages'), {
        text: message.trim(),
        image: fileUrl,
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        userPhoto: user.photoURL,
        timestamp: serverTimestamp(),
      });

      // Resetear estados
      setMessage('');
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Scroll al final
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

  // Actualizar nombre de usuario
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

  // Cargar mensajes
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
                {msg.timestamp?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            className={`p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px] ${
              isSending ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'
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
    </div>
  );
}