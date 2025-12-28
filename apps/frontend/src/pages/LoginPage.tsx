import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, error, isLoading } = useAuthStore();
  const urlParams = new URLSearchParams(window.location.search);
  const errorParam = urlParams.get('error');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#1e1e1e',
        color: '#fff',
      }}
    >
      <div
        style={{
          background: '#2d2d2d',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>Plant Editor</h1>
        <p style={{ color: '#888', marginBottom: '24px' }}>
          Collaborative PlantUML Editor
        </p>

        {(errorParam || error) && (
          <div
            style={{
              background: '#f44336',
              color: '#fff',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
          >
            {errorParam === 'unauthorized'
              ? 'Your email is not authorized. Please contact an administrator.'
              : error || 'An error occurred'}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 24px',
            fontSize: '16px',
            background: '#fff',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          {isLoading ? 'Loading...' : 'Sign in with Google'}
        </button>

        <p style={{ color: '#666', fontSize: '12px', marginTop: '24px' }}>
          Only authorized emails can access this application.
        </p>
      </div>
    </div>
  );
}
