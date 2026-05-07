import React, { useState, useEffect } from 'react';
import { Trash2, MessageSquare, CheckCircle, Circle, Mail } from 'lucide-react';

export default function Queries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/queries', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setQueries(data.queries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will delete the query permanently.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/queries/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setQueries(queries.filter(q => q._id !== id));
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to delete query");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/queries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setQueries(queries.map(q => q._id === id ? data.query : q));
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="text-admin-muted">Loading queries...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white">Community Queries</h2>
          <p className="text-admin-muted text-sm mt-1">Monitor and manage farmer questions</p>
        </div>
        <div className="bg-admin-accent/10 border border-admin-accent/20 px-4 py-2 rounded-lg">
          <span className="text-admin-accent font-medium">{queries.length} Total</span>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-admin-muted">
              <th className="p-4 font-semibold">Query Content</th>
              <th className="p-4 font-semibold">Farmer</th>
              <th className="p-4 font-semibold">Status & Responses</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {queries.map(query => (
              <tr key={query._id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-4 max-w-sm">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-admin-muted flex-shrink-0 mt-1">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-200 block mb-1">{query.title}</span>
                      <span className="text-xs text-slate-400 block line-clamp-2">{query.description}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Mail className="w-4 h-4 text-admin-muted" />
                    {query.farmerId?.email || 'Unknown Farmer'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
                      ${query.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                      {query.status === 'resolved' ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                      {query.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-admin-muted mt-1">
                      {query.responses?.length || 0} Responses
                    </span>
                  </div>
                </td>
                <td className="p-4 text-slate-400 text-sm">
                  {new Date(query.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="p-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <button 
                    onClick={() => handleStatusChange(query._id, query.status === 'open' ? 'resolved' : 'open')}
                    className="px-3 py-1.5 bg-admin-accent/10 hover:bg-admin-accent/20 text-admin-accent border border-admin-accent/20 rounded-lg text-xs font-bold transition-colors"
                  >
                    Mark {query.status === 'open' ? 'Resolved' : 'Open'}
                  </button>
                  <button 
                    onClick={() => handleDelete(query._id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {queries.length === 0 && (
          <div className="p-8 text-center text-admin-muted">
            No queries found.
          </div>
        )}
      </div>
    </div>
  );
}
