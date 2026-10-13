import { useEffect, useMemo, useState } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from './api/notesApi';
import NoteCard from './components/NoteCard';
import NoteModal from './components/NoteModal';
import DeleteModal from './components/DeleteModal';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setNotes(await getNotes(query.trim()));
      } catch (err) {
        flash('Could not load notes: ' + err.message);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, reloadKey]);

  function flash(text) {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  }

  const categories = useMemo(
    () => [...new Set(notes.map((n) => n.category).filter(Boolean))].sort(),
    [notes]
  );

  const visible = category ? notes.filter((n) => n.category === category) : notes;

  async function handleSave(payload) {
    try {
      if (editing) {
        await updateNote(editing.id, payload);
        flash('Note updated');
      } else {
        await createNote(payload);
        flash('Note added');
      }
      setEditing(undefined);
      setReloadKey((k) => k + 1);
    } catch (err) {
      flash('Save failed: ' + err.message);
    }
  }

  async function handleDelete() {
    try {
      await deleteNote(deleting.id);
      setDeleting(null);
      flash('Note deleted');
      setReloadKey((k) => k + 1);
    } catch (err) {
      flash('Delete failed: ' + err.message);
    }
  }

  return (
    <>
      <nav className="navbar navbar-dark app-navbar sticky-top">
        <div className="container">
          <span className="navbar-brand mb-0 h1">
            <i className="bi bi-journal-text me-2"></i>Personal Notes
          </span>
          <button className="btn btn-light btn-sm" onClick={() => setEditing(null)}>
            <i className="bi bi-plus-lg me-1"></i>New Note
          </button>
        </div>
      </nav>

      <main className="container py-4">
        <div className="row g-2 mb-4">
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input
                type="search"
                className="form-control"
                placeholder="Search by title, content or category..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4">
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="text-muted small mb-3">
          {visible.length} {visible.length === 1 ? 'note' : 'notes'}
        </div>

        {visible.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-inbox display-3"></i>
            <p className="mt-3 mb-0">No notes found. Click <strong>New Note</strong> to add one.</p>
          </div>
        ) : (
          <div className="row g-3">
            {visible.map((n) => (
              <NoteCard key={n.id} note={n} onEdit={setEditing} onDelete={setDeleting} />
            ))}
          </div>
        )}
      </main>

      {editing !== undefined && (
        <NoteModal
          key={editing ? editing.id : 'new'}
          note={editing}
          categories={categories}
          onClose={() => setEditing(undefined)}
          onSave={handleSave}
        />
      )}
      {deleting && (
        <DeleteModal note={deleting} onCancel={() => setDeleting(null)} onConfirm={handleDelete} />
      )}

      {message && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 2000 }}>
          <div className="toast show text-bg-dark border-0">
            <div className="toast-body">{message}</div>
          </div>
        </div>
      )}
    </>
  );
}