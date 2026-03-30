import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SoilPage() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!file) return setError('Please upload a soil report document or image.');
        
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
        <div className="min-h-screen bg-gray-50 p-10 font-sans">
            <div className='flex justify-between items-center mb-10 pb-5 border-b border-gray-200'>
                <h1 className='text-4xl font-black text-amber-800'>Intelligent Soil Analyzer</h1>
                <button onClick={() => navigate('/dashboard')} className='text-gray-600 hover:text-amber-700 font-bold'>← Back to Dashboard</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Upload Form */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-fit">
                    <h2 className="text-2xl font-bold mb-6">Upload Lab Report</h2>
                    <form onSubmit={handleAnalyze} className="flex flex-col gap-6">
                        {error && <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Select Document (PDF/Image)</label>
                            <input 
                                type="file" 
                                accept=".pdf,image/*" 
                                onChange={e => setFile(e.target.files[0])}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 border border-gray-300 border-dashed rounded-lg p-3"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`px-6 py-3 rounded-xl text-white font-bold transition-all shadow-md mt-2 ${loading ? 'bg-gray-400 cursor-wait' : 'bg-amber-700 hover:bg-amber-800 hover:shadow-lg'}`}
                        >
                            {loading ? 'Extracting with Agri Brain...' : 'Analyze Report'}
                        </button>
                    </form>
                </div>

                {/* Results View */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100 min-h-[400px]">
                    <h2 className="text-2xl font-bold mb-6 text-orange-900">Extracted Metrics</h2>
                    {!result && !loading && (
                        <div className="flex items-center justify-center h-full text-gray-400 text-center pb-20">
                            Upload a lab report document. Our AI will automatically extract and parse the key soil indicators.
                        </div>
                    )}
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full pb-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-700 mb-4"></div>
                            <p className="text-gray-500 font-medium">Scanning document structure...</p>
                        </div>
                    )}
                    {result && !loading && (
                        <div className="animate-in fade-in flex flex-col gap-6">
                            
                            <div className="flex items-center justify-between border-b pb-4">
                                <h3 className="text-xl font-bold text-gray-800">Soil pH Level</h3>
                                <span className={`px-4 py-1.5 rounded-full font-black text-lg bg-gray-100 text-gray-800`}>
                                    {result.pH || 'Unknown'}
                                </span>
                            </div>

                            <div>
                                <h4 className="font-bold text-lg text-gray-700 mb-4">NPK Values (Nitrogen, Phosphorus, Potassium)</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl text-center">
                                        <div className="text-sky-800 font-bold mb-1">Nitrogen (N)</div>
                                        <div className="text-2xl font-black text-sky-600">{result.NPK?.N || '--'}</div>
                                    </div>
                                    <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-center">
                                        <div className="text-purple-800 font-bold mb-1">Phosphorus (P)</div>
                                        <div className="text-2xl font-black text-purple-600">{result.NPK?.P || '--'}</div>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-center">
                                        <div className="text-orange-800 font-bold mb-1">Potassium (K)</div>
                                        <div className="text-2xl font-black text-orange-600">{result.NPK?.K || '--'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 border-t pt-4">
                                <h4 className="font-bold text-lg text-gray-700 mb-3">AI Recommendations</h4>
                                {result.suggestions?.length > 0 ? (
                                    <ul className="list-disc pl-5 text-gray-600 font-medium space-y-1">
                                        {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                ) : <p className="text-gray-500 italic">No specific recommendations provided from this report.</p>}
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
