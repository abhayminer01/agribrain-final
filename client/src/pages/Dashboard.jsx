import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Edit2, FileText, Pickaxe, ShieldAlert, Trash2 } from 'lucide-react';
import { generateFieldAuditPDF } from '../utils/pdfGenerator';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fields, setFields] = useState([]);
    
    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // Smart Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Field Actions Modal State
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [actionModal, setActionModal] = useState({ type: null, field: null, input: '' });
    const [currentStep, setCurrentStep] = useState(1);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data - Step 1
    const [fieldName, setFieldName] = useState('');
    const [fieldSize, setFieldSize] = useState('');
    const [fieldImage, setFieldImage] = useState(null);
    const [soilReport, setSoilReport] = useState(null);

    // AI Form Data - Step 2/3
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
            const res = await fetch('http://localhost:5000/api/notifications', { credentials: 'include' });
            if(res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
            }
        } catch(err) {}
    }

    const handleReadNotification = async (id) => {
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
        if (!fieldName || !fieldSize || !fieldImage || !soilReport) return setFormError("Missing required fields.");
        
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
                setFormError('⚠️ AI Quota Exceeded: The daily free-tier limit for AI analysis has been reached. Please try again tomorrow or contact support.');
                setCurrentStep(1);
            } else {
                setFormError(data.message); setCurrentStep(1);
            }
        } catch (err) { setFormError('Network error. Please check your connection.'); setCurrentStep(1); } finally { setIsSubmitting(false); }
    }

    const handleCreateField = async (e) => {
        e.preventDefault();
        const finalCrop = customCrop.trim() !== '' ? customCrop : selectedCrop;
        if (!finalCrop) return setFormError('You must select or type a crop to plant.');
        
        setFormError(''); setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', fieldName); formData.append('size', fieldSize);
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
                setFormError('⚠️ AI Quota Exceeded: Unable to calculate nutrients. The daily free-tier limit has been reached. Please try again tomorrow.');
            } else {
                setFormError(data.message);
            }
        } catch (err) { setFormError('Network error. Please check your connection.'); } finally { setIsSubmitting(false); }
    };

    const handlePlant = async (id) => {
        if(!window.confirm("Mark this field as physically planted today?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/fields/${id}/plant`, {
                method: 'PUT', credentials: 'include'
            });
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
        let url = '';
        let opt = { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' } };

        if (type === 'rename') {
            opt.method = 'PATCH';
            url = `http://localhost:5000/api/fields/${field._id}`;
            opt.body = JSON.stringify({ name: input });
        } else if (type === 'harvest') {
            url = `http://localhost:5000/api/fields/${field._id}/harvest`;
            opt.body = JSON.stringify({ actualYield: input });
        } else if (type === 'failure') {
            url = `http://localhost:5000/api/fields/${field._id}/failure`;
            opt.body = JSON.stringify({ failureReason: input });
        } else if (type === 'delete') {
            opt.method = 'DELETE';
            url = `http://localhost:5000/api/fields/${field._id}`;
            delete opt.body;
        }

        try {
            const res = await fetch(url, opt);
            if (res.ok) {
                if (type === 'delete') {
                    setFields(fields.filter(f => f._id !== field._id));
                } else {
                    const data = await res.json();
                    setFields(fields.map(f => f._id === field._id ? data.field : f));
                }
                setActionModal({ type: null, field: null, input: '' });
            }
        } catch(err) {}
    }

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-green-800">Booting Agri Brain...</div>;

    const renderStepContent = () => {
        if (currentStep === 1) return (
            <form onSubmit={handleAnalyzeSoil} className='flex flex-col gap-4'>
                <p className="text-sm text-gray-500 mb-2">Basic parameters and soil context.</p>
                <input value={fieldName} onChange={e => setFieldName(e.target.value)} type="text" placeholder="Plot Name" required className='border p-3 rounded-lg focus:ring-2 focus:ring-green-200 outline-none' />
                <input value={fieldSize} onChange={e => setFieldSize(e.target.value)} type="number" step="0.1" placeholder="Size in Acres" required className='border p-3 rounded-lg focus:ring-2 focus:ring-green-200 outline-none' />
                <label className='text-sm font-bold text-gray-700 -mb-2 mt-2'>Field Photo</label>
                <input type="file" accept="image/*" onChange={e => setFieldImage(e.target.files[0])} required className='border border-dashed p-3 rounded-lg text-sm bg-gray-50' />
                <label className='text-sm font-bold text-gray-700 -mb-2 mt-2'>Soil Lab Report</label>
                <input type="file" accept=".pdf,image/*" onChange={e => setSoilReport(e.target.files[0])} required className='border border-dashed p-3 rounded-lg text-sm bg-amber-50' />
                <button type="submit" className='bg-green-700 hover:bg-green-800 py-3 rounded-lg text-white font-bold mt-4'>Analyze Soil Profile ›</button>
            </form>
        );
        else if (currentStep === 2) return (
            <div className="flex flex-col items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-500 mb-6"></div>
                <h3 className="text-xl font-bold text-gray-800 text-center">AI is scanning your soil report...</h3>
            </div>
        );
        else return (
            <form onSubmit={handleCreateField} className='flex flex-col gap-6'>
                <div className="bg-amber-50 p-4 border border-amber-100 rounded-xl text-amber-900 text-sm flex gap-4 font-bold">
                    <span>pH: {aiAnalysis.pH}</span><span>N: {aiAnalysis.NPK?.N}</span><span>P: {aiAnalysis.NPK?.P}</span><span>K: {aiAnalysis.NPK?.K}</span>
                </div>
                <div>
                    <h4 className="font-bold text-gray-700 mb-3">AI Suggestions</h4>
                    <div className="flex gap-2 flex-wrap">
                        {aiAnalysis?.suggestedCrops?.map(crop => (
                            <button type="button" key={crop} onClick={() => { setSelectedCrop(crop); setCustomCrop(''); }} className={`px-4 py-2 border rounded-full font-bold ${selectedCrop === crop && !customCrop ? 'bg-green-700 text-white' : 'bg-white text-gray-600'}`}>{crop}</button>
                        ))}
                    </div>
                </div>
                <input value={customCrop} onChange={e => { setCustomCrop(e.target.value); setSelectedCrop(''); }} placeholder="Or type a custom crop..." className="border p-3 rounded-lg" />
                <button type="submit" disabled={isSubmitting} className={`bg-green-700 py-3 rounded-lg text-white font-bold ${isSubmitting && 'opacity-70'}`}>
                    {isSubmitting ? 'Calculating Nutrients...' : 'Lock Field & Save'}
                </button>
            </form>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 p-10 font-sans'>
            <div className='flex justify-between items-center mb-8 pb-5 border-b border-gray-200'>
                <div>
                    <h1 className='text-4xl font-black text-green-800'>Agri Brain Dashboard</h1>
                    <p className='text-gray-600 mt-2 font-medium'>Logged in as <span className="text-gray-900">{user?.email}</span></p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <div className="relative">
                        <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }} className="bg-white border rounded-full p-3 shadow-sm hover:bg-gray-50 relative">
                            🔔
                            {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                        </button>
                        {showNotifs && (
                            <div className="absolute right-0 top-12 w-80 bg-white border rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="bg-gray-100 p-3 border-b font-bold text-gray-700">Inbox ({unreadCount})</div>
                                <div className="max-h-96 overflow-y-auto p-2">
                                    {notifications.length === 0 ? <p className="p-4 text-center text-gray-500 text-sm">No new alerts.</p> :
                                        notifications.map(n => (
                                            <div key={n._id} onClick={() => handleReadNotification(n._id)} className={`p-3 border-b last:border-0 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/50 hover:bg-blue-50' : 'opacity-60 hover:bg-gray-50'}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-sm ${!n.isRead ? 'font-bold text-blue-900' : 'font-medium text-gray-700'}`}>{n.title}</h4>
                                                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>}
                                                </div>
                                                <p className="text-xs text-gray-600 leading-snug">{n.message}</p>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Avatar */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-800 flex items-center justify-center text-white font-black text-lg shadow-sm hover:shadow-md transition-all border-2 border-white"
                            title={user?.email}
                        >
                            {user?.email?.[0]?.toUpperCase() ?? 'U'}
                        </button>
                        {showProfile && (
                            <div className="absolute right-0 top-12 w-52 bg-white border rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 border-b">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Signed in as</p>
                                    <p className="text-sm font-bold text-gray-800 truncate mt-0.5">{user?.email}</p>
                                </div>
                                <div className="p-1.5">
                                    <button
                                        onClick={() => { setShowProfile(false); navigate('/manage-fields'); }}
                                        className="w-full text-left px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        🚜 Manage Fields
                                    </button>
                                    <div className="border-t my-1" />
                                    <button
                                        onClick={() => { setShowProfile(false); handleLogout(); }}
                                        className="w-full text-left px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        ↩ Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={handleLogout} className='bg-red-50 text-red-600 px-5 py-2 rounded-lg font-bold text-sm'>Logout</button>
                </div>
            </div>

            <div className='flex gap-4 mb-8 overflow-x-auto items-center pb-2'>
                <button className='px-5 py-2.5 font-bold bg-green-700 text-white rounded-xl shadow-sm'>🚜 Fields Overview</button>
                <button onClick={() => navigate('/disease')} className='px-5 py-2.5 font-bold text-emerald-800 bg-emerald-50 rounded-xl'>📷 Scan Crop / Disease</button>
                <button onClick={() => navigate('/soil')} className='px-5 py-2.5 font-bold text-amber-800 bg-amber-50 rounded-xl'>🧪 Analyze Lab Report</button>
                <button onClick={() => navigate('/expert')} className='px-5 py-2.5 font-bold text-indigo-800 bg-indigo-50 rounded-xl'>👨‍🌾 Expert Consultations</button>
            </div>

            <div className='flex justify-between items-center mb-8'>
                <h2 className='text-2xl font-bold text-gray-800'>My Cultivated Fields</h2>
                <button onClick={openModal} className='bg-green-700 hover:bg-green-800 px-6 py-2.5 rounded-lg text-white font-bold shadow-md'>+ Smart Field Setup</button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
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
                            className='bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 flex flex-col cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full min-h-[380px]'
                        >
                            {/* Card Header Image */}
                            <div className='w-full h-[180px] bg-gray-100 relative shrink-0'>
                                <img src={field.imageUrl} alt={field.name} className='w-full h-full object-cover' />
                                {field.status === 'harvested' ? (
                                    <div className="absolute top-4 right-4 bg-indigo-600/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                        <Pickaxe size={14} /> Harvested
                                    </div>
                                ) : field.status === 'failure' ? (
                                    <div className="absolute top-4 right-4 bg-rose-600/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                        <ShieldAlert size={14} /> Failed
                                    </div>
                                ) : (
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-[#1b5e20] text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                        {upcoming ? (
                                            <>
                                                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                Next: {upcoming.stageName}
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                Status: Completed
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Card Content */}
                            <div className={`p-5 flex flex-col flex-1 ${field.status === 'failure' ? 'bg-rose-50/30' : field.status === 'harvested' ? 'bg-indigo-50/20' : 'bg-white'}`}>
                                <div className="flex justify-between items-start mb-1.5">
                                    <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                                        {field.size} ACRES • FIELD
                                    </span>
                                    <div className="relative">
                                        <button 
                                            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1 rounded-full transition-colors" 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === field._id ? null : field._id); }}
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {activeMenuId === field._id && (
                                            <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-20">
                                                <button onClick={(e) => { e.stopPropagation(); setActionModal({type: 'rename', field, input: field.name}); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Edit2 size={15}/> Rename</button>
                                                <button onClick={(e) => { e.stopPropagation(); generateFieldAuditPDF(field); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"><FileText size={15}/> Get Audit PDF</button>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <button onClick={(e) => { e.stopPropagation(); setActionModal({type: 'harvest', field, input: ''}); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"><Pickaxe size={15}/> Mark Harvested</button>
                                                <button onClick={(e) => { e.stopPropagation(); setActionModal({type: 'failure', field, input: ''}); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2"><ShieldAlert size={15}/> Mark Failure</button>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <button onClick={(e) => { e.stopPropagation(); setActionModal({type: 'delete', field, input: ''}); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={15}/> Delete</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h3 className='text-xl font-bold text-gray-900 mb-4 line-clamp-1'>{field.name}</h3>

                                <div className="flex gap-2.5 mb-auto">
                                    <div className="bg-gray-100/80 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        {field.plantingDate ? new Date(field.plantingDate).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : 'Not Planted'}
                                    </div>
                                    <div className="bg-green-100/60 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                                        {field.selectedCrop}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    {field.status === 'harvested' ? (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-indigo-800/70 text-xs font-bold uppercase tracking-wider">Expected</span>
                                                <span className="text-indigo-800/70 text-xs font-bold uppercase tracking-wider">Actual</span>
                                            </div>
                                            <div className="flex justify-between items-end font-black mb-1.5">
                                                <span className="text-gray-400 line-through text-sm">{field.estimatedYieldRaw} <span className="text-[10px] font-bold">{field.yieldUnit}</span></span>
                                                <span className="text-indigo-700 text-lg leading-none flex items-center gap-1.5"><Pickaxe size={16}/> {field.actualYield || 0} <span className="text-[10px] font-bold">{field.yieldUnit}</span></span>
                                            </div>
                                            <div className={`text-xs font-bold text-right ${(field.actualYield || 0) >= field.estimatedYieldRaw ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {((field.actualYield || 0) - field.estimatedYieldRaw) >= 0 ? '+' : ''}{Math.round(((field.actualYield || 0) - field.estimatedYieldRaw) * 10) / 10} {field.yieldUnit} difference
                                            </div>
                                        </div>
                                    ) : field.status === 'failure' ? (
                                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-rose-800/70 text-xs font-bold uppercase tracking-wider">Expected</span>
                                                <span className="text-rose-800/70 text-xs font-bold uppercase tracking-wider">Loss</span>
                                            </div>
                                            <div className="flex justify-between items-end font-black">
                                                <span className="text-gray-400 line-through text-sm">{field.estimatedYieldRaw} <span className="text-[10px] font-bold">{field.yieldUnit}</span></span>
                                                <span className="text-rose-700 text-lg leading-none">-100%</span>
                                            </div>
                                            <div className="text-rose-900 font-bold text-[11px] mt-2 pt-2 border-t border-rose-200/60 leading-tight">
                                                {field.failureReason ? `Reason: ${field.failureReason}` : 'No reason provided.'}
                                            </div>
                                        </div>
                                    ) : !field.plantingDate ? (
                                        <button onClick={(e) => { e.stopPropagation(); handlePlant(field._id); }} className="w-full bg-[#1b5e20] hover:bg-green-800 text-white text-sm font-bold py-2.5 rounded-xl flex justify-center items-center gap-2 transition-colors">
                                           🌱 Mark Planted
                                        </button>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-end mb-2.5">
                                                <span className="text-[13px] font-bold text-gray-600 truncate mr-2">
                                                    {upcoming ? `Next: ${upcoming.stageName}` : 'Growth Stage: Maturity'}
                                                </span>
                                                <span className="text-[13px] font-black text-[#1b5e20]">{progressPct}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200/80 rounded-full h-[8px] overflow-hidden mb-3">
                                                <div className="bg-[#1b5e20] h-full rounded-full" style={{ width: `${progressPct}%` }}></div>
                                            </div>
                                            
                                            {upcoming && (upcoming.status === 'pending' || upcoming.status === 'notified') && (
                                                <div className="flex gap-2">
                                                    {!upcoming.selectedType ? (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); setPreference(field._id, upcomingIdx, 'organic'); }} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold py-1.5 rounded-lg transition-colors border border-emerald-100/50">🍃 Organic</button>
                                                            <button onClick={(e) => { e.stopPropagation(); setPreference(field._id, upcomingIdx, 'chemical'); }} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold py-1.5 rounded-lg transition-colors border border-blue-100/50">🧪 Chemical</button>
                                                        </>
                                                    ) : (
                                                        <button onClick={(e) => { e.stopPropagation(); markStageApplied(field._id, upcomingIdx); }} className="w-full bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold py-1.5 rounded-lg border border-green-200 transition-colors">
                                                            ✓ Mark Applied
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

            {actionModal.type && (
                <div className='fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4' onClick={() => setActionModal({type: null, field: null, input: ''})}>
                    <div className='bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl' onClick={e => e.stopPropagation()}>
                        <h2 className='text-2xl font-black text-gray-800 mb-6'>
                            {actionModal.type === 'rename' && 'Rename Field'}
                            {actionModal.type === 'harvest' && 'Mark Harvested'}
                            {actionModal.type === 'failure' && 'Mark Crop Failure'}
                            {actionModal.type === 'delete' && 'Delete Field'}
                        </h2>
                        
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
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-green-400"
                                        placeholder={actionModal.type === 'failure' ? 'e.g., Heavy rainfall, Pest attack' : ''}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setActionModal({type: null, field: null, input: ''})} className="px-5 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className={`px-5 py-2 font-bold text-white rounded-lg shadow-sm transition-colors ${actionModal.type === 'delete' || actionModal.type === 'failure' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'}`}>
                                    {actionModal.type === 'delete' ? 'Delete' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className='fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4'>
                    <div className='bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl'>
                        <div className='flex justify-between items-center mb-6'>
                            <h2 className='text-2xl font-black text-gray-800'>{currentStep === 1 ? 'New Field Setup' : currentStep === 2 ? 'AI Reading Lab Report' : 'Select Crop & Lock'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className='text-gray-400 hover:text-red-500 text-3xl'>&times;</button>
                        </div>
                        {formError && <div className='mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium'>{formError}</div>}
                        {renderStepContent()}
                    </div>
                </div>
            )}
        </div>
    )
}
