import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, membersApi, type ApiKey } from '../store/authStore';

export function MyApiKeysPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, [token]);

  const loadApiKeys = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const keys = await membersApi.getMyApiKeys(token);
      setApiKeys(keys);
      setError(null);
    } catch (err) {
      setError('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!token) return;
    setActionLoading('create');
    try {
      const result = await membersApi.createMyApiKey(token, newKeyName || undefined);
      setNewlyCreatedKey(result.key);
      setNewKeyName('');
      await loadApiKeys();
    } catch (err) {
      setError('Failed to create API key');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this API key?')) return;

    setActionLoading(`delete-${keyId}`);
    try {
      await membersApi.deleteMyApiKey(token, keyId);
      await loadApiKeys();
    } catch (err) {
      setError('Failed to delete API key');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1e1e1e', color: '#fff' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: '#252526',
          borderBottom: '1px solid #333',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: '20px' }}>My API Keys</h1>
        </div>
        <div style={{ color: '#888' }}>{user?.email}</div>
      </header>

      <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto' }}>
        {/* Info Box */}
        <div
          style={{
            background: '#2d2d2d',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#888',
          }}
        >
          <p style={{ margin: '0 0 8px 0' }}>
            Use API keys to authenticate with the Plant Editor API from Claude Code or other tools.
          </p>
          <p style={{ margin: 0 }}>
            Add the key to your skill file as <code style={{ color: '#4fc3f7' }}>X-API-Key</code> header.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: '#f44336',
              color: '#fff',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
            }}
          >
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                float: 'right',
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Newly Created Key Alert */}
        {newlyCreatedKey && (
          <div
            style={{
              background: '#2e7d32',
              padding: '16px',
              borderRadius: '4px',
              marginBottom: '16px',
            }}
          >
            <div style={{ marginBottom: '8px', fontWeight: 500 }}>
              API Key Created - Copy it now, it won't be shown again!
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1e1e1e',
                padding: '12px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '13px',
              }}
            >
              <code style={{ flex: 1, wordBreak: 'break-all' }}>{newlyCreatedKey}</code>
              <button
                onClick={() => copyToClipboard(newlyCreatedKey)}
                style={{
                  padding: '6px 16px',
                  fontSize: '12px',
                  background: copiedKey ? '#4caf50' : '#0078d4',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {copiedKey ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Create New Key */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., MacBook Pro, Work PC)..."
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '14px',
              background: '#2d2d2d',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
            }}
          />
          <button
            onClick={handleCreateApiKey}
            disabled={actionLoading === 'create'}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              background: '#0078d4',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: actionLoading === 'create' ? 'not-allowed' : 'pointer',
              opacity: actionLoading === 'create' ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {actionLoading === 'create' ? 'Creating...' : 'Create API Key'}
          </button>
        </div>

        {/* Existing Keys */}
        <h2 style={{ fontSize: '16px', marginBottom: '12px', color: '#888' }}>
          Your API Keys
        </h2>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            Loading...
          </div>
        ) : apiKeys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            No API keys yet. Create one to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {apiKeys.map((key) => (
              <div
                key={key.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: '#2d2d2d',
                  borderRadius: '4px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{key.name}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt && (
                      <> • Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      marginTop: '4px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 8)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteApiKey(key.id)}
                  disabled={actionLoading === `delete-${key.id}`}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    background: '#f44336',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: actionLoading === `delete-${key.id}` ? 'not-allowed' : 'pointer',
                    opacity: actionLoading === `delete-${key.id}` ? 0.6 : 1,
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
