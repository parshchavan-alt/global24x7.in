import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, Key, X } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (isDefaultPasscode?: boolean) => void;
  onLogSecurityEvent: (action: string, status: 'success' | 'warning' | 'alert', details: string) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  onLogSecurityEvent,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        sessionStorage.setItem('chronicle_admin_session', data.token);
        sessionStorage.setItem('chronicle_admin_session_expiry', (Date.now() + 7 * 86400 * 1000).toString());
        localStorage.setItem('chronicle_admin_token', data.token);
        // Also keep client passcode cache for offline fallback
        localStorage.setItem('chronicle_admin_passcode', passcode);

        onLogSecurityEvent('Admin Login', 'success', 'Authenticated with master passcode');
        setPasscode('');
        setError(null);
        onAuthenticated(data.isDefault);
      } else {
        const errMsg = data.error || 'Invalid master passcode. Access denied.';
        setError(errMsg);
        if (res.status === 429) {
          setIsLockedOut(true);
        } else {
          setFailedAttempts((prev) => prev + 1);
        }
        onLogSecurityEvent('Failed Auth Attempt', 'alert', errMsg);
      }
    } catch {
      // Fallback if server is temporarily unreachable (e.g. edge or static export)
      const localPasscode = localStorage.getItem('chronicle_admin_passcode');
      if (localPasscode && passcode === localPasscode) {
        sessionStorage.setItem('chronicle_admin_session', 'offline_token_' + Date.now());
        sessionStorage.setItem('chronicle_admin_session_expiry', (Date.now() + 2 * 3600 * 1000).toString());
        onAuthenticated(false);
      } else {
        setError('Network error: Unable to verify credentials with security server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-stone-300 rounded-sm shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 text-stone-900">
          <div className="p-2 bg-stone-100 rounded-sm">
            <ShieldCheck className="w-5 h-5 text-stone-800" />
          </div>
          <div>
            <h2 className="text-base font-bold font-editorial-serif tracking-tight">
              Editorial Control Center
            </h2>
            <p className="text-xs text-stone-500 font-mono">Restricted Access & Audit Active</p>
          </div>
        </div>

        <p className="text-xs text-stone-600 mb-5 leading-relaxed">
          Enter the master editorial passcode to access the AI fine-tuning laboratory, automated scheduler, and publication management console.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 font-mono uppercase">
              Master Passcode
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode..."
                disabled={isLockedOut || isLoading}
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-stone-500">
              <span className="text-stone-400 font-mono text-[10px]">Restricted Editorial Access</span>
              <span className="text-stone-400 font-mono text-[10px]">Encrypted Session</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLockedOut || !passcode || isLoading}
              className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Verifying...' : 'Unlock Admin Suite'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
