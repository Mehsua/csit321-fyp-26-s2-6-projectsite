import { useState } from 'react';

const S = {
  page: { display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' },
  topbar: { display: 'flex', alignItems: 'center', padding: '0 16px', height: 48, borderBottom: '1px solid #e5e5e5', gap: 12, flexShrink: 0 },
  backBtn: { background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13, color: '#555' },
  title: { fontWeight: 600, fontSize: 15 },
  badge: { marginLeft: 'auto', background: '#f3f4f6', borderRadius: 12, padding: '2px 10px', fontSize: 12, color: '#555' },
  tabs: { display: 'flex', borderBottom: '1px solid #e5e5e5', background: '#fafafa', flexShrink: 0 },
  tab: (active) => ({
    flex: 1, padding: '10px 0', textAlign: 'center', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? '#16a34a' : '#666', borderBottom: active ? '2px solid #16a34a' : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none', borderBottomWidth: 2,
    borderBottomStyle: 'solid', borderBottomColor: active ? '#16a34a' : 'transparent',
  }),
  content: { flex: 1, overflowY: 'auto', padding: '12px 14px 80px' },
  dayLabel: { fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 },
  card: { border: '1px solid #e5e5e5', borderRadius: 8, padding: '10px 12px', marginBottom: 10, background: '#fafafa' },
  cardRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 13, fontWeight: 600 },
  cardMeta: { fontSize: 11, color: '#777', marginTop: 3 },
  perishWarn: { color: '#e07000' },
  removeBtn: { background: 'none', border: '1px solid #dc2626', borderRadius: 4, color: '#dc2626', fontSize: 11, padding: '2px 8px', cursor: 'pointer' },
  emptySlot: { border: '1px dashed #d1d5db', borderRadius: 8, padding: 16, textAlign: 'center', color: '#bbb', fontSize: 11, marginBottom: 10 },
  divider: { height: 1, background: '#e5e5e5', margin: '12px 0' },
  sectionHead: { fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 },
  nutGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: '6px 0' },
  nutCard: { background: '#f3f4f6', borderRadius: 6, padding: 8, textAlign: 'center' },
  nutNum: { fontSize: 14, fontWeight: 700 },
  nutLabel: { fontSize: 10, color: '#888' },
  perishBanner: { marginTop: 12, padding: 8, background: '#fffbe6', border: '1px solid #e0c060', fontSize: 11, color: '#806000', borderRadius: 6 },
  listBtn: { display: 'block', width: '100%', marginTop: 12, padding: '10px 0', textAlign: 'center', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  emptyState: { textAlign: 'center', padding: '40px 20px', color: '#888' },
  genBtn: { display: 'block', width: '100%', padding: '10px 0', marginTop: 16, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};

export default function MealPlanPage({ plan, onBack, onRemoveItem, onGeneratePlan, onAddToShoppingList, loading }) {
  const [activeDay, setActiveDay] = useState(1);

  const numDays = plan?.number_of_days || 3;
  const dayData = plan?.days?.find(d => d.day_number === activeDay);
  const allPerishables = plan?.days?.flatMap(d =>
    d.items.flatMap(item =>
      (item.perishable_warnings || []).map(w => `${w} (Day ${d.day_number})`)
    )
  ) || [];

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <button style={S.backBtn} onClick={onBack}>← Back</button>
        <span style={S.title}>Meal Plan</span>
        <span style={S.badge}>{numDays}-Day Plan</span>
      </div>

      <div style={S.tabs}>
        {Array.from({ length: numDays }, (_, i) => i + 1).map(d => (
          <button key={d} style={S.tab(activeDay === d)} onClick={() => setActiveDay(d)}>
            Day {d}
          </button>
        ))}
      </div>

      <div style={S.content}>
        {!plan && !loading && (
          <div style={S.emptyState}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No meal plan yet</div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>Generate a plan from your current ingredient session.</div>
            <button style={S.genBtn} onClick={onGeneratePlan} disabled={loading}>
              {loading ? 'Generating…' : '✨ Generate 3-Day Meal Plan'}
            </button>
          </div>
        )}

        {loading && (
          <div style={S.emptyState}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
            <div>Generating your meal plan…</div>
          </div>
        )}

        {plan && !loading && (
          <>
            <div style={S.dayLabel}>Day {activeDay} — Recipes</div>

            {(dayData?.items || []).map(item => (
              <div key={item.item_id} style={S.card}>
                <div style={S.cardRow}>
                  <div style={S.cardName}>{item.name}</div>
                  <button style={S.removeBtn} onClick={() => onRemoveItem(item.item_id)}>✕</button>
                </div>
                <div style={S.cardMeta}>
                  🕐 {item.cooking_time} min
                  {item.nutrition?.calories && <> &nbsp;|&nbsp; {item.nutrition.calories} kcal</>}
                  {(item.perishable_warnings || []).length > 0 && (
                    <span style={S.perishWarn}> &nbsp;|&nbsp; ⚠ perishable: {item.perishable_warnings.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}

            {(dayData?.items || []).length === 0 && (
              <div style={S.emptySlot}>+ No recipes assigned to Day {activeDay}</div>
            )}

            {dayData?.nutrition_summary && (
              <>
                <div style={S.divider} />
                <div style={S.sectionHead}>Day {activeDay} Nutrition Summary</div>
                <div style={S.nutGrid}>
                  <div style={S.nutCard}><div style={S.nutNum}>{Math.round(dayData.nutrition_summary.calories)}</div><div style={S.nutLabel}>kcal</div></div>
                  <div style={S.nutCard}><div style={S.nutNum}>{Math.round(dayData.nutrition_summary.protein_g)}g</div><div style={S.nutLabel}>protein</div></div>
                  <div style={S.nutCard}><div style={S.nutNum}>{Math.round(dayData.nutrition_summary.carbs_g)}g</div><div style={S.nutLabel}>carbs</div></div>
                  <div style={S.nutCard}><div style={S.nutNum}>{Math.round(dayData.nutrition_summary.fats_g)}g</div><div style={S.nutLabel}>fats</div></div>
                </div>
              </>
            )}

            {allPerishables.length > 0 && activeDay === 1 && (
              <div style={S.perishBanner}>
                ⚠ Perishable ingredients detected: <strong>{allPerishables.join(', ')}</strong>. Consider using them first.
              </div>
            )}

            <button style={S.listBtn} onClick={onAddToShoppingList}>
              🛒 Generate Shopping List for {numDays}-Day Plan
            </button>
          </>
        )}
      </div>
    </div>
  );
}
