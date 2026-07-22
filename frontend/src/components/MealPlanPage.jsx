import { useState } from 'react';

export default function MealPlanPage({ plan, onBack, onRemoveItem, onGeneratePlan, onAddToShoppingList, loading }) {
  const [activeDay, setActiveDay] = useState(1);

  const numDays   = plan?.number_of_days || 3;
  const dayData   = plan?.days?.find(d => d.day_number === activeDay);
  const allPerishables = plan?.days?.flatMap(d =>
    d.items.flatMap(item =>
      (item.perishable_warnings || []).map(w => `${w} (Day ${d.day_number})`)
    )
  ) || [];

  const topbarBtn = {
    padding: '6px 13px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
    background: 'var(--surface)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)', fontWeight: 500,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 54, borderBottom: '1px solid var(--border)', gap: 12, flexShrink: 0, background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}>
        <button className="btn-outline" style={topbarBtn} onClick={onBack}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📅</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Meal Plan</span>
        </div>
        <span style={{ marginLeft: 'auto', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--r-full)', padding: '3px 12px', fontSize: 12, fontWeight: 600, border: '1px solid rgba(232,96,44,0.2)' }}>
          {numDays}-Day Plan
        </span>
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        {Array.from({ length: numDays }, (_, i) => i + 1).map(d => {
          const isActive = activeDay === d;
          return (
            <button
              key={d}
              className="day-tab"
              onClick={() => setActiveDay(d)}
              style={{
                flex: 1, padding: '11px 0', textAlign: 'center', fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                background: isActive ? 'var(--primary-light)' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s ease',
              }}
            >
              Day {d}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 80px' }}>
        {/* Empty / loading states */}
        {!plan && !loading && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>📅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>No meal plan yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.65 }}>Generate a personalised 3-day meal plan from your current ingredient session.</div>
            <button
              className="btn-primary"
              onClick={onGeneratePlan}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r-lg)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', boxShadow: '0 3px 10px rgba(232,96,44,0.30)' }}
            >
              ✨ Generate 3-Day Meal Plan
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Generating your meal plan…</div>
          </div>
        )}

        {plan && !loading && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Day {activeDay} — Recipes</div>

            {(dayData?.items || []).map(item => (
              <div key={item.item_id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '12px 14px', marginBottom: 10, boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', flex: 1, marginRight: 10 }}>{item.name}</div>
                  <button
                    onClick={() => onRemoveItem(item.item_id)}
                    style={{ fontSize: 11, padding: '3px 9px', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 'var(--r-sm)', background: 'var(--red-light)', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, flexShrink: 0 }}
                  >
                    ✕ Remove
                  </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>🕐 {item.cooking_time} min</span>
                  {item.nutrition?.calories && <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{item.nutrition.calories} kcal</span>}
                  {(item.perishable_warnings || []).length > 0 && (
                    <span style={{ color: 'var(--amber)', fontWeight: 500 }}>⚠ perishable: {item.perishable_warnings.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}

            {(dayData?.items || []).length === 0 && (
              <div style={{ border: '1.5px dashed var(--border)', borderRadius: 'var(--r-lg)', padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>
                + No recipes assigned to Day {activeDay}
              </div>
            )}

            {/* Nutrition summary */}
            {dayData?.nutrition_summary && (
              <>
                <div style={{ height: 1, background: 'var(--border-light)', margin: '14px 0 12px' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Day {activeDay} Nutrition</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    ['kcal',    Math.round(dayData.nutrition_summary.calories),  'var(--primary)'],
                    ['protein', Math.round(dayData.nutrition_summary.protein_g) + 'g', 'var(--green)'],
                    ['carbs',   Math.round(dayData.nutrition_summary.carbs_g) + 'g',   'var(--amber)'],
                    ['fats',    Math.round(dayData.nutrition_summary.fats_g) + 'g',    'var(--blue)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 8px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Perishable banner */}
            {allPerishables.length > 0 && activeDay === 1 && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--amber-light)', border: '1px solid rgba(217,119,6,0.25)', fontSize: 12, color: 'var(--amber)', borderRadius: 'var(--r-md)', fontWeight: 500 }}>
                ⚠ Perishable ingredients: <strong>{allPerishables.join(', ')}</strong>. Consider using these first.
              </div>
            )}

            {/* Shopping list CTA */}
            <button
              style={{ display: 'block', width: '100%', marginTop: 16, padding: '11px 0', textAlign: 'center', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r-lg)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', boxShadow: '0 3px 10px rgba(232,96,44,0.28)' }}
              className="btn-primary"
              onClick={onAddToShoppingList}
            >
              🛒 Generate Shopping List for {numDays}-Day Plan
            </button>
          </>
        )}
      </div>
    </div>
  );
}
