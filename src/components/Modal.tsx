import React from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200}}
        className="flex items-center justify-center p-6"
      >
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}} className="bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "relative w-full max-w-sm bg-background border border-foreground shadow-2xl z-10",
            className
          )}
        >
          {title && (
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">{title}</h3>
              <button onClick={onClose} className="p-1 text-muted hover:text-foreground transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="px-6 pb-6">
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- Alert Modal ---
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

export const AlertModal = ({ isOpen, onClose, message, title = 'System Notice' }: AlertModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <p className="text-[10px] text-muted uppercase tracking-widest leading-relaxed mb-6">{message}</p>
    <button
      onClick={onClose}
      className="w-full bg-foreground text-background py-3 text-[10px] font-bold uppercase tracking-widest"
    >
      Understood
    </button>
  </Modal>
);

// --- Confirm Modal ---
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export const ConfirmModal = ({ isOpen, onClose, onConfirm, message, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel', danger }: ConfirmModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <p className="text-[10px] text-muted uppercase tracking-widest leading-relaxed mb-6">{message}</p>
    <div className="flex gap-2">
      <button
        onClick={onClose}
        className="flex-1 border border-border py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary-bg transition-colors"
      >
        {cancelText}
      </button>
      <button
        onClick={() => { onConfirm(); onClose(); }}
        className={cn(
          "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors",
          danger ? "bg-[#FF4444] text-white" : "bg-foreground text-background"
        )}
      >
        {confirmText}
      </button>
    </div>
  </Modal>
);

// --- Prompt Modal ---
interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  message: string;
  title?: string;
  defaultValue?: string;
  placeholder?: string;
  inputType?: string;
  submitText?: string;
}

export const PromptModal = ({ isOpen, onClose, onSubmit, message, title = 'Input Required', defaultValue = '', placeholder, inputType = 'text', submitText = 'Submit' }: PromptModalProps) => {
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-[10px] text-muted uppercase tracking-widest leading-relaxed mb-4">{message}</p>
      <input
        type={inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground placeholder:text-muted rounded-none mb-4"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onSubmit(value);
            onClose();
          }
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 border border-border py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary-bg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => { if (value.trim()) { onSubmit(value); onClose(); } }}
          className="flex-1 bg-foreground text-background py-3 text-[10px] font-bold uppercase tracking-widest"
        >
          {submitText}
        </button>
      </div>
    </Modal>
  );
};

// --- useModal hook for imperative-style usage ---
interface ModalState {
  alert: { isOpen: boolean; message: string; title?: string };
  confirm: { isOpen: boolean; message: string; title?: string; danger?: boolean; onConfirm: () => void };
  prompt: { isOpen: boolean; message: string; title?: string; defaultValue?: string; placeholder?: string; inputType?: string; onSubmit: (val: string) => void };
}

const defaultModalState: ModalState = {
  alert: { isOpen: false, message: '' },
  confirm: { isOpen: false, message: '', onConfirm: () => {} },
  prompt: { isOpen: false, message: '', onSubmit: () => {} },
};

export function useModal() {
  const [state, setState] = React.useState<ModalState>(defaultModalState);

  const showAlert = (message: string, title?: string) => {
    setState(prev => ({ ...prev, alert: { isOpen: true, message, title } }));
  };

  const showConfirm = (message: string, onConfirm: () => void, opts?: { title?: string; danger?: boolean }) => {
    setState(prev => ({ ...prev, confirm: { isOpen: true, message, onConfirm, ...opts } }));
  };

  const showPrompt = (message: string, onSubmit: (val: string) => void, opts?: { title?: string; defaultValue?: string; placeholder?: string; inputType?: string }) => {
    setState(prev => ({ ...prev, prompt: { isOpen: true, message, onSubmit, ...opts } }));
  };

  const closeAlert = () => setState(prev => ({ ...prev, alert: { ...prev.alert, isOpen: false } }));
  const closeConfirm = () => setState(prev => ({ ...prev, confirm: { ...prev.confirm, isOpen: false } }));
  const closePrompt = () => setState(prev => ({ ...prev, prompt: { ...prev.prompt, isOpen: false } }));

  const ModalRenderer = () => (
    <>
      <AlertModal isOpen={state.alert.isOpen} onClose={closeAlert} message={state.alert.message} title={state.alert.title} />
      <ConfirmModal isOpen={state.confirm.isOpen} onClose={closeConfirm} onConfirm={state.confirm.onConfirm} message={state.confirm.message} title={state.confirm.title} danger={state.confirm.danger} />
      <PromptModal isOpen={state.prompt.isOpen} onClose={closePrompt} onSubmit={state.prompt.onSubmit} message={state.prompt.message} title={state.prompt.title} defaultValue={state.prompt.defaultValue} placeholder={state.prompt.placeholder} inputType={state.prompt.inputType} />
    </>
  );

  return { showAlert, showConfirm, showPrompt, ModalRenderer };
}
