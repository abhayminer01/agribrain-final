import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
            } else {
                setFormError(data.message); setCurrentStep(1);
            }
        } catch (err) { setFormError('Network error'); setCurrentStep(1); } finally { setIsSubmitting(false); }
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
            if (response.ok) {
                const data = await response.json();
                setFields([data.field, ...fields]);
                setIsModalOpen(false);
            } else { setFormError((await response.json()).message); }
        } catch (err) { setFormError('Network error'); } finally { setIsSubmitting(false); }
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

            <div className='flex flex-col gap-10'>
                {fields.map(field => (
                    <div
                        key={field._id}
                        onClick={() => navigate(`/fields/${field._id}`)}
                        className='bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex flex-col md:flex-row cursor-pointer hover:shadow-md hover:border-green-200 transition-all duration-200'
                    >
                        {/* Field Image & Core Stats */}
                        <div className='w-full md:w-1/3 min-h-[300px] bg-gray-100 relative group shrink-0'>
                            <img src={field.imageUrl} alt={field.name} className='w-full h-full object-cover absolute inset-0' />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end text-white">
                                <h3 className='text-3xl font-black truncate'>{field.name}</h3>
                                <div className='flex items-center gap-3 font-medium mt-2 text-sm'>
                                    <span>📐 {field.size} Acres</span>
                                    <span className="bg-green-600 px-2 py-0.5 rounded">🌿 {field.selectedCrop}</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/20">
                                    {!field.plantingDate ? (
                                        <button onClick={() => handlePlant(field._id)} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg flex justify-center gap-2">🌱 Mark Field Planted</button>
                                    ) : (
                                        <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                                            <div>
                                                <div className="text-xs text-white/70">Est. Harvest</div>
                                                <div className="font-bold text-emerald-400">{new Date(field.estimatedHarvestDate).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-white/70">Yield Proj.</div>
                                                <div className="font-bold text-amber-400">{field.estimatedYieldRaw} {field.yieldUnit}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Timeline Area */}
                        <div className='p-6 md:p-8 flex-1 bg-gray-50/50'>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-black text-gray-800 text-lg">AI Fertilization Timeline</h4>
                                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Banned Chemistry Filtered</span>
                            </div>

                            <div className="space-y-6 relative border-l-2 border-green-200 ml-4 pb-4">
                                {field.fertilizationSchedule?.map((stage, idx) => {
                                    const isApplied = stage.status === 'applied';
                                    const isPending = stage.status === 'pending' || stage.status === 'notified';
                                    
                                    // Target Date Math for display
                                    let targetDateStr = `Day ${stage.dayOffset}`;
                                    if (field.plantingDate) {
                                        const tDate = new Date(field.plantingDate);
                                        tDate.setDate(tDate.getDate() + stage.dayOffset);
                                        targetDateStr = tDate.toLocaleDateString(undefined, {month:'short', day:'numeric'});
                                    }

                                    return (
                                        <div key={idx} className="relative pl-6">
                                            {/* Timeline Node */}
                                            <span className={`absolute -left-[11px] top-1.5 h-5 w-5 rounded-full border-4 border-white shadow-sm ${isApplied ? 'bg-green-600' : stage.status === 'notified' ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`}></span>
                                            
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h5 className={`font-bold ${isApplied ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{stage.stageName}</h5>
                                                    <p className="text-sm font-black text-green-700">{targetDateStr}</p>
                                                </div>
                                                {isPending && stage.selectedType && (
                                                    <button onClick={() => markStageApplied(field._id, idx)} className="bg-white border border-green-200 text-green-700 hover:bg-green-50 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                                                        ✓ Mark Applied
                                                    </button>
                                                )}
                                                {isApplied && <span className="text-green-600 font-bold text-sm">✓ Done</span>}
                                            </div>

                                            {!isApplied && (
                                                <div className="bg-white border p-3 rounded-xl shadow-sm mt-3">
                                                    <div className="flex gap-2 mb-3 bg-gray-100 p-1 rounded-lg">
                                                        <button 
                                                            onClick={() => setPreference(field._id, idx, 'organic')}
                                                            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${stage.selectedType === 'organic' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                        >🍃 Organic Route</button>
                                                        <button 
                                                            onClick={() => setPreference(field._id, idx, 'chemical')}
                                                            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${stage.selectedType === 'chemical' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                        >🧪 Chemical Route</button>
                                                    </div>

                                                    <div className="text-sm text-gray-600 h-16 overflow-y-auto pr-2">
                                                        {!stage.selectedType ? (
                                                            <div className="text-center text-gray-400 italic py-2">Select a preference to view AI instructions.</div>
                                                        ) : (
                                                            <ul className="list-disc pl-4 space-y-1">
                                                                {stage.options[stage.selectedType]?.map((opt, oIdx) => <li key={oIdx}>{opt}</li>)}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className='fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4'>
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
