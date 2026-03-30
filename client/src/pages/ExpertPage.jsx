import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExpertPage() {
    const navigate = useNavigate();
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [newQuery, setNewQuery] = useState({ title: '', description: '' });
    const [reply, setReply] = useState('');
    const [activeQuery, setActiveQuery] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const meRes = await fetch('http://localhost:5000/auth/me', { credentials: 'include' });
            if (!meRes.ok) return navigate('/');
            const meData = await meRes.json();
            setUser(meData.user);

            const queryRes = await fetch('http://localhost:5000/api/expert/queries', { credentials: 'include' });
            if (queryRes.ok) {
                const queryData = await queryRes.json();
                setQueries(queryData.queries);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAsk = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/expert/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newQuery)
            });
            if (res.ok) {
                setNewQuery({ title: '', description: '' });
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRespond = async (e, queryId) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:5000/api/expert/respond/${queryId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ answer: reply })
            });
            if (res.ok) {
                setReply('');
                setActiveQuery(null);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;

    const isFarmer = user?.role === 'Farmer';

    return (
        <div className="min-h-screen bg-gray-50 p-10 font-sans">
            <div className='flex justify-between items-center mb-10 pb-5 border-b border-gray-200'>
                <h1 className='text-4xl font-black text-indigo-800'>{isFarmer ? 'Ask an Expert' : 'Expert Panel'}</h1>
                <button onClick={() => navigate('/dashboard')} className='text-gray-600 hover:text-indigo-700 font-bold'>← Back to Dashboard</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 opacity-100">
                
                {/* Farmer: Ask Form */}
                {isFarmer && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-fit">
                        <h2 className="text-xl font-bold mb-4">Submit a Question</h2>
                        <form onSubmit={handleAsk} className="flex flex-col gap-4">
                            <input 
                                value={newQuery.title} 
                                onChange={e => setNewQuery({...newQuery, title: e.target.value})} 
                                placeholder="Core issue (e.g., Wilted leaves on tomato)" 
                                required className="border p-3 rounded-lg"
                            />
                            <textarea 
                                value={newQuery.description} 
                                onChange={e => setNewQuery({...newQuery, description: e.target.value})} 
                                placeholder="Describe the environment, timeline, and symptoms..." 
                                required className="border p-3 rounded-lg h-32"
                            />
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg">Submit Question</button>
                        </form>
                    </div>
                )}

                {/* List of Queries */}
                <div className={`bg-white p-8 rounded-2xl shadow-sm border border-indigo-100 ${!isFarmer ? 'col-span-1 md:col-span-2' : ''}`}>
                    <h2 className="text-xl font-bold mb-6 text-indigo-900">Community Queries</h2>
                    
                    {queries.length === 0 ? (
                        <p className="text-gray-500">No queries have been submitted yet.</p>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {queries.map(q => (
                                <div key={q._id} className="border rounded-xl p-5 bg-indigo-50/30">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-gray-800">{q.title}</h3>
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${q.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {q.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4">{q.description}</p>
                                    
                                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                                        <h4 className="font-bold text-xs text-gray-400 mb-2 uppercase tracking-wide">Expert Responses</h4>
                                        {q.responses.length > 0 ? (
                                            <ul className="space-y-3">
                                                {q.responses.map(resp => (
                                                    <li key={resp._id} className="text-gray-700 text-sm border-l-2 border-indigo-400 pl-3">
                                                        {resp.answer}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-gray-400 text-sm italic">Pending expert verification...</p>}
                                    </div>

                                    {!isFarmer && q.status === 'open' && (
                                        <div className="mt-4 pt-4 border-t">
                                            {activeQuery === q._id ? (
                                                <form onSubmit={(e) => handleRespond(e, q._id)} className="flex gap-2">
                                                    <textarea value={reply} onChange={e => setReply(e.target.value)} required placeholder="Provide professional advice..." className="border flex-1 p-2 text-sm rounded" />
                                                    <div className="flex flex-col gap-1">
                                                        <button type="submit" className="bg-green-600 text-white font-bold px-4 py-2 rounded text-sm">Post</button>
                                                        <button type="button" onClick={() => setActiveQuery(null)} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded text-sm">Cancel</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button onClick={() => setActiveQuery(q._id)} className="text-indigo-600 font-bold text-sm hover:underline">Reply to Farmer</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
