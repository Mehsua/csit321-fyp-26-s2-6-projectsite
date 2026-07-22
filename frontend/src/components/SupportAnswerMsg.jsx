export default function SupportAnswerMsg({ matched, question, answer, category, escalated, contactInfo, onEscalate }) {
  const bubble = {
    padding: '14px 16px',
    borderRadius: '18px 18px 18px 4px',
    fontSize: 14,
    lineHeight: 1.65,
    background: 'var(--surface)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-light)',
    maxWidth: '72%',
  };

  const escalateBtn = {
    marginTop: 12,
    fontSize: 13,
    padding: '7px 16px',
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--r-md)',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    boxShadow: '0 2px 6px rgba(232,96,44,0.28)',
  };

  const linkBtn = {
    fontSize: 13,
    color: 'var(--primary)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
  };

  if (matched) {
    return (
      <div style={bubble}>
        {category && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            {category}
          </div>
        )}
        <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', fontSize: 14 }}>{question}</div>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{answer}</div>
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
          {!escalated ? (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Still not resolved?{' '}
              <button style={linkBtn} onClick={onEscalate}>Contact support →</button>
            </span>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
              ✓ Request submitted. We'll reach you at: <span style={{ fontWeight: 400 }}>{contactInfo || 'support@foodbot.com'}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...bubble, borderLeft: '3px solid var(--amber)' }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.65 }}>
        I couldn&apos;t find a specific answer to your question. Would you like to contact our support team directly?
      </div>
      {!escalated ? (
        <button style={escalateBtn} onClick={onEscalate}>Contact Support</button>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
          ✓ Request submitted. We'll reach you at: <span style={{ fontWeight: 400 }}>{contactInfo || 'support@foodbot.com'}</span>
        </div>
      )}
    </div>
  );
}
