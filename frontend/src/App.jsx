import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import CustomerContacts from './pages/CustomerContacts';
import Engineers from './pages/Engineers';
import EngineerDetail from './pages/EngineerDetail';
import Members from './pages/Members';
import Projects from './pages/Projects';
import AlarmNotes from './pages/AlarmNotes';
import CMDB from './pages/CMDB';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/contacts" element={<CustomerContacts />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/engineers" element={<Engineers />} />
            <Route path="/engineers/:id" element={<EngineerDetail />} />
            <Route path="/members" element={<Members />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/alarms" element={<AlarmNotes />} />
            <Route path="/cmdb" element={<CMDB />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
