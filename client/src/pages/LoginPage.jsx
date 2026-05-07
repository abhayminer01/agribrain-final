import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Leaf, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isExpert = new URLSearchParams(location.search).get('role') === 'expert';

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const email = e.target.email.value;
        const password = e.target.password.value;

        // Basic strict validations for login
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (password.trim() === '') {
            setError('Password field cannot be completely blank.');
            return;
        }

        setIsLoading(true);

        const payload = { email, password };

        try {
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                if (data.user && data.user.role === 'Expert') {
                    navigate('/expert-dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white flex font-sans page-transition">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className={`hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden ${isExpert ? 'bg-blue-900' : 'bg-green-900'}`}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                
                {/* Background decorative elements */}
                <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-50 ${isExpert ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-50 ${isExpert ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>

                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-2 w-fit">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isExpert ? 'bg-blue-600 shadow-blue-600/20' : 'bg-green-600 shadow-green-600/20'}`}>
                            <Leaf className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tight">AgriBrain</span>
                    </Link>
                </div>

                <div className="relative z-10 mt-auto pb-10">
                    <h1 className="text-5xl font-black text-white leading-tight mb-6">
                        {isExpert ? 'Empower the Farming Community.' : 'Welcome Back to Your Farm.'}
                    </h1>
                    <p className={`text-lg max-w-md leading-relaxed ${isExpert ? 'text-blue-200' : 'text-green-200'}`}>
                        {isExpert 
                            ? "Log in to answer queries, broadcast important announcements, and guide farmers to success."
                            : "Access your AI insights, track your fields, and manage your crop lifecycle seamlessly."}
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gray-50/50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="flex lg:hidden justify-center mb-8">
                        <Link to="/" className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isExpert ? 'bg-blue-600 shadow-blue-600/20' : 'bg-green-600 shadow-green-600/20'}`}>
                                <Leaf className="text-white w-6 h-6" />
                            </div>
                            <span className="text-2xl font-black text-gray-900 tracking-tight">AgriBrain</span>
                        </Link>
                    </div>

                    <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Sign in</h2>
                            <p className="text-gray-500 font-medium text-sm">
                                Access your {isExpert ? <span className="text-blue-600 font-bold">Expert Portal</span> : <span className="text-green-600 font-bold">Farmer Dashboard</span>}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                                <span className="text-red-500 text-sm font-bold">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        required 
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        required 
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={`w-full py-3.5 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:-translate-y-0.5 mt-4
                                    ${isExpert 
                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' 
                                        : 'bg-green-600 hover:bg-green-700 shadow-green-600/30'} 
                                    ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? 'Signing in...' : 'Sign in'} <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to={`/register${location.search}`} className={`font-bold hover:underline ${isExpert ? 'text-blue-600' : 'text-green-600'}`}>
                                Create one now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}