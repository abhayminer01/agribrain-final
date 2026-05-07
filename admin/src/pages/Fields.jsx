import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Sprout, X, Check, MapPin } from 'lucide-react';

export default function Fields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', size: '', selectedCrop: '', status: '' });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/fields', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setFields(data.fields);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to completely erase this field?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/fields/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setFields(fields.filter(f => f._id !== id));
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to delete field");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/admin/fields/${editingField._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            name: editForm.name,
            size: Number(editForm.size),
            selectedCrop: editForm.selectedCrop,
            status: editForm.status
        })
      });
      const data = await res.json();
      if (data.success) {
        setFields(fields.map(f => f._id === editingField._id ? data.field : f));
        setEditingField(null);
      }
    } catch (err) {
      alert("Failed to update field");
    }
  };

  if (loading) return <div className="text-admin-muted">Loading network ecosystem...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Global Ecosystem</h2>
          <p className="text-admin-muted text-sm mt-1">Monitor and manage all agricultural fields</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg">
          <span className="text-emerald-400 font-medium">{fields.length} Active Fields</span>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-admin-muted">
              <th className="p-4 font-semibold">Field Name</th>
              <th className="p-4 font-semibold">Owner</th>
              <th className="p-4 font-semibold">Crop & Size</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {fields.map(field => (
              <tr key={field._id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                        {field.imageUrl ? 
                            <img src={field.imageUrl} alt={field.name} className="w-full h-full object-cover opacity-80" /> : 
                            <div className="w-full h-full flex items-center justify-center"><MapPin className="w-4 h-4 text-admin-muted" /></div>
                        }
                    </div>
                    <div>
                        <div className="font-medium text-slate-200">{field.name}</div>
                        <div className="text-xs text-slate-500 font-mono text-ellipsis overflow-hidden w-32">{field._id}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                    <span className="text-sm text-slate-300">{field.userId ? field.userId.email : 'Unknown User'}</span>
                </td>
                <td className="p-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-amber-200/80 flex items-center gap-1"><Sprout className="w-3 h-3"/> {field.selectedCrop}</span>
                        <span className="text-xs text-slate-400">{field.size} Acres</span>
                    </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
                    ${field.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      field.status === 'harvested' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                      'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {field.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { 
                        setEditingField(field); 
                        setEditForm({ name: field.name, size: field.size, selectedCrop: field.selectedCrop, status: field.status }); 
                    }}
                    className="p-2 hover:bg-admin-accent/20 text-admin-accent rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(field._id)}
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
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 relative">
            <button onClick={() => setEditingField(null)} className="absolute top-4 right-4 text-admin-muted hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Modify Terrain Config</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-admin-muted mb-1">Field Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent"
                />
              </div>
              <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-admin-muted mb-1">Size (Acres)</label>
                    <input 
                    type="number" 
                    value={editForm.size}
                    onChange={e => setEditForm({...editForm, size: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-admin-muted mb-1">Crop</label>
                    <input 
                    type="text" 
                    value={editForm.selectedCrop}
                    onChange={e => setEditForm({...editForm, selectedCrop: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent"
                    />
                  </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-muted mb-1">Status</label>
                <select 
                  value={editForm.status}
                  onChange={e => setEditForm({...editForm, status: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent [&>option]:bg-admin-card"
                >
                  <option value="active">Active</option>
                  <option value="harvested">Harvested</option>
                  <option value="failure">Failure</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingField(null)} className="px-4 py-2 text-admin-muted hover:text-white transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-admin-accent hover:bg-blue-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2">
                  <Check className="w-4 h-4" /> Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
