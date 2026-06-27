import React from 'react';
import { FiShieldOff, FiX } from 'react-icons/fi';

const DeleteUserModal = ({ open, user, loading, onClose, onConfirm }) => {
  if (!open || !user) return null;

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="admin-hero-badge"><FiShieldOff /> Desativar acesso</div>
            <h3 className="mt-4 text-2xl font-semibold text-dark-text">Confirmar desativação</h3>
            <p className="mt-2 text-sm leading-6 text-dark-text-secondary">
              Você está prestes a desativar o acesso de <strong className="text-dark-text">{user.email}</strong>.
              O usuário deixará de autenticar, mas o histórico de imports e auditoria será preservado.
            </p>
          </div>
          <button type="button" onClick={onClose} className="admin-inline-action is-muted">
            <FiX />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-dark-text-secondary">
              Usuário selecionado
            </label>
            <div className="admin-static-field">{user.email}</div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-dark-text-secondary">
              Status atual
            </label>
            <div className="admin-static-field">{user.is_active ? 'Ativo' : 'Inativo'}</div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="admin-ghost-button">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(user)}
              className="admin-primary-button"
              disabled={loading || !user.is_active}
            >
              {loading ? 'Desativando...' : user.is_active ? 'Confirmar desativação' : 'Usuário já inativo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
