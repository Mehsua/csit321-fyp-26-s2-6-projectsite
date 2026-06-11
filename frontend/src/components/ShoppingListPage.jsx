import { useState } from 'react';

const CATEGORY_ICONS = {
  Produce: '🥬',
  Dairy: '🥛',
  Pantry: '🥫',
  Meat: '🥩',
  Seafood: '🐟',
  Other: '📦',
};

const CATEGORY_ORDER = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Other'];

export default function ShoppingListPage({ onBack, user, items, onClear }) {
  const [checked, setChecked] = useState({});
  const [clearing, setClearing] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');

  function toggleItem(key) {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleClear() {
    setClearing(true);
    await onClear();
    setChecked({});
    setClearing(false);
  }

  function exportList() {
    const byCategory = {};
    items.forEach(item => {
      const cat = item.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    });
    const lines = ['Shopping List', '─'.repeat(20)];
    CATEGORY_ORDER.forEach(cat => {
      if (!byCategory[cat]?.length) return;
      lines.push('', cat.toUpperCase());
      byCategory[cat].forEach(item => {
        const qty = item.quantity && item.unit ? ` — ${item.quantity} ${item.unit}` : '';
        lines.push(`[ ] ${item.name}${qty}`);
      });
    });
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => { setCopyMsg('Copied!'); setTimeout(() => setCopyMsg(''), 2000); })
      .catch(() => setCopyMsg('Copy failed'));
  }

  const byCategory = {};
  items.forEach(item => {
    const cat = item.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });
  const orderedCategories = CATEGORY_ORDER.filter(c => byCategory[c]?.length);

  const totalItems = items.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const topbar = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', height: 48, borderBottom: '1px solid #e5e5e5',
    flexShrink: 0, background: '#fff',
  };
  const btn = { padding: '5px 12px', border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#555' };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'hidden', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 14, color: '#1a1a1a' }}>
      {/* Topbar */}
      <div style={topbar}>
        <button onClick={onBack} style={btn}>← Back</button>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Shopping List</span>
        <button onClick={exportList} style={btn}>{copyMsg || 'Export ↓'}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 80px' }}>
        {/* Guest banner */}
        {!user && (
          <div style={{ background: '#fffbe6', border: '1px solid #e0c060', borderRadius: 4, padding: '7px 10px', fontSize: 12, color: '#806000', marginBottom: 10 }}>
            ℹ Guest: this list is session-only and will be cleared when your session ends.
          </div>
        )}

        {totalItems === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', marginTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
            <div style={{ fontSize: 14 }}>No items yet.</div>
            <div style={{ fontSize: 13, marginTop: 4, color: '#aaa' }}>Open a recipe and click "Add to Shopping List".</div>
          </div>
        ) : (
          <>
            {/* Summary + Clear */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#555' }}>
                {totalItems} item{totalItems !== 1 ? 's' : ''} &nbsp;|&nbsp; {checkedCount} checked
              </div>
              <button
                onClick={handleClear}
                disabled={clearing}
                style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #dc2626', borderRadius: 6, background: '#fff', color: '#dc2626', cursor: clearing ? 'not-allowed' : 'pointer' }}
              >
                {clearing ? 'Clearing…' : 'Clear All'}
              </button>
            </div>

            {/* Categorised items */}
            {orderedCategories.map(cat => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#e8e8e8', padding: '5px 8px', border: '1px solid #ccc' }}>
                  {CATEGORY_ICONS[cat] || '📦'} {cat}
                </div>
                {byCategory[cat].map(item => {
                  const key = item.item_id || item.ingredient_id;
                  const isChecked = !!checked[key];
                  return (
                    <div
                      key={key}
                      data-testid={`shopping-item-${key}`}
                      onClick={() => toggleItem(key)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', border: '1px solid #ddd', borderTop: 'none', cursor: 'pointer', background: isChecked ? '#fafafa' : '#fff' }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isChecked ? '#16a34a' : '#ccc'}`, background: isChecked ? '#16a34a' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isChecked && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, fontSize: 13, textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? '#aaa' : '#1a1a1a' }}>
                        {item.name}
                        {item.quantity && item.unit && (
                          <span style={{ color: '#888', fontSize: 12 }}> — {item.quantity} {item.unit}</span>
                        )}
                      </div>
                      {item.recipe_name && (
                        <span style={{ fontSize: 11, color: isChecked ? '#ccc' : '#777', flexShrink: 0 }}>{item.recipe_name}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Export button */}
            <div style={{ marginTop: 10 }}>
              <button
                onClick={exportList}
                style={{ width: '100%', padding: 11, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
              >
                {copyMsg || '↓ Export / Copy Checklist'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
