import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DiseasePage() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [type, setType] = useState('disease');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!file) return setError('Please upload an image first.');
        
        setError('');
        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', type);

        try {
            const res = await fetch('http://localhost:5000/api/disease/detect', {
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
                <h1 className='text-4xl font-black text-green-800'>AI Crop Scanner</h1>
                <button onClick={() => navigate('/dashboard')} className='text-gray-600 hover:text-green-700 font-bold'>← Back to Dashboard</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Upload Form */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-fit">
                    <h2 className="text-2xl font-bold mb-6">Upload Image</h2>
                    <form onSubmit={handleAnalyze} className="flex flex-col gap-6">
                        {error && <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Scan Type</label>
                            <select value={type} onChange={e => setType(e.target.value)} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-300 outline-none">
                                <option value="disease">Disease Detection</option>
                                <option value="pest">Pest Detection</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Capture or Upload Photo</label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                onChange={e => setFile(e.target.files[0])}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-300 border-dashed rounded-lg p-3"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`px-6 py-3 rounded-xl text-white font-bold transition-all shadow-md mt-2 ${loading ? 'bg-gray-400 cursor-wait' : 'bg-green-700 hover:bg-green-800 hover:shadow-lg'}`}
                        >
                            {loading ? 'Analyzing with Agri Brain...' : 'Scan Image'}
                        </button>
                    </form>
                </div>

                {/* Results View */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 min-h-[400px]">
                    <h2 className="text-2xl font-bold mb-6 text-emerald-900">Analysis Results</h2>
                    {!result && !loading && (
                        <div className="flex items-center justify-center h-full text-gray-400 text-center pb-20">
                            Upload an image to see the AI diagnostic results here.
                        </div>
                    )}
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full pb-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-700 mb-4"></div>
                            <p className="text-gray-500 font-medium">AI is inspecting your crop...</p>
                        </div>
                    )}
                    {result && !loading && (
                        <div className="animate-in fade-in flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black text-gray-800 capitalize">{result.name || 'Unknown Condition'}</h3>
                                <span className={`px-4 py-1.5 rounded-full font-bold text-sm ${result.severity?.toLowerCase() === 'high' ? 'bg-red-100 text-red-700' : result.severity?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                    {result.severity || 'Unknown'} Severity
                                </span>
                            </div>

                            {result.warning && (
                                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-800 text-sm font-medium">
                                    ⚠️ {result.warning}
                                </div>
                            )}

                            <div>
                                <h4 className="font-bold text-lg border-b pb-2 mb-3">Chemical Treatments</h4>
                                {result.suggestions?.chemical?.length > 0 ? (
                                    <ul className="list-disc pl-5 text-gray-700">
                                        {result.suggestions.chemical.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                ) : <p className="text-gray-500 italic">No chemical treatments recommended.</p>}
                            </div>

                            <div>
                                <h4 className="font-bold text-lg border-b pb-2 mb-3">Organic Treatments</h4>
                                {result.suggestions?.organic?.length > 0 ? (
                                    <ul className="list-disc pl-5 text-gray-700">
                                        {result.suggestions.organic.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                ) : <p className="text-gray-500 italic">No organic treatments recommended.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
