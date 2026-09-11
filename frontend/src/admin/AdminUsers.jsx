import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AdminUsers = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    const res = await fetch('/api/auth/users', {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/auth/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user.token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setUsers(users.filter(u => u._id !== id));
      setMessage(data.message || 'User deleted');
    } else {
      setMessage(data.message || 'Failed to delete user');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/users/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message || (data.user ? `Admin "${data.user.name}" saved successfully` : 'Done'));
      setForm({ name: '', email: '', password: '' });
      setShowAddAdmin(false);
      fetchUsers();
    } else {
      setMessage(data.message || 'Failed to create admin');
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ color: '#f97316', marginBottom: '20px' }}>User Directory</h2>
      {message && <p style={{ color: '#10b981', marginBottom: '15px' }}>{message}</p>}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowAddAdmin(!showAddAdmin)} style={addAdminBtnStyle}>
          {showAddAdmin ? ' Cancel' : '+ Add Admin User'}
        </button>
      </div>
      {showAddAdmin && (
        <form onSubmit={handleAddAdmin} style={formStyle}>
          <input style={inputStyle} placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input style={inputStyle} type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input style={inputStyle} type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button type="submit" style={submitBtnStyle}>Create Admin</button>
        </form>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={rowStyle}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>NAME</th>
              <th style={thStyle}>EMAIL</th>
              <th style={thStyle}>ROLE</th>
              <th style={thStyle}>JOINED</th>
              <th style={thStyle}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter(u => u._id !== user._id)
              .map(u => (
              <tr key={u._id} style={rowStyle}>
                <td style={tdStyle}>{u._id.substring(0, 8)}...</td>
                <td style={tdStyle}>{u.name}</td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}>
                  <span style={{ background: u.role === 'admin' ? 'rgba(234,88,12,0.2)' : 'rgba(16,185,129,0.2)', color: u.role === 'admin' ? '#f97316' : '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={tdStyle}>{formatDate(u.createdAt)}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleDelete(u._id, u.name)}
                    style={deleteBtnStyle}
                    title={u._id === user._id ? "You can't delete yourself" : 'Delete user'}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const containerStyle = { maxWidth: '1200px', margin: '40px auto', padding: '30px', background: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#fafafa' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const rowStyle = { borderBottom: '1px solid rgba(255,255,255,0.1)' };
const thStyle = { padding: '15px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.9rem' };
const tdStyle = { padding: '15px', textAlign: 'left' };
const deleteBtnStyle = { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' };
const addAdminBtnStyle = { background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.4)', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 'bold' };
const formStyle = { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' };
const inputStyle = { flex: '1 1 180px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#09090b', color: '#fafafa', outline: 'none' };
const submitBtnStyle = { background: '#f97316', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default AdminUsers;