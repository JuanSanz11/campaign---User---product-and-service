import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  ShoppingBag, 
  Wrench, 
  Upload, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Settings, 
  Mail, 
  MessageSquare, 
  Send, 
  RefreshCw,
  UserCheck,
  Phone,
  Layers
} from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
  }
  return res;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Campaigns State
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [batchSize, setBatchSize] = useState(7);
  const [batchInterval, setBatchInterval] = useState(3);
  const [messageLimit, setMessageLimit] = useState(6);
  const [messageInterval, setMessageInterval] = useState(5);

  // Entities State
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ nombre: '', email: '', contrasena: '' });
  
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ nombre: '', precio: '', categoria: '', stock: '' });

  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ nombre: '' });

  // Manual Send State
  const [manualContact, setManualContact] = useState({ nombre: '', email: '', mensaje: '' });
  const [manualSendLoading, setManualSendLoading] = useState(false);

  // Manager State
  const [managerSubTab, setManagerSubTab] = useState('dashboard');
  const [userRoles, setUserRoles] = useState({});
  const [webhookTesting, setWebhookTesting] = useState(false);

  // Magic Token verification and user verification on Mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      setLoading(true);
      fetch(`${API_BASE}/auth/verify?token=${urlToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.token) {
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setCurrentUser(data.user);
            setSuccessMsg('✅ ¡Acceso concedido exitosamente!');
          } else {
            setErrorMsg(data.error || 'Token de acceso inválido o expirado.');
          }
        })
        .catch(err => {
          setErrorMsg('Error al conectar con el servidor.');
        })
        .finally(() => {
          setLoading(false);
          // Clear query params from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        })
          .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then(data => {
            setCurrentUser(data.user);
            setToken(savedToken);
          })
          .catch(() => {
            localStorage.removeItem('token');
          });
      }
    }
  }, []);

  // Auto-refresh interval for campaign details
  useEffect(() => {
    let interval;
    if (!currentUser) return;
    
    if (activeTab === 'dashboard') {
      fetchCampaigns();
      interval = setInterval(() => {
        fetchCampaigns();
        if (selectedCampaign) {
          fetchCampaignDetails(selectedCampaign.uuid);
        }
      }, 5000);
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'services') {
      fetchServices();
    } else if (activeTab === 'manager') {
      fetchUsers();
      fetchProducts();
      fetchServices();
      fetchCampaigns();
    }
    return () => clearInterval(interval);
  }, [activeTab, selectedCampaign?.uuid, currentUser]);

  // Alert dismisser
  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
        setSuccessMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  // --- API FETCH FUNCTIONS ---

  const fetchCampaigns = async () => {
    try {
      const res = await authFetch(`${API_BASE}/campaigns`);
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const fetchCampaignDetails = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/campaigns/${id}`);
      const data = await res.json();
      setSelectedCampaign(data);
    } catch (err) {
      console.error('Error fetching campaign details:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch(`${API_BASE}/users`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await authFetch(`${API_BASE}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await authFetch(`${API_BASE}/services`);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  // --- HANDLER FUNCTIONS ---

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setErrorMsg('Por favor ingresa tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, contrasena: authPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
      
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setSuccessMsg('✅ Sesión iniciada exitosamente.');
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!authEmail) {
      setErrorMsg('Por favor ingresa tu email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar token');
      
      setMagicLinkSent(true);
      setSuccessMsg('✉️ Enlace de acceso directo enviado. Revisa tu email.');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setToken('');
    setSuccessMsg('Sesión cerrada.');
  };

  const handleTriggerCsvCheck = async () => {
    setWebhookTesting(true);
    try {
      const res = await authFetch(`${API_BASE}/n8n/trigger-csv-check`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al ejecutar workflow');
      setSuccessMsg('🔔 Alerta de CSV ejecutada y enviada a Telegram.');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setWebhookTesting(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaignName || !csvContent) {
      setErrorMsg('Por favor especifica un nombre y sube un archivo CSV válido.');
      return;
    }
    setLoading(true);
    try {
      // Admins perform campaign creation under the admin namespace
      const url = currentUser?.role === 'master' ? `${API_BASE}/admin/campaigns/upload` : `${API_BASE}/campaigns/upload`;
      const res = await authFetch(url, {
        method: 'POST',
        body: JSON.stringify({
          nombre: newCampaignName,
          csvData: csvContent,
          batchSize,
          batchIntervalHours: batchInterval,
          messageLimit,
          messageIntervalHours: messageInterval
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar campaña');
      
      setSuccessMsg('Campaña creada y ejecutada exitosamente.');
      setNewCampaignName('');
      setCsvContent('');
      setCsvFileName('');
      fetchCampaigns();
      setSelectedCampaign(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseCampaign = async (id) => {
    try {
      const url = currentUser?.role === 'master' ? `${API_BASE}/admin/campaigns/${id}/pause` : `${API_BASE}/campaigns/${id}/pause`;
      const res = await authFetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('Error al pausar');
      setSuccessMsg('Campaña pausada.');
      fetchCampaignDetails(id);
      fetchCampaigns();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleResumeCampaign = async (id) => {
    try {
      const url = currentUser?.role === 'master' ? `${API_BASE}/admin/campaigns/${id}/resume` : `${API_BASE}/admin/campaigns/${id}/resume`;
      const res = await authFetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('Error al reanudar');
      setSuccessMsg('Campaña reanudada.');
      fetchCampaignDetails(id);
      fetchCampaigns();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRestartCampaign = async (id) => {
    try {
      const url = currentUser?.role === 'master' ? `${API_BASE}/admin/campaigns/${id}/restart` : `${API_BASE}/admin/campaigns/${id}/restart`;
      const res = await authFetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('Error al reiniciar');
      setSuccessMsg('Campaña reiniciada.');
      fetchCampaignDetails(id);
      fetchCampaigns();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  // --- CRUD FUNCTIONS ---

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const url = currentUser?.role === 'master' ? `${API_BASE}/admin/users` : `${API_BASE}/users`;
      const res = await authFetch(url, {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      if (!res.ok) throw new Error('Error al crear usuario');
      setSuccessMsg('Usuario creado con éxito.');
      setNewUser({ nombre: '', email: '', contrasena: '' });
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('¿Deseas eliminar este usuario?')) return;
    try {
      const url = currentUser?.role === 'master' ? `${API_BASE}/admin/users/${id}` : `${API_BASE}/users/${id}`;
      const res = await authFetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setSuccessMsg('Usuario eliminado.');
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const url = currentUser?.role === 'master' ? `${API_BASE}/admin/products` : `${API_BASE}/products`;
      const res = await authFetch(url, {
        method: 'POST',
        body: JSON.stringify({
          ...newProduct,
          precio: parseFloat(newProduct.precio),
          stock: parseInt(newProduct.stock)
        })
      });
      if (!res.ok) throw new Error('Error al crear producto');
      setSuccessMsg('Producto creado con éxito.');
      setNewProduct({ nombre: '', precio: '', categoria: '', stock: '' });
      fetchProducts();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Deseas eliminar este producto?')) return;
    try {
      const url = currentUser?.role === 'master' ? `${API_BASE}/admin/products/${id}` : `${API_BASE}/products/${id}`;
      const res = await authFetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setSuccessMsg('Producto eliminado.');
      fetchProducts();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const url = currentUser?.role === 'master' ? `${API_BASE}/admin/services` : `${API_BASE}/services`;
      const res = await authFetch(url, {
        method: 'POST',
        body: JSON.stringify(newService)
      });
      if (!res.ok) throw new Error('Error al crear servicio');
      setSuccessMsg('Servicio creado con éxito.');
      setNewService({ nombre: '' });
      fetchServices();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteService = async (id) => {
    if (!confirm('¿Deseas eliminar este servicio?')) return;
    try {
      const url = currentUser?.role === 'master' ? `${API_BASE}/admin/services/${id}` : `${API_BASE}/services/${id}`;
      const res = await authFetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      setSuccessMsg('Servicio eliminado.');
      fetchServices();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSendManual = async (e) => {
    e.preventDefault();
    if (!manualContact.email) {
      setErrorMsg('Por favor ingresa un email válido.');
      return;
    }
    setManualSendLoading(true);
    try {
      const payload = {
        nombre: manualContact.nombre,
        email: manualContact.email,
        mensaje: manualContact.mensaje
      };

      const url = `${API_BASE}/campaigns/send-manual`;
      const res = await authFetch(url, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setSuccessMsg(`✅ ${data.message}`);
      setManualContact({ nombre: '', email: '', mensaje: '' });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setManualSendLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15) 0%, rgba(9, 15, 30, 1) 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#fff',
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Alerts and notifications */}
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {errorMsg && (
            <div className="glass-panel" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '12px 20px',
              animation: 'fadeIn 0.3s ease'
            }}>
              <AlertCircle color="#f87171" size={20} />
              <span style={{ color: '#f87171', fontWeight: 500 }}>{errorMsg}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="glass-panel" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '12px 20px',
              animation: 'fadeIn 0.3s ease'
            }}>
              <CheckCircle2 color="#34d399" size={20} />
              <span style={{ color: '#34d399', fontWeight: 500 }}>{successMsg}</span>
            </div>
          )}
        </div>

        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 className="gradient-text" style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Castel Campaign
            </h2>
            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
              {authMode === 'login' ? 'Ingresa tus credenciales para acceder' : 'Regístrate para recibir tu enlace de acceso directo'}
            </p>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label htmlFor="auth-email">Correo Electrónico</label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="admin@admin.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="auth-password">Contraseña</label>
                <input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>

              <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '10px' }}>
                {loading ? <RefreshCw size={18} className="spin-icon" style={{ animation: 'spinSlow 2s linear infinite' }} /> : 'Iniciar Sesión'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label htmlFor="reg-email">Correo Electrónico</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="tuemail@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '10px' }}>
                {loading ? <RefreshCw size={18} className="spin-icon" style={{ animation: 'spinSlow 2s linear infinite' }} /> : 'Recibir Enlace de Acceso'}
              </button>
            </form>
          )}

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', textAlign: 'center' }}>
            {authMode === 'login' ? (
              <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  Registrarse con Magic Link
                </button>
              </p>
            ) : (
              <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  Iniciar Sesión
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{
        width: '260px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRight: '1px solid var(--border-light)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Castel Campaign
          </h1>
          <span style={{ fontSize: '0.75rem', opacity: 0.5, letterSpacing: '1px', textTransform: 'uppercase' }}>
            N8N INTEGRATION
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`btn-secondary`}
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'dashboard' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              borderColor: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'dashboard' ? '#fff' : 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <LayoutDashboard size={20} color={activeTab === 'dashboard' ? 'var(--primary)' : 'rgba(255,255,255,0.7)'} />
            Dashboard
          </button>
          {currentUser?.role === 'master' && (
            <button 
              onClick={() => setActiveTab('manager')} 
              className={`btn-secondary`}
              style={{
                justifyContent: 'flex-start',
                background: activeTab === 'manager' ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                borderColor: activeTab === 'manager' ? '#60a5fa' : 'transparent',
                color: activeTab === 'manager' ? '#fff' : 'rgba(255, 255, 255, 0.7)'
              }}
            >
              <Layers size={20} color={activeTab === 'manager' ? '#60a5fa' : 'rgba(255,255,255,0.7)'} />
              Manager
            </button>
          )}
          <button 
            onClick={() => setActiveTab('send')} 
            className={`btn-secondary`}
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'send' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderColor: activeTab === 'send' ? '#34d399' : 'transparent',
              color: activeTab === 'send' ? '#fff' : 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <UserCheck size={20} color={activeTab === 'send' ? '#34d399' : 'rgba(255,255,255,0.7)'} />
            Envío Manual
          </button>
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          {currentUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{currentUser.nombre}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{currentUser.email}</span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: currentUser.role === 'master' ? '#60a5fa' : '#a78bfa',
                background: currentUser.role === 'master' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(167, 139, 250, 0.15)',
                border: '1px solid',
                borderColor: currentUser.role === 'master' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(167, 139, 250, 0.3)',
                padding: '2px 6px',
                borderRadius: '4px',
                width: 'fit-content',
                textTransform: 'uppercase',
                marginTop: '4px'
              }}>
                {currentUser.role}
              </span>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>N8N: Configurado</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              background: 'transparent',
              justifyContent: 'center',
              marginTop: '4px'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', height: '100vh' }}>
        
        {/* Alerts and notifications */}
        {errorMsg && (
          <div className="glass-panel" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderColor: 'rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.1)',
            marginBottom: '24px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <AlertCircle color="#f87171" size={24} />
            <span style={{ color: '#f87171', fontWeight: 500 }}>{errorMsg}</span>
          </div>
        )}
        
        {successMsg && (
          <div className="glass-panel" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            background: 'rgba(16, 185, 129, 0.1)',
            marginBottom: '24px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <CheckCircle2 color="#34d399" size={24} />
            <span style={{ color: '#34d399', fontWeight: 500 }}>{successMsg}</span>
          </div>
        )}

        {/* ----------------- TAB: DASHBOARD ----------------- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Control de Campañas</h2>
              <p style={{ opacity: 0.7 }}>Automatiza y envía mensajes masivos a través del flujo configurado en N8N.</p>
            </div>

            {/* STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="glass-panel">
                <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Campañas Totales</span>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0' }}>{campaigns.length}</p>
                <div style={{ height: '3px', background: 'var(--primary)', borderRadius: '2px', width: '60%' }}></div>
              </div>
              <div className="glass-panel">
                <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>En Ejecución</span>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0', color: 'var(--secondary)' }}>
                  {campaigns.filter(c => c.status === 'RUNNING').length}
                </p>
                <div style={{ height: '3px', background: 'var(--secondary)', borderRadius: '2px', width: '40%' }}></div>
              </div>
              <div className="glass-panel">
                <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Pausadas</span>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0', color: '#fbbf24' }}>
                  {campaigns.filter(c => c.status === 'PAUSED').length}
                </p>
                <div style={{ height: '3px', background: '#fbbf24', borderRadius: '2px', width: '30%' }}></div>
              </div>
              <div className="glass-panel">
                <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Contactos Válidos</span>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0', color: '#34d399' }}>
                  {campaigns.reduce((acc, c) => acc + c.validContacts, 0)}
                </p>
                <div style={{ height: '3px', background: '#34d399', borderRadius: '2px', width: '80%' }}></div>
              </div>
            </div>

            {/* CAMPAIGN LAUNCH FORM AND LIST */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
              
              {/* UPLOAD FORM */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 className="gradient-text-secondary" style={{ fontSize: '1.25rem' }}>Nueva Campaña</h3>
                
                <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label htmlFor="camp-name">Nombre de la Campaña</label>
                    <input 
                      id="camp-name"
                      type="text" 
                      placeholder="Ej. Campaña Email Masivo" 
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Drag and drop file select */}
                  <div>
                    <label>Archivo CSV de Contactos</label>
                    <div style={{
                      border: '2px dashed rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      position: 'relative'
                    }}>
                      <input 
                        type="file" 
                        accept=".csv"
                        onChange={handleFileUpload}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                      <Upload size={32} color="var(--primary)" style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        {csvFileName ? `Archivo: ${csvFileName}` : 'Arrastra o haz clic para subir CSV'}
                      </p>
                      <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                        Debe incluir cabeceras: "nombre", "email"
                      </span>
                    </div>
                  </div>

                  {/* PARAMS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label htmlFor="batch-size">Lote (Usuarios)</label>
                      <input 
                        id="batch-size"
                        type="number" 
                        value={batchSize} 
                        onChange={(e) => setBatchSize(e.target.value)} 
                        min="1"
                      />
                    </div>
                    <div>
                      <label htmlFor="batch-interval">Intervalo de Lote (Horas)</label>
                      <input 
                        id="batch-interval"
                        type="number" 
                        value={batchInterval} 
                        onChange={(e) => setBatchInterval(e.target.value)} 
                        min="1"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label htmlFor="msg-limit">Límite de Mensajes</label>
                      <input 
                        id="msg-limit"
                        type="number" 
                        value={messageLimit} 
                        onChange={(e) => setMessageLimit(e.target.value)} 
                        min="1"
                      />
                    </div>
                    <div>
                      <label htmlFor="msg-interval">Intervalo Mensaje (Horas)</label>
                      <input 
                        id="msg-interval"
                        type="number" 
                        value={messageInterval} 
                        onChange={(e) => setMessageInterval(e.target.value)} 
                        min="1"
                      />
                    </div>
                  </div>

                  <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
                    {loading ? <RefreshCw className="spin-icon" style={{ animation: 'spinSlow 2s linear infinite' }} /> : <Play size={18} />}
                    Crear e Iniciar Campaña
                  </button>
                </form>
              </div>

              {/* CAMPAIGN LIST */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '550px', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Historial de Campañas</h3>
                
                {campaigns.length === 0 ? (
                  <p style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>No hay campañas creadas aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {campaigns.map((c) => (
                      <div 
                        key={c.uuid} 
                        onClick={() => {
                          setSelectedCampaign(c);
                          fetchCampaignDetails(c.uuid);
                        }}
                        style={{
                          padding: '16px',
                          background: selectedCampaign?.uuid === c.uuid ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                          border: '1px solid',
                          borderColor: selectedCampaign?.uuid === c.uuid ? 'var(--primary)' : 'var(--border-light)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ fontWeight: 600 }}>{c.nombre}</h4>
                          <span className={`badge ${
                            c.status === 'RUNNING' ? 'badge-success' : 
                            c.status === 'PAUSED' ? 'badge-warning' : 
                            c.status === 'COMPLETED' ? 'badge-info' : 'badge-danger'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.6, marginBottom: '6px' }}>
                          <span>Contactos: {c.validContacts} válidos / {c.totalContacts} total</span>
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        {/* Simple Progress Bar */}
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${c.validContacts > 0 ? (c.validContacts / c.validContacts) * 100 : 0}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)' 
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CAMPAIGN DETAILS AND LOGS VIEW */}
            {selectedCampaign && (
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Detalle de Campaña: {selectedCampaign.nombre}</h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '4px' }}>UUID: {selectedCampaign.uuid}</p>
                  </div>
                  
                  {/* CONTROLS */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedCampaign.status === 'RUNNING' ? (
                      <button className="btn-secondary" onClick={() => handlePauseCampaign(selectedCampaign.uuid)}>
                        <Pause size={18} />
                        Pausar
                      </button>
                    ) : selectedCampaign.status === 'PAUSED' ? (
                      <button className="btn-primary" onClick={() => handleResumeCampaign(selectedCampaign.uuid)}>
                        <Play size={18} />
                        Reanudar
                      </button>
                    ) : null}
                    
                    <button className="btn-secondary" onClick={() => handleRestartCampaign(selectedCampaign.uuid)}>
                      <RotateCcw size={18} />
                      Reiniciar
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                  
                  {/* CONTACTS TABLE */}
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Contactos de la Planilla</h4>
                    <div style={{ overflowX: 'auto', maxHeight: '400px', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                            <th style={{ padding: '12px' }}>Nombre</th>
                            <th style={{ padding: '12px' }}>Email</th>
                            <th style={{ padding: '12px' }}>Validación</th>
                            <th style={{ padding: '12px' }}>Envío</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCampaign.contacts?.map((contact) => (
                            <tr key={contact.uuid} style={{ borderBottom: '1px solid var(--border-light)' }}>
                              <td style={{ padding: '12px' }}>{contact.nombre}</td>
                              <td style={{ padding: '12px' }}>{contact.email}</td>
                              <td style={{ padding: '12px' }}>
                                <span className={`badge ${contact.isValid ? 'badge-success' : 'badge-danger'}`}>
                                  {contact.isValid ? 'Válido' : 'Inválido'}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span className={`badge ${
                                  contact.status === 'SENT' ? 'badge-success' :
                                  contact.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
                                }`}>
                                  {contact.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SENDING LOGS FEED */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '1.1rem' }}>Logs de Envío Multicanal</h4>
                      <Clock size={16} style={{ opacity: 0.5 }} />
                    </div>

                    <div style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      padding: '16px',
                      height: '400px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      fontFamily: 'monospace'
                    }}>
                      {selectedCampaign.logs?.length === 0 ? (
                        <p style={{ opacity: 0.4, textAlign: 'center', padding: '40px', fontSize: '0.9rem' }}>
                          Esperando a que N8N inicie el envío de mensajes...
                        </p>
                      ) : (
                        selectedCampaign.logs?.map((log) => (
                          <div 
                            key={log.uuid}
                            style={{
                              padding: '10px',
                              background: 'rgba(255,255,255,0.02)',
                              borderLeft: '3px solid #a78bfa',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', opacity: 0.7 }}>
                              <span>[EMAIL] Envío {log.messageIndex}</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p style={{ color: '#fff', fontSize: '0.85rem' }}>{log.message}</p>
                            <span style={{ fontSize: '0.75rem', color: log.status === 'SUCCESS' ? '#34d399' : '#f87171', display: 'block', marginTop: '4px' }}>
                              Estado: {log.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: MANAGER (CONSOLIDATED ADMIN VIEW) ----------------- */}
        {activeTab === 'manager' && currentUser?.role === 'master' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.4s ease' }}>
            <div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '8px' }}>Portal del Manager Administrativo</h2>
              <p style={{ opacity: 0.7 }}>Control centralizado de usuarios, productos, servicios, campañas y flujos de automatización.</p>
            </div>

            {/* MANAGER SUB-TAB SELECTOR */}
            <div style={{
              display: 'flex',
              gap: '12px',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '8px',
              overflowX: 'auto'
            }}>
              {[
                { id: 'dashboard', label: 'Métricas', icon: '📊' },
                { id: 'users', label: 'Usuarios', icon: '👥' },
                { id: 'products', label: 'Productos', icon: '🛍️' },
                { id: 'services', label: 'Servicios', icon: '⚙️' },
                { id: 'campaigns', label: 'Campañas', icon: '📣' },
                { id: 'n8n', label: 'Workflow N8N', icon: '🤖' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setManagerSubTab(sub.id)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: managerSubTab === sub.id ? 'var(--primary)' : 'transparent',
                    background: managerSubTab === sub.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    color: managerSubTab === sub.id ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ marginRight: '8px' }}>{sub.icon}</span>
                  {sub.label}
                </button>
              ))}
            </div>

            {/* SUB-TAB: DASHBOARD / METRICS */}
            {managerSubTab === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Usuarios del Sistema</span>
                    <p style={{ fontSize: '2.25rem', fontWeight: 700, margin: '8px 0' }}>{users.length}</p>
                    <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>Registrados en PostgreSQL</span>
                  </div>
                  <div className="glass-panel" style={{ borderLeft: '4px solid #60a5fa' }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Productos</span>
                    <p style={{ fontSize: '2.25rem', fontWeight: 700, margin: '8px 0' }}>{products.length}</p>
                    <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>En el catálogo</span>
                  </div>
                  <div className="glass-panel" style={{ borderLeft: '4px solid #a78bfa' }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Servicios</span>
                    <p style={{ fontSize: '2.25rem', fontWeight: 700, margin: '8px 0' }}>{services.length}</p>
                    <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>Servicios disponibles</span>
                  </div>
                  <div className="glass-panel" style={{ borderLeft: '4px solid #34d399' }}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Campañas</span>
                    <p style={{ fontSize: '2.25rem', fontWeight: 700, margin: '8px 0' }}>{campaigns.length}</p>
                    <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>Totales creadas</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Información del Administrador</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', opacity: 0.8 }}>
                    <p><strong>Nombre:</strong> {currentUser.nombre}</p>
                    <p><strong>Email:</strong> {currentUser.email}</p>
                    <p><strong>Rol:</strong> <span className="badge badge-success" style={{ textTransform: 'uppercase' }}>{currentUser.role}</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: USERS CONTROL */}
            {managerSubTab === 'users' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'start' }}>
                <div className="glass-panel">
                  <h3 className="gradient-text-secondary" style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Crear Usuario</h3>
                  <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label htmlFor="usr-name">Nombre Completo</label>
                      <input 
                        id="usr-name"
                        type="text" 
                        placeholder="Juan Pérez" 
                        value={newUser.nombre}
                        onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="usr-email">Email</label>
                      <input 
                        id="usr-email"
                        type="email" 
                        placeholder="juan@example.com" 
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="usr-pass">Contraseña</label>
                      <input 
                        id="usr-pass"
                        type="password" 
                        placeholder="••••••••" 
                        value={newUser.contrasena}
                        onChange={(e) => setNewUser({ ...newUser, contrasena: e.target.value })}
                        required
                      />
                    </div>
                    <button className="btn-primary" type="submit">
                      <Plus size={18} />
                      Guardar Usuario
                    </button>
                  </form>
                </div>

                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '16px' }}>Nombre</th>
                        <th style={{ padding: '16px' }}>Email</th>
                        <th style={{ padding: '16px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>No hay usuarios registrados.</td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.uuid} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '16px', fontWeight: 500 }}>{u.nombre}</td>
                            <td style={{ padding: '16px' }}>{u.email}</td>
                            <td style={{ padding: '16px' }}>
                              <button 
                                onClick={() => handleDeleteUser(u.uuid)}
                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB: PRODUCTS CONTROL */}
            {managerSubTab === 'products' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'start' }}>
                <div className="glass-panel">
                  <h3 className="gradient-text-secondary" style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Crear Producto</h3>
                  <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label htmlFor="prod-name">Nombre del Producto</label>
                      <input 
                        id="prod-name"
                        type="text" 
                        placeholder="Notebook Gamer" 
                        value={newProduct.nombre}
                        onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="prod-price">Precio (USD)</label>
                      <input 
                        id="prod-price"
                        type="number" 
                        step="0.01" 
                        placeholder="1299.99" 
                        value={newProduct.precio}
                        onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="prod-cat">Categoría</label>
                      <input 
                        id="prod-cat"
                        type="text" 
                        placeholder="Electrónica" 
                        value={newProduct.categoria}
                        onChange={(e) => setNewProduct({ ...newProduct, categoria: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="prod-stock">Stock Inicial</label>
                      <input 
                        id="prod-stock"
                        type="number" 
                        placeholder="15" 
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        required
                      />
                    </div>
                    <button className="btn-primary" type="submit">
                      <Plus size={18} />
                      Guardar Producto
                    </button>
                  </form>
                </div>

                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '16px' }}>Nombre</th>
                        <th style={{ padding: '16px' }}>Precio</th>
                        <th style={{ padding: '16px' }}>Categoría</th>
                        <th style={{ padding: '16px' }}>Stock</th>
                        <th style={{ padding: '16px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>No hay productos registrados.</td>
                        </tr>
                      ) : (
                        products.map((p) => (
                          <tr key={p.uuid} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '16px', fontWeight: 500 }}>{p.nombre}</td>
                            <td style={{ padding: '16px', fontFamily: 'monospace' }}>${parseFloat(p.precio).toFixed(2)}</td>
                            <td style={{ padding: '16px' }}><span className="badge badge-info">{p.categoria}</span></td>
                            <td style={{ padding: '16px' }}>{p.stock} uds</td>
                            <td style={{ padding: '16px' }}>
                              <button 
                                onClick={() => handleDeleteProduct(p.uuid)}
                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB: SERVICES CONTROL */}
            {managerSubTab === 'services' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'start' }}>
                <div className="glass-panel">
                  <h3 className="gradient-text-secondary" style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Crear Servicio</h3>
                  <form onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label htmlFor="srv-name">Nombre del Servicio</label>
                      <input 
                        id="srv-name"
                        type="text" 
                        placeholder="Consultoría Cloud" 
                        value={newService.nombre}
                        onChange={(e) => setNewService({ nombre: e.target.value })}
                        required
                      />
                    </div>
                    <button className="btn-primary" type="submit">
                      <Plus size={18} />
                      Guardar Servicio
                    </button>
                  </form>
                </div>

                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '16px' }}>Nombre</th>
                        <th style={{ padding: '16px' }}>ID de Servicio (UUID)</th>
                        <th style={{ padding: '16px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>No hay servicios registrados.</td>
                        </tr>
                      ) : (
                        services.map((s) => (
                          <tr key={s.uuid} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '16px', fontWeight: 500 }}>{s.nombre}</td>
                            <td style={{ padding: '16px', fontFamily: 'monospace', opacity: 0.7 }}>{s.uuid}</td>
                            <td style={{ padding: '16px' }}>
                              <button 
                                onClick={() => handleDeleteService(s.uuid)}
                                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB: CAMPAIGNS CONTROL */}
            {managerSubTab === 'campaigns' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Monitoreo Global de Campañas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {campaigns.length === 0 ? (
                    <p style={{ opacity: 0.5, textAlign: 'center', padding: '40px' }}>No hay campañas para gestionar.</p>
                  ) : (
                    campaigns.map((c) => (
                      <div 
                        key={c.uuid}
                        style={{
                          padding: '20px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{c.nombre}</h4>
                            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>ID: {c.uuid}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className={`badge ${
                              c.status === 'RUNNING' ? 'badge-success' : 
                              c.status === 'PAUSED' ? 'badge-warning' : 
                              c.status === 'COMPLETED' ? 'badge-info' : 'badge-danger'
                            }`}>
                              {c.status}
                            </span>
                            {c.status === 'RUNNING' ? (
                              <button className="btn-secondary" onClick={() => handlePauseCampaign(c.uuid)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Pausar</button>
                            ) : c.status === 'PAUSED' ? (
                              <button className="btn-primary" onClick={() => handleResumeCampaign(c.uuid)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Reanudar</button>
                            ) : null}
                            <button className="btn-secondary" onClick={() => handleRestartCampaign(c.uuid)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Reiniciar</button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.7 }}>
                          <span>Contactos: {c.validContacts} válidos / {c.totalContacts} total</span>
                          <span>Fecha: {new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB: WORKFLOW N8N / TRIGGERS */}
            {managerSubTab === 'n8n' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60a5fa' }}>🤖 Integración con N8N</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.5 }}>
                    Accede a tu instancia de N8N para ver los logs visuales de tu workflow o editar los disparadores de automatizaciones.
                  </p>
                  
                  <a 
                    href="https://afoot-parting-caterer.ngrok-free.dev" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-primary" 
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    🚀 Abrir Workflow N8N
                  </a>
                </div>

                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24' }}>📢 Monitoreo de CSV por Telegram</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.5 }}>
                    Dispara una verificación manual inmediata del archivo CSV. Si se encuentra vacío o desactualizado, el workflow de N8N te enviará una alerta directamente a Telegram.
                  </p>

                  <button 
                    onClick={handleTriggerCsvCheck} 
                    className="btn-primary"
                    disabled={webhookTesting}
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                      borderColor: '#fbbf24',
                      color: '#000',
                      fontWeight: 700
                    }}
                  >
                    {webhookTesting ? <RefreshCw className="spin-icon" style={{ animation: 'spinSlow 2s linear infinite' }} /> : '🔔 Chequear CSV y Alertar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: ENVÍO MANUAL ----------------- */}
        {activeTab === 'send' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Envío Manual</h2>
              <p style={{ opacity: 0.7 }}>Envía un email directo a un cliente específico.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

              {/* SEND FORM */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(6,182,212,0.3) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Send size={20} color="#34d399" />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Nuevo Mensaje</h3>
                </div>

                <form onSubmit={handleSendManual} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* NOMBRE */}
                  <div>
                    <label htmlFor="manual-nombre">Nombre del Cliente (opcional)</label>
                    <input
                      id="manual-nombre"
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={manualContact.nombre}
                      onChange={(e) => setManualContact({ ...manualContact, nombre: e.target.value })}
                    />
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label htmlFor="manual-email" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="#a78bfa" />
                      Email del Cliente
                    </label>
                    <input
                      id="manual-email"
                      type="email"
                      placeholder="cliente@example.com"
                      value={manualContact.email}
                      onChange={(e) => setManualContact({ ...manualContact, email: e.target.value })}
                      required
                    />
                  </div>

                  {/* MENSAJE PERSONALIZADO */}
                  <div>
                    <label htmlFor="manual-msg">Mensaje Personalizado (opcional)</label>
                    <textarea
                      id="manual-msg"
                      placeholder="Escribe aquí un mensaje personalizado para el cliente. Si lo dejas vacío se usará el template de N8N."
                      value={manualContact.mensaje}
                      onChange={(e) => setManualContact({ ...manualContact, mensaje: e.target.value })}
                      rows={4}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    id="btn-enviar-manual"
                    className="btn-primary"
                    type="submit"
                    disabled={manualSendLoading}
                    style={{
                      background: manualSendLoading
                        ? 'rgba(16,185,129,0.3)'
                        : 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                      marginTop: '8px'
                    }}
                  >
                    {manualSendLoading
                      ? <RefreshCw size={18} style={{ animation: 'spinSlow 2s linear infinite' }} />
                      : <Send size={18} />}
                    {manualSendLoading ? 'Enviando...' : 'Enviar Mensaje'}
                  </button>
                </form>
              </div>

              {/* INFO PANEL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-panel" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: '#34d399' }}>📋 ¿Cómo funciona?</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { icon: '1️⃣', title: 'Selecciona el canal', desc: 'Elige si enviar por email, teléfono o ambos.' },
                      { icon: '2️⃣', title: 'Ingresa los datos', desc: 'Completa el nombre y el contacto del cliente.' },
                      { icon: '3️⃣', title: 'Mensaje opcional', desc: 'Puedes personalizar el mensaje o usar el template de N8N.' },
                      { icon: '4️⃣', title: 'Envía', desc: 'El mensaje se dispara a través del webhook de N8N inmediatamente.' }
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{step.icon}</span>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{step.title}</p>
                          <p style={{ fontSize: '0.8rem', opacity: 0.6, lineHeight: 1.4 }}>{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel" style={{ borderColor: 'rgba(251, 191, 36, 0.2)', background: 'rgba(251, 191, 36, 0.05)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px', color: '#fbbf24' }}>⚠️ Importante</h4>
                  <ul style={{ fontSize: '0.82rem', opacity: 0.75, lineHeight: 1.7, paddingLeft: '16px', margin: 0 }}>
                    <li>El envío se procesa a través del flujo de N8N configurado.</li>
                    <li>Los envíos se hacen por lotes de 10 emails cada 2 minutos, con pausas de 1 hora.</li>
                    <li>Si el webhook de N8N no está activo, el envío fallará.</li>
                    <li>Los envíos manuales no se guardan en el historial de campañas.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
