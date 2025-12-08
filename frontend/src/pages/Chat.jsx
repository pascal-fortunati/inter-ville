import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/chat/messages');
      setMessages(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!text.trim()) return;
    await api.post('/chat/messages', { text });
    setText('');
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Chat</h2>
          {loading && <div className="loading loading-dots loading-lg"/>}
          <ul className="space-y-2 mb-4">
            {messages.map(m => (
              <li key={m.id} className="p-3 rounded bg-base-200">
                <div className="text-sm opacity-70">{m.author}</div>
                <div>{m.text}</div>
              </li>
            ))}
            {!messages.length && <li className="p-3">Aucun message</li>}
          </ul>
          <div className="join w-full">
            <input className="input input-bordered join-item w-full" placeholder="Votre message" value={text} onChange={e => setText(e.target.value)} disabled={!token} />
            <button className="btn btn-primary join-item" onClick={send} disabled={!token}>Envoyer</button>
          </div>
          {!token && <div className="mt-2 text-sm opacity-70">Connecte-toi pour écrire</div>}
        </div>
      </div>
    </div>
  );
}
