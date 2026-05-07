import React, { useState, useEffect } from 'react';
import { Trash2, Megaphone, Edit2, User, X, Check } from 'lucide-react';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAnn, setEditingAnn] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', message: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/announcements', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setAnnouncements(data.announcements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will delete the announcement permanently.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/announcements/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(announcements.filter(a => a._id !== id));
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to delete announcement");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/announcements/${editingAnn._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(announcements.map(a => a._id === editingAnn._id ? data.announcement : a));
        setEditingAnn(null);
      }
    } catch (err) {
      alert("Failed to update announcement");
    }
  };

  if (loading) return <div className="text-admin-muted">Loading announcements...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Global Announcements</h2>
          <p className="text-admin-muted text-sm mt-1">Manage broadcasts and alerts</p>
        </div>
        <div className="bg-admin-accent/10 border border-admin-accent/20 px-4 py-2 rounded-lg">
          <span className="text-admin-accent font-medium">{announcements.length} Total</span>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-admin-muted">
              <th className="p-4 font-semibold">Broadcast Content</th>
              <th className="p-4 font-semibold">Author</th>
              <th className="p-4 font-semibold">Date Posted</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {announcements.map(ann => (
              <tr key={ann._id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-4 max-w-md">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-admin-muted flex-shrink-0 mt-1">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block mb-1">{ann.title}</span>
                      <span className="text-xs text-slate-400 block line-clamp-2">{ann.message}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium text-slate-300 text-sm">
                      {ann.authorId?.fullName || 'Unknown'}
                    </span>
                    <span className="text-xs text-admin-muted">
                      {ann.authorId?.email}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-slate-400 text-sm">
                  {new Date(ann.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="p-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <button 
                    onClick={() => { setEditingAnn(ann); setEditForm({ title: ann.title, message: ann.message }); }}
                    className="p-2 hover:bg-admin-accent/20 text-admin-accent rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(ann._id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {announcements.length === 0 && (
          <div className="p-8 text-center text-admin-muted">
            No announcements found.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 relative">
            <button onClick={() => setEditingAnn(null)} className="absolute top-4 right-4 text-admin-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Edit Announcement</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-admin-muted mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-muted mb-1">Message Content</label>
                <textarea 
                  required
                  value={editForm.message}
                  onChange={e => setEditForm({...editForm, message: e.target.value})}
                  className="w-full h-32 bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent"
                ></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingAnn(null)} className="px-4 py-2 text-admin-muted hover:text-white transition-colors font-medium">Cancel</button>
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
