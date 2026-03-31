import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000';

export default function ManageFieldsPage() {
    const navigate = useNavigate();
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPlantingDate, setEditPlantingDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchFields = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/fields`, { credentials: 'include' });
            if (!res.ok) { navigate('/'); return; }
            const data = await res.json();
            setFields(data.fields);
        } catch (e) { navigate('/'); }
        finally { setLoading(false); }
    }, [navigate]);

    useEffect(() => { fetchFields(); }, [fetchFields]);

    const openEdit = (field) => {
        setEditingId(field._id);
        setEditName(field.name);
        setEditPlantingDate(
            field.plantingDate
                ? new Date(field.plantingDate).toISOString().split('T')[0]
                : ''
        );
        setError('');
    };

    const cancelEdit = () => { setEditingId(null); setError(''); };

    const saveEdit = async (id) => {
        if (!editName.trim()) return setError('Field name cannot be empty.');
        setSaving(true);
        setError('');
        try {
            const body = { name: editName };
            if (editPlantingDate) body.plantingDate = editPlantingDate;

            const res = await fetch(`${API}/api/fields/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setFields(fields.map(f => f._id === id ? data.field : f));
                setEditingId(null);
            } else {
                setError(data.message || 'Save failed.');
            }
        } catch (e) { setError('Network error.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API}/api/fields/${id}`, {
                method: 'DELETE', credentials: 'include',
            });
            if (res.ok) setFields(fields.filter(f => f._id !== id));
        } catch (e) { alert('Delete failed, please try again.'); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-green-700 border-b-transparent" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b shadow-sm px-8 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Manage Fields</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Rename, reschedule planting, or remove fields</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-600 hover:text-green-700 font-bold text-sm flex items-center gap-1"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10">
                {fields.length === 0 ? (
                    <div className="text-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
                        <p className="text-gray-400 text-lg">No fields created yet.</p>
                        <button onClick={() => navigate('/dashboard')} className="mt-4 text-green-700 font-bold underline text-sm">
                            Go create one →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {fields.map(field => {
                            const isEditing = editingId === field._id;
                            return (
                                <div
                                    key={field._id}
                                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${isEditing ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    {/* Card Header */}
                                    <div className="flex items-center gap-4 p-5">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                            <img src={field.imageUrl} alt={field.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-gray-800 text-lg truncate">{field.name}</h3>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                <span className="text-xs bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">{field.selectedCrop}</span>
                                                <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">{field.size} Acres</span>
                                                {field.plantingDate
                                                    ? <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">🌱 {new Date(field.plantingDate).toLocaleDateString()}</span>
                                                    : <span className="text-xs bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full">Not planted</span>
                                                }
                                            </div>
                                        </div>
                                        {!isEditing && (
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => openEdit(field)}
                                                    className="bg-gray-100 hover:bg-green-50 hover:text-green-700 text-gray-600 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(field._id, field.name)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    🗑 Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Edit Panel */}
                                    {isEditing && (
                                        <div className="border-t border-green-100 bg-green-50/30 px-5 pb-5 pt-4">
                                            {error && (
                                                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Field Name</label>
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-300"
                                                        placeholder="Field name..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Planting Date</label>
                                                    <input
                                                        type="date"
                                                        value={editPlantingDate}
                                                        onChange={e => setEditPlantingDate(e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-300"
                                                    />
                                                    {editPlantingDate && field.daysToHarvest && (
                                                        <p className="text-xs text-gray-400 mt-1 font-medium">
                                                            Harvest will recalculate to: {(() => {
                                                                const d = new Date(editPlantingDate);
                                                                d.setDate(d.getDate() + field.daysToHarvest);
                                                                return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                                            })()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => saveEdit(field._id)}
                                                    disabled={saving}
                                                    className={`bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-6 py-2 rounded-lg transition-colors ${saving ? 'opacity-60 cursor-wait' : ''}`}
                                                >
                                                    {saving ? 'Saving...' : '✓ Save Changes'}
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
