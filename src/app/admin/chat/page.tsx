'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Admin chat inbox: customer conversations from the website chat. Replies typed here appear in the
// customer's chat within seconds. New messages: sound + browser notification + unread count in the tab title.

type Conv = { id: string; code: string; lang: 'cs' | 'en'; lastActivity: string; lastText: string | null; lastSender: string | null; unread: number };
type Msg = { id: number; sender: 'visitor' | 'owner' | 'bot'; text: string; createdAt: string };

const time = (d: string) => {
  const date = new Date(d);
  const today = new Date().toDateString() === date.toDateString();
  return date.toLocaleString('cs-CZ', today ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** Short "ding" made in the browser (no sound file needed). */
function ding() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.15;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.start(t);
      o.stop(t + 0.3);
    });
  } catch {}
}

export default function AdminChatPage() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [notifyState, setNotifyState] = useState<NotificationPermission | 'unsupported'>('default');
  const lastUnread = useRef<number | null>(null);
  const lastMsgId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;

  useEffect(() => {
    setNotifyState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  }, []);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chat', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/admin';
        return;
      }
      const data: { conversations: Conv[]; unreadTotal: number } = await res.json();
      setConvs(data.conversations);
      setLoaded(true);
      document.title = data.unreadTotal ? `(${data.unreadTotal}) Chat · Navázáno admin` : 'Chat · Navázáno admin';
      // new customer message since the last check → sound + notification
      if (lastUnread.current !== null && data.unreadTotal > lastUnread.current) {
        ding();
        const newest = data.conversations.find((c) => c.unread > 0);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && newest) {
          const n = new Notification(`💬 Nová zpráva · #${newest.code}`, { body: newest.lastText ?? '', tag: newest.id });
          n.onclick = () => {
            window.focus();
            setSelected(newest.id);
          };
        }
      }
      lastUnread.current = data.unreadTotal;
      // ?c=CODE from the e-mail link opens that chat
      const code = new URLSearchParams(window.location.search).get('c');
      if (code && !selectedRef.current) {
        const match = data.conversations.find((c) => c.code === code.toUpperCase());
        if (match) setSelected(match.id);
      }
    } catch {}
  }, []);

  const loadMsgs = useCallback(async (reset = false) => {
    const id = selectedRef.current;
    if (!id) return;
    try {
      const after = reset ? 0 : lastMsgId.current;
      const res = await fetch(`/api/admin/chat/${encodeURIComponent(id)}?after=${after}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data: { messages: Msg[] } = await res.json();
      if (selectedRef.current !== id) return; // switched chats meanwhile
      if (reset) setMsgs(data.messages);
      else if (data.messages.length) setMsgs((m) => [...m, ...data.messages.filter((x) => !m.some((y) => y.id === x.id))]);
      const last = data.messages[data.messages.length - 1];
      if (last) lastMsgId.current = Math.max(lastMsgId.current, last.id);
    } catch {}
  }, []);

  // list every 5 s, open chat every 3 s
  useEffect(() => {
    loadList();
    const iv = setInterval(loadList, 5000);
    return () => clearInterval(iv);
  }, [loadList]);

  useEffect(() => {
    if (!selected) return;
    lastMsgId.current = 0;
    setMsgs([]);
    loadMsgs(true).then(loadList);
    const iv = setInterval(() => loadMsgs(), 3000);
    return () => clearInterval(iv);
  }, [selected, loadMsgs, loadList]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !selected || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/chat/${encodeURIComponent(selected)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      });
      if (res.ok) {
        setText('');
        await loadMsgs();
        loadList();
      } else alert('Zprávu se nepodařilo odeslat. Zkuste to znovu.');
    } finally {
      setSending(false);
    }
  };

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setNotifyState(p);
    if (p === 'granted') ding();
  };

  const current = convs.find((c) => c.id === selected);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Chat se zákazníky</h1>
        {notifyState === 'default' && (
          <button onClick={enableNotifications} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
            🔔 Zapnout upozornění
          </button>
        )}
        {notifyState === 'granted' && <span className="text-sm text-sage-dark">🔔 Upozornění zapnutá (když je tato stránka otevřená)</span>}
        {notifyState === 'denied' && <span className="text-sm text-ink-light">Upozornění jsou v prohlížeči zablokovaná. Nové zprávy chodí e-mailem.</span>}
      </div>

      <div className="flex h-[calc(100vh-14rem)] min-h-[460px] overflow-hidden rounded-2xl bg-white shadow-card">
        {/* conversation list (hidden on phones while a chat is open) */}
        <aside className={`w-full shrink-0 overflow-y-auto border-r border-ink-lighter/30 sm:w-72 ${selected ? 'hidden sm:block' : ''}`}>
          {!loaded && <p className="p-4 text-sm text-ink-light">Načítám…</p>}
          {loaded && convs.length === 0 && <p className="p-4 text-sm text-ink-light">Zatím žádné zprávy. Jakmile zákazník napíše do chatu na webu, objeví se tady.</p>}
          {convs.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`flex w-full flex-col gap-0.5 border-b border-ink-lighter/20 px-4 py-3 text-left hover:bg-brand-light/40 ${selected === c.id ? 'bg-brand-light/60' : ''}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">
                  #{c.code} <span className="text-xs font-normal text-ink-light">{c.lang === 'en' ? '🇬🇧 EN' : '🇨🇿 CZ'}</span>
                </span>
                <span className="text-xs text-ink-light">{time(c.lastActivity)}</span>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className={`truncate text-sm ${c.unread ? 'font-semibold text-ink' : 'text-ink-light'}`}>
                  {c.lastSender === 'owner' ? 'Vy: ' : ''}
                  {c.lastText}
                </span>
                {c.unread > 0 && <span className="shrink-0 rounded-full bg-brand px-2 text-xs font-bold text-white">{c.unread}</span>}
              </span>
            </button>
          ))}
        </aside>

        {/* open conversation */}
        <section className={`flex min-w-0 flex-1 flex-col ${selected ? '' : 'hidden sm:flex'}`}>
          {!selected ? (
            <div className="m-auto p-6 text-center text-ink-light">Vyberte konverzaci vlevo.</div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-ink-lighter/30 px-4 py-3">
                <button onClick={() => setSelected(null)} className="text-2xl leading-none text-ink sm:hidden" aria-label="Zpět">
                  ‹
                </button>
                <div>
                  <p className="font-semibold text-ink">Zákazník #{current?.code}</p>
                  <p className="text-xs text-ink-light">Píše {current?.lang === 'en' ? 'anglicky 🇬🇧 – odpovězte prosím anglicky' : 'česky 🇨🇿'}</p>
                </div>
              </header>
              <div ref={logRef} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-cream p-4">
                {msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                      m.sender === 'owner'
                        ? 'self-end rounded-br-sm bg-brand text-white'
                        : m.sender === 'bot'
                          ? 'self-center bg-transparent text-center text-xs italic text-ink-light'
                          : 'self-start rounded-bl-sm bg-white text-ink shadow-card'
                    }`}
                  >
                    {m.sender === 'bot' ? `Automatická odpověď: ${m.text}` : m.text}
                    {m.sender !== 'bot' && <span className={`mt-0.5 block text-[10px] ${m.sender === 'owner' ? 'text-white/75' : 'text-ink-light'}`}>{time(m.createdAt)}</span>}
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-ink-lighter/30 p-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(e as unknown as React.FormEvent);
                    }
                  }}
                  rows={2}
                  maxLength={2000}
                  placeholder="Napište odpověď… (Enter = odeslat, Shift+Enter = nový řádek)"
                  className="min-w-0 flex-1 resize-none rounded-xl border border-ink-lighter px-3 py-2 text-base outline-none focus:border-brand"
                />
                <button type="submit" disabled={sending || !text.trim()} className="self-end rounded-full bg-brand px-5 py-2.5 font-semibold text-white disabled:opacity-50">
                  Odeslat
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
