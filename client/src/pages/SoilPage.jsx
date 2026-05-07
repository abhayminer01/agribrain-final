import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Beaker, Users, ChevronLeft, ChevronRight, LogOut, Leaf, AlertCircle, CheckCircle2
} from 'lucide-react';

export default function SoilPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
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

    const handleAnalyze = async (e) => {
        e.preventDefault();
        
        // Strict validation
        if (!file) return setError('Please upload a soil report document or image.');
        if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
            return setError('The report must be a valid PDF or Image file.');
        }

        setError('');
        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('report', file);

        try {
            const res = await fetch('http://localhost:5000/api/soil/analyze', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                setResult(data.record.result);
            } else {
                setError(data.message || 'Analysis failed.');
            }
        } catch (err) {
            setError('Network Error');
        } finally {
            setLoading(false);
        }
    };

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
                    <button className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${isSidebarOpen ? 'bg-amber-50 text-amber-700' : 'justify-center text-amber-700 bg-amber-50'}`}>
                        <Beaker className="w-5 h-5" />
                        {isSidebarOpen && <span>Lab Reports</span>}
                    </button>
                    <button onClick={() => navigate('/expert')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all ${!isSidebarOpen && 'justify-center'}`}>
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
                            <h1 className='text-3xl lg:text-4xl font-black text-gray-900 tracking-tight'>Intelligent Soil Analyzer</h1>
                            <p className="text-gray-500 font-medium mt-1">Upload a soil lab report to instantly extract key metrics.</p>
                        </div>
                        <button onClick={() => navigate('/dashboard')} className='lg:hidden bg-white border border-gray-200 px-4 py-2 rounded-xl text-gray-600 hover:text-green-700 hover:border-green-300 font-bold shadow-sm transition-all'>
                            Dashboard
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Upload Form */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2"><Beaker className="text-amber-600"/> Upload Lab Report</h2>
                            <form onSubmit={handleAnalyze} className="flex flex-col gap-6">
                                {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5"/> {error}</div>}
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Document (PDF/Image)</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,image/*" 
                                        onChange={e => setFile(e.target.files[0])}
                                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 border border-gray-200 border-dashed rounded-xl p-3 outline-none focus:border-amber-500 transition-all cursor-pointer"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className={`w-full py-4 rounded-xl text-white font-bold transition-all shadow-lg mt-2 flex items-center justify-center gap-2 ${loading ? 'bg-gray-400 cursor-wait' : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-600/20 hover:-translate-y-0.5'}`}
                                >
                                    {loading ? 'Extracting with AgriBrain...' : 'Analyze Report'}
                                </button>
                            </form>
                        </div>

                        {/* Results View */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100 min-h-[400px] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><CheckCircle2 className="w-32 h-32 text-amber-900" /></div>
                            
                            <h2 className="text-2xl font-black text-gray-900 mb-6 relative z-10">Extracted Metrics</h2>
                            
                            {!result && !loading && (
                                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 text-center relative z-10">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <Beaker className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="max-w-xs">Upload a lab report document. Our AI will automatically extract and parse the key soil indicators.</p>
                                </div>
                            )}
                            
                            {loading && (
                                <div className="flex flex-col items-center justify-center h-[300px] relative z-10">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-amber-200 rounded-full blur-xl animate-pulse"></div>
                                        <Beaker className="w-16 h-16 text-amber-600 relative z-10 animate-bounce" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Scanning document structure...</h3>
                                    <p className="text-gray-500 font-medium mt-1">Please wait a moment.</p>
                                </div>
                            )}
                            
                            {result && !loading && (
                                <div className="animate-in fade-in flex flex-col gap-6 relative z-10">
                                    
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                                        <h3 className="text-xl font-black text-gray-900">Soil pH Level</h3>
                                        <span className={`px-5 py-2 rounded-xl font-black text-lg bg-gray-50 text-gray-900 border border-gray-200 shadow-sm`}>
                                            {result.pH || 'Unknown'}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-lg text-gray-800 mb-4">NPK Values (Nitrogen, Phosphorus, Potassium)</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-sky-50/50 border border-sky-100 p-5 rounded-2xl text-center shadow-sm">
                                                <div className="text-sky-800 font-bold mb-1 text-sm uppercase tracking-wide">Nitrogen (N)</div>
                                                <div className="text-3xl font-black text-sky-600">{result.NPK?.N || '--'}</div>
                                            </div>
                                            <div className="bg-purple-50/50 border border-purple-100 p-5 rounded-2xl text-center shadow-sm">
                                                <div className="text-purple-800 font-bold mb-1 text-sm uppercase tracking-wide">Phosphorus (P)</div>
                                                <div className="text-3xl font-black text-purple-600">{result.NPK?.P || '--'}</div>
                                            </div>
                                            <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-2xl text-center shadow-sm">
                                                <div className="text-orange-800 font-bold mb-1 text-sm uppercase tracking-wide">Potassium (K)</div>
                                                <div className="text-3xl font-black text-orange-600">{result.NPK?.K || '--'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                        <h4 className="font-black text-gray-900 mb-3 flex items-center gap-2">
                                            <Leaf className="w-5 h-5 text-green-600"/> AI Recommendations
                                        </h4>
                                        {result.suggestions?.length > 0 ? (
                                            <ul className="space-y-2">
                                                {result.suggestions.map((s, i) => (
                                                    <li key={i} className="text-gray-700 font-medium text-sm flex gap-3">
                                                        <span className="text-amber-500 mt-0.5">•</span> 
                                                        <span>{s}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-gray-500 italic text-sm">No specific recommendations provided from this report.</p>}
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
