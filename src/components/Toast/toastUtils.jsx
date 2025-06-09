import toast from 'react-hot-toast';
import { baseToastStyle, toastButtonStyle, progressBarStyle,confirmToastStyle,cancelToastBtn,confirmToastBtn} from './toastStyles'; 
// Custom toast with progress bar animation
const createCustomToast = (message, type = 'default', title = null, duration = 4000) => {
  const toastId = toast.custom((t) => (
    <div
      className={`toast-container ${t.visible ? 'toast-enter' : 'toast-exit'}`}
      style={baseToastStyle}
    >
      {/* Close button */}
      <button
        onClick={() => toast.dismiss(t.id)}
        style={toastButtonStyle}
      >
        ×
      </button>

      {/* Toast content */}
      <div style={{ paddingRight: 'var(--spacing-6)' }}>
        {title && (
          <div style={{
            fontWeight: '600',
            marginBottom: 'var(--spacing-1)',
            color: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : 'var(--card-foreground)'
          }}>
            {title}
          </div>
        )}
        <div style={{ color: 'var(--muted-foreground)' }}>
          {message}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          className="toast-progress"
          style={{
            height: '100%',
            background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : 'var(--primary)',
            animation: `toastProgress ${duration}ms linear forwards`,
            transformOrigin: 'left',
          }}
        />
      </div>
    </div>
  ), {
    duration: duration,
  });

  return toastId;
};

// Convenient wrapper functions
export const showSuccessToast = (message, title = 'Success') => {
  return createCustomToast(message, 'success', title);
};

export const showErrorToast = (message, title = 'Error') => {
  return createCustomToast(message, 'error', title);
};

export const showInfoToast = (message, title = 'Info') => {
  return createCustomToast(message, 'info', title);
};

export const showNotificationToast = (message, title = 'Notification') => {
  return createCustomToast(message, 'info', title, 6000);
};


// Custom confirm toast that returns a promise
export const showConfirmToast = (message, title = 'Confirm') => {
  return new Promise((resolve) => {
    const toastId = toast.custom((t) => (
      <div
        className={`toast-container ${t.visible ? 'toast-enter' : 'toast-exit'}`}
        style={confirmToastStyle}
      >
        <div>
          <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-1)' }}>
            {title}
          </div>
          <div style={{ color: 'var(--muted-foreground)' }}>
            {message}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(false);
            }}
            style={cancelToastBtn}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              resolve(true);
            }}
            style={confirmToastBtn}
          >
            OK
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
    });
  });
};