import React, { useState } from 'react';
import Modal from './Modal';
import { btnDanger, btnGhost, btnPrimary } from './ui';

interface Props {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

const ConfirmDialog: React.FC<Props> = ({ title, message, confirmLabel, danger, onConfirm, onClose }) => {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={title} onClose={onClose}>
      <div className="text-gray-300 mb-6">{message}</div>
      <div className="flex justify-end gap-3">
        <button type="button" className={btnGhost} onClick={onClose}>Keep as is</button>
        <button type="button" className={danger ? btnDanger : btnPrimary} onClick={run} disabled={busy}>{confirmLabel}</button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
