import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          🔧 HandwerkerNetz
        </Link>
        <div className="navbar-links">
          <Link to="/jobs">
            <span>🔍</span> <span>Aufträge</span>
          </Link>
          {user ? (
            <>
              <Link to="/dashboard">
                <span>📊</span> <span>Dashboard</span>
              </Link>
              {user.is_admin && (
                <Link to="/admin" style={{ color: 'var(--accent-dark)', fontWeight: 700 }}>
                  <span>⚙️</span> <span>Admin</span>
                </Link>
              )}
              {user.role === 'customer' && (
                <Link to="/jobs/new">
                  <span>➕</span> <span>Auftrag</span>
                </Link>
              )}
              <Link to={`/profile/${user.id}`}>
                <span>👤</span> <span>{user.name.split(' ')[0]}</span>
              </Link>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleLogout}
              >
                Abmelden
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={location.pathname === '/login' ? 'btn btn-outline btn-sm' : ''}>
                Anmelden
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Kostenlos registrieren
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
