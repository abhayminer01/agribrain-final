import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MoreVertical, Edit2, FileText, Pickaxe, ShieldAlert, Trash2, 
    Leaf, Bell, User, Plus, X, LayoutDashboard, Beaker, Users, 
    ChevronLeft, ChevronRight, Menu, LogOut, CheckCircle2, ArrowRight
} from 'lucide-react';
import { generateFieldAuditPDF } from '../utils/pdfGenerator';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fields, setFields] = useState([]);
    
    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [actionModal, setActionModal] = useState({ type: null, field: null, input: '' });
    
    // Form State
    const [currentStep, setCurrentStep] = useState(1);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldName, setFieldName] = useState('');
    const [fieldSize, setFieldSize] = useState('');
    const [fieldImage, setFieldImage] = useState(null);
    const [soilReport, setSoilReport] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [tempReportUrl, setTempReportUrl] = useState('');
    const [selectedCrop, setSelectedCrop] = useState('');
    const [customCrop, setCustomCrop] = useState('');

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch('http://localhost:5000/auth/me', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                    fetchFields();
                    fetchNotifications();
                } else {
                    navigate('/');
                }
            } catch (err) { navigate('/'); } finally { setLoading(false); }
        };
        checkSession();
        
        // Auto-collapse sidebar on smaller screens
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
        const handleResize = () => { if (window.innerWidth < 1024) setIsSidebarOpen(false); else setIsSidebarOpen(true); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [navigate]);

    const fetchFields = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/fields', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setFields(data.fields);
            }
        } catch (err) { }
    };

    const fetchNotifications = async () => {
        try {
            const [notifRes, annRes] = await Promise.all([
                fetch('http://localhost:5000/api/notifications', { credentials: 'include' }),
                fetch('http://localhost:5000/api/announcements', { credentials: 'include' })
            ]);
            
            let allNotifs = [];
            if(notifRes.ok) {
                const notifData = await notifRes.json();
                allNotifs = [...notifData.notifications.map(n => ({ ...n, type: 'alert' }))];
            }
            if(annRes.ok) {
                const annData = await annRes.json();
                const mappedAnns = annData.announcements.map(a => ({
                    _id: a._id,
                    title: `Announcement: ${a.title}`,
                    message: `By ${a.authorId?.fullName || a.authorId?.email || 'Expert'}: ${a.message}`,
                    isRead: false, 
                    createdAt: a.createdAt,
                    type: 'announcement'
                }));
                allNotifs = [...allNotifs, ...mappedAnns];
            }
            
            allNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setNotifications(allNotifs);

        } catch(err) {}
    }

    const handleReadNotification = async (id, type) => {
        if (type === 'announcement') return; 
        try {
            const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT', credentials: 'include' });
            if(res.ok) fetchNotifications();
        } catch(err) {}
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:5000/auth/logout', { method: 'POST', credentials: 'include' });
            navigate('/');
        } catch (err) { }
    };

    const openModal = () => {
        setIsModalOpen(true); setCurrentStep(1); setFormError('');
        setFieldName(''); setFieldSize(''); setFieldImage(null); setSoilReport(null);
        setAiAnalysis(null); setSelectedCrop(''); setCustomCrop(''); setTempReportUrl('');
    }

    const handleAnalyzeSoil = async (e) => {
        e.preventDefault();
        
        if (!fieldName || fieldName.trim().length < 3) return setFormError("Field name must be at least 3 characters long.");
        if (!fieldSize || parseFloat(fieldSize) <= 0) return setFormError("Field size must be greater than 0.");
        if (!fieldImage) return setFormError("Please upload a field photo.");
        if (!fieldImage.type.startsWith('image/')) return setFormError("Field photo must be a valid image file.");
        if (!soilReport) return setFormError("Please upload a soil lab report.");
        if (soilReport.type !== 'application/pdf' && !soilReport.type.startsWith('image/')) {
            return setFormError("Soil report must be a PDF or Image file.");
        }
        
        setFormError(''); setCurrentStep(2); setIsSubmitting(true);
        const formData = new FormData(); formData.append('soilReport', soilReport);

        try {
            const res = await fetch('http://localhost:5000/api/fields/analyze-soil', {
                method: 'POST', credentials: 'include', body: formData
            });
            const data = await res.json();
            
            if (res.ok) {
                setTempReportUrl(data.tempReportUrl);
                setAiAnalysis(data.analysis);
                setCurrentStep(3);
            } else if (res.status === 429) {
                setFormError('Quota Exceeded: The daily free-tier limit for AI analysis has been reached.');
                setCurrentStep(1);
            } else {
                setFormError(data.message); setCurrentStep(1);
            }
        } catch (err) { setFormError('Network error. Please check your connection.'); setCurrentStep(1); } finally { setIsSubmitting(false); }
    }

    const handleCreateField = async (e) => {
        e.preventDefault();
        const finalCrop = customCrop.trim() !== '' ? customCrop.trim() : selectedCrop;
        if (!finalCrop || finalCrop.length < 2) return setFormError('You must specify a valid crop to plant.');
        
        setFormError(''); setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', fieldName.trim()); formData.append('size', fieldSize);
        formData.append('image', fieldImage); formData.append('selectedCrop', finalCrop);
        formData.append('soilTestReportUrl', tempReportUrl);
        formData.append('soilDataStr', JSON.stringify({ pH: aiAnalysis.pH, NPK: aiAnalysis.NPK }));

        try {
            const response = await fetch('http://localhost:5000/api/fields', {
                method: 'POST', credentials: 'include', body: formData
            });
            const data = await response.json();
            if (response.ok) {
                setFields([data.field, ...fields]);
                setIsModalOpen(false);
            } else if (response.status === 429) {
                setFormError('Quota Exceeded: Unable to calculate nutrients. The daily limit has been reached.');
            } else {
                setFormError(data.message);
            }
        } catch (err) { setFormError('Network error. Please check your connection.'); } finally { setIsSubmitting(false); }
    };

    const handlePlant = async (id) => {
        if(!window.confirm("Mark this field as physically planted today?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/fields/${id}/plant`, { method: 'PUT', credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setFields(fields.map(f => f._id === id ? data.field : f));
            }
        } catch(e) {}
    }

    const setPreference = async (fieldId, index, type) => {
        try {
            const res = await fetch(`http://localhost:5000/api/fields/${fieldId}/schedule/${index}/select`, {
                method: 'PUT', headers: {'Content-Type': 'application/json'}, credentials: 'include',
                body: JSON.stringify({ selectedType: type })
            });
            if (res.ok) {
                const data = await res.json();
                setFields(fields.map(f => f._id === fieldId ? data.field : f));
            }
        } catch(e){}
    }

    const markStageApplied = async (fieldId, index) => {
        try {
            const res = await fetch(`http://localhost:5000/api/fields/${fieldId}/schedule/${index}/apply`, {
                method: 'PUT', credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setFields(fields.map(f => f._id === fieldId ? data.field : f));
            }
        } catch(e){}
    }

    const handleFieldAction = async (e) => {
        e.preventDefault();
        const { type, field, input } = actionModal;
        setFormError('');

        if (type === 'rename' && input.trim().length < 3) return setFormError("Field name must be at least 3 characters.");
        if (type === 'harvest' && (isNaN(parseFloat(input)) || parseFloat(input) < 0)) return setFormError("Yield must be a valid positive number.");
        if (type === 'failure' && input.trim().length < 10) return setFormError("Please provide a reason of at least 10 characters.");

        let url = '';
        let opt = { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' } };

        if (type === 'rename') {
            opt.method = 'PATCH'; url = `http://localhost:5000/api/fields/${field._id}`; opt.body = JSON.stringify({ name: input.trim() });
        } else if (type === 'harvest') {
            url = `http://localhost:5000/api/fields/${field._id}/harvest`; opt.body = JSON.stringify({ actualYield: input });
        } else if (type === 'failure') {
            url = `http://localhost:5000/api/fields/${field._id}/failure`; opt.body = JSON.stringify({ failureReason: input.trim() });
        } else if (type === 'delete') {
            opt.method = 'DELETE'; url = `http://localhost:5000/api/fields/${field._id}`; delete opt.body;
        }

        try {
            const res = await fetch(url, opt);
            if (res.ok) {
                if (type === 'delete') setFields(fields.filter(f => f._id !== field._id));
                else {
                    const data = await res.json();
                    setFields(fields.map(f => f._id === field._id ? data.field : f));
                }
                setActionModal({ type: null, field: null, input: '' });
            }
        } catch(err) {}
    }

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <Leaf className="w-12 h-12 text-green-600 animate-pulse" />
                <p className="text-gray-500 font-medium">Loading AgriBrain...</p>
            </div>
        </div>
    );

    const renderStepContent = () => {
        if (currentStep === 1) return (
            <form onSubmit={handleAnalyzeSoil} className='flex flex-col gap-5'>
                <p className="text-sm text-gray-500 mb-2">Upload your soil lab report to generate an AI-powered fertilization schedule.</p>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Plot Name</label>
                    <input value={fieldName} onChange={e => setFieldName(e.target.value)} type="text" placeholder="e.g. North Acre Wheat" className='w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all' />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Size (Acres)</label>
                    <input value={fieldSize} onChange={e => setFieldSize(e.target.value)} type="number" step="0.1" placeholder="e.g. 1.5" className='w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all' />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Field Photo</label>
                    <input type="file" accept="image/*" onChange={e => setFieldImage(e.target.files[0])} className='w-full border border-dashed border-gray-300 p-3 rounded-xl text-sm bg-gray-50 text-gray-600 focus:outline-none focus:border-green-500' />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Soil Lab Report (PDF/Image)</label>
                    <input type="file" accept=".pdf,image/*" onChange={e => setSoilReport(e.target.files[0])} className='w-full border border-dashed border-amber-300 p-3 rounded-xl text-sm bg-amber-50/50 text-amber-800 focus:outline-none focus:border-amber-500' />
                </div>
                <button type="submit" className='w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3.5 rounded-xl text-white font-bold mt-4 shadow-lg shadow-green-600/20 transition-all flex justify-center items-center gap-2'>
                    Analyze Soil Profile <ArrowRight className="w-5 h-5" />
                </button>
            </form>
        );
        else if (currentStep === 2) return (
            <div className="flex flex-col items-center py-12">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-200 rounded-full blur-xl animate-pulse"></div>
                    <Beaker className="w-16 h-16 text-green-600 relative z-10 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mt-6">AI is scanning your soil report...</h3>
                <p className="text-gray-500 text-sm mt-2">Extracting NPK levels and generating schedules.</p>
            </div>
        );
        else return (
            <form onSubmit={handleCreateField} className='flex flex-col gap-6 animate-in fade-in zoom-in-95'>
                <div className="bg-amber-50 p-5 border border-amber-100/50 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 className="w-16 h-16 text-amber-900" /></div>
                    <div className="flex items-center gap-2 text-amber-900 font-bold mb-1 relative z-10">
                        <FileText className="w-5 h-5" /> Extracted Soil Data
                    </div>
                    <div className="flex gap-4 font-black text-amber-900 text-lg relative z-10">
                        <span className="bg-white/80 px-3 py-1.5 rounded-xl shadow-sm border border-amber-100/50">pH {aiAnalysis.pH}</span>
                        <span className="bg-white/80 px-3 py-1.5 rounded-xl shadow-sm border border-amber-100/50">N {aiAnalysis.NPK?.N}</span>
                        <span className="bg-white/80 px-3 py-1.5 rounded-xl shadow-sm border border-amber-100/50">P {aiAnalysis.NPK?.P}</span>
                        <span className="bg-white/80 px-3 py-1.5 rounded-xl shadow-sm border border-amber-100/50">K {aiAnalysis.NPK?.K}</span>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 mb-3">AI Crop Recommendations</h4>
                    <div className="flex gap-2 flex-wrap">
                        {aiAnalysis?.suggestedCrops?.map(crop => (
                            <button type="button" key={crop} onClick={() => { setSelectedCrop(crop); setCustomCrop(''); }} className={`px-4 py-2 border-2 rounded-xl font-bold transition-all ${selectedCrop === crop && !customCrop ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-600 hover:border-green-200'}`}>{crop}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Or plant something else:</label>
                    <input value={customCrop} onChange={e => { setCustomCrop(e.target.value); setSelectedCrop(''); }} placeholder="Type a custom crop name..." className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" />
                </div>
                <button type="submit" disabled={isSubmitting} className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg mt-2 transition-all ${isSubmitting ? 'bg-gray-400 cursor-wait' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-600/20 hover:-translate-y-0.5'}`}>
                    {isSubmitting ? 'Finalizing Setup...' : 'Lock Field & Save'}
                </button>
            </form>
        );
    }

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
                    <button className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all ${isSidebarOpen ? 'bg-green-50 text-green-700' : 'justify-center text-green-700 bg-green-50'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        {isSidebarOpen && <span>My Fields</span>}
                    </button>
                    <button onClick={() => navigate('/soil')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all ${!isSidebarOpen && 'justify-center'}`}>
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
            <main className="flex-1 flex flex-col h-screen overflow-y-auto relative scroll-smooth">
                
                {/* Top Header / Hero Section */}
                <div className="relative bg-white border-b border-gray-100 pb-16">
                    <div className="absolute inset-0 overflow-hidden h-48">
                        <img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop" alt="Farm Banner" className="w-full h-full object-cover opacity-[0.15] mix-blend-luminosity" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
                    </div>
                    
                    <div className="relative z-10 px-6 lg:px-10 pt-6 flex justify-between items-center">
                        <div className="flex items-center gap-4 lg:hidden">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                                <Leaf className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black text-gray-900 tracking-tight">AgriBrain</span>
                        </div>
                        <div className="hidden lg:block"></div> {/* Spacer for desktop layout */}

                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm relative">
                                    <Bell className="w-5 h-5 text-gray-600" />
                                    {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{unreadCount}</span>}
                                </button>
                                {showNotifs && (
                                    <div className="absolute right-0 top-12 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-gray-50/80 backdrop-blur-sm p-4 border-b font-bold text-gray-900 flex justify-between items-center">
                                            <span>Notifications</span>
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">{unreadCount} new</span>
                                        </div>
                                        <div className="max-h-[350px] overflow-y-auto">
                                            {notifications.length === 0 ? <p className="p-8 text-center text-gray-400 text-sm">You're all caught up.</p> :
                                                notifications.map(n => (
                                                    <div key={n._id} onClick={() => handleReadNotification(n._id, n.type)} className={`p-4 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/30 hover:bg-blue-50/60' : 'hover:bg-gray-50'}`}>
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <h4 className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                                                                {n.type === 'announcement' && <span className="text-blue-500 mr-1">📢</span>}
                                                                {n.title}
                                                            </h4>
                                                            {!n.isRead && n.type === 'alert' && <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>}
                                                        </div>
                                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile Menu */}
                            <div className="relative hidden sm:block">
                                <button
                                    onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                                    className="h-10 pl-3 pr-4 rounded-xl bg-white border border-gray-200 flex items-center gap-3 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs uppercase">
                                        {user?.email?.[0] || 'U'}
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 max-w-[120px] truncate">{user?.email}</span>
                                </button>
                                {showProfile && (
                                    <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <div className="p-2">
                                            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2">
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 px-6 lg:px-10 mt-12 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
                        <div>
                            <h2 className='text-3xl lg:text-4xl font-black text-gray-900 tracking-tight'>Cultivated Fields</h2>
                            <p className="text-gray-500 font-medium mt-1">Manage and track your active growing cycles.</p>
                        </div>
                        <button onClick={openModal} className='bg-gray-900 hover:bg-black px-6 py-3.5 rounded-xl text-white font-bold shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 whitespace-nowrap w-full sm:w-auto'>
                            <Plus className="w-5 h-5" /> Create Smart Field
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="px-6 lg:px-10 py-8 relative z-20 -mt-6">
                    {fields.length === 0 && !loading && (
                        <div className="bg-white border border-gray-100 rounded-[32px] p-12 text-center shadow-sm flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                <Leaf className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">No fields added yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">Start tracking your farm by creating your first smart field. Upload a soil report and let AI generate your optimal schedule.</p>
                            <button onClick={openModal} className='bg-green-600 hover:bg-green-700 px-8 py-3.5 rounded-xl text-white font-bold shadow-lg shadow-green-600/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5'>
                                <Plus className="w-5 h-5" /> Create Smart Field
                            </button>
                        </div>
                    )}

                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10'>
                        {fields.map(field => {
                            const upcomingIdx = field.fertilizationSchedule?.findIndex(s => s.status !== 'applied');
                            const upcoming = upcomingIdx !== -1 && field.fertilizationSchedule ? field.fertilizationSchedule[upcomingIdx] : null;
                            const totalStages = field.fertilizationSchedule?.length || 1;
                            const appliedStages = field.fertilizationSchedule?.filter(s => s.status === 'applied').length || 0;
                            const progressPct = Math.round((appliedStages / totalStages) * 100);

                            return (
                                <div
                                    key={field._id}
                                    onClick={() => navigate(`/fields/${field._id}`)}
                                    className='bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-gray-200 flex flex-col cursor-pointer transition-all duration-300 group h-full'
                                >
                                    {/* Card Header Image */}
                                    <div className='w-full h-48 bg-gray-100 relative shrink-0 overflow-hidden'>
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
                                        <img src={field.imageUrl} alt={field.name} className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out' />
                                        
                                        {/* Status Badges */}
                                        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                                            {field.status === 'harvested' ? (
                                                <div className="bg-indigo-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                                    <Pickaxe size={14} /> Harvested
                                                </div>
                                            ) : field.status === 'failure' ? (
                                                <div className="bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                                    <ShieldAlert size={14} /> Failed
                                                </div>
                                            ) : (
                                                <div className="bg-white/95 backdrop-blur-md text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-gray-100/50">
                                                    {upcoming ? (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                                            Next: {upcoming.stageName}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                            Completed
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Card Content */}
                                    <div className={`p-6 flex flex-col flex-1 relative ${field.status === 'failure' ? 'bg-rose-50/20' : field.status === 'harvested' ? 'bg-indigo-50/10' : 'bg-white'}`}>
                                        
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black text-green-600 tracking-widest uppercase bg-green-50 px-2.5 py-1 rounded-md">
                                                {field.size} Acres
                                            </span>
                                            
                                            {/* Action Menu */}
                                            <div className="relative -mt-1 -mr-2">
                                                <button 
                                                    className="text-gray-400 hover:text-gray-900 p-2 rounded-xl transition-colors hover:bg-gray-100" 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === field._id ? null : field._id); }}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                {activeMenuId === field._id && (
                                                    <div className="absolute right-0 top-10 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30 animate-in fade-in slide-in-from-top-1">
                                                        <button onClick={(e) => { e.stopPropagation(); setActionModal({type: 'rename', field, input: field.name}); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"><Edit2 size={16} className="text-gray-400"/> Rename</button>
                                                        <button onClick={(e) => { e.stopPropagation(); generateFieldAuditPDF(field); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"><FileText size={16} className="text-gray-400"/> Get Audit PDF</button>
                                                        <div className="border-t border-gray-100 my-1.5"></div>
                                                        <button onClick={(e) => { e.stopPropagation(); setActionModal({type: 'harvest', field, input: ''}); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2.5"><Pickaxe size={16}/> Mark Harvested</button>
                                                        <button onClick={(e) => { e.stopPropagation(); setActionModal({type: 'failure', field, input: ''}); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"><ShieldAlert size={16}/> Mark Failure</button>
                                                        <div className="border-t border-gray-100 my-1.5"></div>
                                                        <button onClick={(e) => { e.stopPropagation(); setActionModal({type: 'delete', field, input: ''}); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5"><Trash2 size={16}/> Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className='text-xl font-black text-gray-900 mb-4 line-clamp-1'>{field.name}</h3>

                                        <div className="flex gap-2.5 mb-auto flex-wrap">
                                            <div className="bg-gray-50 border border-gray-100 text-gray-600 text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                                {field.plantingDate ? new Date(field.plantingDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Unplanted'}
                                            </div>
                                            <div className="bg-green-50 border border-green-100 text-green-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                                <Leaf size={12} className="text-green-600"/> {field.selectedCrop}
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-5 border-t border-gray-100">
                                            {field.status === 'harvested' ? (
                                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-indigo-800/60 text-[10px] font-black uppercase tracking-wider">Expected</span>
                                                        <span className="text-indigo-800/60 text-[10px] font-black uppercase tracking-wider">Actual</span>
                                                    </div>
                                                    <div className="flex justify-between items-end font-black mb-1.5">
                                                        <span className="text-gray-400 line-through text-sm">{field.estimatedYieldRaw} <span className="text-[10px]">{field.yieldUnit}</span></span>
                                                        <span className="text-indigo-700 text-lg leading-none">{field.actualYield || 0} <span className="text-[10px]">{field.yieldUnit}</span></span>
                                                    </div>
                                                    <div className={`text-xs font-bold text-right ${(field.actualYield || 0) >= field.estimatedYieldRaw ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        {((field.actualYield || 0) - field.estimatedYieldRaw) >= 0 ? '+' : ''}{Math.round(((field.actualYield || 0) - field.estimatedYieldRaw) * 10) / 10} diff
                                                    </div>
                                                </div>
                                            ) : field.status === 'failure' ? (
                                                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4">
                                                    <div className="flex justify-between items-end font-black">
                                                        <div>
                                                            <span className="text-rose-800/60 text-[10px] font-black uppercase tracking-wider block mb-1">Expected</span>
                                                            <span className="text-gray-400 line-through text-sm">{field.estimatedYieldRaw} <span className="text-[10px]">{field.yieldUnit}</span></span>
                                                        </div>
                                                        <span className="text-rose-600 text-lg leading-none">-100% Loss</span>
                                                    </div>
                                                </div>
                                            ) : !field.plantingDate ? (
                                                <button onClick={(e) => { e.stopPropagation(); handlePlant(field._id); }} className="w-full bg-white hover:bg-green-50 text-green-700 border border-green-200 text-sm font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors">
                                                   Mark as Planted
                                                </button>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">
                                                            {upcoming ? `Stage Progress` : 'Completed'}
                                                        </span>
                                                        <span className="text-[12px] font-black text-green-600">{progressPct}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mb-4">
                                                        <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                                                    </div>
                                                    
                                                    {upcoming && (upcoming.status === 'pending' || upcoming.status === 'notified') && (
                                                        <div className="flex gap-2">
                                                            {!upcoming.selectedType ? (
                                                                <>
                                                                    <button onClick={(e) => { e.stopPropagation(); setPreference(field._id, upcomingIdx, 'organic'); }} className="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold py-2.5 rounded-xl transition-colors border border-emerald-200">Organic</button>
                                                                    <button onClick={(e) => { e.stopPropagation(); setPreference(field._id, upcomingIdx, 'chemical'); }} className="flex-1 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold py-2.5 rounded-xl transition-colors border border-blue-200">Chemical</button>
                                                                </>
                                                            ) : (
                                                                <button onClick={(e) => { e.stopPropagation(); markStageApplied(field._id, upcomingIdx); }} className="w-full bg-gray-900 hover:bg-black text-white text-xs font-bold py-3 rounded-xl transition-colors shadow-sm">
                                                                    Mark Applied
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Action Modals */}
            {actionModal.type && (
                <div className='fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4' onClick={() => setActionModal({type: null, field: null, input: ''})}>
                    <div className='bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95' onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <h2 className='text-2xl font-black text-gray-900'>
                                {actionModal.type === 'rename' && 'Rename Field'}
                                {actionModal.type === 'harvest' && 'Mark Harvested'}
                                {actionModal.type === 'failure' && 'Mark Crop Failure'}
                                {actionModal.type === 'delete' && 'Delete Field'}
                            </h2>
                            <button onClick={() => setActionModal({type: null, field: null, input: ''})} className="text-gray-400 hover:text-gray-700 bg-gray-50 rounded-full p-1"><X className="w-5 h-5"/></button>
                        </div>

                        {formError && <div className='mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2'><ShieldAlert size={16}/> {formError}</div>}
                        
                        <form onSubmit={handleFieldAction} className="flex flex-col gap-4">
                            {actionModal.type === 'delete' ? (
                                <p className="text-gray-600 mb-2 font-medium">Are you sure you want to permanently delete <strong>{actionModal.field.name}</strong>? This cannot be undone.</p>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {actionModal.type === 'rename' && 'New Field Name'}
                                        {actionModal.type === 'harvest' && `Actual Yield (${actionModal.field.yieldUnit || 'units'})`}
                                        {actionModal.type === 'failure' && 'Reason for Failure'}
                                    </label>
                                    <input 
                                        autoFocus
                                        type={actionModal.type === 'harvest' ? 'number' : 'text'}
                                        required={actionModal.type !== 'rename'}
                                        value={actionModal.input}
                                        onChange={e => setActionModal({...actionModal, input: e.target.value})}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                        placeholder={actionModal.type === 'failure' ? 'e.g., Heavy rainfall, Pest attack' : ''}
                                    />
                                </div>
                            )}

                            <button type="submit" className={`w-full py-3.5 font-bold text-white rounded-xl shadow-lg mt-2 transition-all ${actionModal.type === 'delete' || actionModal.type === 'failure' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-gray-900 hover:bg-black shadow-gray-900/20'}`}>
                                {actionModal.type === 'delete' ? 'Permanently Delete' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Smart Field Setup Modal */}
            {isModalOpen && (
                <div className='fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4'>
                    <div className='bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95'>
                        <div className='flex justify-between items-center mb-6'>
                            <h2 className='text-2xl font-black text-gray-900 flex items-center gap-2'>
                                {currentStep === 1 ? <><Leaf className="text-green-600" /> New Smart Field</> : currentStep === 2 ? 'Analyzing Report' : 'Confirm Setup'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className='text-gray-400 hover:text-red-500 transition-colors p-1 bg-gray-50 rounded-full'>
                                <X className="w-5 h-5"/>
                            </button>
                        </div>
                        {formError && <div className='mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-start gap-2'><ShieldAlert size={16}/> {formError}</div>}
                        {renderStepContent()}
                    </div>
                </div>
            )}
        </div>
    )
}
