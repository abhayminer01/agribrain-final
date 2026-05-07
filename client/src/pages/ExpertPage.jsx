import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Beaker, Users, ChevronLeft, ChevronRight, LogOut, Leaf, MessageSquare, PlusCircle, Reply
} from 'lucide-react';

export default function ExpertPage() {
    const navigate = useNavigate();
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [newQuery, setNewQuery] = useState({ title: '', description: '' });
    const [reply, setReply] = useState('');
    const [activeQuery, setActiveQuery] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        fetchData();
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
        const handleResize = () => { if (window.innerWidth < 1024) setIsSidebarOpen(false); else setIsSidebarOpen(true); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:5000/auth/logout', { method: 'POST', credentials: 'include' });
            navigate('/');
        } catch (err) { }
    };

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

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <Users className="w-12 h-12 text-indigo-600 animate-pulse" />
                <p className="text-gray-500 font-medium">Loading Community Panel...</p>
            </div>
        </div>
    );

    const isFarmer = user?.role === 'Farmer';

    return (
        <div className='min-h-screen bg-[#f8fafc] flex font-sans overflow-hidden'>
            
            {/* Sidebar */}
            <aside className={`bg-white border-r border-gray-100 flex flex-col transition-all duration-300 z-40 ${isSidebarOpen ? 'w-64' : 'w-20'} hidden lg:flex relative`}>
                <div className="h-20 flex items-center justify-center border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        {isSidebarOpen && <span className="text-xl font-black text-gray-900 tracking-tight">AgriBrain</span>}
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <button onClick={() => navigate('/dashboard')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all ${!isSidebarOpen && 'justify-center'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        {isSidebarOpen && <span>My Fields</span>}
                    </button>
                    <button onClick={() => navigate('/soil')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all ${!isSidebarOpen && 'justify-center'}`}>
                        <Beaker className="w-5 h-5" />
                        {isSidebarOpen && <span>Lab Reports</span>}
                    </button>
                    <button className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${isSidebarOpen ? 'bg-indigo-50 text-indigo-700' : 'justify-center text-indigo-700 bg-indigo-50'}`}>
                        <Users className="w-5 h-5" />
                        {isSidebarOpen && <span>Experts</span>}
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-50">
                    <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all ${!isSidebarOpen && 'justify-center'}`}>
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>

                {/* Sidebar Toggle */}
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-4 top-24 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm hover:shadow-md text-gray-400 hover:text-gray-600 transition-all z-50"
                >
                    {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto relative scroll-smooth bg-gray-50">
                <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
                    <div className='flex justify-between items-center mb-10 pb-5 border-b border-gray-200'>
                        <div>
                            <h1 className='text-3xl lg:text-4xl font-black text-gray-900 tracking-tight'>
                                {isFarmer ? 'Community Consultations' : 'Expert Panel'}
                            </h1>
                            <p className="text-gray-500 font-medium mt-1">
                                {isFarmer ? 'Ask agricultural experts for personalized advice.' : 'Help farmers resolve their agricultural queries.'}
                            </p>
                        </div>
                        <button onClick={() => navigate('/dashboard')} className='lg:hidden bg-white border border-gray-200 px-4 py-2 rounded-xl text-gray-600 hover:text-indigo-700 hover:border-indigo-300 font-bold shadow-sm transition-all'>
                            Dashboard
                        </button>
                    </div>

                    <div className={`grid grid-cols-1 ${isFarmer ? 'xl:grid-cols-3' : 'xl:grid-cols-1'} gap-10`}>
                        
                        {/* Farmer: Ask Form */}
                        {isFarmer && (
                            <div className="xl:col-span-1">
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-10">
                                    <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <PlusCircle className="w-6 h-6 text-indigo-600" /> Submit a Question
                                    </h2>
                                    <form onSubmit={handleAsk} className="flex flex-col gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Core Issue</label>
                                            <input 
                                                value={newQuery.title} 
                                                onChange={e => setNewQuery({...newQuery, title: e.target.value})} 
                                                placeholder="e.g., Wilted leaves on tomato" 
                                                required 
                                                className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Description</label>
                                            <textarea 
                                                value={newQuery.description} 
                                                onChange={e => setNewQuery({...newQuery, description: e.target.value})} 
                                                placeholder="Describe the environment, timeline, and symptoms..." 
                                                required 
                                                className="w-full border border-gray-200 p-3.5 rounded-xl h-32 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                            />
                                        </div>
                                        <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all mt-2 flex justify-center items-center gap-2">
                                            Post to Experts <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* List of Queries */}
                        <div className={`xl:col-span-2`}>
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[500px]">
                                <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-2">
                                    <MessageSquare className="w-6 h-6 text-gray-400" /> Public Discussion Forum
                                </h2>
                                
                                {queries.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <MessageSquare className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">No discussions yet</h3>
                                        <p className="text-gray-500">Be the first to ask a question to our experts.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        {queries.map(q => (
                                            <div key={q._id} className="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-black text-xl text-gray-900 pr-4">{q.title}</h3>
                                                    <span className={`shrink-0 text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg font-black ${q.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {q.status}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm mb-6 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    {q.description}
                                                </p>
                                                
                                                <div>
                                                    <h4 className="font-bold text-xs text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                                        <Reply className="w-4 h-4"/> Expert Responses
                                                    </h4>
                                                    {q.responses.length > 0 ? (
                                                        <ul className="space-y-4">
                                                            {q.responses.map(resp => (
                                                                <li key={resp._id} className="text-gray-700 text-sm border-l-2 border-indigo-400 pl-4 py-1 flex flex-col gap-1.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-black uppercase">
                                                                            {(resp.expertId?.fullName || resp.expertId?.email || 'E')[0]}
                                                                        </div>
                                                                        <span className="font-bold text-gray-900">{resp.expertId?.fullName || resp.expertId?.email || 'Verified Expert'}</span>
                                                                    </div>
                                                                    <span className="text-gray-600 leading-relaxed">{resp.answer}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : <p className="text-gray-400 text-sm font-medium italic bg-white inline-block">Awaiting expert review...</p>}
                                                </div>

                                                {!isFarmer && q.status === 'open' && (
                                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                                        {activeQuery === q._id ? (
                                                            <form onSubmit={(e) => handleRespond(e, q._id)} className="flex flex-col sm:flex-row gap-3">
                                                                <textarea 
                                                                    value={reply} 
                                                                    onChange={e => setReply(e.target.value)} 
                                                                    required 
                                                                    placeholder="Provide professional advice..." 
                                                                    className="border border-gray-200 flex-1 p-3 text-sm rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-24 sm:h-auto" 
                                                                />
                                                                <div className="flex sm:flex-col gap-2 shrink-0">
                                                                    <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">Post</button>
                                                                    <button type="button" onClick={() => setActiveQuery(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl transition-colors">Cancel</button>
                                                                </div>
                                                            </form>
                                                        ) : (
                                                            <button onClick={() => setActiveQuery(q._id)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
                                                                Reply to Farmer
                                                            </button>
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
                </div>
            </main>
        </div>
    );
}
