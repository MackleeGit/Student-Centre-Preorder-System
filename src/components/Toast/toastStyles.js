export const baseToastStyle = {
  background: 'var(--card)',
  color: 'var(--card-foreground)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-lg)',
  padding: 'var(--spacing-4)',
  fontSize: '0.875rem',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
  maxWidth: '420px',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-2)',
};

export const toastButtonStyle = {
  position: 'absolute',
  top: 'var(--spacing-2)',
  right: 'var(--spacing-2)',
  background: 'transparent',
  border: 'none',
  color: 'var(--muted-foreground)',
  cursor: 'pointer',
  fontSize: '1rem',
  padding: '2px',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}



export const progressBarStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '3px',
  background: 'var(--border)',
  overflow: 'hidden',
}


export const confirmToastStyle = {
  ...baseToastStyle,
  background: 'var(--card)',
  color: 'var(--card-foreground)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-lg)',
  padding: 'var(--spacing-4)',
  fontSize: '0.875rem',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
  maxWidth: '420px',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-3)',
}

export const cancelToastBtn = {
  padding: 'var(--spacing-2) var(--spacing-3)',
  background: 'var(primary)',
  color: 'var(--secondary-foreground)',
  border: 'none',
  borderRadius: 'var(--radius)',
  fontSize: '0.75rem',
  cursor: 'pointer',
}

export const confirmToastBtn = {
  padding: 'var(--spacing-2) var(--spacing-3)',
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
  border: 'none',
  borderRadius: 'var(--radius)',
  fontSize: '0.75rem',
  cursor: 'pointer',
}