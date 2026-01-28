import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerContactService } from '../services/api';
import {
    Phone, Mail, Users, ChevronDown, Building2, Crown, MapPin, Globe, ArrowLeft,
    Plus, Edit2, Trash2, X, Check, UserPlus
} from 'lucide-react';

const CustomerContacts = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCustomerId, setActiveCustomerId] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Modals
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    // Forms
    const [customerForm, setCustomerForm] = useState({
        name: '', industry: '', address: '', website: '', status: 'Active',
        itHead: { name: '', title: '', phone: '', email: '' }
    });

    const [contactForm, setContactForm] = useState({
        name: '', title: '', department: '', phone: '', email: ''
    });

    useEffect(() => {
        loadCustomers();
    }, []);

    useEffect(() => {
        if (customers.length > 0 && !activeCustomerId) {
            setActiveCustomerId(customers[0].id);
        }
    }, [customers]);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await customerContactService.getAll();
            setCustomers(data);
            // Sort by latest or keeps order, usually backend handles order or we do it here
            // For now assume backend returns list
            if (data.length > 0 && !activeCustomerId) {
                setActiveCustomerId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load customers:', error);
        }
        setLoading(false);
    };

    const activeCustomer = customers.find(c => c.id === activeCustomerId) || null;

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        return parts.length > 1
            ? parts[parts.length - 1].charAt(0).toUpperCase()
            : name.charAt(0).toUpperCase();
    };

    // --- Customer Handlers ---

    const handleEditCustomer = () => {
        if (!activeCustomer) return;
        setEditingCustomer(activeCustomer);
        setCustomerForm({
            name: activeCustomer.name,
            industry: activeCustomer.industry,
            address: activeCustomer.address,
            website: activeCustomer.website,
            status: activeCustomer.status,
            itHead: { ...activeCustomer.itHead }
        });
        setShowCustomerModal(true);
    };

    const handleAddCustomer = () => {
        setEditingCustomer(null);
        setCustomerForm({
            name: '', industry: '', address: '', website: '', status: 'Active',
            itHead: { name: '', title: '', phone: '', email: '' }
        });
        setShowCustomerModal(true);
    };

    const handleSaveCustomer = async (e) => {
        e.preventDefault();
        try {
            // Ensure nested objects are handled correctly by the service/backend
            // The service sends data as JSON which matches backend expectation
            if (editingCustomer) {
                const updated = await customerContactService.update(editingCustomer.id, customerForm);
                setCustomers(customers.map(c => c.id === updated.id ? updated : c));
                setActiveCustomerId(updated.id);
            } else {
                const created = await customerContactService.create(customerForm);
                setCustomers([created, ...customers]);
                setActiveCustomerId(created.id);
            }
            setShowCustomerModal(false);
        } catch (error) {
            alert('Failed to save customer');
            console.error(error);
        }
    };

    const handleDeleteCustomer = async () => {
        if (!activeCustomer) return;
        if (!window.confirm(`Are you sure you want to delete customer "${activeCustomer.name}"?`)) return;

        try {
            await customerContactService.delete(activeCustomer.id);
            const remaining = customers.filter(c => c.id !== activeCustomer.id);
            setCustomers(remaining);
            setActiveCustomerId(remaining.length > 0 ? remaining[0].id : null);
        } catch (error) {
            alert('Failed to delete customer');
        }
    };

    // --- Contact Handlers ---

    const handleAddContact = async (e) => {
        e.preventDefault();
        if (!activeCustomer) return;
        try {
            const newContact = await customerContactService.addContact(activeCustomer.id, contactForm);
            // Update local state
            const updatedCustomer = {
                ...activeCustomer,
                contacts: [...activeCustomer.contacts, newContact]
            };
            setCustomers(customers.map(c => c.id === activeCustomer.id ? updatedCustomer : c));
            setShowContactModal(false);
            setContactForm({ name: '', title: '', department: '', phone: '', email: '' });
        } catch (error) {
            alert('Failed to add contact');
        }
    };

    const handleRemoveContact = async (contactId) => {
        if (!activeCustomer) return;
        if (!window.confirm('Remove this contact?')) return;
        try {
            await customerContactService.removeContact(activeCustomer.id, contactId);
            const updatedCustomer = {
                ...activeCustomer,
                contacts: activeCustomer.contacts.filter(c => c.id !== contactId)
            };
            setCustomers(customers.map(c => c.id === activeCustomer.id ? updatedCustomer : c));
        } catch (error) {
            alert('Failed to remove contact');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (customers.length === 0 && !showCustomerModal) {
        return (
            <div className="text-center py-20">
                <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 size={40} className="text-cyan-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No Customers Found</h2>
                <p className="text-slate-500 mb-8">Start by adding your first customer contact.</p>
                <button
                    onClick={handleAddCustomer}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 mx-auto"
                >
                    <Plus size={20} /> Add New Customer
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link to="/customers" className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-bold transition-colors mb-4">
                        <ArrowLeft size={18} />
                        Quay lại danh sách
                    </Link>

                    {/* Customer Selector Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center justify-between w-full md:w-auto min-w-[350px] px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-cyan-300 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                                    <Building2 size={20} className="text-cyan-600" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Customer</p>
                                    <p className="font-bold text-slate-800">{activeCustomer?.name}</p>
                                </div>
                            </div>
                            <ChevronDown size={20} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full md:w-[400px] bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden max-h-[400px] overflow-y-auto">
                                {customers.map((customer) => (
                                    <button
                                        key={customer.id}
                                        onClick={() => { setActiveCustomerId(customer.id); setDropdownOpen(false); }}
                                        className={`w-full px-5 py-4 text-left hover:bg-cyan-50 transition-colors flex items-center justify-between ${activeCustomerId === customer.id ? 'bg-cyan-50' : ''}`}
                                    >
                                        <div>
                                            <p className="font-bold text-slate-800">{customer.name}</p>
                                            <p className="text-xs text-slate-400">{customer.industry} • {customer.contacts?.length || 0} contacts</p>
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">
                                            {customer.status}
                                        </span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setDropdownOpen(false); handleAddCustomer(); }}
                                    className="w-full px-5 py-3 text-left bg-slate-50 hover:bg-slate-100 text-cyan-600 font-bold text-sm flex items-center gap-2 border-t border-slate-100"
                                >
                                    <Plus size={16} /> Add New Customer
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleEditCustomer}
                        className="p-3 bg-white border border-slate-200 hover:border-cyan-300 text-slate-600 hover:text-cyan-600 rounded-xl transition-all shadow-sm"
                        title="Edit Customer"
                    >
                        <Edit2 size={20} />
                    </button>
                    <button
                        onClick={handleDeleteCustomer}
                        className="p-3 bg-white border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 rounded-xl transition-all shadow-sm"
                        title="Delete Customer"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Hero Section - Customer Info */}
            {activeCustomer && (
                <div className="bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-700 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-cyan-500/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Left - Company Visual */}
                        <div className="relative h-64 lg:h-auto min-h-[280px] bg-gradient-to-br from-cyan-500/30 to-transparent flex items-center justify-center">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
                            <div className="relative text-center p-8">
                                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                    <Building2 size={64} className="text-white" />
                                </div>
                                <span className="text-xs font-black px-4 py-2 rounded-full bg-emerald-400 text-emerald-900">
                                    {activeCustomer.status}
                                </span>
                            </div>
                        </div>

                        {/* Right - Company Info */}
                        <div className="p-10 lg:p-12 text-white flex flex-col justify-center">
                            <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">
                                {activeCustomer.name}
                            </h1>
                            <p className="text-lg text-cyan-200 leading-relaxed mb-6">
                                {activeCustomer.industry}
                            </p>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <MapPin size={18} className="text-cyan-300" />
                                    <span className="font-medium text-cyan-100">{activeCustomer.address || 'No address'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Globe size={18} className="text-cyan-300" />
                                    <span className="font-medium text-cyan-100">{activeCustomer.website || 'No website'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users size={18} className="text-cyan-300" />
                                    <span className="font-medium text-cyan-100">{activeCustomer.contacts?.length || 0} liên hệ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* IT Head Card */}
            {activeCustomer && (
                <>
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Crown size={24} className="text-amber-500" />
                                <h2 className="text-xl font-black text-slate-800">IT Head / Primary Contact</h2>
                            </div>
                            {activeCustomer.itHead?.name && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleEditCustomer}
                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-cyan-600 transition-colors"
                                        title="Edit IT Head Info"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        {activeCustomer.itHead?.name ? (
                            <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl border border-cyan-100 relative group">
                                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-cyan-500/30">
                                    {getInitials(activeCustomer.itHead.name)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-black text-slate-800">{activeCustomer.itHead.name}</h3>
                                    <span className="inline-block mt-1 px-3 py-1 bg-cyan-100 text-cyan-700 font-bold text-xs rounded-lg uppercase tracking-wider">
                                        {activeCustomer.itHead.title}
                                    </span>
                                    <div className="flex flex-wrap gap-6 mt-4 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Phone size={16} className="text-cyan-400" />
                                            <span className="font-mono font-medium">{activeCustomer.itHead.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Mail size={16} className="text-cyan-400" />
                                            <span className="font-medium">{activeCustomer.itHead.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-400 mb-4">No IT Head information</p>
                                <button
                                    onClick={handleEditCustomer}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 rounded-xl font-bold text-sm transition-colors"
                                >
                                    <Plus size={16} /> Add Info
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Customer Contacts Grid */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Users size={24} className="text-cyan-500" />
                                <h2 className="text-xl font-black text-slate-800">Contacts</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                                    {activeCustomer.contacts?.length || 0} người
                                </span>
                                <button
                                    onClick={() => setShowContactModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 font-bold text-sm rounded-xl transition-colors"
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeCustomer.contacts?.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="group relative p-6 bg-slate-50 hover:bg-cyan-50 rounded-2xl border border-transparent hover:border-cyan-200 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                                >
                                    <button
                                        onClick={() => handleRemoveContact(contact.id)}
                                        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X size={14} />
                                    </button>

                                    {/* Avatar */}
                                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                                        {getInitials(contact.name)}
                                    </div>

                                    {/* Name & Title */}
                                    <h4 className="text-lg font-bold text-slate-800 text-center mb-1 group-hover:text-cyan-700 transition-colors">
                                        {contact.name}
                                    </h4>
                                    <p className="text-xs font-bold text-cyan-600 text-center bg-cyan-100 rounded-lg py-1 px-3 mx-auto w-fit mb-2">
                                        {contact.title}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-4">
                                        {contact.department}
                                    </p>

                                    {/* Contact Info */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-slate-500 justify-center">
                                            <Phone size={14} className="text-cyan-400" />
                                            <span className="font-mono">{contact.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 justify-center">
                                            <Mail size={14} className="text-cyan-400" />
                                            <span className="text-xs truncate">{contact.email}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setShowContactModal(true)}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50/50 transition-all min-h-[200px]"
                            >
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-cyan-100">
                                    <Plus size={24} />
                                </div>
                                <span className="font-bold">Add Contact</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* --- Customer Modal --- */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCustomerModal(false)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-2xl font-black text-slate-800">
                                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                            </h2>
                            <button onClick={() => setShowCustomerModal(false)} className="p-2 hover:bg-slate-200 rounded-xl"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveCustomer} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-cyan-500 uppercase tracking-widest border-b border-slate-100 pb-2">Company Info</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Company Name</label>
                                        <input required type="text" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Industry</label>
                                        <input type="text" value={customerForm.industry} onChange={e => setCustomerForm({ ...customerForm, industry: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                                        <select value={customerForm.status} onChange={e => setCustomerForm({ ...customerForm, status: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500">
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                                        <input type="text" value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Website</label>
                                        <input type="text" value={customerForm.website} onChange={e => setCustomerForm({ ...customerForm, website: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-cyan-500 uppercase tracking-widest border-b border-slate-100 pb-2">IT Head / Primary Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                        <input type="text" value={customerForm.itHead.name} onChange={e => setCustomerForm({ ...customerForm, itHead: { ...customerForm.itHead, name: e.target.value } })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                                        <input type="text" value={customerForm.itHead.title} onChange={e => setCustomerForm({ ...customerForm, itHead: { ...customerForm.itHead, title: e.target.value } })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                        <input type="text" value={customerForm.itHead.phone} onChange={e => setCustomerForm({ ...customerForm, itHead: { ...customerForm.itHead, phone: e.target.value } })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                        <input type="email" value={customerForm.itHead.email} onChange={e => setCustomerForm({ ...customerForm, itHead: { ...customerForm.itHead, email: e.target.value } })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-cyan-500/20">
                                <Check size={20} /> Save Customer
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Contact Modal --- */}
            {showContactModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowContactModal(false)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-black text-slate-800">Add Contact</h2>
                            <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-slate-200 rounded-xl"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddContact} className="p-8 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                <input required type="text" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                                <input type="text" value={contactForm.title} onChange={e => setContactForm({ ...contactForm, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                                <input type="text" value={contactForm.department} onChange={e => setContactForm({ ...contactForm, department: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                <input type="text" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                <input type="email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500" />
                            </div>
                            <button type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2">
                                <UserPlus size={20} /> Add Contact
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerContacts;
