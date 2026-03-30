import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const payload = {
            email : e.target.email.value,
            password : e.target.password.value
        };

        try {
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Important: sends cookies with request
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                navigate('/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error');
        }
    }

    return (
        <div className='flex flex-col justify-center items-center mt-20'>
            <h1 className='text-[40px] font-black mb-10'>Login Page</h1>
            <form className='flex flex-col border rounded-[20px] py-20 w-90 align-middle items-center justify-center gap-10' onSubmit={handleFormSubmit}>
                {error && <div className='text-red-500 max-w-[200px] text-center'>{error}</div>}
                
                <div className='flex gap-5 items-center'>
                    <label className='w-20 text-right'>Email Id :</label>
                    <input className='border rounded p-1 w-40' name='email' type="email" required />
                </div>
                <div className='flex gap-5 items-center'>    
                    <label className='w-20 text-right'>Password :</label>
                    <input className='border rounded p-1 w-40' name='password' type="password" required />
                </div>
                
                <input className='bg-green-700 px-20 py-2 rounded-2xl text-white font-bold cursor-pointer hover:bg-green-800 transition-colors' value="Login" type="submit" />

                <div className='text-sm mt-4'>
                    Don't have an account? <Link to="/register" className="text-blue-500 underline">Register</Link>
                </div>
            </form>
        </div>
    )
}