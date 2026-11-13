import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Bell, CalendarDays, Check, ChevronRight,
  CircleHelp, Clock3, Command, Home, Lightbulb, ListTodo, Menu,
  MessageSquareText, Plus, Search, Settings2, Sparkles, StickyNote,
  Target, X
} from "lucide-react";

const navigation = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "apml", label: "APML intelligence", icon: Activity }
];

const initialNotes = [
  { id: 1, text: "NOVA is my private space for ideas, plans and things worth remembering.", date: "Pinned note" }
];

function Mascot({ onClick }) {
  return (
    <button className="mascot" onClick={onClick} aria-label="Talk to NOVA">
      <span className="mascot-image" />
      <span className="mascot-ping" />
    </button>
  );
}

function EmptyState({ icon: Icon, title, detail }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={21} /></span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("nova.notes.v1");
      return saved ? JSON.parse(saved) : initialNotes;
    } catch {
      return initialNotes;
    }
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [greeting, setGreeting] = useState("Hey! I'm NOVA. Your ideas have a home here.");

  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    []
  );

  function saveNote(event) {
    event.preventDefault();
    const value = noteText.trim();
    if (!value) return;
    const next = [{ id: Date.now(), text: value, date: "Just now" }, ...notes];
    setNotes(next);
    localStorage.setItem("nova.notes.v1", JSON.stringify(next));
    setNoteText("");
    setToast("Saved to your notes");
    window.setTimeout(() => setToast(""), 2200);
  }

  function removeNote(id) {
    const next = notes.filter((note) => note.id !== id);
    setNotes(next);
    localStorage.setItem("nova.notes.v1", JSON.stringify(next));
  }

  function selectSection(id) {
    setActive(id);
    setMobileNav(false);
  }

  const sectionTitle = navigation.find((item) => item.id === active)?.label ?? "Overview";

  return (
    <div className="nova-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <a className="brand" href="#overview" onClick={() => selectSection("overview")}>
          <span className="brand-symbol"><Sparkles size={19} /></span>
          <span><b>NOVA</b><small>YOUR PERSONAL SPACE</small></span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => selectSection(id)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {id === "apml" && <span className="nav-new">LIVE</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="private-card">
            <span className="private-icon"><Target size={16} /></span>
            <b>Made for one</b>
            <p>A quieter place to think, plan and remember.</p>
          </div>
          <div className="sidebar-foot"><span className="online-dot" /> Personal workspace</div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle menu">
              {mobileNav ? <X size={19} /> : <Menu size={19} />}
            </button>
            <div className="breadcrumb"><span>Workspace</span><ChevronRight size={13} /><b>{sectionTitle}</b></div>
          </div>
          <div className="topbar-right">
            <span className="today-label"><CalendarDays size={14} />{dateLabel}</span>
            <span className="avatar">K</span>
          </div>
        </header>

        <div className="page-content">
          {active === "overview" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow"><Sparkles size={13} /> YOUR PERSONAL ASSISTANT</div>
                  <h1>A little more clarity,<br /><span>one day at a time.</span></h1>
                  <p className="lead">Good things are easier to manage when you have a place to put them.</p>
                </div>
                <div className="welcome-art"><div className="orb orb-one" /><div className="orb orb-two" /><Sparkles size={38} /></div>
              </section>

              <section className="quick-stats">
                <div className="stat-card"><span className="stat-icon violet"><StickyNote size={17} /></span><div><small>Notes saved</small><strong>{notes.length}</strong></div><span className="stat-caption">Your thoughts</span></div>
                <div className="stat-card"><span className="stat-icon blue"><Bell size={17} /></span><div><small>Reminders</small><strong>—</strong></div><span className="stat-caption">Coming soon</span></div>
                <div className="stat-card"><span className="stat-icon amber"><ListTodo size={17} /></span><div><small>Tasks</small><strong>—</strong></div><span className="stat-caption">Coming soon</span></div>
              </section>

              <div className="section-heading"><div><span className="eyebrow">CAPTURE A THOUGHT</span><h2>What's on your mind?</h2></div><span className="section-note">Private to this browser for now</span></div>
              <section className="capture-card">
                <form onSubmit={saveNote}>
                  <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="A thought, an idea, something to remember…" aria-label="Write a note" />
                  <div className="capture-bottom"><span><Command size={13} /> A small thought today can save time tomorrow.</span><button className="primary-button" type="submit" disabled={!noteText.trim()}><Plus size={15} /> Save note</button></div>
                </form>
              </section>

              <div className="section-heading notes-heading"><div><span className="eyebrow">YOUR MEMORY SPACE</span><h2>Recent notes</h2></div><button className="text-button" onClick={() => selectSection("notes")}>View all <ArrowUpRight size={14} /></button></div>
              <section className="notes-card">
                {notes.length ? <div className="note-list">{notes.slice(0, 3).map((note) => (
                  <article className="note-row" key={note.id}><span className="note-bullet"><StickyNote size={15} /></span><div className="note-copy"><p>{note.text}</p><small>{note.date}</small></div><button className="remove-note" onClick={() => removeNote(note.id)} aria-label="Delete note"><X size={15} /></button></article>
                ))}</div> : <EmptyState icon={MessageSquareText} title="Nothing saved yet" detail="Your notes will appear here when you capture your first thought." />}
              </section>
            </>
          )}

          {active === "notes" && (
            <SectionPage eyebrow="YOUR MEMORY SPACE" title="Notes" description="Keep useful thoughts, links and little details in one place.">
              <section className="capture-card"><form onSubmit={saveNote}><textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Write something worth remembering…" aria-label="Write a note" /><div className="capture-bottom"><span>Saved in this browser</span><button className="primary-button" type="submit" disabled={!noteText.trim()}><Plus size={15} /> Save note</button></div></form></section>
              <section className="notes-card notes-page">{notes.length ? <div className="note-list">{notes.map((note) => <article className="note-row" key={note.id}><span className="note-bullet"><StickyNote size={15} /></span><div className="note-copy"><p>{note.text}</p><small>{note.date}</small></div><button className="remove-note" onClick={() => removeNote(note.id)} aria-label="Delete note"><X size={15} /></button></article>)}</div> : <EmptyState icon={StickyNote} title="Your notes start here" detail="Save a thought above and it will stay in this browser." />}</section>
            </SectionPage>
          )}

          {active === "reminders" && <SectionPage eyebrow="DON'T LET IT SLIP" title="Reminders" description="A gentle nudge at the right moment."><EmptyState icon={Bell} title="Reminders are next" detail="We'll add dates, times and notification delivery in a dedicated step." /></SectionPage>}
          {active === "tasks" && <SectionPage eyebrow="MAKE ROOM FOR PROGRESS" title="Tasks" description="Turn intentions into small, manageable steps."><EmptyState icon={ListTodo} title="Your task list is waiting" detail="Task creation, priorities and completion tracking will come next." /></SectionPage>}
          {active === "apml" && <SectionPage eyebrow="CONNECTED PROJECT" title="APML intelligence" description="A private view of how your APML Portal is being used."><div className="apml-placeholder"><span className="apml-symbol"><Activity size={20} /></span><div><b>APML connection will be added securely</b><p>Analytics will load through a protected server connection after NOVA's Google sign-in is configured. No APML password or secret will be stored in this React app.</p></div><span className="coming-tag">IN SETUP</span></div><div className="apml-preview-grid"><div><small>VISITORS</small><strong>—</strong><span>Awaiting secure connection</span></div><div><small>PDF DOWNLOADS</small><strong>—</strong><span>Awaiting secure connection</span></div><div><small>MEDIA DOWNLOADS</small><strong>—</strong><span>Awaiting secure connection</span></div></div></SectionPage>}
        </div>

        <footer className="app-footer"><span><span className="footer-spark">✳</span> NOVA <i>·</i> Your personal space</span><span>Built to make everyday life a little lighter.</span></footer>
      </main>

      <div className="mascot-dock"><div className="mascot-message">{greeting}</div><Mascot onClick={() => setGreeting("I'm here. Let's make a little progress together.")} /></div>
      {toast && <div className="toast"><Check size={15} />{toast}</div>}
    </div>
  );
}

function SectionPage({ eyebrow, title, description, children }) {
  return <section className="section-page"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="lead">{description}</p><div className="section-content">{children}</div></section>;
}