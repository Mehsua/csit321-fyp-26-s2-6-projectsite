import { useState } from 'react';

const S = {
  bubble: {
    maxWidth: '72%',
    padding: '13px 16px',
    borderRadius: '18px 18px 18px 4px',
    fontSize: 14,
    lineHeight: 1.65,
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-light)',
  },
  tag: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 'var(--r-full)',
    background: 'var(--primary-light)',
    color: 'var(--primary)',
    fontSize: 12,
    fontWeight: 600,
    marginRight: 5,
    marginBottom: 5,
    border: '1px solid rgba(232,96,44,0.2)',
  },
  btnConfirm: {
    padding: '7px 16px',
    borderRadius: 'var(--r-md)',
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    boxShadow: '0 2px 6px rgba(232,96,44,0.28)',
  },
  btnEdit: {
    padding: '7px 14px',
    borderRadius: 'var(--r-md)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
  },
  editInput: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 'var(--r-md)',
    border: '1.5px solid var(--border)',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 10,
    background: 'var(--bg)',
    color: 'var(--text-primary)',
  },
};

export default function IngredientConfirmMsg({ ingredients, onConfirm, confirmed }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(ingredients.join(', '));
  const [submitting, setSubmitting] = useState(false);

  if (confirmed) {
    return (
      <div style={S.bubble}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Identified ingredients</div>
        <div style={{ marginBottom: 8 }}>
          {ingredients.map(i => <span key={i} style={S.tag}>{i}</span>)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ Confirmed — finding recipes…</div>
      </div>
    );
  }

  if (editing) {
    const handleSubmit = () => {
      const parsed = editText.split(',').map(s => s.trim()).filter(Boolean);
      if (parsed.length > 0) { setSubmitting(true); onConfirm(parsed); }
    };
    return (
      <div style={S.bubble}>
        <div style={{ fontSize: 13, marginBottom: 10, color: 'var(--text-secondary)' }}>Edit your ingredient list (comma-separated):</div>
        <input
          className="form-input"
          style={S.editInput}
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ ...S.btnConfirm, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Finding…' : '🔍 Find recipes'}
          </button>
          <button className="btn-outline" style={S.btnEdit} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={S.bubble}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>I identified these ingredients — is this right?</div>
        <div style={{ marginBottom: 12 }}>
          {ingredients.map(i => <span key={i} style={S.tag}>{i}</span>)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ ...S.btnConfirm, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            disabled={submitting}
            onClick={() => { setSubmitting(true); onConfirm(ingredients); }}
          >
            {submitting ? 'Finding…' : '✓ Yes, find recipes'}
          </button>
          <button className="btn-outline" style={S.btnEdit} onClick={() => setEditing(true)}>
            ✏ Edit list
          </button>
        </div>
      </div>
    </div>
  );
}
