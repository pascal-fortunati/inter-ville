// Page Messages DM
import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { assetUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';
import Page from '../components/Layout/Page.jsx';

export default function DirectChat() {
  const { userId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [channelId, setChannelId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [other, setOther] = useState(null);
  const [onlineIds, setOnlineIds] = useState(new Set());
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(false);
  const [notifyTs, setNotifyTs] = useState(() => { try { return Number(localStorage.getItem(`dm:lastNotifiedAt:${userId}`) || 0); } catch { return 0; } });
  const [typingOther, setTypingOther] = useState(false);
  const typingLastSentRef = useRef(0);
  const typingStopTimerRef = useRef(null);
  const typingExpireTimerRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/chat/direct/${userId}/messages`);
      const rows = res.data?.messages || [];
      const sorted = [...rows].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      setMessages(sorted);
      setAutoScroll(true);
      setChannelId(res.data?.channelId || null);
      try {
        const u = await api.get(`/auth/get/${userId}`);
        setOther(u.data || null);
      } catch { void 0 }
      try {
        const on = await api.get('/users/online');
        setOnlineIds(new Set(on.data?.ids || []));
      } catch { void 0 }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    try {
      const ts = Number(localStorage.getItem(`dm:lastNotifiedAt:${userId}`) || 0);
      if (ts) { setNotifyTs(ts); localStorage.removeItem(`dm:lastNotifiedAt:${userId}`); }
    } catch { void 0 }
  }, [userId]);

  useEffect(() => {
    function onReceive(payload) {
      if (payload.channelId !== channelId) return;
      if (user && payload.fromUserId === user.id) return;
      const au = payload.fromUserId === Number(userId) ? other : user;
      const msg = { id: payload.id, text: payload.text, user_id: payload.fromUserId, created_at: new Date().toISOString(), author: au?.username || 'Un utilisateur' };
      setMessages(m => [...m, msg]);
    }
    socket.on('dm:receive', onReceive);
    function onTypingStart(p) {
      if (!p || !p.userId || !p.channelId) return;
      if (p.channelId !== channelId) return;
      if (user && p.userId === user.id) return;
      setTypingOther(true);
      if (typingExpireTimerRef.current) clearTimeout(typingExpireTimerRef.current);
      typingExpireTimerRef.current = setTimeout(() => { setTypingOther(false); }, 3500);
    }
    function onTypingStop(p) {
      if (!p || !p.userId || !p.channelId) return;
      if (p.channelId !== channelId) return;
      if (user && p.userId === user.id) return;
      setTypingOther(false);
      if (typingExpireTimerRef.current) { clearTimeout(typingExpireTimerRef.current); typingExpireTimerRef.current = null; }
    }
    socket.on('dm:typing:start', onTypingStart);
    socket.on('dm:typing:stop', onTypingStop);
    return () => { socket.off('dm:receive', onReceive); };
  }, [channelId, other, user, userId]);

  useEffect(() => {
    function onOnline(p) { setOnlineIds(s => new Set(s).add(p.userId)); }
    function onOffline(p) { setOnlineIds(s => { const n = new Set(s); n.delete(p.userId); return n; }); }
    socket.on('user:online', onOnline);
    socket.on('user:offline', onOffline);
    return () => { socket.off('user:online', onOnline); socket.off('user:offline', onOffline); };
  }, []);

  useEffect(() => {
    if (!autoScroll) return;
    const el = listRef.current;
    if (!el) return;
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, autoScroll]);

  async function send() {
    if (!text.trim()) return;
    const payloadText = text;
    setText('');
    try { if (channelId) socket.emit('dm:typing:stop', { channelId }); } catch { void 0 }
    setAutoScroll(true);
    try {
      const res = await api.post(`/chat/direct/${userId}/messages`, { text: payloadText });
      const myMsg = { id: res.data?.id || Math.random(), text: payloadText, user_id: user?.id, created_at: new Date().toISOString(), author: 'Moi' };
      setMessages(m => [...m, myMsg]);
    } catch { void 0 }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleChange(e) {
    const value = e.target.value;
    setText(value);
    if (isAuthenticated && channelId) {
      const now = Date.now();
      if (String(value).trim().length === 0) {
        try { socket.emit('dm:typing:stop', { channelId }); } catch { void 0 }
        typingLastSentRef.current = 0;
        if (typingStopTimerRef.current) { clearTimeout(typingStopTimerRef.current); typingStopTimerRef.current = null; }
      } else {
        if (now - typingLastSentRef.current > 1200) {
          typingLastSentRef.current = now;
          try { socket.emit('dm:typing:start', { channelId, username: user?.username }); } catch { void 0 }
        }
        if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = setTimeout(() => {
          try { socket.emit('dm:typing:stop', { channelId }); } catch { void 0 }
          typingLastSentRef.current = 0;
        }, 2200);
      }
    }
  }

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const isAtBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) <= 2;
    setAutoScroll(isAtBottom);
  }

  if (!isAuthenticated) {
    return (
      <Page icon="chat" title="Messages privés">
        <div className="max-w-2xl mx-auto">
          <div className="alert alert-warning shadow-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">lock</span>
              <div>
                <h3 className="font-bold">Authentification requise</h3>
                <p className="text-sm">Connecte-toi pour accéder aux messages privés</p>
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  const isOtherOnline = other && onlineIds.has(other.id);

  return (
    <Page icon="chat" title="Messages privés" subtitle="Conversation directe">
      <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)]">
        <div className="card bg-base-100 shadow-2xl h-full border border-base-300">
          <div className="card-body p-0 flex flex-col h-full">

            {/* Header avec info utilisateur */}
            <div className="px-6 py-4 border-b border-base-300 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar avec indicateur en ligne */}
                  <div className="relative">
                    <div className="avatar">
                      <div className="w-12 rounded-full ring-2 ring-base-300">
                        {other?.avatar ? (
                          <img alt={other.username} src={assetUrl(other.avatar)} />
                        ) : (
                          <div className="bg-primary text-primary-content w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                            {other?.username?.[0] || '?'}
                          </div>
                        )}
                      </div>
                    </div>
                    {isOtherOnline && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-base-100 animate-pulse"></span>
                    )}
                  </div>

                  {/* Info utilisateur */}
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      {other?.username || `Utilisateur #${userId}`}
                    </h2>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`flex items-center gap-1 ${isOtherOnline ? 'text-success' : 'opacity-60'}`}>
                        <span className={`w-2 h-2 rounded-full ${isOtherOnline ? 'bg-success' : 'bg-base-300'}`}></span>
                        {isOtherOnline ? 'En ligne' : 'Hors ligne'}
                      </span>
                      <span className="opacity-60">
                        {messages.length} message{messages.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton retour */}
                <Link to="/chat" className="btn btn-ghost btn-sm gap-1">
                  <span className="material-symbols-outlined">arrow_back</span>
                  <span className="hidden sm:inline">Retour au chat</span>
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3 bg-gradient-to-b from-base-100 to-base-200/30"
              ref={listRef}
              onScroll={handleScroll}
            >
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <span className="loading loading-ring loading-lg text-primary"></span>
                    <p className="text-xs opacity-60">Chargement des messages...</p>
                  </div>
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-5xl text-primary">mark_chat_unread</span>
                  </div>
                  <p className="font-semibold mb-1">Aucun message</p>
                  <p className="text-sm opacity-50">Commence la conversation avec {other?.username || 'cet utilisateur'} !</p>
                </div>
              )}

              {!loading && messages.map((m, i) => {
                const isMe = user && m.user_id === user.id || m.author === 'Moi';
                const au = isMe ? user : other;
                const name = isMe ? 'Moi' : (au?.username || 'Un utilisateur');
                const avatar = au?.avatar || null;
                const ts = new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const boundaryIdxRaw = notifyTs ? messages.findIndex(x => new Date(x.created_at).getTime() >= notifyTs) : -1;
                const boundaryIndex = notifyTs ? (boundaryIdxRaw !== -1 ? boundaryIdxRaw : (messages.length ? messages.length - 1 : -1)) : -1;
                const isNewBoundary = boundaryIndex !== -1 && i === boundaryIndex;

                return (
                  <Fragment key={m.id}>
                    {isNewBoundary && (
                      <div className="flex items-center gap-2 my-2">
                        <div className="flex-1 border-t border-warning/40"></div>
                        <span className="badge badge-warning">Nouveaux messages</span>
                        <div className="flex-1 border-t border-warning/40"></div>
                      </div>
                    )}
                    <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
                      {/* Avatar */}
                      <div className="avatar flex-shrink-0">
                        <div className="w-9 rounded-full ring-2 ring-base-300 group-hover:ring-primary transition-all">
                          {avatar ? (
                            <img alt={name} src={assetUrl(avatar)} />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${isMe
                                ? 'bg-primary text-primary-content'
                                : 'bg-base-300 text-base-content/80'
                              }`}>
                              {name[0]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bulle de message */}
                      <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className={`text-xs font-semibold ${isMe ? 'text-primary' : 'text-base-content/80'}`}>
                            {name}
                          </span>
                          <span className="text-[10px] opacity-40">{ts}</span>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl shadow-md transition-all group-hover:shadow-lg ${isMe
                            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-content rounded-tr-sm'
                            : 'bg-base-200 rounded-tl-sm'
                          } ${isNewBoundary ? 'ring-2 ring-warning/40' : ''}`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                        </div>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone d'input */}
            <div className="p-4 border-t border-base-300 bg-base-100">
              {typingOther && (
                <div className="flex items-center gap-2 mb-2 px-2 text-xs text-base-content/70">
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span className="truncate">{other?.username || 'Utilisateur'} est en train d'écrire…</span>
                  <span className="loading loading-dots loading-xs"></span>
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    className="input input-bordered w-full pr-12 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    placeholder="Écris ton message..."
                    value={text}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </div>
                </div>
                <button
                  className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  onClick={send}
                  disabled={!text.trim()}
                >
                  <span className="material-symbols-outlined">send</span>
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Page>
  );
}
