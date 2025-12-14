// Widget DM flottant
// Animations fluides et micro-interactions
import { useCallback, useEffect, useRef, useState, Fragment } from 'react';
import api, { assetUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';
import socket from '../../services/socket';
import { useToast } from '../Common/Toast.jsx';
import { playChatSound } from '../../services/sound.js';
export default function DMTray() {
  const { user, isAuthenticated } = useAuth();
  const { info: toastInfo } = useToast();
  const [trays, setTrays] = useState([]);
  const endRefsRef = useRef(new Map());
  const inputRefsRef = useRef(new Map());
  const typingLastSentRef = useRef(new Map());
  const typingStopTimersRef = useRef(new Map());
  const typingExpireTimersRef = useRef(new Map());

  const canChatTray = useCallback((t) => !!user && !!t?.other && !!t?.channelId, [user]);

  const scrollToBottom = useCallback((otherId) => {
    const el = endRefsRef.current.get(otherId);
    el?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchThread = useCallback(async (otherId) => {
    if (!isAuthenticated || !otherId) return { other: null, channelId: null, messages: [] };
    try {
      const res = await api.get(`/chat/direct/${otherId}/messages`);
      const rows = res.data?.messages || [];
      const messages = rows.slice().reverse();
      const channelId = res.data?.channelId || null;
      let other = null;
      try { const u = await api.get(`/auth/get/${otherId}`); other = u.data || null; } catch { void 0; }
      return { other, channelId, messages };
    } catch {
      return { other: null, channelId: null, messages: [] };
    }
  }, [isAuthenticated]);

  const openOrLoad = useCallback(async (otherId) => {
    try {
      const { other, channelId, messages } = await fetchThread(otherId);
      setTrays(prev => {
        const idx = prev.findIndex(t => Number(t.id) === Number(otherId));
        const notifyTs = Number(localStorage.getItem(`dm:lastNotifiedAt:${user?.id}:${otherId}`) || 0);
        const collapsed = localStorage.getItem(`dm:tray:collapsed:${user?.id}:${otherId}`) === 'true';
        if (idx === -1) {
          return [...prev, { id: otherId, other, channelId, messages, text: '', loading: false, collapsed, notifyTs, emojiOpen: false, typingOther: false }];
        } else {
          const arr = [...prev];
          arr[idx] = { ...arr[idx], other, channelId, messages };
          return arr;
        }
      });
      try {
        const openIds = JSON.parse(localStorage.getItem(`dm:openIds:${user?.id}`) || '[]');
        const arr = Array.isArray(openIds) ? openIds : [];
        if (!arr.includes(otherId)) { arr.push(otherId); localStorage.setItem(`dm:openIds:${user?.id}`, JSON.stringify(arr)); }
      } catch { void 0; }
      setTimeout(() => scrollToBottom(otherId), 50);
    } catch { void 0; }
  }, [fetchThread, scrollToBottom, user]);

  useEffect(() => {
    if (!user) return;
    setTimeout(() => {
      setTrays([]);
      try {
        const ids = JSON.parse(localStorage.getItem(`dm:openIds:${user.id}`) || '[]');
        if (Array.isArray(ids)) ids.forEach(id => openOrLoad(Number(id)));
      } catch { void 0; }
    }, 0);
  }, [user, openOrLoad]);

  

  useEffect(() => {
    function onReceive(payload) {
      if (!user) return;
      const isForMe = Number(payload.toUserId) === Number(user.id);
      const isFromMe = Number(payload.fromUserId) === Number(user.id);
      if (!isForMe && !isFromMe) return;
      if (isForMe && !isFromMe) { try { playChatSound(); } catch { void 0 } }
      const otherId = isForMe ? Number(payload.fromUserId) : Number(payload.toUserId);
      setTrays(prev => {
        const idx = prev.findIndex(t => Number(t.id) === Number(otherId));
        const now = Date.now();
        let arr = [...prev];
        if (idx === -1) {
          arr.push({ id: otherId, other: null, channelId: payload.channelId, messages: [], text: '', loading: false, collapsed: false, notifyTs: now, emojiOpen: false, typingOther: false });
        } else {
          arr[idx] = { ...arr[idx], collapsed: false, notifyTs: now };
        }
        return arr;
      });
      try {
        const ids = JSON.parse(localStorage.getItem(`dm:openIds:${user?.id}`) || '[]');
        const arr = Array.isArray(ids) ? ids : [];
        if (!arr.includes(otherId)) arr.push(otherId);
        localStorage.setItem(`dm:openIds:${user?.id}`, JSON.stringify(arr));
        localStorage.setItem(`dm:lastNotifiedAt:${user?.id}:${otherId}`, Date.now().toString());
      } catch { void 0; }
      (async () => {
        await openOrLoad(otherId);
        if (isForMe && !isFromMe) {
          try {
            const u = await api.get(`/auth/get/${otherId}`);
            const name = u?.data?.username || 'Un utilisateur';
            toastInfo(`Message privé de ${name}`, { durationMs: 3000 });
          } catch { toastInfo(`Message privé`, { durationMs: 3000 }); }
        }
      })();
    }
    socket.on('dm:receive', onReceive);

    function onTypingStart(p) {
      if (!p || !p.userId || !p.channelId) return;
      if (user && p.userId === user.id) return;
      setTrays(prev => prev.map(t => t.channelId === p.channelId ? ({ ...t, typingOther: true }) : t));
      const key = p.channelId;
      const tm = typingExpireTimersRef.current.get(key);
      if (tm) clearTimeout(tm);
      const newTm = setTimeout(() => {
        setTrays(prev => prev.map(t => t.channelId === key ? ({ ...t, typingOther: false }) : t));
        typingExpireTimersRef.current.delete(key);
      }, 3500);
      typingExpireTimersRef.current.set(key, newTm);
    }
    function onTypingStop(p) {
      if (!p || !p.userId || !p.channelId) return;
      if (user && p.userId === user.id) return;
      setTrays(prev => prev.map(t => t.channelId === p.channelId ? ({ ...t, typingOther: false }) : t));
      const key = p.channelId;
      const tm = typingExpireTimersRef.current.get(key);
      if (tm) { clearTimeout(tm); typingExpireTimersRef.current.delete(key); }
    }
    socket.on('dm:typing:start', onTypingStart);
    socket.on('dm:typing:stop', onTypingStop);
    const stopTimersMap = typingStopTimersRef.current;
    const expireTimersMap = typingExpireTimersRef.current;
    return () => {
      socket.off('dm:receive', onReceive);
      socket.off('dm:typing:start', onTypingStart);
      socket.off('dm:typing:stop', onTypingStop);
      try {
        const stopTimers = Array.from(stopTimersMap.values());
        const expireTimers = Array.from(expireTimersMap.values());
        stopTimers.forEach(tm => { try { clearTimeout(tm); } catch { void 0; } });
        stopTimersMap.clear();
        expireTimers.forEach(tm => { try { clearTimeout(tm); } catch { void 0; } });
        expireTimersMap.clear();
      } catch { void 0; }
    };
  }, [user, openOrLoad, toastInfo]);

  function toggleCollapsed(otherId) {
    setTrays(prev => prev.map(t => t.id === otherId ? ({ ...t, collapsed: !t.collapsed }) : t));
    try {
      const t = trays.find(x => Number(x.id) === Number(otherId));
      const n = !(t?.collapsed);
      localStorage.setItem(`dm:tray:collapsed:${user?.id}:${otherId}`, n ? 'true' : 'false');
    } catch { void 0; }
  }

  function closeTray(otherId) {
    setTrays(prev => prev.filter(t => Number(t.id) !== Number(otherId)));
    try {
      const ids = JSON.parse(localStorage.getItem(`dm:openIds:${user?.id}`) || '[]');
      const arr = Array.isArray(ids) ? ids.filter(id => Number(id) !== Number(otherId)) : [];
      localStorage.setItem(`dm:openIds:${user?.id}`, JSON.stringify(arr));
      localStorage.removeItem(`dm:lastNotifiedAt:${user?.id}:${otherId}`);
      localStorage.removeItem(`dm:tray:collapsed:${user?.id}:${otherId}`);
    } catch { void 0; }
  }

  async function send(otherId) {
    const t = trays.find(x => Number(x.id) === Number(otherId));
    if (!t || !String(t.text).trim() || !isAuthenticated) return;
    const payloadText = t.text;
    setTrays(prev => prev.map(x => x.id === otherId ? ({ ...x, text: '' }) : x));
    try { if (t.channelId) socket.emit('dm:typing:stop', { channelId: t.channelId }); } catch { void 0; }
    try {
      const res = await api.post(`/chat/direct/${otherId}/messages`, { text: payloadText });
      const myMsg = { id: res.data?.id || Math.random(), text: payloadText, user_id: user?.id, created_at: new Date().toISOString(), author: 'Moi' };
      setTrays(prev => prev.map(x => x.id === otherId ? ({ ...x, messages: [...x.messages, myMsg] }) : x));
      setTimeout(() => scrollToBottom(otherId), 50);
      try { localStorage.setItem(`dm:lastNotifiedAt:${user?.id}:${otherId}`, Date.now().toString()); } catch { void 0; }
    } catch { void 0; }
  }

  function handleKey(otherId, e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(otherId); }
  }

  function handleChange(otherId, e) {
    const value = e.target.value;
    setTrays(prev => prev.map(x => x.id === otherId ? ({ ...x, text: value }) : x));
    const t = trays.find(x => Number(x.id) === Number(otherId));
    if (isAuthenticated && t?.channelId) {
      const now = Date.now();
      if (String(value).trim().length === 0) {
        try { socket.emit('dm:typing:stop', { channelId: t.channelId }); } catch { void 0; }
        typingLastSentRef.current.set(otherId, 0);
        const st = typingStopTimersRef.current.get(otherId);
        if (st) { clearTimeout(st); typingStopTimersRef.current.delete(otherId); }
      } else {
        const last = typingLastSentRef.current.get(otherId) || 0;
        if (now - last > 1200) {
          typingLastSentRef.current.set(otherId, now);
          try { socket.emit('dm:typing:start', { channelId: t.channelId, username: user?.username }); } catch { void 0; }
        }
        const st = typingStopTimersRef.current.get(otherId);
        if (st) clearTimeout(st);
        const newSt = setTimeout(() => {
          try { socket.emit('dm:typing:stop', { channelId: t.channelId }); } catch { void 0; }
          typingLastSentRef.current.set(otherId, 0);
          typingStopTimersRef.current.delete(otherId);
        }, 2200);
        typingStopTimersRef.current.set(otherId, newSt);
      }
    }
  }

  function insertEmoji(otherId, emoji) {
    const text = trays.find(x => x.id === otherId)?.text || '';
    const el = inputRefsRef.current.get(otherId);
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const next = `${before}${emoji}${after}`;
    setTrays(prev => prev.map(x => x.id === otherId ? ({ ...x, text: next }) : x));
    setTimeout(() => {
      try {
        el?.focus();
        const pos = start + emoji.length;
        el?.setSelectionRange(pos, pos);
      } catch { void 0; }
    }, 0);
  }

  function setEmojiOpenState(otherId, open) {
    setTrays(prev => prev.map(x => x.id === otherId ? ({ ...x, emojiOpen: open }) : x));
  }

  if (!isAuthenticated) return null;
  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-row-reverse gap-2">
      {trays.map(t => {
        const title = t.other?.username || 'Message privé';
        const avatar = t.other?.avatar || null;
        const canChat = canChatTray(t);
        const messages = t.messages || [];
        const notifyTs = t.notifyTs || 0;
        return (
          <div key={t.id} className={`card bg-base-100 shadow-2xl border border-base-300 rounded-none transition-all duration-300 ease-in-out ${t.collapsed ? 'w-80' : 'w-96'}`}>
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="avatar">
                      <div className="w-10 rounded-full ring-2 ring-base-300">
                        {avatar ? (
                          <img alt={title} src={assetUrl(avatar)} />
                        ) : (
                          <div className="bg-white/20 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white">
                            {title?.[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base-content truncate">{title}</div>
                    <div className="text-xs text-base-content/70">En ligne</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn btn-ghost btn-xs text-base-content hover:bg-base-200 border-none" onClick={() => toggleCollapsed(t.id)} title={t.collapsed ? 'Développer' : 'Réduire'}>
                    <span className="material-symbols-outlined text-lg">{t.collapsed ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  <button className="btn btn-ghost btn-xs text-base-content hover:bg-base-200 border-none" onClick={() => closeTray(t.id)} title="Fermer">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>
            </div>

            {!t.collapsed && (
              <div className="card-body p-0">
                <div className="h-80 overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-base-100 to-base-200/30">
                  {t.loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <span className="loading loading-ring loading-md text-primary" />
                      <p className="text-xs opacity-60">Chargement...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-3xl text-primary">chat_bubble</span>
                      </div>
                      <p className="text-sm font-semibold mb-1">Aucun message</p>
                      <p className="text-xs opacity-50">Commence la conversation !</p>
                    </div>
                  ) : (
                    messages.map((m, i) => {
                      const isMe = user && Number(m.user_id) === Number(user.id) || m.author === 'Moi';
                      const ts = new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      const boundaryIdxRaw = notifyTs ? messages.findIndex(x => new Date(x.created_at).getTime() >= notifyTs) : -1;
                      const boundaryIndex = notifyTs ? (boundaryIdxRaw !== -1 ? boundaryIdxRaw : (messages.length ? messages.length - 1 : -1)) : -1;
                      const isNewBoundary = boundaryIndex !== -1 && i === boundaryIndex;
                      return (
                        <Fragment key={m.id}>
                          {isNewBoundary && (
                            <div className="flex items-center gap-2 my-1">
                              <div className="flex-1 border-t border-warning/40"></div>
                              <span className="badge badge-warning">Nouveaux messages</span>
                              <div className="flex-1 border-t border-warning/40"></div>
                            </div>
                          )}
                          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                            <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className={`px-3 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-content rounded-tr-sm' : 'bg-base-200 rounded-tl-sm'} ${isNewBoundary ? 'ring-2 ring-warning/40' : ''}`}>
                                <p className="text-sm leading-relaxed break-words">{m.text}</p>
                              </div>
                              <span className="text-[10px] opacity-50 mt-1 px-1">{ts}</span>
                            </div>
                          </div>
                        </Fragment>
                      );
                    })
                  )}
                  <div ref={el => endRefsRef.current.set(t.id, el)} />
                </div>

                <div className="p-3 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      {t.typingOther && (
                        <div className="absolute -top-6 left-0 flex items-center gap-2 px-2 text-xs opacity-70">
                          <span className="material-symbols-outlined text-sm">edit</span>
                          <span className="truncate">{t.other?.username || 'Utilisateur'} est en train d'écrire…</span>
                          <span className="loading loading-dots loading-xs"></span>
                        </div>
                      )}
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full pr-20 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Écris ton message..."
                        value={t.text}
                        onChange={e => handleChange(t.id, e)}
                        onKeyDown={e => handleKey(t.id, e)}
                        disabled={!canChat}
                        ref={el => inputRefsRef.current.set(t.id, el)}
                      />
                      <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        <button type="button" className="btn btn-ghost btn-xs btn-square" disabled={!canChat} onClick={() => setEmojiOpenState(t.id, !t.emojiOpen)} title="Émojis">
                          <span className="material-symbols-outlined text-base">mood</span>
                        </button>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-40">
                        <span className="material-symbols-outlined text-base">edit</span>
                      </div>
                      {t.emojiOpen && (
                        <div className="absolute bottom-full right-0 mb-2 p-4 rounded-2xl shadow-2xl border border-base-300 bg-base-100 w-[42rem] z-20">
                          <div className="max-h-64 overflow-y-auto">
                            <div className="grid grid-cols-6 gap-1">
                              {['😀','😃','😄','😁','😆','😅','😂','🤣','😊','🙂','😉','😍','😘','😜','🤪','🤩','🥳','😎','🤓','😇','😋','😌','😴','🤤','😪','😮','😲','😱','😅','🤔','🤯','😬','🤗','🙌','👍','👏','💪','🔥','✨','💯','🏆','🎉','🎶','🎮','🍕','🍔','🍣','⚽','🎯','🧠','🛠️','🖥️','📸','🎬','🎨','🎵','🏃‍♂️','🚴‍♀️','🏊‍♂️','🍩','🍎','🍪','🥐','🍔','🍟','🌮','🍣','🍜','☕','🍺'].map(e => (
                                <button key={e} className="flex items-center justify-center w-20 h-20 rounded-2xl hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary text-3xl leading-none" onClick={() => { insertEmoji(t.id, e); setEmojiOpenState(t.id, false); }}>
                                  {e}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button className="btn btn-primary btn-sm btn-circle shadow-md hover:shadow-lg transition-all disabled:opacity-50" onClick={() => send(t.id)} disabled={!canChat || !String(t.text || '').trim()} title="Envoyer">
                      <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
