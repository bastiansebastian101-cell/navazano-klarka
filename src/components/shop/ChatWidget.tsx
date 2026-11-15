'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Website chat: the visitor first picks Czech or English, then writes; every message goes to Klára's
// WhatsApp (see /api/chat) and her WhatsApp replies appear here (the widget polls for new messages).

type Lang = 'cs' | 'en';
type Msg = { id: number; sender: 'visitor' | 'owner' | 'bot' | 'local'; text: string };

const T = {
  cs: {
    fab: 'Napište nám',
    title: 'Navázáno by Klára',
    subtitle: 'Odpovídáme obvykle do pár minut',
    greeting: 'Dobrý den! 🌸 Jsem tu pro vás. Zeptejte se na cokoliv: kytici na míru, doručení, cenu… Klára vám odpoví přímo sem.',
    placeholder: 'Napište zprávu…',
    send: 'Odeslat',
    owner: 'Klára',
    error: 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.',
    close: 'Zavřít chat',
    switchLang: 'English',
    waFaster: '💬 Rychlejší odpověď? Napište nám na WhatsApp',
    waHeader: 'Napsat na WhatsApp',
    waIntro: 'Dobrý den, píšu z webu navazano.cz.',
  },
  en: {
    fab: 'Chat with us',
    title: 'Navázáno by Klára',
    subtitle: 'We usually reply within minutes',
    greeting: "Hello! 🌸 I'm here to help. Ask anything: a custom bouquet, delivery, prices… Klára will reply right here.",
    placeholder: 'Type a message…',
    send: 'Send',
    owner: 'Klára',
    error: "The message couldn't be sent. Please try again.",
    close: 'Close chat',
    switchLang: 'Česky',
    waFaster: '💬 Faster reply? Message us on WhatsApp',
    waHeader: 'Message on WhatsApp',
    waIntro: "Hello, I'm writing from navazano.cz.",
  },
};

// Shop WhatsApp: questions the chat can't handle are sent here (opens WhatsApp with the text typed in).
const WHATSAPP = '420728415630';
const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

