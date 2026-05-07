import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExpertDashboard() {
    const navigate = useNavigate();
    const [queries, setQueries] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [activeTab, setActiveTab] = useState('queries'); // queries | announcements
    const [replyText, setReplyText] = useState({});
    const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' });

    useEffect(() => {
        fetchQueries();
        fetchAnnouncements();
    }, []);

    const fetchQueries = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/expert/queries', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setQueries(data.queries);
        } catch (err) {
            console.error("Failed to fetch queries", err);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/announcements', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setAnnouncements(data.announcements);
        } catch (err) {
            console.error("Failed to fetch announcements", err);
        }
    };

    const handleReply = async (queryId) => {
        if (!replyText[queryId]) return;
        try {
            const res = await fetch(`http://localhost:5000/api/expert/respond/${queryId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ answer: replyText[queryId] })
            });
            const data = await res.json();
            if (data.success) {
                alert("Reply submitted successfully!");
                setReplyText({ ...replyText, [queryId]: '' });
                fetchQueries();
            }
        } catch (err) {
            alert("Error submitting reply.");
        }
    };

    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(announcementForm)
            });
            const data = await res.json();
            if (data.success) {
                alert("Announcement broadcasted successfully!");
                setAnnouncementForm({ title: '', message: '' });
                fetchAnnouncements();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Error posting announcement.");
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:5000/auth/logout', { method: 'POST', credentials: 'include' });
            navigate('/');
        } catch (err) { }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">👨‍🔬</div>
                    <span className="text-xl font-black text-gray-800 tracking-tight">AgriBrain <span className="text-blue-600 font-medium">Expert Portal</span></span>
                </div>
                <button onClick={handleLogout} className="text-red-600 bg-red-50 hover:bg-red-100 font-bold px-5 py-2.5 rounded-lg transition-colors">
                    Logout
                </button>
            </div>
            
            <div className="max-w-6xl mx-auto mt-10 px-4">
                <h1 className="text-4xl font-black text-gray-800 mb-8">Expert & Official Portal</h1>

                {/* Tabs */}
                <div className="flex space-x-4 border-b-2 border-gray-200 mb-8">
                    <button 
                        className={`pb-4 px-4 text-lg font-bold transition-colors ${activeTab === 'queries' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => setActiveTab('queries')}
                    >
                        Farmer Queries
                    </button>
                    <button 
                        className={`pb-4 px-4 text-lg font-bold transition-colors ${activeTab === 'announcements' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => setActiveTab('announcements')}
                    >
                        Community Announcements
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'queries' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-700">Open Queries</h2>
                        {queries.length === 0 && <p className="text-gray-500">No queries found.</p>}
                        
                        {queries.map(q => (
                            <div key={q._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{q.title}</h3>
                                        <p className="text-sm text-gray-500">From: {q.farmerId?.email}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${q.status === 'open' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                        {q.status.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-gray-700 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    {q.description}
                                </p>

                                {q.responses && q.responses.length > 0 && (
                                    <div className="mb-6 space-y-4">
                                        <h4 className="font-bold text-gray-700">Previous Responses:</h4>
                                        {q.responses.map((resp, idx) => (
                                            <div key={idx} className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                <p className="text-gray-800">{resp.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        placeholder="Type your expert advice here..." 
                                        className="flex-1 border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={replyText[q._id] || ''}
                                        onChange={(e) => setReplyText({...replyText, [q._id]: e.target.value})}
                                    />
                                    <button 
                                        onClick={() => handleReply(q._id)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-colors"
                                    >
                                        Reply
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'announcements' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Post Form */}
                        <div className="lg:col-span-1">
                            <form onSubmit={handlePostAnnouncement} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-10">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Broadcast Message</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={announcementForm.title}
                                        onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Message Content</label>
                                    <textarea 
                                        required
                                        className="w-full border rounded-xl px-4 py-2 h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={announcementForm.message}
                                        onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})}
                                    ></textarea>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
                                    Post Announcement
                                </button>
                            </form>
                        </div>

                        {/* History */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-2xl font-bold text-gray-700 mb-6">Recent Broadcasts</h2>
                            {announcements.length === 0 && <p className="text-gray-500">No announcements yet.</p>}
                            {announcements.map(ann => (
                                <div key={ann._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl">📢</span>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-800">{ann.title}</h4>
                                        <p className="text-sm text-blue-600 font-medium mb-2">By {ann.authorId?.fullName || ann.authorId?.email} • {new Date(ann.createdAt).toLocaleDateString()}</p>
                                        <p className="text-gray-600">{ann.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
