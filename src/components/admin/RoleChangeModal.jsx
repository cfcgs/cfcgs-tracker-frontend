import React, { useEffect, useState } from 'react';
import { FiShield, FiX } from 'react-icons/fi';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'importer', label: 'Importer' },
];

const RoleChangeModal = ({ open, user, loading, onClose, onConfirm }) => {
  const [role, setRole] = useState('importer');

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  if (!open || !user) return null;

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="admin-hero-badge"><FiShield /> Alterar role</div>
            <h3 className="mt-4 text-2xl font-semibold text-dark-text">Definir perfil de acesso</h3>
            <p className="mt-2 text-sm leading-6 text-dark-text-secondary">
              Escolha a nova role para <strong className="text-dark-text">{user.email}</strong>. Essa alteração impacta imediatamente o acesso às áreas de gestão.
            </p>
          </div>
          <button type="button" onClick={onClose} className="admin-inline-action is-muted">
            <FiX />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-dark-text-secondary">
              Role atual
            </label>
            <div className="admin-static-field">{user.role}</div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-dark-text-secondary">
              Nova role
            </label>
            <select
              className="admin-form-input"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="admin-ghost-button">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(role)}
              className="admin-primary-button"
              disabled={loading || role === user.role}
            >
              {loading ? 'Salvando...' : 'Confirmar role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleChangeModal;
