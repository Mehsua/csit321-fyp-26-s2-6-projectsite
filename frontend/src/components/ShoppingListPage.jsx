import { useState } from 'react';

const CATEGORY_ICONS = {
  Produce: '🥬',
  Dairy:   '🥛',
  Pantry:  '🥫',
  Meat:    '🥩',
  Seafood: '🐟',
  Other:   '📦',
};

const CATEGORY_ORDER = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Other'];

const CATEGORY_COLORS = {
  Produce: '#15803D',
  Dairy:   '#2563EB',
  Pantry:  '#D97706',
  Meat:    '#DC2626',
  Seafood: '#0891B2',
  Other:   '#6B5838',
};

export default function ShoppingListPage({ onBack, user, items, onClear }) {
  const [checked, setChecked]     = useState({});
  const [clearing, setClearing]   = useState(false);
  const [copyMsg, setCopyMsg]     = useState('');

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
    const lines = ['Shopping List', '─'.repeat(24)];
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
  const totalItems  = items.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'hidden', fontFamily: 'var(--font-body)', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 54, borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}>
        <button className="btn-outline" onClick={onBack} style={{ padding: '6px 13px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🛒</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Shopping List</span>
        </div>
        <button className="btn-outline" onClick={exportList} style={{ padding: '6px 13px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
          {copyMsg || '↓ Export'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 80px' }}>
        {/* Guest banner */}
        {!user && (
          <div style={{ background: 'var(--amber-light)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 'var(--r-md)', padding: '8px 12px', fontSize: 12, color: 'var(--amber)', marginBottom: 14, fontWeight: 500 }}>
            ℹ Guest: this list is session-only and will be cleared when your session ends.
          </div>
        )}

        {totalItems === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🛒</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Your list is empty</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Open a recipe and click "Add to Shopping List".</div>
          </div>
        ) : (
          <>
            {/* Progress + clear */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {checkedCount} of {totalItems} items checked
                </div>
                <div style={{ marginTop: 6, height: 4, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', width: 160 }}>
                  <div style={{ height: '100%', borderRadius: 3, background: 'var(--primary)', width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
              <button
                onClick={handleClear}
                disabled={clearing}
                style={{ fontSize: 12, padding: '6px 12px', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 'var(--r-md)', background: 'var(--red-light)', color: 'var(--red)', cursor: clearing ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)' }}
              >
                {clearing ? 'Clearing…' : 'Clear All'}
              </button>
            </div>

            {/* Categorised items */}
            {orderedCategories.map(cat => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', marginBottom: 2, background: 'var(--bg-secondary)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-light)' }}>
                  <span>{CATEGORY_ICONS[cat] || '📦'}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: CATEGORY_COLORS[cat] || 'var(--text-muted)' }}>{cat}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', background: 'var(--border)', borderRadius: 'var(--r-full)', padding: '1px 7px' }}>{byCategory[cat].length}</span>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                  {byCategory[cat].map((item, idx) => {
                    const key = item.item_id || item.ingredient_id;
                    const isChecked = !!checked[key];
                    return (
                      <div
                        key={key}
                        data-testid={`shopping-item-${key}`}
                        onClick={() => toggleItem(key)}
                        className="list-item"
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: idx < byCategory[cat].length - 1 ? '1px solid var(--border-light)' : 'none', background: isChecked ? 'var(--bg-secondary)' : 'var(--surface)' }}
                      >
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}`, background: isChecked ? 'var(--primary)' : 'var(--surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}>
                          {isChecked && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, fontSize: 13, textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)', transition: 'color 0.15s ease' }}>
                          {item.name}
                          {item.quantity && item.unit && (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> — {item.quantity} {item.unit}</span>
                          )}
                        </div>
                        {item.recipe_name && (
                          <span style={{ fontSize: 11, color: isChecked ? 'var(--border)' : 'var(--text-muted)', flexShrink: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.recipe_name}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Export CTA */}
            <button
              onClick={exportList}
              style={{ width: '100%', padding: 12, background: 'var(--text-primary)', color: '#fff', border: 'none', borderRadius: 'var(--r-lg)', fontSize: 13, cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)', marginTop: 4, letterSpacing: '0.01em' }}
            >
              {copyMsg || '↓ Copy Checklist to Clipboard'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
