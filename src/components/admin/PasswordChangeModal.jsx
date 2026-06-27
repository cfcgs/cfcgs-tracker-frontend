import React, { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiEye, FiEyeOff, FiKey, FiX } from 'react-icons/fi';

const PasswordChangeModal = ({
  open,
  loading,
  error,
  onClose,
  onVerifyCurrentPassword,
  onSaveNewPassword,
}) => {
  const [step, setStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const matches = useMemo(() => {
    if (!newPassword && !confirmation) return null;
    return newPassword.length > 0 && newPassword === confirmation;
  }, [newPassword, confirmation]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmation(false);
    }
  }, [open]);

  if (!open) return null;

  const closeAndReset = () => {
    setStep(1);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmation(false);
    onClose();
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    const ok = await onVerifyCurrentPassword(currentPassword);
    if (ok) {
      setStep(2);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const ok = await onSaveNewPassword({
      currentPassword,
      newPassword,
      confirmation,
    });
    if (ok) {
      closeAndReset();
    }
  };

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal-card admin-modal-card-wide">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="admin-hero-badge"><FiKey /> Alterar senha</div>
            <h3 className="mt-4 text-2xl font-semibold text-dark-text">Atualização segura de senha</h3>
            <p className="mt-2 text-sm leading-6 text-dark-text-secondary">
              Primeiro confirme sua senha atual. Depois defina a nova senha e valide a confirmação antes de salvar.
            </p>
          </div>
          <button type="button" onClick={closeAndReset} className="admin-inline-action is-muted">
            <FiX />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-dark-text-secondary">
                Confirme sua senha atual
              </label>
              <div className="admin-password-field">
                <input
                  className="admin-form-input admin-form-input-with-icon"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowCurrentPassword((current) => !current)}
                  aria-label={showCurrentPassword ? 'Ocultar senha atual' : 'Visualizar senha atual'}
                  title={showCurrentPassword ? 'Ocultar senha atual' : 'Visualizar senha atual'}
                >
                  {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            {error ? <div className="admin-feedback is-error"><span>{error}</span></div> : null}
            <div className="flex justify-end">
              <button type="submit" className="admin-primary-button" disabled={loading}>
                {loading ? 'Validando...' : 'Validar senha atual'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-dark-text-secondary">
                  Nova senha
                </label>
                <div className="admin-password-field">
                  <input
                    className="admin-form-input admin-form-input-with-icon"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() => setShowNewPassword((current) => !current)}
                    aria-label={showNewPassword ? 'Ocultar nova senha' : 'Visualizar nova senha'}
                    title={showNewPassword ? 'Ocultar nova senha' : 'Visualizar nova senha'}
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-dark-text-secondary">
                  Confirmar nova senha
                </label>
                <div className="admin-password-field">
                  <input
                    className="admin-form-input admin-form-input-with-icon admin-form-input-with-status"
                    type={showConfirmation ? 'text' : 'password'}
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    required
                  />
                  <span
                    className={`admin-password-match-icon ${matches === true ? 'is-match' : matches === false ? 'is-mismatch' : ''}`}
                    aria-hidden="true"
                  >
                    {matches === true ? <FiCheck /> : matches === false ? <FiX /> : null}
                  </span>
                  <button
                    type="button"
                    className="admin-password-toggle admin-password-toggle-secondary"
                    onClick={() => setShowConfirmation((current) => !current)}
                    aria-label={showConfirmation ? 'Ocultar confirmação de senha' : 'Visualizar confirmação de senha'}
                    title={showConfirmation ? 'Ocultar confirmação de senha' : 'Visualizar confirmação de senha'}
                  >
                    {showConfirmation ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            </div>

            {error ? <div className="admin-feedback is-error"><span>{error}</span></div> : null}
            <div className="flex justify-end">
              <button type="submit" className="admin-primary-button" disabled={loading || matches !== true}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PasswordChangeModal;
