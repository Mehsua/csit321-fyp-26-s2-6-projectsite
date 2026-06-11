import { useState } from 'react';

const S = {
  tagFilled: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 12,
    background: '#16a34a',
    color: '#fff',
    fontSize: 12,
    fontWeight: 500,
    marginRight: 4,
    marginBottom: 4,
  },
  confirmBubble: {
    maxWidth: '70%',
    padding: '10px 14px',
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 1.6,
    background: '#f4f4f4',
    color: '#1a1a1a',
  },
  btnConfirm: {
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    background: '#16a34a',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
  btnEdit: {
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid #e5e5e5',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    color: '#555',
  },
  editInput: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 8,
  },
};

export default function IngredientConfirmMsg({ ingredients, onConfirm, confirmed }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(ingredients.join(', '));

  if (confirmed) {
    return (
      <div style={S.confirmBubble}>
        <div>Got it! I identified these ingredients:</div>
        <div style={{ marginTop: 8 }}>
          {ingredients.map(i => <span key={i} style={S.tagFilled}>{i}</span>)}
        </div>
        <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>✓ Confirmed</div>
      </div>
    );
  }

  if (editing) {
    const handleSubmit = () => {
      const parsed = editText.split(',').map(s => s.trim()).filter(Boolean);
      if (parsed.length > 0) onConfirm(parsed);
    };
    return (
      <div style={S.confirmBubble}>
        <div style={{ marginBottom: 8 }}>Edit your ingredient list:</div>
        <input
          style={S.editInput}
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btnConfirm} onClick={handleSubmit}>Find recipes</button>
          <button style={S.btnEdit} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={S.confirmBubble}>
        <div>Got it! I identified these ingredients:</div>
        <div style={{ marginTop: 8 }}>
          {ingredients.map(i => <span key={i} style={S.tagFilled}>{i}</span>)}
        </div>
        <div style={{ marginTop: 8 }}>Is this correct?</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button style={S.btnConfirm} onClick={() => onConfirm(ingredients)}>
          ✓ Yes, find recipes
        </button>
        <button style={S.btnEdit} onClick={() => setEditing(true)}>
          ✏ Edit list
        </button>
      </div>
    </div>
  );
}
