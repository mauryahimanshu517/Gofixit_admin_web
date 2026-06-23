import React from 'react';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'outline' | 'danger';
    loading?: boolean;
  }
> = ({ variant = 'primary', loading, children, style, disabled, ...rest }) => {
  const bg =
    variant === 'primary' ? 'var(--primary)' : variant === 'danger' ? 'var(--danger)' : 'transparent';
  const fg = variant === 'outline' ? 'var(--primary)' : '#fff';
  const border = variant === 'outline' ? '1.5px solid var(--primary)' : 'none';
  return (
    <button
      {...rest}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      style={{
        background: bg,
        color: fg,
        border,
        borderRadius: 10,
        padding: '8px 16px',
        fontWeight: 600,
        fontSize: 13,
        minHeight: 36,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const StatCard: React.FC<{ label: string; value: React.ReactNode; delta?: string }> = ({
  label,
  value,
  delta,
}) => (
  <Card>
    <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: 'var(--primary)' }}>{value}</div>
    {delta && <div style={{ color: 'var(--success)', fontSize: 12, marginTop: 4 }}>{delta}</div>}
  </Card>
);

export const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
> = ({ label, error, id, ...rest }) => {
  const inputId = id ?? `in-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        {...rest}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 10,
          fontSize: 15,
          background: 'var(--surface)',
        }}
      />
      {error && (
        <div role="alert" style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
};
