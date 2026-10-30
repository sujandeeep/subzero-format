import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface UuidBadgeProps {
  uuid?: string | null;
  label?: string;
  className?: string;
}

export const UuidBadge: React.FC<UuidBadgeProps> = ({ uuid, label, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!uuid || uuid === '—' || uuid === 'None' || uuid === 'Not provided') {
    return <span style={{ color: '#64748b', fontSize: '12px' }}>—</span>;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className={className}
        onClick={handleToggle}
        title={`Click to reveal ID: ${uuid}`}
        aria-label={`Reveal ID: ${uuid}`}
        aria-expanded={false}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.32)',
          color: '#38bdf8',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '11.5px',
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: '5px',
          cursor: 'pointer',
          lineHeight: 1.35,
          verticalAlign: 'middle',
          minHeight: '22px',
          width: 'fit-content',
        }}
      >
        <span style={{ fontWeight: 800, fontSize: '13px', lineHeight: 1 }}>#</span>
        {label && <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{label}</span>}
      </button>
    );
  }

  return (
    <div
      className={className}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: '#090e17',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '6px',
        padding: '3px 6px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        verticalAlign: 'middle',
        flexWrap: 'wrap',
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        title="Click to hide ID under #"
        aria-label="Hide ID"
        aria-expanded={true}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          color: '#38bdf8',
          fontFamily: 'ui-monospace, monospace',
          fontWeight: 800,
          fontSize: '11.5px',
          padding: '2px 5px',
          borderRadius: '4px',
          cursor: 'pointer',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <span>#</span>
      </button>
      <span
        title={uuid}
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '11.5px',
          color: '#38bdf8',
          userSelect: 'all',
          wordBreak: 'break-all',
          lineHeight: 1.3,
        }}
      >
        {uuid}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? 'Copied to clipboard!' : 'Copy UUID'}
        aria-label="Copy UUID"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          background: copied ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
          border: copied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #334155',
          color: copied ? '#34d399' : '#94a3b8',
          padding: '2px 6px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '10px',
          fontWeight: 600,
          flexShrink: 0,
          lineHeight: 1.2,
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  );
};

export default UuidBadge;
