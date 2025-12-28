import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setToken, fetchUser } = useAuthStore();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      setToken(token);
      fetchUser().then(() => {
        navigate('/');
      });
    } else {
      navigate('/login?error=no_token');
    }
  }, [setToken, fetchUser, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#1e1e1e',
        color: '#fff',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #333',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p>Authenticating...</p>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}
