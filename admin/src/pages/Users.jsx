import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Shield, User as UserIcon, X, Check } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', email: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will delete the user and ALL their fields.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u._id !== id));
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u._id === id ? data.user : u));
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u._id === editingUser._id ? data.user : u));
        setEditingUser(null);
      }
    } catch (err) {
      alert("Failed to update user");
    }
  };

  if (loading) return <div className="text-admin-muted">Loading network...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Network Citizens</h2>
          <p className="text-admin-muted text-sm mt-1">Manage platform access and roles</p>
        </div>
        <div className="bg-admin-accent/10 border border-admin-accent/20 px-4 py-2 rounded-lg">
          <span className="text-admin-accent font-medium">{users.length} Total</span>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-admin-muted">
              <th className="p-4 font-semibold">User Details</th>
              <th className="p-4 font-semibold">Role & Status</th>
              <th className="p-4 font-semibold">Joined Date</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(user => (
              <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-admin-muted flex-shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium text-slate-200 block">{user.email}</span>
                      {user.description && <span className="text-xs text-slate-400 block mt-0.5 line-clamp-1">{user.description}</span>}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
                      ${user.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                        user.role === 'Expert' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                      {user.role === 'Admin' && <Shield className="w-3 h-3" />}
                      {user.role}
                    </span>
                    {user.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20 uppercase">
                          Pending Approval
                        </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-slate-400 text-sm">
                  {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="p-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {user.status === 'pending' && (
                    <button 
                      onClick={() => handleStatusChange(user._id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  <button 
                    onClick={() => { setEditingUser(user); setEditForm({ role: user.role, email: user.email }); }}
                    className="p-2 hover:bg-admin-accent/20 text-admin-accent rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(user._id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 relative">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-admin-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Edit Identity</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-admin-muted mb-1">Email</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-muted mb-1">Role Classification</label>
                <select 
                  value={editForm.role}
                  onChange={e => setEditForm({...editForm, role: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent [&>option]:bg-admin-card"
                >
                  <option value="Farmer">Farmer</option>
                  <option value="Expert">Expert</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-admin-muted hover:text-white transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-admin-accent hover:bg-blue-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
