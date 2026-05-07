import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Leaf, Mail, Lock, User, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const isExpert = new URLSearchParams(location.search).get('role') === 'expert';

    const validateForm = (e) => {
        const email = e.target.email.value;
        const password = e.target.password.value;
        const confirmPassword = e.target.confirmPassword.value;
        
        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return "Please enter a valid email address.";

        // Password Validation (8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return "Password must be at least 8 characters, include an uppercase letter, a lowercase letter, a number, and a special character.";
        }

        if (password !== confirmPassword) return "Passwords do not match.";

        if (isExpert) {
            const fullName = e.target.fullName.value;
            const description = e.target.description.value;
            if (fullName.trim().length < 3) return "Full Name must be at least 3 characters long.";
            if (description.trim().length < 20) return "Professional Description must be at least 20 characters to provide sufficient detail.";
        }

        return null;
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        
        const validationError = validateForm(e);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);

        const payload = {
            email : e.target.email.value,
            password : e.target.password.value
        };

        if (isExpert) {
            payload.description = e.target.description.value;
            payload.fullName = e.target.fullName.value;
        }

        const endpoint = isExpert ? 'http://localhost:5000/auth/register-expert' : 'http://localhost:5000/auth/register';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                if (isExpert) {
                    setMessage('Registration submitted for admin approval! Redirecting...');
                } else {
                    setMessage('Account created successfully! Navigating to login...');
                }
                setTimeout(() => navigate(`/login${location.search}`), 2500);
            } else {
                setError(data.message || 'Registration failed');
                setIsLoading(false);
            }
        } catch (err) {
            setError('Network error. Please try again.');
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white flex font-sans page-transition">
            
            {/* Right Side - Branding (Hidden on mobile, reversed from login page for variety) */}
            <div className={`hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden order-2 ${isExpert ? 'bg-blue-900' : 'bg-green-900'}`}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                
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
                        {isExpert ? 'Join the Expert Network.' : 'Start Your Journey Today.'}
                    </h1>
                    <div className={`space-y-4 ${isExpert ? 'text-blue-200' : 'text-green-200'}`}>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 opacity-80" />
                            <span className="text-lg">{isExpert ? "Provide verified solutions to farmers" : "AI-powered crop disease detection"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 opacity-80" />
                            <span className="text-lg">{isExpert ? "Broadcast critical regional updates" : "Intelligent soil analysis & tracking"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 opacity-80" />
                            <span className="text-lg">{isExpert ? "Expand your professional reach" : "Direct access to certified experts"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Left Side - Register Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gray-50/50 order-1 overflow-y-auto">
                <div className="w-full max-w-md py-8">
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
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Create Account</h2>
                            <p className="text-gray-500 font-medium text-sm">
                                Registering as {isExpert ? <span className="text-blue-600 font-bold">an Expert / Official</span> : <span className="text-green-600 font-bold">a Farmer</span>}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                                <span className="text-red-500 text-sm font-bold">{error}</span>
                            </div>
                        )}
                        
                        {message && (
                            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-start gap-3">
                                <span className="text-green-600 text-sm font-bold">{message}</span>
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="space-y-5">
                            
                            {isExpert && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input 
                                            type="text" 
                                            name="fullName" 
                                            required 
                                            placeholder="Dr. Jane Doe"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                                        />
                                    </div>
                                </div>
                            )}

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
                                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-gray-900 placeholder-gray-400 ${isExpert ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-green-500/20 focus:border-green-500'}`}
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
                                        placeholder="Create a strong password"
                                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-gray-900 placeholder-gray-400 ${isExpert ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-green-500/20 focus:border-green-500'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input 
                                        type="password" 
                                        name="confirmPassword" 
                                        required 
                                        placeholder="Re-enter your password"
                                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 outline-none transition-all text-gray-900 placeholder-gray-400 ${isExpert ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-green-500/20 focus:border-green-500'}`}
                                    />
                                </div>
                            </div>

                            {isExpert && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Professional Description</label>
                                    <div className="relative">
                                        <div className="absolute top-3.5 left-0 pl-3.5 pointer-events-none">
                                            <FileText className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <textarea 
                                            name="description" 
                                            required 
                                            placeholder="Describe your qualifications, degrees, and area of expertise..."
                                            className="w-full pl-10 pr-4 py-3 h-28 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none"
                                        ></textarea>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 ml-1">This will be reviewed by an administrator before approval.</p>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={`w-full py-3.5 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:-translate-y-0.5 mt-6
                                    ${isExpert 
                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' 
                                        : 'bg-green-600 hover:bg-green-700 shadow-green-600/30'} 
                                    ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? 'Processing...' : 'Create Account'} <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to={`/login${location.search}`} className={`font-bold hover:underline ${isExpert ? 'text-blue-600' : 'text-green-600'}`}>
                                Sign in here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
