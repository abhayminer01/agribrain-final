import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NoPage() {
    const navigate = useNavigate();
  return (
    <div className='flex justify-center'>
        <img onClick={() => navigate('/')} src="/images/404.gif" alt="404 Error" />
    </div>
  )
}