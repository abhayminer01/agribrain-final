import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import DiseasePage from './pages/DiseasePage';
import SoilPage from './pages/SoilPage';
import ExpertPage from './pages/ExpertPage';
import AdminPage from './pages/AdminPage';
import FieldDetailPage from './pages/FieldDetailPage';
import ManageFieldsPage from './pages/ManageFieldsPage';
import NoPage from './pages/NoPage';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path='/' element = { <LoginPage /> }/>
        <Route path='/register' element = { <RegisterPage /> }/>
        <Route path='/dashboard' element = { <Dashboard /> }/>
        <Route path='/disease' element={<DiseasePage />} />
        <Route path='/soil' element={<SoilPage />} />
        <Route path='/expert' element={<ExpertPage />} />
        <Route path='/admin' element={<AdminPage />} />
        <Route path='/fields/:id' element={<FieldDetailPage />} />
        <Route path='/manage-fields' element={<ManageFieldsPage />} />
        <Route path='*' element = { <NoPage /> } />
      </Routes>
    </Router>
  </StrictMode>
)
