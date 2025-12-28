import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, membersApi, type Member, type ApiKey } from '../store/authStore';

export function MembersPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // API Keys state
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKey[]>>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [token]);

  const loadMembers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await membersApi.getAll(token);
      setMembers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const loadApiKeys = async (memberId: string) => {
    if (!token) return;
    try {
      const keys = await membersApi.getApiKeys(token, memberId);
      setApiKeys(prev => ({ ...prev, [memberId]: keys }));
    } catch (err) {
      setError('Failed to load API keys');
    }
  };

  const handleToggleMember = async (memberId: string) => {
    if (expandedMember === memberId) {
      setExpandedMember(null);
      setNewlyCreatedKey(null);
    } else {
      setExpandedMember(memberId);
      setNewlyCreatedKey(null);
      await loadApiKeys(memberId);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newEmail.trim()) return;

    setActionLoading('add');
    try {
      await membersApi.create(token, newEmail.toLowerCase().trim());
      setNewEmail('');
      await loadMembers();
    } catch (err) {
      setError('Failed to add member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (member: Member) => {
    if (!token) return;
    setActionLoading(member.id);
    try {
      await membersApi.update(token, member.id, { isActive: !member.isActive });
      await loadMembers();
    } catch (err) {
      setError('Failed to update member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (member: Member) => {
    if (!token) return;
    setActionLoading(member.id);
    try {
      const newRole = member.role === 'admin' ? 'user' : 'admin';
      await membersApi.update(token, member.id, { role: newRole });
      await loadMembers();
    } catch (err) {
      setError('Failed to update member role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (member: Member) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to delete ${member.email}?`)) return;

    setActionLoading(member.id);
    try {
      await membersApi.delete(token, member.id);
      await loadMembers();
    } catch (err) {
      setError('Failed to delete member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateApiKey = async (memberId: string) => {
    if (!token) return;
    setActionLoading(`key-${memberId}`);
    try {
      const result = await membersApi.createApiKey(token, memberId, newKeyName || undefined);
      setNewlyCreatedKey(result.key);
      setNewKeyName('');
      await loadApiKeys(memberId);
    } catch (err) {
      setError('Failed to create API key');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteApiKey = async (memberId: string, keyId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this API key?')) return;

    setActionLoading(`delete-${keyId}`);
    try {
      await membersApi.deleteApiKey(token, memberId, keyId);
      await loadApiKeys(memberId);
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
          <h1 style={{ margin: 0, fontSize: '20px' }}>Members & API Keys</h1>
        </div>
        <div style={{ color: '#888' }}>Logged in as {user?.email}</div>
      </header>

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Add Member Form */}
        <form
          onSubmit={handleAddMember}
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter email address..."
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
            type="submit"
            disabled={!newEmail.trim() || actionLoading === 'add'}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              background: '#0078d4',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: !newEmail.trim() || actionLoading === 'add' ? 'not-allowed' : 'pointer',
              opacity: !newEmail.trim() || actionLoading === 'add' ? 0.6 : 1,
            }}
          >
            {actionLoading === 'add' ? 'Adding...' : 'Add Member'}
          </button>
        </form>

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

        {/* Members List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            No members found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map((member) => (
              <div
                key={member.id}
                style={{
                  background: '#2d2d2d',
                  borderRadius: '4px',
                  opacity: member.isActive ? 1 : 0.5,
                }}
              >
                {/* Member Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                  }}
                >
                  <div
                    style={{ cursor: 'pointer', flex: 1 }}
                    onClick={() => handleToggleMember(member.id)}
                  >
                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#888' }}>
                        {expandedMember === member.id ? '▼' : '▶'}
                      </span>
                      {member.email}
                      {member.id === user?.id && (
                        <span style={{ color: '#0078d4' }}>(you)</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', marginLeft: '20px' }}>
                      {member.name || 'No name'} • {member.role} • Added by {member.addedBy || 'system'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleRole(member)}
                      disabled={actionLoading === member.id || member.id === user?.id}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: member.role === 'admin' ? '#ff9800' : '#4caf50',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: actionLoading === member.id || member.id === user?.id ? 'not-allowed' : 'pointer',
                        opacity: member.id === user?.id ? 0.5 : 1,
                      }}
                    >
                      {member.role === 'admin' ? 'Make User' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => handleToggleActive(member)}
                      disabled={actionLoading === member.id || member.id === user?.id}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: member.isActive ? '#f44336' : '#4caf50',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: actionLoading === member.id || member.id === user?.id ? 'not-allowed' : 'pointer',
                        opacity: member.id === user?.id ? 0.5 : 1,
                      }}
                    >
                      {member.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(member)}
                      disabled={actionLoading === member.id || member.id === user?.id}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: '#333',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: actionLoading === member.id || member.id === user?.id ? 'not-allowed' : 'pointer',
                        opacity: member.id === user?.id ? 0.5 : 1,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* API Keys Section (Expanded) */}
                {expandedMember === member.id && (
                  <div
                    style={{
                      borderTop: '1px solid #444',
                      padding: '16px',
                      background: '#252526',
                    }}
                  >
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#888' }}>
                      API Keys
                    </h3>

                    {/* Newly Created Key Alert */}
                    {newlyCreatedKey && (
                      <div
                        style={{
                          background: '#2e7d32',
                          padding: '12px',
                          borderRadius: '4px',
                          marginBottom: '12px',
                        }}
                      >
                        <div style={{ marginBottom: '8px', fontWeight: 500 }}>
                          New API Key Created - Copy it now, it won't be shown again!
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#1e1e1e',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                          }}
                        >
                          <code style={{ flex: 1, wordBreak: 'break-all' }}>{newlyCreatedKey}</code>
                          <button
                            onClick={() => copyToClipboard(newlyCreatedKey)}
                            style={{
                              padding: '4px 12px',
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
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="Key name (optional)..."
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          fontSize: '13px',
                          background: '#1e1e1e',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          color: '#fff',
                        }}
                      />
                      <button
                        onClick={() => handleCreateApiKey(member.id)}
                        disabled={actionLoading === `key-${member.id}`}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          background: '#0078d4',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: actionLoading === `key-${member.id}` ? 'not-allowed' : 'pointer',
                          opacity: actionLoading === `key-${member.id}` ? 0.6 : 1,
                        }}
                      >
                        {actionLoading === `key-${member.id}` ? 'Creating...' : 'Create API Key'}
                      </button>
                    </div>

                    {/* Existing Keys */}
                    {apiKeys[member.id]?.length === 0 ? (
                      <div style={{ color: '#888', fontSize: '13px' }}>
                        No API keys yet
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {apiKeys[member.id]?.map((key) => (
                          <div
                            key={key.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              background: '#1e1e1e',
                              borderRadius: '4px',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 500, fontSize: '13px' }}>{key.name}</div>
                              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                Created: {new Date(key.createdAt).toLocaleDateString()}
                                {key.lastUsedAt && (
                                  <> • Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', fontFamily: 'monospace' }}>
                                {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 8)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteApiKey(member.id, key.id)}
                              disabled={actionLoading === `delete-${key.id}`}
                              style={{
                                padding: '4px 12px',
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
