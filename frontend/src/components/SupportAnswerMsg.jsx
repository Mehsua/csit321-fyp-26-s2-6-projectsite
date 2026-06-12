export default function SupportAnswerMsg({ matched, question, answer, category, escalated, contactInfo, onEscalate }) {
  const faqStyle = {
    padding: '12px 16px',
    background: '#f0f7ff',
    borderRadius: 12,
    border: '1px solid #cce4ff',
    fontSize: 14,
    lineHeight: 1.5,
  };
  const noMatchStyle = {
    padding: '12px 16px',
    background: '#fff9e6',
    borderRadius: 12,
    border: '1px solid #ffe082',
    fontSize: 14,
  };
  const escalateBtn = {
    marginTop: 10,
    fontSize: 13,
    padding: '6px 14px',
    background: '#f57c00',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  };
  const linkBtn = {
    fontSize: 13,
    color: '#0070f3',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  };
  const confirmedStyle = { marginTop: 8, fontSize: 13, color: '#388e3c' };

  if (matched) {
    return (
      <div style={faqStyle}>
        {category && (
          <div style={{ fontSize: 11, color: '#666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            {category}
          </div>
        )}
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{question}</div>
        <div style={{ color: '#333' }}>{answer}</div>
        <div style={{ marginTop: 12 }}>
          {!escalated ? (
            <>
              <span style={{ color: '#666', fontSize: 13 }}>Still not resolved? </span>
              <button style={linkBtn} onClick={onEscalate}>Contact support →</button>
            </>
          ) : (
            <div style={confirmedStyle}>✓ Request submitted. Contact: {contactInfo}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={noMatchStyle}>
      <div style={{ color: '#333', marginBottom: 10 }}>
        I couldn&apos;t find a specific answer to your question. Would you like to contact our support team?
      </div>
      {!escalated ? (
        <button style={escalateBtn} onClick={onEscalate}>Contact Support</button>
      ) : (
        <div style={confirmedStyle}>✓ Request submitted. Contact: {contactInfo}</div>
      )}
    </div>
  );
}
