import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, LineChart, Leaf, Users, ShieldCheck, Sprout, ArrowRight } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-green-50/50 font-sans selection:bg-green-200">
            {/* Header / Navbar */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-green-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-600/20">
                            <Leaf className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black text-green-900 tracking-tight">AgriBrain</span>
                    </div>
                    <nav className="hidden md:flex gap-8 font-medium text-gray-600">
                        <a href="#features" className="hover:text-green-700 transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-green-700 transition-colors">How it Works</a>
                        <a href="#portals" className="hover:text-green-700 transition-colors">Login Portals</a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-green-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 font-bold text-sm mb-8 border border-green-200">
                        <span className="flex h-2 w-2 rounded-full bg-green-600"></span>
                        Next-Generation Agricultural Ecosystem
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
                        Farming Powered By <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400">Artificial Intelligence</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Connect with top agricultural experts, analyze your soil with cutting-edge AI, and manage your entire farming lifecycle in one seamless platform.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="#portals" className="bg-green-700 hover:bg-green-800 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-green-700/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                            Get Started Now <ArrowRight className="w-5 h-5" />
                        </a>
                        <a href="#features" className="bg-white hover:bg-gray-50 text-gray-800 font-bold px-8 py-4 rounded-xl shadow-sm border border-gray-200 transition-all flex items-center justify-center">
                            Explore Features
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 mb-4">Everything You Need to Succeed</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">AgriBrain combines traditional farming wisdom with modern machine learning to optimize every acre of your land.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:bg-white transition-all group">
                            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Bot className="text-amber-600 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Soil Analysis</h3>
                            <p className="text-gray-600 leading-relaxed">Simply upload your lab report. Our AI instantly extracts NPK values, pH levels, and generates a custom fertilization timeline.</p>
                        </div>

                        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:bg-white transition-all group">
                            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Leaf className="text-emerald-600 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Disease Detection</h3>
                            <p className="text-gray-600 leading-relaxed">Snap a photo of a sick plant. Our visual AI engine identifies the exact disease and provides a multi-step organic or chemical treatment plan.</p>
                        </div>

                        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:bg-white transition-all group">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users className="text-blue-600 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Expert Networking</h3>
                            <p className="text-gray-600 leading-relaxed">Stuck on a problem? Submit a query directly to certified agricultural experts and receive verified, actionable advice.</p>
                        </div>

                        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:bg-white transition-all group">
                            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LineChart className="text-purple-600 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Lifecycle Tracking</h3>
                            <p className="text-gray-600 leading-relaxed">Manage multiple fields visually. Track planting dates, monitor expected yields, and record exact harvest or failure data.</p>
                        </div>

                        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:bg-white transition-all group">
                            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="text-rose-600 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Rule-Based Safety</h3>
                            <p className="text-gray-600 leading-relaxed">Our backend rule engine automatically filters out banned or harmful chemical suggestions from the AI, ensuring your farm stays compliant.</p>
                        </div>

                        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:bg-white transition-all group">
                            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Sprout className="text-indigo-600 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Live Announcements</h3>
                            <p className="text-gray-600 leading-relaxed">Receive critical updates, weather warnings, and local agricultural news broadcasted directly by officials to your dashboard.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Portals Section */}
            <section id="portals" className="py-24 bg-green-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4">Choose Your Path</h2>
                        <p className="text-xl text-green-200">Select the portal that best describes your role to get started.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
                        
                        {/* Farmer Card */}
                        <div 
                            onClick={() => navigate('/login?role=farmer')}
                            className="flex-1 bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 hover:bg-white/20 hover:-translate-y-2 transition-all cursor-pointer group flex flex-col"
                        >
                            <div className="w-20 h-20 bg-green-500/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <span className="text-4xl">🌾</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-4">I am a Farmer</h2>
                            <p className="text-green-100 mb-10 leading-relaxed text-lg flex-1">
                                Access AI-driven soil analysis, pest detection, crop lifecycle management, and expert consultations to maximize your yield.
                            </p>
                            <button className="bg-white text-green-900 font-bold py-4 rounded-xl w-full group-hover:bg-green-50 transition-colors shadow-lg mt-auto">
                                Enter Farmer Portal
                            </button>
                        </div>

                        {/* Expert Card */}
                        <div 
                            onClick={() => navigate('/login?role=expert')}
                            className="flex-1 bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 hover:bg-white/20 hover:-translate-y-2 transition-all cursor-pointer group flex flex-col"
                        >
                            <div className="w-20 h-20 bg-blue-500/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <span className="text-4xl">👨‍🔬</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-4">I am an Expert</h2>
                            <p className="text-green-100 mb-10 leading-relaxed text-lg flex-1">
                                Register your credentials to answer farmer queries, broadcast community announcements, and guide the agricultural network.
                            </p>
                            <button className="bg-blue-600 text-white font-bold py-4 rounded-xl w-full group-hover:bg-blue-500 transition-colors shadow-lg mt-auto">
                                Enter Expert Portal
                            </button>
                        </div>

                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Leaf className="text-green-500 w-6 h-6" />
                        <span className="text-xl font-black text-white tracking-tight">AgriBrain</span>
                    </div>
                    <p className="text-sm">
                        &copy; {new Date().getFullYear()} AgriBrain Ecosystem. Developed By Abhay Vijayan.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
