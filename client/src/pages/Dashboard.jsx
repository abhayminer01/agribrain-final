import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fields, setFields] = useState([]);
    
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
    const [aiAnalysis, setAiAnalysis] = useState(null); // { soilData, suggestedCrops }
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
                } else {
                    navigate('/');
                }
            } catch (err) {
                navigate('/');
            } finally {
                setLoading(false);
            }
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

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:5000/auth/logout', { method: 'POST', credentials: 'include' });
            navigate('/');
        } catch (err) { }
    };

    const openModal = () => {
        setIsModalOpen(true);
        setCurrentStep(1);
        setFormError('');
        setFieldName(''); setFieldSize(''); setFieldImage(null); setSoilReport(null);
        setAiAnalysis(null); setSelectedCrop(''); setCustomCrop(''); setTempReportUrl('');
    }

    const handleAnalyzeSoil = async (e) => {
        e.preventDefault();
        if (!fieldName || !fieldSize || !fieldImage || !soilReport) {
            return setFormError("Please fill out all required fields including the Soil Report.");
        }
        
        setFormError('');
        setCurrentStep(2); // Loading step
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('soilReport', soilReport);

        try {
            const res = await fetch('http://localhost:5000/api/fields/analyze-soil', {
                method: 'POST', credentials: 'include', body: formData
            });
            const data = await res.json();
            
            if (res.ok) {
                setTempReportUrl(data.tempReportUrl);
                setAiAnalysis(data.analysis); // { pH, NPK, suggestedCrops }
                setCurrentStep(3); // Crop Selection
            } else {
                setFormError(data.message || 'Soil analysis failed. Reverting to Step 1.');
                setCurrentStep(1);
            }
        } catch (err) {
            setFormError('Network error during AI analysis.');
            setCurrentStep(1);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleCreateField = async (e) => {
        e.preventDefault();
        const finalCrop = customCrop.trim() !== '' ? customCrop : selectedCrop;
        if (!finalCrop) return setFormError('You must select or type a crop to plant.');
        
        setFormError('');
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', fieldName);
        formData.append('size', fieldSize);
        formData.append('image', fieldImage);
        formData.append('selectedCrop', finalCrop);
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
            } else {
                const data = await response.json();
                setFormError(data.message || 'Creation failed');
            }
        } catch (err) {
            setFormError('Network error');
        } finally {
            setIsSubmitting(false);
        }
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

    if (loading) return <div className="flex justify-center items-center h-screen font-bold">Loading...</div>;

    const renderStepContent = () => {
        if (currentStep === 1) {
            return (
                <form onSubmit={handleAnalyzeSoil} className='flex flex-col gap-5'>
                    <p className="text-sm text-gray-500 mb-2">Basic field parameters and soil context.</p>
                    
                    <div className='flex flex-col gap-1.5'>
                        <label className='text-sm font-bold text-gray-700'>Field Name</label>
                        <input value={fieldName} onChange={e => setFieldName(e.target.value)} type="text" placeholder="e.g. North Plot" required className='border p-3 rounded-lg focus:ring-2 focus:ring-green-200 outline-none transition-all' />
                    </div>
                    
                    <div className='flex flex-col gap-1.5'>
                        <label className='text-sm font-bold text-gray-700'>Area Size (Acres)</label>
                        <input value={fieldSize} onChange={e => setFieldSize(e.target.value)} type="number" step="0.1" placeholder="15.5" required className='border p-3 rounded-lg focus:ring-2 focus:ring-green-200 outline-none transition-all' />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-sm font-bold text-gray-700'>Field Photo</label>
                        <input type="file" accept="image/*" onChange={e => setFieldImage(e.target.files[0])} required className='border border-dashed p-3 rounded-lg text-sm bg-gray-50' />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label className='text-sm font-bold text-gray-700'>Soil Lab Report (Required for AI)</label>
                        <input type="file" accept=".pdf,image/*" onChange={e => setSoilReport(e.target.files[0])} required className='border border-dashed p-3 rounded-lg text-sm bg-amber-50' />
                    </div>

                    <div className='flex justify-end gap-3 mt-4'>
                        <button type="button" onClick={() => setIsModalOpen(false)} className='px-5 py-2.5 rounded-lg text-gray-600 font-bold'>Cancel</button>
                        <button type="submit" className='bg-green-700 hover:bg-green-800 px-6 py-2.5 rounded-lg text-white font-bold'>Analyze Soil ›</button>
                    </div>
                </form>
            );
        } else if (currentStep === 2) {
            return (
                <div className="flex flex-col items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-500 mb-6"></div>
                    <h3 className="text-xl font-bold text-gray-800 text-center">AI is scanning your soil report...</h3>
                    <p className="text-gray-500 text-sm mt-2">Checking pH and NPK levels to prescribe ideal crops.</p>
                </div>
            )
        } else if (currentStep === 3) {
            return (
                <form onSubmit={handleCreateField} className='flex flex-col gap-6'>
                    
                    <div className="bg-amber-50 p-4 border border-amber-100 rounded-xl">
                        <h4 className="font-bold text-amber-800 mb-2">Detected Soil Profile</h4>
                        <div className="flex justify-between text-sm text-amber-900 border-t border-amber-200 pt-2 mt-2">
                            <span><strong>pH:</strong> {aiAnalysis.pH || 'Unknown'}</span>
                            <span><strong>N:</strong> {aiAnalysis.NPK?.N || '?'}</span>
                            <span><strong>P:</strong> {aiAnalysis.NPK?.P || '?'}</span>
                            <span><strong>K:</strong> {aiAnalysis.NPK?.K || '?'}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-700 mb-3">AI Cultivation Suggestions</h4>
                        <div className="flex gap-2 flex-wrap">
                            {aiAnalysis?.suggestedCrops?.map(crop => (
                                <button 
                                    type="button" 
                                    key={crop}
                                    onClick={() => { setSelectedCrop(crop); setCustomCrop(''); }}
                                    className={`px-4 py-2 border rounded-full font-bold transition-all ${selectedCrop === crop && customCrop === '' ? 'bg-green-700 text-white border-green-700 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {crop}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-gray-500 uppercase">Or Override (Custom Crop)</label>
                        <input 
                            value={customCrop} 
                            onChange={e => { setCustomCrop(e.target.value); setSelectedCrop(''); }} 
                            placeholder="Type manual preference..." 
                            className="border p-3 rounded-lg focus:ring-2 focus:ring-green-200 outline-none"
                        />
                    </div>

                    <div className='flex justify-between mt-4 border-t pt-4'>
                        <button type="button" onClick={() => setCurrentStep(1)} className='px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100'>‹ Restart</button>
                        <button type="submit" disabled={isSubmitting} className={`bg-green-700 hover:bg-green-800 px-6 py-2.5 rounded-lg text-white font-bold ${isSubmitting && 'opacity-70 cursor-wait'}`}>
                            {isSubmitting ? 'Calculating Nutrients...' : 'Lock Field & Save'}
                        </button>
                    </div>
                </form>
            )
        }
    }

    return (
        <div className='min-h-screen bg-gray-50 p-10 font-sans'>
            <div className='flex justify-between items-center mb-10 pb-5 border-b border-gray-200'>
                <div>
                    <h1 className='text-4xl font-black text-green-800 tracking-tight'>Farmer Dashboard</h1>
                    <p className='text-gray-600 mt-2 font-medium'>Welcome back, <span className="text-gray-900">{user?.email}</span></p>
                </div>
                <button onClick={handleLogout} className='bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-lg font-bold transition-colors'>Logout</button>
            </div>

            {/* Quick Navigation Menu */}
            <div className='flex gap-4 mb-8 border-b border-gray-200 pb-5 overflow-x-auto items-center'>
                <button onClick={() => navigate('/dashboard')} className='px-5 py-2.5 font-bold bg-green-700 text-white rounded-xl whitespace-nowrap shadow-sm'>🚜 Fields Overview</button>
                <button onClick={() => navigate('/disease')} className='px-5 py-2.5 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl whitespace-nowrap border border-emerald-100'>📷 Scan Crop / Disease</button>
                <button onClick={() => navigate('/soil')} className='px-5 py-2.5 font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl whitespace-nowrap border border-amber-100'>🧪 Analyze Soil Report</button>
                <button onClick={() => navigate('/expert')} className='px-5 py-2.5 font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl whitespace-nowrap border border-indigo-100'>👨‍🌾 Expert Consultations</button>
                {user?.role === 'Admin' && (
                    <button onClick={() => navigate('/admin')} className='px-5 py-2.5 font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl whitespace-nowrap border border-red-100 ml-auto'>⚙️ System Admin Portal</button>
                )}
            </div>

            <div className='flex justify-between items-center mb-8'>
                <h2 className='text-2xl font-bold text-gray-800'>My Cultivated Fields</h2>
                <button onClick={openModal} className='bg-green-700 hover:bg-green-800 px-6 py-2.5 rounded-lg text-white font-bold transition-all shadow-md flex items-center gap-2'>
                    + Smart Field Setup
                </button>
            </div>

            {fields.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 mb-2">No active fields tracked.</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    {fields.map(field => (
                        <div key={field._id} className='bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex flex-col'>
                            
                            <div className='w-full h-64 bg-gray-100 overflow-hidden relative group'>
                                <img src={field.imageUrl} alt={field.name} className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105' />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-16">
                                    <h3 className='text-2xl font-black text-white truncate'>{field.name}</h3>
                                    <div className='flex items-center gap-3 text-white/90 font-medium mt-1 text-sm'>
                                        <span>📐 {field.size} Acres</span>
                                        <span>•</span>
                                        <span className="bg-green-600/80 px-2 py-0.5 rounded text-white flex items-center shadow-sm">🌿 {field.selectedCrop}</span>
                                    </div>
                                </div>
                            </div>

                            <div className='p-6 flex flex-col gap-6 flex-1'>
                                
                                {/* Lifecycle Actions */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <h4 className="font-bold text-xs uppercase tracking-wide text-gray-400 mb-2">Crop Lifecycle</h4>
                                    
                                    {!field.plantingDate ? (
                                        <button onClick={() => handlePlant(field._id)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                                            <span>🌱</span> Mark Physical Planting Today
                                        </button>
                                    ) : (
                                        <div className="flex gap-4">
                                            <div className="flex-1 bg-white border rounded-lg p-3 text-center shadow-sm">
                                                <div className="text-xs text-gray-500 font-bold mb-1">Harvest Est.</div>
                                                <div className="text-lg font-black text-emerald-700">
                                                    {new Date(field.estimatedHarvestDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-white border rounded-lg p-3 text-center shadow-sm">
                                                <div className="text-xs text-gray-500 font-bold mb-1">Yield Proj.</div>
                                                <div className="text-lg font-black text-amber-600">
                                                    {field.estimatedYieldRaw} {field.yieldUnit}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Required Nutrients List */}
                                <div className="border-t pt-4 border-dashed border-gray-200 flex-1">
                                    <h4 className="font-bold text-sm text-gray-800 flex justify-between items-center mb-3">
                                        <span>AI Prescribed Nutrients</span>
                                        <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded border border-indigo-100">Tailored Plan</span>
                                    </h4>
                                    
                                    {field.requiredNutrients?.length > 0 ? (
                                        <ul className="space-y-2">
                                            {field.requiredNutrients.slice(0, 3).map((n, i) => (
                                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span className="text-green-500 font-bold">•</span> <span className="flex-1 leading-snug">{n}</span>
                                                </li>
                                            ))}
                                            {field.requiredNutrients.length > 3 && (
                                                <li className="text-xs text-indigo-500 font-bold italic pl-4">+ {field.requiredNutrients.length - 3} more actions required</li>
                                            )}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-400 text-sm italic">Standard farming practices apply.</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* Smart Creation Modal */}
            {isModalOpen && (
                <div className='fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4'>
                    <div className='bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl'>
                        <div className='flex justify-between items-center mb-6'>
                            <h2 className='text-2xl font-black text-gray-800'>
                                {currentStep === 1 ? 'New Field Setup' : currentStep === 2 ? 'AI Reading Lab Report' : 'Select Crop & Lock'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className='text-gray-400 hover:text-red-500 text-3xl leading-none'>&times;</button>
                        </div>

                        {formError && <div className='mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium'>{formError}</div>}
                        
                        {renderStepContent()}
                    </div>
                </div>
            )}
        </div>
    )
}
