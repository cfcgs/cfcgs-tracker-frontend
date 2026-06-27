import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiLock, FiX } from 'react-icons/fi';

const AdminLoginModal = ({ open, onClose, onSubmit, loading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({ username, password });
  };

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="admin-hero-badge"><FiLock /> Acesso autenticado</div>
            <h3 className="mt-4 text-2xl font-semibold text-dark-text">Entrar na área de gestão</h3>
            <p className="mt-2 text-sm leading-6 text-dark-text-secondary">
              Use seu username ou email e a senha cadastrada no backend para liberar o console de gestão.
            </p>
          </div>
          <button type="button" onClick={onClose} className="admin-inline-action is-muted">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            className="admin-form-input"
            placeholder="Username ou email"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <div className="admin-password-field">
            <input
              className="admin-form-input admin-form-input-with-icon"
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="admin-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
              title={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {error ? <div className="admin-feedback is-error"><span>{error}</span></div> : null}
          <button type="submit" className="admin-primary-button w-full justify-center" disabled={loading}>
            {loading ? 'Entrando...' : 'Autenticar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginModal;
