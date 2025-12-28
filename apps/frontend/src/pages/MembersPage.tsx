import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, membersApi, type Member } from '../store/authStore';

export function MembersPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
          <h1 style={{ margin: 0, fontSize: '20px' }}>Members Management</h1>
        </div>
        <div style={{ color: '#888' }}>Logged in as {user?.email}</div>
      </header>

      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: '#2d2d2d',
                  borderRadius: '4px',
                  opacity: member.isActive ? 1 : 0.5,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {member.email}
                    {member.id === user?.id && (
                      <span style={{ color: '#0078d4', marginLeft: '8px' }}>(you)</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
