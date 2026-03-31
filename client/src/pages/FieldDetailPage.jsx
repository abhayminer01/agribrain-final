import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateFieldAuditPDF } from '../utils/pdfGenerator';

const API = 'http://localhost:5000';

const statusConfig = {
    applied:  { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: '✓ Applied' },
    notified: { dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-100 text-amber-700', label: '⏰ Due Soon' },
    pending:  { dot: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500', label: 'Pending' },
};

export default function FieldDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [field, setField] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Diagnosis state
    const [scanType, setScanType] = useState('disease');
    const [scanImage, setScanImage] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState('');

    const fetchField = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/fields/${id}`, { credentials: 'include' });
            if (!res.ok) { setError('Field not found or access denied.'); return; }
            const data = await res.json();
            setField(data.field);
        } catch (e) {
            setError('Network error loading field.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchField(); }, [fetchField]);

    const handlePlant = async () => {
        if (!window.confirm('Mark this field as physically planted today?')) return;
        const res = await fetch(`${API}/api/fields/${id}/plant`, { method: 'PUT', credentials: 'include' });
        if (res.ok) { const d = await res.json(); setField(d.field); }
    };

    const setPreference = async (idx, type) => {
        const res = await fetch(`${API}/api/fields/${id}/schedule/${idx}/select`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            credentials: 'include', body: JSON.stringify({ selectedType: type })
        });
        if (res.ok) { const d = await res.json(); setField(d.field); }
    };

    const markApplied = async (idx) => {
        const res = await fetch(`${API}/api/fields/${id}/schedule/${idx}/apply`, {
            method: 'PUT', credentials: 'include'
        });
        if (res.ok) { const d = await res.json(); setField(d.field); }
    };

    const handleDiagnose = async (e) => {
        e.preventDefault();
        if (!scanImage) return setScanError('Please select a crop image.');
        setScanError('');
        setScanning(true);
        const formData = new FormData();
        formData.append('image', scanImage);
        formData.append('scanType', scanType);
        try {
            const res = await fetch(`${API}/api/fields/${id}/diagnose`, {
                method: 'POST', credentials: 'include', body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setField(data.field);
                setScanImage(null);
                // Reset file input
                document.getElementById('diagFileInput').value = '';
            } else {
                setScanError(data.message || 'Scan failed.');
            }
        } catch (e) {
            setScanError('Network error during scan.');
        } finally {
            setScanning(false);
        }
    };

    const setTreatmentStepPref = async (diagIdx, stepIdx, type) => {
        const res = await fetch(`${API}/api/fields/${id}/diagnose/${diagIdx}/step/${stepIdx}/select`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            credentials: 'include', body: JSON.stringify({ selectedType: type })
        });
        if (res.ok) { const d = await res.json(); setField(d.field); }
    };

    const markTreatmentStepApplied = async (diagIdx, stepIdx) => {
        const res = await fetch(`${API}/api/fields/${id}/diagnose/${diagIdx}/step/${stepIdx}/apply`, {
            method: 'PUT', credentials: 'include'
        });
        if (res.ok) { const d = await res.json(); setField(d.field); }
    };

    const handleGeneratePDF = () => {
        generateFieldAuditPDF(field);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-green-700 border-b-transparent"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
            <p className="text-red-600 font-bold text-lg">{error}</p>
            <button onClick={() => navigate('/dashboard')} className="text-green-700 underline font-medium">← Back to Dashboard</button>
        </div>
    );

    const applied   = field.fertilizationSchedule?.filter(s => s.status === 'applied').length ?? 0;
    const total     = field.fertilizationSchedule?.length ?? 0;
    const progress  = total ? Math.round((applied / total) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* Hero Banner */}
            <div className="relative h-72 md:h-96 w-full overflow-hidden">
                <img src={field.imageUrl} alt={field.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80" />
                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                    <div className="absolute top-6 left-6 right-6 flex flex-wrap gap-4 justify-between items-start">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold px-4 py-2 rounded-lg transition-all"
                        >
                            ← Dashboard
                        </button>
                        <button
                            onClick={handleGeneratePDF}
                            className="bg-emerald-600 hover:bg-emerald-700 backdrop-blur-md text-white font-bold px-5 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Get Complete Audit
                        </button>
                    </div>
                    <span className="text-white/70 text-sm font-bold uppercase tracking-widest mb-2">Field Overview</span>
                    <h1 className="text-4xl md:text-5xl font-black text-white">{field.name}</h1>
                    <div className="flex flex-wrap gap-3 mt-3">
                        <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold">📐 {field.size} Acres</span>
                        <span className="bg-green-600/80 text-white px-3 py-1 rounded-full text-sm font-bold">🌿 {field.selectedCrop}</span>
                        {field.soilData?.pH && (
                            <span className="bg-amber-600/80 text-white px-3 py-1 rounded-full text-sm font-bold">🧪 pH {field.soilData.pH}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-10">

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Area', value: `${field.size} Acres`, icon: '📐', color: 'text-gray-800' },
                        { label: 'Crop', value: field.selectedCrop, icon: '🌾', color: 'text-green-700' },
                        {
                            label: 'Harvest Est.',
                            value: field.estimatedHarvestDate
                                ? new Date(field.estimatedHarvestDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Not planted',
                            icon: '📅',
                            color: field.estimatedHarvestDate ? 'text-emerald-700' : 'text-gray-400'
                        },
                        {
                            label: 'Yield Proj.',
                            value: field.estimatedYieldRaw ? `${field.estimatedYieldRaw} ${field.yieldUnit}` : '—',
                            icon: '📦',
                            color: 'text-amber-700'
                        },
                    ].map(s => (
                        <div key={s.label} className="bg-white border rounded-xl p-4 shadow-sm text-center">
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className={`font-black text-lg truncate ${s.color}`}>{s.value}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Soil Profile */}
                {field.soilData && (
                    <div className="bg-white border rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-black text-gray-800 mb-4">🧪 Soil Profile</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'pH Level', value: field.soilData.pH, color: 'bg-amber-50 border-amber-100 text-amber-800' },
                                { label: 'Nitrogen (N)', value: field.soilData.NPK?.N, color: 'bg-sky-50 border-sky-100 text-sky-800' },
                                { label: 'Phosphorus (P)', value: field.soilData.NPK?.P, color: 'bg-purple-50 border-purple-100 text-purple-800' },
                                { label: 'Potassium (K)', value: field.soilData.NPK?.K, color: 'bg-orange-50 border-orange-100 text-orange-800' },
                            ].map(s => (
                                <div key={s.label} className={`border rounded-xl p-4 text-center ${s.color}`}>
                                    <div className="text-2xl font-black">{s.value || '—'}</div>
                                    <div className="text-xs font-bold opacity-70 mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Planting Status */}
                {!field.plantingDate ? (
                    <div className="bg-white border-2 border-dashed border-emerald-200 rounded-2xl p-8 text-center">
                        <p className="text-gray-500 mb-4">This field hasn't been marked as planted yet. Do it now to activate the fertilization timeline.</p>
                        <button
                            onClick={handlePlant}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-all"
                        >
                            🌱 Mark as Planted Today
                        </button>
                    </div>
                ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
                        <span className="text-3xl">🌱</span>
                        <div>
                            <div className="font-bold text-emerald-800">Planted on {new Date(field.plantingDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            <div className="text-sm text-emerald-600 font-medium mt-0.5">{field.daysToHarvest} days to estimated harvest</div>
                        </div>
                    </div>
                )}

                {/* Fertilization Timeline */}
                <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-black text-gray-800">🗓️ Fertilization Timeline</h2>
                        <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full">
                            Banned Chemistry Filtered
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                            <span>{applied} of {total} stages completed</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Stages */}
                    <div className="relative border-l-2 border-green-100 ml-4 space-y-8 pb-2">
                        {field.fertilizationSchedule?.map((stage, idx) => {
                            const cfg = statusConfig[stage.status] ?? statusConfig.pending;

                            let targetDateStr = `Planting +${stage.dayOffset} days`;
                            if (field.plantingDate) {
                                const d = new Date(field.plantingDate);
                                d.setDate(d.getDate() + stage.dayOffset);
                                targetDateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                            }

                            const isApplied = stage.status === 'applied';
                            const activeOptions = stage.selectedType ? stage.options[stage.selectedType] : [];

                            return (
                                <div key={idx} className="relative pl-7">
                                    {/* Timeline dot */}
                                    <span className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-white shadow-sm ${cfg.dot}`} />

                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className={`font-bold text-lg ${isApplied ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {stage.stageName}
                                                </h3>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                                            </div>
                                            <p className="text-sm font-black text-green-700 mt-0.5">{targetDateStr}</p>
                                        </div>

                                        {!isApplied && stage.selectedType && (
                                            <button
                                                onClick={() => markApplied(idx)}
                                                className="shrink-0 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition-all"
                                            >
                                                ✓ Mark Applied
                                            </button>
                                        )}
                                    </div>

                                    {!isApplied && (
                                        <div className="mt-3 bg-gray-50 border rounded-xl p-4">
                                            {/* Toggle Tabs */}
                                            <div className="flex gap-1 bg-gray-200 p-1 rounded-lg w-fit mb-4">
                                                <button
                                                    onClick={() => setPreference(idx, 'organic')}
                                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${stage.selectedType === 'organic' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    🍃 Organic
                                                </button>
                                                <button
                                                    onClick={() => setPreference(idx, 'chemical')}
                                                    className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${stage.selectedType === 'chemical' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    🧪 Chemical
                                                </button>
                                            </div>

                                            {!stage.selectedType ? (
                                                <p className="text-gray-400 text-sm italic text-center py-2">Select a route above to view AI instructions.</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {activeOptions?.map((opt, oIdx) => (
                                                        <li key={oIdx} className="flex gap-2 text-sm text-gray-700">
                                                            <span className={stage.selectedType === 'organic' ? 'text-emerald-600' : 'text-blue-600'}>•</span>
                                                            <span className="flex-1">{opt}</span>
                                                        </li>
                                                    ))}
                                                    {(!activeOptions || activeOptions.length === 0) && (
                                                        <p className="text-gray-400 text-sm italic">No specific instructions for this route.</p>
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {(!field.fertilizationSchedule || field.fertilizationSchedule.length === 0) && (
                            <p className="pl-7 text-gray-400 italic text-sm">No fertilization schedule was generated for this field.</p>
                        )}
                    </div>
                </div>

                {/* ──── Pest & Disease Diagnosis ──── */}
                <div className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-black text-gray-800 mb-6">🔬 Pest &amp; Disease Scanner</h2>

                    {/* Upload Form */}
                    <form onSubmit={handleDiagnose} className="bg-gray-50 border rounded-xl p-5 mb-8">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            {/* Scan type toggle */}
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Scan Type</label>
                                <div className="flex gap-1 bg-gray-200 p-1 rounded-lg w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setScanType('disease')}
                                        className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${scanType === 'disease' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500'}`}
                                    >🦠 Disease</button>
                                    <button
                                        type="button"
                                        onClick={() => setScanType('pest')}
                                        className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${scanType === 'pest' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500'}`}
                                    >🐛 Pest</button>
                                </div>
                            </div>

                            {/* File picker */}
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Crop Image</label>
                                <input
                                    id="diagFileInput"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={e => setScanImage(e.target.files[0])}
                                    className="w-full border border-dashed bg-white p-2 rounded-lg text-sm"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={scanning}
                                className={`shrink-0 px-6 py-2.5 rounded-lg text-white font-bold shadow-sm transition-all ${scanning ? 'bg-gray-400 cursor-wait' : 'bg-rose-600 hover:bg-rose-700'}`}
                            >
                                {scanning ? 'Scanning…' : 'Run AI Diagnosis'}
                            </button>
                        </div>

                        {scanError && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{scanError}</p>}

                        {scanning && (
                            <div className="flex items-center gap-3 mt-4">
                                <div className="animate-spin h-5 w-5 rounded-full border-2 border-rose-600 border-b-transparent" />
                                <span className="text-sm text-gray-500 font-medium">AI is analyzing the image for {scanType}…</span>
                            </div>
                        )}
                    </form>

                    {/* Diagnosis History with Treatment Timelines */}
                    {field.diagnoses?.length > 0 ? (
                        <div className="space-y-8">
                            {field.diagnoses.slice().reverse().map((diag, revIdx) => {
                                const realIdx = field.diagnoses.length - 1 - revIdx;
                                const sevColor = diag.severity?.toLowerCase() === 'high'
                                    ? 'bg-red-100 text-red-700'
                                    : diag.severity?.toLowerCase() === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-green-100 text-green-700';

                                const appliedSteps = diag.treatmentCourse?.filter(s => s.status === 'applied').length ?? 0;
                                const totalSteps = diag.treatmentCourse?.length ?? 0;
                                const diagProgress = totalSteps ? Math.round((appliedSteps / totalSteps) * 100) : 0;

                                return (
                                    <div key={realIdx} className="border rounded-2xl overflow-hidden">
                                        {/* Diagnosis Header */}
                                        <div className="flex flex-col md:flex-row">
                                            {diag.imageUrl && (
                                                <div className="w-full md:w-44 h-44 md:h-auto shrink-0 bg-gray-100">
                                                    <img src={diag.imageUrl} alt={diag.name} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 p-5">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="text-xl">{diag.type === 'pest' ? '🐛' : '🦠'}</span>
                                                    <h3 className="font-black text-gray-800 text-lg">{diag.name || 'Unknown'}</h3>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sevColor}`}>
                                                        {diag.severity || 'Unknown'} Severity
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium mb-3">
                                                    Diagnosed {new Date(diag.diagnosedAt).toLocaleString()}
                                                </p>

                                                {/* Treatment Progress */}
                                                <div>
                                                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                                        <span>{appliedSteps} of {totalSteps} treatment steps done</span>
                                                        <span>{diagProgress}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-rose-500 rounded-full transition-all duration-700"
                                                            style={{ width: `${diagProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Treatment Course Timeline */}
                                        {totalSteps > 0 && (
                                            <div className="px-6 pb-6 pt-2">
                                                <div className="relative border-l-2 border-rose-100 ml-4 space-y-6 pb-2">
                                                    {diag.treatmentCourse.map((step, sIdx) => {
                                                        const isApplied = step.status === 'applied';
                                                        const isNotified = step.status === 'notified';

                                                        let dateStr = `Day +${step.dayOffset}`;
                                                        if (diag.diagnosedAt) {
                                                            const d = new Date(diag.diagnosedAt);
                                                            d.setDate(d.getDate() + step.dayOffset);
                                                            dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                                                        }

                                                        return (
                                                            <div key={sIdx} className="relative pl-7">
                                                                <span className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-white shadow-sm ${
                                                                    isApplied ? 'bg-emerald-500' : isNotified ? 'bg-amber-400 animate-pulse' : 'bg-gray-300'
                                                                }`} />

                                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <h4 className={`font-bold ${isApplied ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                                                {step.stageName}
                                                                            </h4>
                                                                            {isApplied && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ Applied</span>}
                                                                            {isNotified && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⏰ Due Soon</span>}
                                                                        </div>
                                                                        <p className="text-sm font-black text-rose-600 mt-0.5">{dateStr}</p>
                                                                    </div>

                                                                    {!isApplied && step.selectedType && (
                                                                        <button
                                                                            onClick={() => markTreatmentStepApplied(realIdx, sIdx)}
                                                                            className="shrink-0 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition-all"
                                                                        >
                                                                            ✓ Mark Applied
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {!isApplied && (
                                                                    <div className="mt-3 bg-gray-50 border rounded-xl p-4">
                                                                        <div className="flex gap-1 bg-gray-200 p-1 rounded-lg w-fit mb-3">
                                                                            <button
                                                                                onClick={() => setTreatmentStepPref(realIdx, sIdx, 'organic')}
                                                                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${step.selectedType === 'organic' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                                            >🍃 Organic</button>
                                                                            <button
                                                                                onClick={() => setTreatmentStepPref(realIdx, sIdx, 'chemical')}
                                                                                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${step.selectedType === 'chemical' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                                            >🧪 Chemical</button>
                                                                        </div>

                                                                        {!step.selectedType ? (
                                                                            <p className="text-sm text-gray-400 italic text-center py-1">Select a treatment approach above.</p>
                                                                        ) : (
                                                                            <ul className="space-y-1.5">
                                                                                {step.options?.[step.selectedType]?.map((item, oIdx) => (
                                                                                    <li key={oIdx} className="flex gap-2 text-sm text-gray-700">
                                                                                        <span className={step.selectedType === 'organic' ? 'text-emerald-600' : 'text-blue-600'}>•</span>
                                                                                        <span className="flex-1">{item}</span>
                                                                                    </li>
                                                                                ))}
                                                                                {(!step.options?.[step.selectedType] || step.options[step.selectedType].length === 0) && (
                                                                                    <p className="text-gray-400 text-sm italic">No specific remedies for this approach.</p>
                                                                                )}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 text-sm py-6 italic">
                            No scans yet. Upload crop images above to diagnose diseases or pests on this field.
                        </p>
                    )}
                </div>

                {/* Soil Report Link */}
                {field.soilTestReportUrl && (
                    <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-800">📄 Original Lab Report</h3>
                            <p className="text-sm text-gray-500 mt-0.5">The soil test document uploaded during field creation.</p>
                        </div>
                        <a
                            href={field.soilTestReportUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-sm transition-all"
                        >
                            View Report →
                        </a>
                    </div>
                )}

            </div>
        </div>
    );
}
