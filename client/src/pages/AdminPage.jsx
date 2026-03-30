import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ users: 0, diseaseScans: 0, soilTests: 0 });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                // Fetch Stats
                const statsRes = await fetch('http://localhost:5000/api/admin/stats', { credentials: 'include' });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData.stats);
                } else {
                    return navigate('/dashboard'); // Kick out non-admins silently
                }

                // Fetch Users
                const usersRes = await fetch('http://localhost:5000/api/admin/users', { credentials: 'include' });
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setUsers(usersData.users);
                }
            } catch(e) { console.error(e) } finally { setLoading(false) }
        };
        fetchAdminData();
    }, [navigate]);

    const handleVerify = async (userId) => {
        if(!window.confirm('Elevate this user to Expert?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/verify-expert/${userId}`, {
                method: 'PUT',
                credentials: 'include'
            });
            if(res.ok) {
                // quick local mutate
                setUsers(users.map(u => u._id === userId ? {...u, role: 'Expert'} : u));
            }
        } catch(e) {}
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-10 font-sans">
            <div className='flex justify-between items-center mb-10 pb-5 border-b border-gray-200'>
                <h1 className='text-4xl font-black text-slate-800'>Admin Operations</h1>
                <button onClick={() => navigate('/dashboard')} className='text-gray-600 hover:text-slate-700 font-bold'>← Back to Dashboard</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-500 uppercase">Total Users</h3>
                    <p className="text-4xl font-black text-indigo-600">{stats.users}</p>
                </div>
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-500 uppercase">AI Disease Scans</h3>
                    <p className="text-4xl font-black text-rose-600">{stats.diseaseScans}</p>
                </div>
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-500 uppercase">AI Soil Tests</h3>
                    <p className="text-4xl font-black text-amber-600">{stats.soilTests}</p>
                </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <h2 className="text-xl font-bold bg-gray-100 px-8 py-4 text-gray-700">User Management Directory</h2>
                <div className="px-8 pb-8 pt-4">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase">User Email</th>
                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase">Current Role</th>
                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 font-medium text-gray-800">{u.email}</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'Admin' ? 'bg-red-100 text-red-700' : u.role === 'Expert' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        {u.role === 'Farmer' && (
                                            <button onClick={() => handleVerify(u._id)} className="text-sm border border-indigo-200 text-indigo-700 px-3 py-1 font-bold rounded hover:bg-indigo-50 transition-colors">
                                                Verify as Expert
                                            </button>
                                        )}
                                        {u.role !== 'Farmer' && <span className="text-xs text-gray-400">No Action</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
