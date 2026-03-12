import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './Login.css';

export default function Login() {
  const { signIn, user, isLoading } = useUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user && !isLoading) {
    navigate(`/${user.role === 'ADMIN' ? 'admin' : user.role === 'QUOTER' ? 'cotizador' : user.role === 'SALES' ? 'comercial' : user.role === 'DEVELOPMENT' ? 'desarrollo' : 'disenador'}`, {
      replace: true,
    });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const u = await signIn({ email, password });
      const path =
        u?.role === 'ADMIN'
          ? '/admin'
          : u?.role === 'QUOTER'
            ? '/cotizador'
            : u?.role === 'SALES'
              ? '/comercial'
              : u?.role === 'DEVELOPMENT'
                ? '/desarrollo'
                : '/disenador';
      navigate(path, { replace: true });
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">MUMA</h1>
        <p className="login-subtitle">Catálogo de Especiales</p>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