const STORE_KEY = 'navazano_chat';
type Saved = { lang?: Lang; id?: string; lastId?: number; seen?: number };
const load = (): Saved => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  } catch {
    return {};
  }
};
const save = (s: Saved) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {}
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const lastId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  // restore an earlier chat from this browser
  useEffect(() => {
    const s = load();
    if (s.lang) setLang(s.lang);
    if (s.id) setConvId(s.id);
  }, []);

  const poll = useCallback(async () => {
    if (!convId) return;
    try {
      const res = await fetch(`/api/chat?id=${encodeURIComponent(convId)}&after=${lastId.current}`, { cache: 'no-store' });
      if (res.status === 404) {
        setConvId(null);
        save({ lang: lang ?? undefined });
        return;
      }
      const data = await res.json();
      const fresh: Msg[] = data.messages ?? [];
      if (!fresh.length) return;
      lastId.current = fresh[fresh.length - 1].id;
      setMsgs((list) => [...list.filter((m) => m.sender !== 'local' || !fresh.some((f) => f.sender === 'visitor' && f.text === m.text)), ...fresh]);
      const replies = fresh.filter((m) => m.sender === 'owner').length;
      if (!openRef.current && replies) setUnread((n) => n + replies);
      const s = load();
      save({ ...s, lastId: lastId.current });
    } catch {}
  }, [convId, lang]);

  // poll every 3 s while open, every 20 s while closed (to show the unread badge); pause in background tabs
  useEffect(() => {
    if (!convId) return;
    poll();
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') poll();
    }, open ? 3000 : 20000);
    return () => clearInterval(iv);
  }, [convId, open, poll]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, open, lang]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const chooseLang = (l: Lang) => {
    setLang(l);
    save({ ...load(), lang: l });
  };

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value || !lang || sending) return;
    setSending(true);
    setText('');
    setMsgs((list) => [...list, { id: -Date.now(), sender: 'local', text: value }]);
    try {
      let id = convId;
      if (!id) {
        const r = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start', lang }),
        });
        const d = await r.json();
        if (!r.ok || !d.id) throw new Error('start');
        id = d.id as string;
        setConvId(id);
        save({ ...load(), lang, id, lastId: 0 });
      }
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', id, text: value }),
      });
      if (!r.ok) throw new Error('send');
      setTimeout(poll, 400);
    } catch {
      setMsgs((list) => [...list, { id: -Date.now() - 1, sender: 'bot', text: T[lang].error }]);
    } finally {
      setSending(false);
    }
  };

  const t = T[lang ?? 'cs'];

  return (
    <div className={`fixed ${open ? 'z-[70] inset-0 sm:inset-auto sm:bottom-5 sm:right-5' : 'z-30 bottom-5 right-4 sm:right-5'}`}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t.fab}
          className="relative flex items-center gap-2 rounded-full bg-brand px-4 py-3 font-semibold text-white shadow-card-hover transition hover:bg-brand-hover"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path d="M4 5h16v11H8l-4 4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">{lang ? t.fab : 'Napište nám · Chat'}</span>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sage-dark px-1 text-xs">{unread}</span>
          )}
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label={t.title}
          className="flex h-full w-full flex-col overflow-hidden bg-white shadow-card-hover sm:h-[560px] sm:max-h-[calc(100vh-40px)] sm:w-[370px] sm:rounded-2xl"
        >
          <header className="flex items-center gap-3 bg-brand px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/25 text-lg" aria-hidden="true">🌸</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold leading-tight">{t.title}</p>
              <p className="text-xs text-white/85">{t.subtitle}</p>
            </div>
            {lang && (
              <button onClick={() => chooseLang(lang === 'cs' ? 'en' : 'cs')} className="rounded-full border border-white/60 px-2 py-0.5 text-xs">
                {t.switchLang}
              </button>
            )}
            <a
              href={waLink(T[lang ?? 'cs'].waIntro)}
              target="_blank"
              rel="noopener"
              aria-label={t.waHeader}
              title={t.waHeader}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.1z" />
              </svg>
            </a>
            <button onClick={() => setOpen(false)} aria-label={t.close} className="px-1 text-2xl leading-none">
              ×
            </button>
          </header>

          <div ref={logRef} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-cream p-4" aria-live="polite">
            {!lang ? (
              <div className="m-auto text-center">
                <p className="mb-1 text-lg">👋</p>
                <p className="mb-4 text-ink">
                  Dobrý den! V jakém jazyce si chcete psát?
                  <br />
                  <span className="text-ink-light">Hello! Which language would you like to chat in?</span>
                </p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => chooseLang('cs')} className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-hover">
                    🇨🇿 Čeština
                  </button>
                  <button onClick={() => chooseLang('en')} className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-hover">
                    🇬🇧 English
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Bubble who="bot">{t.greeting}</Bubble>
                {msgs.map((m) => (
                  <Bubble key={m.id} who={m.sender} label={m.sender === 'owner' ? t.owner : undefined}>
                    {m.text}
                  </Bubble>
                ))}
                {/* after the customer has written, offer WhatsApp with their question already typed */}
                {msgs.some((m) => m.sender === 'visitor' || m.sender === 'local') && (
                  <a
                    href={waLink(
                      `${t.waIntro}\n\n${msgs
                        .filter((m) => m.sender === 'visitor' || m.sender === 'local')
                        .map((m) => m.text)
                        .slice(-3)
                        .join('\n')}`
                    )}
                    target="_blank"
                    rel="noopener"
                    className="mt-1 self-start rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-card hover:brightness-95"
                  >
                    {t.waFaster}
                  </a>
                )}
              </>
            )}
          </div>

          {lang && (
            <form onSubmit={send} className="flex gap-2 border-t border-ink-lighter/40 p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.placeholder}
                maxLength={1000}
                aria-label={t.placeholder}
                className="min-w-0 flex-1 rounded-full border border-ink-lighter px-4 py-2 text-base outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                aria-label={t.send}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path d="M3 20 21 12 3 4l3 8zM6 12h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}

function Bubble({ who, label, children }: { who: Msg['sender']; label?: string; children: React.ReactNode }) {
  const mine = who === 'visitor' || who === 'local';
  return (
    <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${mine ? 'self-end rounded-br-sm bg-brand text-white' : 'self-start rounded-bl-sm bg-white text-ink shadow-card'}`}>
      {label && <p className="mb-0.5 text-xs font-semibold text-brand-dark">{label}</p>}
      {children}
    </div>
  );
}
