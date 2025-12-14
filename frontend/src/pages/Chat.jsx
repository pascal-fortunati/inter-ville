// Page Chat public - Design Modern 2025
// Prêt à copier-coller pour remplacer votre Chat.jsx
import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { assetUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';
import { playChatSound } from '../services/sound.js';
import Page from '../components/Layout/Page.jsx';

export default function Chat() {
  const { userId: dmUserId } = useParams();
  const isDM = !!dmUserId;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [online, setOnline] = useState(new Set());
  const { isAuthenticated, user } = useAuth();
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const [tab, setTab] = useState('all');
  const [autoScroll, setAutoScroll] = useState(false);
  const [notifyTs, setNotifyTs] = useState(() => {
    try { return Number(localStorage.getItem('chat:lastNotifiedAt') || 0); } catch { return 0; }
  });
  const [other, setOther] = useState(null);
  const [channelId, setChannelId] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionActive, setMentionActive] = useState(0);
  const [typingMap, setTypingMap] = useState(() => new Map());
  const typingLastSentRef = useRef(0);
  const typingStopTimerRef = useRef(null);
  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!isDM) {
        const res = await api.get('/chat/messages');
        const rows = res.data || [];
        const sorted = [...rows].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        setMessages(sorted);
        setAutoScroll(true);
        if (isAuthenticated) {
          const u = await api.get('/directory/users');
          setUsers(u.data || []);
          const on = await api.get('/users/online');
          setOnline(new Set(on.data?.ids || []));
        } else {
          setUsers([]);
          setOnline(new Set());
        }
      } else {
        const res = await api.get(`/chat/direct/${dmUserId}/messages`);
        const rows = res.data?.messages || [];
        const sorted = [...rows].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        setMessages(sorted);
        setAutoScroll(true);
        setChannelId(res.data?.channelId || null);
        try {
          const u = await api.get(`/auth/get/${dmUserId}`);
          setOther(u.data || null);
        } catch { void 0 }
        try {
          const on = await api.get('/users/online');
          setOnline(new Set(on.data?.ids || []));
        } catch { void 0 }
      }
    } finally {
      setLoading(false);
    }
  }, [isDM, dmUserId, isAuthenticated]);

  useEffect(() => { load(); }, [load, isAuthenticated]);
  useEffect(() => { window.dispatchEvent(new CustomEvent('chat:opened')); }, []);
  useEffect(() => {
    if (!isDM) {
      try {
        const ts = Number(localStorage.getItem('chat:lastNotifiedAt') || 0);
        if (ts) { setNotifyTs(ts); localStorage.removeItem('chat:lastNotifiedAt'); }
      } catch { void 0 }
    } else {
      try {
        const ts = Number(localStorage.getItem(`dm:lastNotifiedAt:${dmUserId}`) || 0);
        if (ts) { setNotifyTs(ts); localStorage.removeItem(`dm:lastNotifiedAt:${dmUserId}`); }
      } catch { void 0 }
    }
  }, [isDM, dmUserId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isDM) {
      function onReceive(payload) {
        if (user && payload.user_id === user.id) return;
        const authorUser = users.find(x => x.id === payload.user_id);
        const msg = { id: payload.id, text: payload.text, author: authorUser?.username || 'Un utilisateur', user_id: payload.user_id, created_at: new Date().toISOString() };
        setMessages(m => [...m, msg]);
        try { playChatSound(); } catch { void 0 }
      }
      function onOnline(p) { setOnline(s => new Set(s).add(p.userId)); }
      function onOffline(p) { setOnline(s => { const n = new Set(s); n.delete(p.userId); return n; }); }
      socket.on('message:receive', onReceive);
      socket.on('user:online', onOnline);
      socket.on('user:offline', onOffline);
      function onTypingStart(p) {
        if (!p || !p.userId) return;
        if (user && p.userId === user.id) return;
        setTypingMap(m => {
          const n = new Map(m);
          n.set(p.userId, Date.now() + 3500);
          return n;
        });
      }
      function onTypingStop(p) {
        if (!p || !p.userId) return;
        if (user && p.userId === user.id) return;
        setTypingMap(m => {
          const n = new Map(m);
          n.delete(p.userId);
          return n;
        });
      }
      socket.on('typing:start', onTypingStart);
      socket.on('typing:stop', onTypingStop);
      const cleanup = setInterval(() => {
        setTypingMap(m => {
          const now = Date.now();
          let changed = false;
          const n = new Map(m);
          for (const [uid, expires] of n.entries()) {
            if (expires <= now) { n.delete(uid); changed = true; }
          }
          return changed ? n : m;
        });
      }, 800);
      return () => {
        socket.off('message:receive', onReceive);
        socket.off('user:online', onOnline);
        socket.off('user:offline', onOffline);
        socket.off('typing:start', onTypingStart);
        socket.off('typing:stop', onTypingStop);
        clearInterval(cleanup);
      };
    } else {
      function onReceive(payload) {
        if (payload.channelId !== channelId) return;
        if (user && payload.fromUserId === user.id) return;
        const au = payload.fromUserId === Number(dmUserId) ? other : user;
        const msg = { id: payload.id, text: payload.text, author: au?.username || 'Un utilisateur', user_id: payload.fromUserId, created_at: new Date().toISOString() };
        setMessages(m => [...m, msg]);
        try { playChatSound(); } catch { void 0 }
      }
      function onOnline(p) { setOnline(s => new Set(s).add(p.userId)); }
      function onOffline(p) { setOnline(s => { const n = new Set(s); n.delete(p.userId); return n; }); }
      socket.on('dm:receive', onReceive);
      socket.on('user:online', onOnline);
      socket.on('user:offline', onOffline);
      function onTypingStartDM(p) {
        if (!p || !p.userId || !p.channelId) return;
        if (p.channelId !== channelId) return;
        if (user && p.userId === user.id) return;
        setTypingMap(m => {
          const n = new Map(m);
          n.set(p.userId, Date.now() + 3500);
          return n;
        });
      }
      function onTypingStopDM(p) {
        if (!p || !p.userId || !p.channelId) return;
        if (p.channelId !== channelId) return;
        if (user && p.userId === user.id) return;
        setTypingMap(m => {
          const n = new Map(m);
          n.delete(p.userId);
          return n;
        });
      }
      socket.on('dm:typing:start', onTypingStartDM);
      socket.on('dm:typing:stop', onTypingStopDM);
      const cleanup = setInterval(() => {
        setTypingMap(m => {
          const now = Date.now();
          let changed = false;
          const n = new Map(m);
          for (const [uid, expires] of n.entries()) {
            if (expires <= now) { n.delete(uid); changed = true; }
          }
          return changed ? n : m;
        });
      }, 800);
      return () => {
        socket.off('dm:receive', onReceive);
        socket.off('user:online', onOnline);
        socket.off('user:offline', onOffline);
        socket.off('dm:typing:start', onTypingStartDM);
        socket.off('dm:typing:stop', onTypingStopDM);
        clearInterval(cleanup);
      };
    }
  }, [isDM, users, user, isAuthenticated, channelId, other, dmUserId]);

  useEffect(() => {
    if (!autoScroll) return;
    scrollToBottom();
  }, [messages, autoScroll, scrollToBottom]);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [loading, scrollToBottom]);

  async function send() {
    if (!text.trim()) return;
    const payloadText = text;
    setText('');
    setAutoScroll(true);
    try { if (!isDM) socket.emit('typing:stop'); else socket.emit('dm:typing:stop', { channelId }); } catch { void 0 }
    try {
      const endpoint = isDM ? `/chat/direct/${dmUserId}/messages` : '/chat/messages';
      const res = await api.post(endpoint, { text: payloadText });
      const myMsg = { id: res.data?.id || Math.random(), text: payloadText, author: 'Moi', user_id: user?.id, created_at: new Date().toISOString() };
      setMessages(m => [...m, myMsg]);
    } catch { void 0 }
  }

  function insertEmoji(emoji) {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const next = `${before}${emoji}${after}`;
    setText(next);
    setTimeout(() => {
      try {
        el.focus();
        const pos = start + emoji.length;
        el.setSelectionRange(pos, pos);
      } catch { void 0 }
    }, 0);
  }

  function renderWithMentions(t) {
    const my = user?.username;
    if (!my) return t;
    const target = `@${my}`;
    const parts = String(t).split(new RegExp(`(${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'));
    return parts.map((p, i) => {
      const isMatch = p.toLowerCase() === target.toLowerCase();
      return isMatch ? (
        <span key={i} className="bg-warning/40 px-1 rounded">{p}</span>
      ) : (
        <Fragment key={i}>{p}</Fragment>
      );
    });
  }

  function findMentionTrigger(value, caret) {
    const v = String(value);
    let i = Math.max(0, (caret ?? v.length) - 1);
    while (i >= 0) {
      const ch = v[i];
      if (ch === '@') {
        const before = v[i - 1] ?? ' ';
        if (/\s|^/.test(before)) {
          const q = v.slice(i + 1, caret).replace(/\s.*/, '');
          return { start: i, query: q };
        }
        break;
      }
      if (/\s/.test(ch)) break;
      i--;
    }
    return null;
  }

  function getMentionCandidates(q) {
    const base = users.filter(u => online.has(u.id));
    const query = String(q || '').toLowerCase();
    const list = query ? base.filter(u => String(u.username || '').toLowerCase().startsWith(query)) : base;
    return list.slice(0, 8);
  }

  function applyMention(name) {
    if (mentionStart < 0) return;
    const el = inputRef.current;
    const caret = el?.selectionStart ?? text.length;
    const before = text.slice(0, mentionStart);
    const after = text.slice(caret);
    const next = `${before}@${name} ${after}`;
    setText(next);
    setMentionOpen(false);
    setMentionQuery('');
    setMentionStart(-1);
    setMentionActive(0);
    setTimeout(() => {
      try {
        el?.focus();
        const pos = (before + `@${name} `).length;
        el?.setSelectionRange(pos, pos);
      } catch { void 0 }
    }, 0);
  }

  function handleChange(e) {
    const value = e.target.value;
    const caret = e.target.selectionStart;
    setText(value);
    const trig = findMentionTrigger(value, caret);
    if (trig) {
      setMentionOpen(true);
      setMentionStart(trig.start);
      setMentionQuery(trig.query);
      setMentionActive(0);
      setEmojiOpen(false);
    } else {
      setMentionOpen(false);
    }

    // Émission des événements de saisie
    if (isAuthenticated) {
      try {
        const now = Date.now();
        if (String(value).trim().length === 0) {
          if (!isDM) socket.emit('typing:stop'); else socket.emit('dm:typing:stop', { channelId });
          typingLastSentRef.current = 0;
        } else {
          if (now - typingLastSentRef.current > 1200) {
            typingLastSentRef.current = now;
            if (!isDM) socket.emit('typing:start', { username: user?.username }); else socket.emit('dm:typing:start', { channelId, username: user?.username });
          }
          if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
          typingStopTimerRef.current = setTimeout(() => {
            if (!isDM) socket.emit('typing:stop'); else socket.emit('dm:typing:stop', { channelId });
            typingLastSentRef.current = 0;
          }, 2200);
        }
      } catch { void 0 }
    }
  }

  function handleKeyDown(e) {
    if (mentionOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionActive(a => Math.min(getMentionCandidates(mentionQuery).length - 1, a + 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionActive(a => Math.max(0, a - 1)); return; }
      if (e.key === 'Escape') { e.preventDefault(); setMentionOpen(false); return; }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const cs = getMentionCandidates(mentionQuery);
        if (cs[mentionActive]) { applyMention(cs[mentionActive].username); return; }
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const isAtBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) <= 2;
    setAutoScroll(isAtBottom);
  }

  const onlineCount = users.filter(u => online.has(u.id)).length;
  const sidebarUsers = tab === 'online' ? users.filter(u => online.has(u.id)) : users;
  const boundaryIdxRaw = notifyTs ? messages.findIndex(m => new Date(m.created_at).getTime() >= notifyTs) : -1;
  const boundaryIndex = notifyTs ? (boundaryIdxRaw !== -1 ? boundaryIdxRaw : (messages.length > 0 ? messages.length - 1 : -1)) : -1;
  const pageTitle = isDM ? 'Messages privés' : 'Chat Public';
  const pageSubtitle = isDM ? 'Conversation directe' : 'Discute en temps réel avec les étudiants de la plateforme';
  const pageIcon = isDM ? 'chat' : 'forum';
  const typingUsersList = isDM ? [] : users.filter(u => typingMap.has(u.id));
  const typingCount = isDM ? (other && typingMap.has(other.id) ? 1 : 0) : typingUsersList.length;
  const typingText = (() => {
    if (typingCount === 0) return '';
    if (isDM) return `${other?.username || 'Un utilisateur'} est en train d'écrire…`;
    if (typingCount === 1) return `${typingUsersList[0].username} est en train d'écrire…`;
    if (typingCount === 2) return `${typingUsersList[0].username} et ${typingUsersList[1].username} écrivent…`;
    return `${typingUsersList[0].username}, ${typingUsersList[1].username} et ${typingCount - 2} autres écrivent…`;
  })();

  return (
    <Page icon={pageIcon} title={pageTitle} subtitle={pageSubtitle}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">

        <div className="lg:col-span-1 order-2 lg:order-1">
          {!isDM ? (
            <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl h-[70vh] border border-base-300">
              <div className="card-body p-4 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">group</span>
                    Utilisateurs
                  </h3>
                  <div className="badge badge-primary badge-sm">{users.length}</div>
                </div>
                <div className="flex gap-1 mb-3 bg-base-300 p-1 rounded-lg">
                  <button
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'all' ? 'bg-primary text-primary-content shadow-md' : 'hover:bg-base-200'}`}
                    onClick={() => setTab('all')}
                  >
                    Tous
                  </button>
                  <button
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'online' ? 'bg-success text-success-content shadow-md' : 'hover:bg-base-200'}`}
                    onClick={() => setTab('online')}
                  >
                    En ligne ({onlineCount})
                  </button>
                </div>
                <div className="space-y-1.5 overflow-y-auto flex-1 min-h-0 pr-1">
                  {sidebarUsers.map(u => (
                    <div key={u.id} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-base-100 transition-all hover:shadow-md">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="relative">
                          <div className="avatar">
                            <div className="w-9 rounded-full ring-2 ring-base-300 group-hover:ring-primary transition-all">
                              {u.avatar ? (
                                <img alt={u.username} src={assetUrl(u.avatar)} />
                              ) : (
                                <div className="bg-primary text-primary-content w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm">
                                  {u.username?.[0]}
                                </div>
                              )}
                            </div>
                          </div>
                          {online.has(u.id) && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-base-100 animate-pulse"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs truncate">{u.username}</div>
                          <div className="text-[10px] opacity-60">{online.has(u.id) ? 'En ligne' : 'Hors ligne'}</div>
                        </div>
                      </div>
                      <Link
                        className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Message privé"
                        to={`/chat/direct/${u.id}`}
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                      </Link>
                    </div>
                  ))}
                  {sidebarUsers.length === 0 && (
                    <div className="text-center py-12 opacity-40">
                      <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                      <p className="text-xs">Aucun utilisateur</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card relative overflow-hidden shadow-2xl h-[70vh] border border-base-300">
              {other?.avatar ? (
                <img src={assetUrl(other.avatar)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 opacity-40" />
              )}
              <div className="absolute inset-0 bg-base-100/20 backdrop-blur-sm" />
              <div className="card-body p-6 relative z-10 flex flex-col items-center justify-center gap-4">
                <div className="avatar">
                  <div className="w-24 rounded-full ring-4 ring-primary ring-offset-base-100 ring-offset-2">
                    {other?.avatar ? (
                      <img alt={other?.username || `Utilisateur #${dmUserId}`} src={assetUrl(other.avatar)} />
                    ) : (
                      <div className="bg-primary text-primary-content w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl">
                        {(other?.username?.[0]) || '?'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{other?.username || `Utilisateur #${dmUserId}`}</h3>
                  <div className="mt-1 flex items-center justify-center gap-2 text-xs">
                    <span className={`flex items-center gap-1 ${other && online.has(other.id) ? 'text-success' : 'opacity-60'}`}>
                      <span className={`w-2 h-2 rounded-full ${other && online.has(other.id) ? 'bg-success' : 'bg-base-300'}`}></span>
                      {other && online.has(other.id) ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 px-4 py-2 rounded-full bg-base-100/80 border border-base-300 text-xs">
                  Conversation avec {other?.username || `Utilisateur #${dmUserId}`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Zone de Chat Principal */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="card bg-base-100 shadow-2xl h-[70vh] border border-base-300">
            <div className="card-body p-0 flex flex-col h-full overflow-hidden">

          <div className="px-6 py-4 border-b border-base-300 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between">
              {!isDM ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-primary-content">forum</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Chat Public</h3>
                    <p className="text-xs opacity-60">{messages.length} message{messages.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="avatar">
                      <div className="w-12 rounded-full ring-2 ring-base-300">
                        {other?.avatar ? (
                          <img alt={other?.username || `Utilisateur #${dmUserId}`} src={assetUrl(other.avatar)} />
                        ) : (
                          <div className="bg-primary text-primary-content w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                            {(other?.username?.[0]) || '?'}
                          </div>
                        )}
                      </div>
                    </div>
                    {other && online.has(other.id) && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-base-100 animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">{other?.username || `Utilisateur #${dmUserId}`}</h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`flex items-center gap-1 ${other && online.has(other.id) ? 'text-success' : 'opacity-60'}`}>
                        <span className={`w-2 h-2 rounded-full ${other && online.has(other.id) ? 'bg-success' : 'bg-base-300'}`}></span>
                        {other && online.has(other.id) ? 'En ligne' : 'Hors ligne'}
                      </span>
                      <span className="opacity-60">{messages.length} message{messages.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              )}
              {!isDM ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                  <span className="text-xs font-semibold text-success">{onlineCount} en ligne</span>
                </div>
              ) : (
                <Link to="/chat" className="btn btn-ghost btn-sm gap-1">
                  <span className="material-symbols-outlined">arrow_back</span>
                  <span className="hidden sm:inline">Retour au chat</span>
                </Link>
              )}
            </div>
          </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3 bg-gradient-to-b from-base-100 to-base-200/30" ref={listRef} onScroll={handleScroll}>
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
                      <span className="material-symbols-outlined text-5xl text-primary">chat_bubble</span>
                    </div>
                    <p className="font-semibold mb-1">Aucun message</p>
                    <p className="text-sm opacity-50">Commence la conversation !</p>
                  </div>
                )}

                {!loading && messages.map((m, i) => {
                  const isMe = (user && m.user_id === user.id) || (!isDM && (m.author === 'Moi'));
                  const au = isDM ? (isMe ? user : other) : users.find(u => u.id === m.user_id);
                  const name = isDM ? (isMe ? 'Moi' : (au?.username || 'Un utilisateur')) : (m.author || au?.username || 'Un utilisateur');
                  const avatar = au?.avatar || null;
                  const ts = new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
                        <div className="avatar flex-shrink-0">
                          <div className="w-9 rounded-full ring-2 ring-base-300 group-hover:ring-primary transition-all">
                            {avatar ? (
                              <img alt={name} src={assetUrl(avatar)} />
                            ) : (
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${isMe ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/80'}`}>
                                {name[0]}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className={`text-xs font-semibold ${isMe ? 'text-primary' : 'text-base-content/80'}`}>{name}</span>
                            <span className="text-[10px] opacity-40">{ts}</span>
                          </div>
                          {(() => {
                            const isMentioned = !!user && new RegExp(`(^|\\s)@${String(user.username || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(String(m.text || ''));
                            const bubbleCls = `${isMe
                              ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-content rounded-tr-sm'
                              : 'bg-base-200 rounded-tl-sm'
                            }`;
                            const ringCls = isNewBoundary ? ' ring-2 ring-warning/40' : '';
                            const mentionCls = isMentioned ? (isMe ? ' ring-2 ring-warning/70 shadow-lg' : ' ring-2 ring-warning/70 shadow-lg') : '';
                            return (
                              <div className={`relative px-4 py-2.5 rounded-2xl shadow-md transition-all group-hover:shadow-lg${ringCls}${mentionCls} ${bubbleCls}`}>
                                {isMentioned && (
                                  <>
                                    <div className={`absolute inset-y-0 ${isMe ? 'right-0 rounded-tr-xl' : 'left-0 rounded-tl-xl'} w-1 bg-warning`}></div>
                                    {!isMe && <div className="absolute inset-0 bg-warning/10 rounded-2xl pointer-events-none"></div>}
                                  </>
                                )}
                                <p className="relative text-sm leading-relaxed whitespace-pre-wrap break-words">{renderWithMentions(m.text)}</p>
                              </div>
                            );
                          })()}
                          </div>
                        </div>
                      </Fragment>
                      );
                    })}
                <div ref={messagesEndRef} />
              </div>

            {/* Input Zone */}
            <div className="p-4 border-t border-base-300 bg-base-100">
              {typingCount > 0 && (
                <div className="flex items-center gap-2 mb-2 px-2 text-xs text-base-content/70">
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span className="truncate">{typingText}</span>
                  <span className="loading loading-dots loading-xs"></span>
                </div>
              )}
              {!isAuthenticated && (
                <div className="alert alert-warning mb-3 py-2 shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">lock</span>
                    <span className="text-sm">Connecte-toi pour envoyer des messages</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="input input-bordered w-full pr-24 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                      placeholder={isAuthenticated ? 'Écris ton message...' : 'Connecte-toi pour écrire'}
                      value={text}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      disabled={!isAuthenticated}
                      ref={inputRef}
                    />
                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square"
                        disabled={!isAuthenticated}
                        onClick={() => setEmojiOpen(o => !o)}
                        title="Émojis"
                      >
                        <span className="material-symbols-outlined">mood</span>
                      </button>
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </div>
                    {emojiOpen && (
                      <div className="absolute bottom-full right-0 mb-2 p-4 rounded-2xl shadow-2xl border border-base-300 bg-base-100 w-[42rem] z-20">
                        <div className="max-h-64 overflow-y-auto">
                          <div className="grid grid-cols-6 gap-1">
                            {['😀','😃','😄','😁','😆','😅','😂','🤣','😊','🙂','😉','😍','😘','😜','🤪','🤩','🥳','😎','🤓','😇','😋','😌','😴','🤤','😪','😮','😲','😱','😅','🤔','🤯','😬','🤗','🙌','👍','👏','💪','🔥','✨','💯','🏆','🎉','🎶','🎮','🍕','🍔','🍣','⚽','🎯','🧠','🛠️','🖥️','📸','🎬','🎨','🎵','🏃‍♂️','🚴‍♀️','🏊‍♂️','🍩','🍎','🍪','🥐','🍔','🍟','🌮','🍣','🍜','☕','🍺'].map(e => (
                              <button
                                key={e}
                                className="flex items-center justify-center w-20 h-20 rounded-2xl hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary text-3xl leading-none"
                                onClick={() => { insertEmoji(e); setEmojiOpen(false); }}
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {mentionOpen && (
                      <div className="absolute bottom-full left-0 mb-2 p-2 rounded-2xl shadow-2xl border border-base-300 bg-base-100 w-[22rem] z-30">
                        <div className="max-h-60 overflow-y-auto">
                          {getMentionCandidates(mentionQuery).map((u, idx) => (
                            <button
                              key={u.id}
                              className={`w-full flex items-center gap-2 p-2 rounded-xl text-left ${idx === mentionActive ? 'bg-base-200' : 'hover:bg-base-200'}`}
                              onMouseEnter={() => setMentionActive(idx)}
                              onClick={() => applyMention(u.username)}
                            >
                              <div className="avatar">
                                <div className="w-6 rounded-full ring-2 ring-base-300">
                                  {u.avatar ? <img alt={u.username} src={assetUrl(u.avatar)} /> : (
                                    <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-[10px] font-bold">{u.username?.[0]}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">@{u.username}</div>
                                <div className="text-[10px] opacity-60">{online.has(u.id) ? 'En ligne' : 'Hors ligne'}</div>
                              </div>
                              <span className={`w-2 h-2 rounded-full ${online.has(u.id) ? 'bg-success' : 'bg-base-300'}`}></span>
                            </button>
                          ))}
                          {getMentionCandidates(mentionQuery).length === 0 && (
                            <div className="p-2 text-xs opacity-60">Aucun utilisateur en ligne</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    onClick={send}
                    disabled={!isAuthenticated || !text.trim()}
                  >
                    <span className="material-symbols-outlined">send</span>
                    <span className="hidden sm:inline">Envoyer</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </Page>
  );
}
