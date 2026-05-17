
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  MoreVertical, 
  ChevronLeft, 
  Shield, 
  Settings as SettingsIcon,
  Trash2,
  AlertTriangle,
  Lock,
  BookOpen,
  WifiOff,
  Phone,
  Scan,
  Send,
  ArrowRight,
  Download,
  Moon,
  Sun,
  Smartphone,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Storage, Note, Notebook, EmergencyContact, VaultItem } from './services/storage';
import { VaultService } from './services/vaultService';
import { loginWithGoogle, logout, auth, testFirebaseConnection } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SAFETY_LIBRARY } from './constants/library';
import Markdown from 'react-markdown';
import { askAssistant as askAssistantService, type ChatMessage } from './services/aiService';
import { useModal } from './components/Modal';
import { Cloud, LogOut, CheckCircle, RefreshCcw } from 'lucide-react';

// --- Types ---
type AppMode = 'onboarding' | 'normal' | 'private';
type PrivateView = 'menu' | 'contacts' | 'sos' | 'planning' | 'vault' | 'safety-check' | 'library' | 'ai';

// --- Components ---
const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-4 px-6">{children}</h3>
);

const Button = ({ 
  children, 
  onClick, 
  className, 
  variant = 'secondary',
  id 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  id?: string;
}) => {
  const variants = {
    primary: 'bg-foreground text-background',
    secondary: 'bg-background border border-border text-foreground hover:bg-secondary-bg',
    danger: 'bg-background border border-border text-foreground hover:bg-foreground hover:text-background',
    ghost: 'bg-transparent text-muted hover:text-foreground'
  };
  
  return (
    <button 
      id={id}
      onClick={onClick}
      className={cn(
        "px-4 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors active:opacity-70 flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  className,
  type = 'text',
  id
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string; 
  className?: string;
  type?: string;
  id?: string;
}) => (
  <input 
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={cn(
      "w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground placeholder:text-muted rounded-none",
      className
    )}
  />
);

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState<AppMode>('normal');

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);
  const [privateView, setPrivateView] = useState<PrivateView>('menu');
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pin, setPin] = useState('');
  const [validatedPin, setValidatedPin] = useState<string | null>(null);

  // Notebooks
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  // Private Data State
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [decryptedItem, setDecryptedItem] = useState<{type: VaultItem['type'], label: string, content: string} | null>(null);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeEngine, setActiveEngine] = useState<'gemma' | 'local'>('local');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : false);
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal system
  const { showAlert, showConfirm, showPrompt, ModalRenderer } = useModal();

  // Onboarding data
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingPin, setOnboardingPin] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCode, setContactCode] = useState('');

  const [appDisplayName, setAppDisplayName] = useState('QuietInk System');
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Security Settings
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [emergencyResource, setEmergencyResource] = useState('');
  const [safetySensitivity, setSafetySensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [helpPriority, setHelpPriority] = useState<'immediate' | 'planning'>('immediate');
  const [aiTone, setAiTone] = useState<'supportive' | 'neutral'>('supportive');
  const [responseLength, setResponseLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [dataConsentAcknowledged, setDataConsentAcknowledged] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);

  // Disguise mode
  const [disguiseActive, setDisguiseActive] = useState(false);

  // Safety planning checkboxes
  const [planChecks, setPlanChecks] = useState<Record<string, boolean>>({});

  // Vault create form
  const [showVaultForm, setShowVaultForm] = useState(false);
  const [vaultFormType, setVaultFormType] = useState<VaultItem['type']>('text');
  const [vaultFormLabel, setVaultFormLabel] = useState('');
  const [vaultFormContent, setVaultFormContent] = useState('');

  // Stealth Triggers
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    loadData();
    testFirebaseConnection();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Automatically pull data if newly logged in
        Storage.pullFromCloud().then(() => loadData());
      }
    });
    const handleActivity = () => {
      if (mode === 'private' && validatedPin && autoLockEnabled) {
        if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = setTimeout(() => {
          setValidatedPin(null);
          setMode('normal');
          showAlert('Session timed out for security.', 'Auto-Lock');
        }, autoLockMinutes * 60 * 1000);
      }
    };

    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    };
  }, [mode, validatedPin]);

  // Online/Offline listener
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Load dark mode + plan checks from storage
  useEffect(() => {
    (async () => {
      const dm = await Storage.getSetting<boolean>('darkMode');
      if (dm !== undefined) setDarkMode(dm);
      const pc = await Storage.getSetting<Record<string, boolean>>('planChecks');
      if (pc) setPlanChecks(pc);
      const savedName = await Storage.getSetting<string>('profileName');
      if (savedName) setProfileName(savedName);
      const savedPhone = await Storage.getSetting<string>('profilePhone');
      if (savedPhone) setProfilePhone(savedPhone);
      const savedResource = await Storage.getSetting<string>('emergencyResource');
      if (savedResource) setEmergencyResource(savedResource);
      const savedSensitivity = await Storage.getSetting<'low' | 'medium' | 'high'>('safetySensitivity');
      if (savedSensitivity) setSafetySensitivity(savedSensitivity);
      const savedPriority = await Storage.getSetting<'immediate' | 'planning'>('helpPriority');
      if (savedPriority) setHelpPriority(savedPriority);
      const savedTone = await Storage.getSetting<'supportive' | 'neutral'>('aiTone');
      if (savedTone) setAiTone(savedTone);
      const savedLength = await Storage.getSetting<'short' | 'medium' | 'long'>('responseLength');
      if (savedLength) setResponseLength(savedLength);
      const savedFont = await Storage.getSetting<'small' | 'medium' | 'large'>('fontSize');
      if (savedFont) setFontSize(savedFont);
      const consent = await Storage.getSetting<boolean>('dataConsentAcknowledged');
      if (consent !== undefined) setDataConsentAcknowledged(consent);
    })();
  }, []);

  // Shake-to-lock (DeviceMotion API)
  useEffect(() => {
    let lastAccel = 0;
    let shakeCount = 0;
    let shakeTimeout: NodeJS.Timeout | null = null;

    const handleMotion = (e: DeviceMotionEvent) => {
      if (mode !== 'private') return;
      const accel = e.accelerationIncludingGravity;
      if (!accel) return;
      const totalAccel = Math.sqrt((accel.x || 0) ** 2 + (accel.y || 0) ** 2 + (accel.z || 0) ** 2);
      const delta = Math.abs(totalAccel - lastAccel);
      lastAccel = totalAccel;
      if (delta > 25) {
        shakeCount++;
        if (shakeCount >= 3) {
          setValidatedPin(null);
          setMode('normal');
          shakeCount = 0;
        }
        if (shakeTimeout) clearTimeout(shakeTimeout);
        shakeTimeout = setTimeout(() => { shakeCount = 0; }, 1000);
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (shakeTimeout) clearTimeout(shakeTimeout);
    };
  }, [mode]);

  const loadData = async () => {
    const isComplete = await Storage.getSetting<boolean>('onboardingComplete');
    if (!isComplete) {
      setMode('onboarding');
    } else {
      const savedPin = await Storage.getSetting<string>('securePin');

      const savedName = await Storage.getSetting<string>('displayName');
      if (savedName) setAppDisplayName(savedName);
    }

    const savedNotes = await Storage.getNotes();
    setNotes(savedNotes);
    const savedContacts = await Storage.getContacts();
    setContacts(savedContacts);
    const savedVault = await Storage.getVaultItems();
    setVaultItems(savedVault);
    const savedNotebooks = await Storage.getNotebooks();
    setNotebooks(savedNotebooks);

    const lockEnabled = await Storage.getSetting<boolean>('autoLockEnabled');
    if (lockEnabled !== undefined) setAutoLockEnabled(lockEnabled);
    const lockMins = await Storage.getSetting<number>('autoLockMinutes');
    if (lockMins !== undefined) setAutoLockMinutes(lockMins);
  };

  // --- Stealth Logic ---
  const handleTriggerPrivate = () => {
    setMode('private');
    setPrivateView('menu');
    setPin('');
  };

  const handleNoteContentChange = (content: string) => {
    if (!activeNote) return;
    
    // Stealth Logic: Keyword Trigger
    if (content.includes('safe://open') || content.includes('#private_mode')) {
      handleTriggerPrivate();
      return;
    }

    const updated = { ...activeNote, content, updatedAt: Date.now() };
    setActiveNote(updated);
    Storage.saveNote(updated);
    setNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const startLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    longPressTimer.current = setTimeout(() => {
      handleTriggerPrivate();
    }, 2000);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handlePinChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPin(val);
    
    // Secret PIN for Private Mode
    if (val.length === 4) {
      const isValid = await VaultService.verifyPin(val);
      if (isValid) {
        setValidatedPin(val);
        handleTriggerPrivate();
      }
    }
  };

  const handleSearchInputChange = async (val: string) => {
    setSearchQuery(val);
    if (val.length === 4) {
      const isValid = await VaultService.verifyPin(val);
      if (isValid) {
        setValidatedPin(val);
        setSearchQuery('');
        handleTriggerPrivate();
      }
    }
  };

  const verifyStepUpAuth = (): Promise<boolean> => {
    return new Promise((resolve) => {
      showPrompt('Enter PIN to authorize critical action.', async (input) => {
        const isValid = await VaultService.verifyPin(input);
        if (!isValid) {
          showAlert('INVALID PIN. ACCESS DENIED.', 'Authentication Failed');
          resolve(false);
        } else {
          resolve(true);
        }
      }, { title: 'Re-Authentication Required', inputType: 'password', placeholder: '4-digit PIN' });
    });
  };

  // --- SOS Logic ---
  const [sosActive, setSosActive] = useState(false);
  const sosHoldTimer = useRef<NodeJS.Timeout | null>(null);

  const startSosHold = () => {
    sosHoldTimer.current = setTimeout(() => {
      setSosActive(true);
      // Trigger real SOS: open SMS to first contact with code message
      if (contacts.length > 0) {
        const c = contacts[0];
        const smsUrl = `sms:${c.phone}?body=${encodeURIComponent(c.codeMessage || 'I need help')}`;
        window.open(smsUrl, '_blank');
      }
    }, 3000);
  };

  const cancelSosHold = () => {
    if (sosHoldTimer.current) clearTimeout(sosHoldTimer.current);
  };

  // --- Export Backup ---
  const handleExportBackup = async () => {
    const notes = await Storage.getNotes();
    const contactsList = await Storage.getContacts();
    const vault = await Storage.getVaultItems();
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.4',
      notes,
      contacts: contactsList,
      vault,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quietink-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showAlert('Encrypted backup downloaded successfully.', 'Export Complete');
  };

  // --- AI Assistant Logic ---
  const handleAskAssistant = async (query: string) => {
    if (!query.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: query };
    const updatedMessages = [...aiMessages, userMessage];
    setAiMessages(updatedMessages);
    setIsAiLoading(true);

    try {
      const result = await askAssistantService(updatedMessages);
      setAiMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
      setActiveEngine(result.engine);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'System error. Unable to process request. Please try again.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const [aiInput, setAiInput] = useState('');

  // --- Vault Capture Logic ---
  const handleFileUpload = async (type: 'image' | 'document') => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = type === 'image' ? 'image/*' : '*/*';
    fileInputRef.current.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      showPrompt(`Title for ${type}`, async (label) => {
        const reader = new FileReader();
        reader.onload = async () => {
          const content = reader.result as string;
          try {
            if (!validatedPin) throw new Error("No session");
            const newItem = await VaultService.createEntry(type, label, content, validatedPin, {
              fileName: file.name,
              mimeType: file.type
            });
            setVaultItems(prev => [...prev, newItem]);
          } catch (err) {
            showAlert('Storage failed.', 'Vault Error');
          }
        };
        reader.readAsDataURL(file);
      }, { defaultValue: file.name, title: 'Entry Title' });
    };
    fileInputRef.current.click();
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const content = reader.result as string;
          const defaultLabel = "Voice Log " + new Date().toLocaleTimeString();
          showPrompt('Title for Audio Recording', async (label) => {
            if (validatedPin) {
              const newItem = await VaultService.createEntry('voice', label, content, validatedPin, {
                mimeType: 'audio/webm'
              });
              setVaultItems(prev => [...prev, newItem]);
            }
          }, { defaultValue: defaultLabel, title: 'Voice Recording' });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      showAlert('Microphone access denied.', 'Permission Error');
    }
  };

  // --- Renderers ---

  const renderOnboarding = () => {
    return (
      <div id="onboarding" className="flex flex-col h-full bg-background p-8 justify-center">
        <div className="mb-12">
          <div className="w-10 h-10 border border-foreground flex items-center justify-center font-bold text-lg mb-4">QI</div>
          <h1 className="text-xl font-bold uppercase tracking-widest mb-2">Initialize QuietInk</h1>
          <p className="text-[10px] text-muted uppercase tracking-widest leading-loose">Configure your secure digital journal environment.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-2">Public Identity name</label>
            <Input 
              placeholder="e.g. My Personal Journal"
              value={onboardingName}
              onChange={(e) => setOnboardingName(e.target.value)}
            />
          </div>

          <div>
             <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-2">Emergency Recovery Master PIN</label>
             <p className="text-[8px] text-muted uppercase tracking-widest mb-2 italic">Used to recover deleted logs from the system core.</p>
             <Input 
               type="password"
               placeholder="4-digit PIN"
               value={onboardingPin}
               onChange={(e) => setOnboardingPin(e.target.value)}
               className="tracking-[1em]"
             />
          </div>

          <button 
            onClick={async () => {
              if (onboardingPin.length < 4) return;
              await Storage.saveSetting('onboardingComplete', true);
              await Storage.saveSetting('securePin', onboardingPin);
              await Storage.saveSetting('displayName', onboardingName || 'My Personal Journal');
              // Initialize Vault verifier for first time
              await VaultService.verifyPin(onboardingPin);
              

              setValidatedPin(onboardingPin);
              setMode('normal');
            }}
            className="w-full bg-foreground text-background py-4 text-[10px] font-bold uppercase tracking-[0.3em] mt-8"
          >
            Finalize Configuration
          </button>
        </div>
      </div>
    );
  };

  const renderNormalMode = () => {
    if (showSettingsScreen) return renderSettingsScreen();
    if (activeNote) {
      return (
        <div id="note-editor" className="flex flex-col h-full bg-background">
          <header className="flex items-center justify-between px-4 py-4 border-b border-border">
            <button onClick={() => setActiveNote(null)} className="p-1">
              <ChevronLeft size={20} />
            </button>
            <input 
              className="flex-1 mx-4 font-medium bg-transparent focus:outline-none"
              value={activeNote.title}
              onChange={(e) => {
                const updated = { ...activeNote, title: e.target.value, updatedAt: Date.now() };
                setActiveNote(updated);
                Storage.saveNote(updated);
                setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
              }}
            />
            <select
              value={activeNote.notebookId || ''}
              onChange={async (e) => {
                const nbId = e.target.value || undefined;
                const updated = { ...activeNote, notebookId: nbId, updatedAt: Date.now() };
                setActiveNote(updated);
                await Storage.saveNote(updated);
                setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
              }}
              className="bg-transparent text-[9px] font-bold uppercase tracking-widest border border-border px-2 py-1 focus:outline-none focus:border-foreground cursor-pointer mr-2"
            >
              <option value="">No Notebook</option>
              {notebooks.map(nb => (
                <option key={nb.id} value={nb.id}>{nb.name}</option>
              ))}
            </select>
            <button onClick={() => {
              showConfirm('Delete this note permanently?', async () => {
                await Storage.deleteNote(activeNote.id);
                setNotes(prev => prev.filter(n => n.id !== activeNote.id));
                setActiveNote(null);
              }, { title: 'Delete Note', danger: true });
            }} className="p-1 text-muted hover:text-foreground">
              <Trash2 size={18} />
            </button>
          </header>
          <textarea 
            className="flex-1 p-6 bg-transparent focus:outline-none resize-none text-sm leading-relaxed"
            value={activeNote.content}
            onChange={(e) => handleNoteContentChange(e.target.value)}
            placeholder="Start writing..."
          />
        </div>
      );
    }

    return (
      <div id="notes-list" className="flex flex-col h-full bg-background">
        <header className="px-6 pt-8 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border border-foreground flex items-center justify-center font-bold text-[10px]">QI</div>
              <h1 
                id="app-title"
                className="text-xs font-bold uppercase tracking-widest cursor-default"
                onMouseDown={startLongPress}
                onTouchStart={startLongPress}
                onMouseUp={cancelLongPress}
                onTouchEnd={cancelLongPress}
              >
                {appDisplayName}
              </h1>
            </div>
            <button onClick={() => setShowSettingsScreen(true)} className="p-1">
              <SettingsIcon size={16} className="text-muted" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={12} />
            <input 
              placeholder="SEARCH NOTES..."
              className="w-full bg-background border border-border pl-9 pr-4 py-2 text-[10px] focus:outline-none focus:border-foreground placeholder:text-muted uppercase tracking-wider"
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto hidden-scrollbar">
          {/* Notebook tabs */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border overflow-x-auto hidden-scrollbar">
            <button
              onClick={() => setSelectedNotebookId(null)}
              className={cn(
                "shrink-0 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-colors",
                selectedNotebookId === null
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted border-border hover:text-foreground"
              )}
            >
              All
            </button>
            {notebooks.map(nb => (
              <button
                key={nb.id}
                onClick={() => setSelectedNotebookId(nb.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  showConfirm(`Delete notebook "${nb.name}"? Notes will be moved to All.`, async () => {
                    await Storage.deleteNotebook(nb.id);
                    setNotebooks(prev => prev.filter(n => n.id !== nb.id));
                    setNotes(prev => prev.map(n => n.notebookId === nb.id ? { ...n, notebookId: undefined } : n));
                    if (selectedNotebookId === nb.id) setSelectedNotebookId(null);
                  }, { title: 'Delete Notebook', danger: true });
                }}
                className={cn(
                  "shrink-0 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-colors",
                  selectedNotebookId === nb.id
                    ? "text-background border-foreground"
                    : "bg-transparent text-muted border-border hover:text-foreground"
                )}
                style={selectedNotebookId === nb.id ? { backgroundColor: nb.color, borderColor: nb.color } : {}}
              >
                {nb.name}
              </button>
            ))}
            <button
              onClick={() => {
                showPrompt('Notebook name', async (name) => {
                  if (!name.trim()) return;
                  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];
                  const nb: Notebook = {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    color: colors[notebooks.length % colors.length],
                    createdAt: Date.now()
                  };
                  await Storage.saveNotebook(nb);
                  setNotebooks(prev => [...prev, nb]);
                  setSelectedNotebookId(nb.id);
                }, { title: 'New Notebook', placeholder: 'e.g. Work, Personal, Ideas' });
              }}
              className="shrink-0 w-7 h-7 flex items-center justify-center border border-dashed border-border text-muted hover:text-foreground hover:border-foreground transition-colors"
            >
              <Plus size={10} />
            </button>
          </div>

          <div className="divide-y divide-border">
            {notes
              .filter(n => selectedNotebookId ? n.notebookId === selectedNotebookId : true)
              .filter(n => {
                const q = searchQuery.toLowerCase();
                return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
              })
              .map(note => (
              <div 
                key={note.id}
                onClick={() => setActiveNote(note)}
                className="group p-6 hover:bg-secondary-bg cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[11px] uppercase tracking-tight group-hover:underline flex-1">{note.title || 'UNTITLED NOTE'}</h3>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[9px] text-muted font-mono uppercase tracking-tighter"
                      onMouseDown={startLongPress}
                      onTouchStart={startLongPress}
                      onMouseUp={cancelLongPress}
                      onTouchEnd={cancelLongPress}
                    >
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirm('Delete this note?', async () => {
                          await Storage.deleteNote(note.id);
                          setNotes(prev => prev.filter(n => n.id !== note.id));
                        }, { title: 'Delete Note', danger: true });
                      }}
                      className="p-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted line-clamp-1 leading-relaxed opacity-80">{note.content || 'No content provided'}</p>
              </div>
            ))}
          </div>
        </main>

        <div className="p-6 border-t border-border bg-background">
          <button 
            id="new-note-btn"
            onClick={async () => {
              const newNote: Note = {
                id: crypto.randomUUID(),
                title: '',
                content: '',
                updatedAt: Date.now(),
                notebookId: selectedNotebookId || undefined
              };
              await Storage.saveNote(newNote);
              setNotes([newNote, ...notes]);
              setActiveNote(newNote);
            }}
            className="w-full border border-foreground py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
          >
            <Plus size={14} />
            Create New Note
          </button>
        </div>
        <footer className="px-6 py-2 border-t border-border bg-background">
          <div className="flex justify-between items-center text-[8px] text-muted font-mono uppercase tracking-widest">
            <span>QuietInk v1.0.4</span>
            <span>{(() => {
              const count = selectedNotebookId ? notes.filter(n => n.notebookId === selectedNotebookId).length : notes.length;
              return `${count} ${count === 1 ? 'Note' : 'Notes'}`;
            })()}</span>
          </div>
        </footer>
      </div>
    );
  };

  const renderSettingsScreen = () => (
    <div className="flex flex-col h-full bg-background text-foreground">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-background z-10">
        <div className="flex items-center gap-3">
          <SettingsIcon size={20} />
          <div>
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase">SETTINGS</h2>
            <p className="text-[8px] uppercase tracking-[0.3em] text-muted">App preferences, safety controls, and backup options.</p>
          </div>
        </div>
        <button onClick={() => setShowSettingsScreen(false)} className="px-3 py-1 border border-border text-[9px] uppercase font-bold tracking-widest hover:bg-foreground hover:text-background transition-colors">
          CLOSE
        </button>
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-6 hidden-scrollbar">
        <section className="space-y-4 border border-border p-4 bg-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted">Profile & Recovery</p>
              <p className="text-[8px] text-muted leading-relaxed">Update identity and trusted resources.</p>
            </div>
          </div>
          <Input id="settings-profile-name" placeholder="Your Name" value={profileName} onChange={(e) => { setProfileName(e.target.value); Storage.saveSetting('profileName', e.target.value); }} />
          <Input id="settings-profile-phone" placeholder="Emergency Phone" value={profilePhone} onChange={(e) => { setProfilePhone(e.target.value); Storage.saveSetting('profilePhone', e.target.value); }} />
          <Input id="settings-emergency-resource" placeholder="Emergency Resource / Shelter" value={emergencyResource} onChange={(e) => { setEmergencyResource(e.target.value); Storage.saveSetting('emergencyResource', e.target.value); }} />
        </section>

        <section className="space-y-4 border border-border p-4 bg-background">
          <p className="text-[9px] uppercase tracking-[0.3em] text-muted">Safety Preferences</p>
          <div className="grid gap-2">
            {['low', 'medium', 'high'].map(level => (
              <button key={level} onClick={() => { setSafetySensitivity(level as any); Storage.saveSetting('safetySensitivity', level); }} className={cn(
                "w-full text-left px-4 py-3 border text-[9px] uppercase tracking-widest transition-colors",
                safetySensitivity === level ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border hover:border-foreground'
              )}>
                {level === 'low' ? 'Low sensitivity' : level === 'medium' ? 'Balanced safety' : 'High-risk support'}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            {['immediate', 'planning'].map(value => (
              <button key={value} onClick={() => { setHelpPriority(value as any); Storage.saveSetting('helpPriority', value); }} className={cn(
                "w-full text-left px-4 py-3 border text-[9px] uppercase tracking-widest transition-colors",
                helpPriority === value ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border hover:border-foreground'
              )}>
                {value === 'immediate' ? 'Immediate help priority' : 'Planning & long-term support'}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4 border border-border p-4 bg-background">
          <p className="text-[9px] uppercase tracking-[0.3em] text-muted">AI Assistant Controls</p>
          <div className="grid gap-2">
            {['supportive', 'neutral'].map(value => (
              <button key={value} onClick={() => { setAiTone(value as any); Storage.saveSetting('aiTone', value); }} className={cn(
                "w-full text-left px-4 py-3 border text-[9px] uppercase tracking-widest transition-colors",
                aiTone === value ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border hover:border-foreground'
              )}>
                {value === 'supportive' ? 'Supportive tone' : 'Neutral tone'}
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            {['short', 'medium', 'long'].map(value => (
              <button key={value} onClick={() => { setResponseLength(value as any); Storage.saveSetting('responseLength', value); }} className={cn(
                "w-full text-left px-4 py-3 border text-[9px] uppercase tracking-widest transition-colors",
                responseLength === value ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border hover:border-foreground'
              )}>
                {value === 'short' ? 'Short responses' : value === 'medium' ? 'Medium detail' : 'Full guidance'}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4 border border-border p-4 bg-background">
          <p className="text-[9px] uppercase tracking-[0.3em] text-muted">Backup & Export</p>
          <Button onClick={handleExportBackup} className="w-full text-[9px]">
            <Download size={12} /> Export Encrypted Backup
          </Button>
          <Button onClick={() => {
            setDarkMode(!darkMode);
            Storage.saveSetting('darkMode', !darkMode);
          }} className="w-full text-[9px]">
            {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </Button>
        </section>

        <section className="space-y-4 border border-border p-4 bg-background">
          <p className="text-[9px] uppercase tracking-[0.3em] text-muted">App Preferences</p>
          <div className="grid gap-2">
            {['small', 'medium', 'large'].map(size => (
              <button key={size} onClick={() => { setFontSize(size as any); Storage.saveSetting('fontSize', size); }} className={cn(
                "w-full text-left px-4 py-3 border text-[9px] uppercase tracking-widest transition-colors",
                fontSize === size ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border hover:border-foreground'
              )}>
                {size === 'small' ? 'Compact font' : size === 'medium' ? 'Standard font' : 'Large font'}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] uppercase tracking-[0.3em] text-muted">Privacy & Support</p>
            <button onClick={() => { setDataConsentAcknowledged(!dataConsentAcknowledged); Storage.saveSetting('dataConsentAcknowledged', !dataConsentAcknowledged); }} className={cn(
              "px-3 py-2 border text-[9px] uppercase tracking-widest transition-colors",
              dataConsentAcknowledged ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border hover:border-foreground'
            )}>
              {dataConsentAcknowledged ? 'Acknowledged' : 'Acknowledge'}
            </button>
          </div>
          <p className="text-[8px] text-muted leading-relaxed">QuietInk keeps your private data local and encrypted. Only selected settings are stored for personalization, and no sensitive content is shared without your consent.</p>
          <div className="text-[8px] text-muted bg-secondary-bg border border-border p-3 rounded-none">
            Version 1.0.4 • Built for safe journaling and emergency planning.
          </div>
        </section>
      </main>
    </div>
  );

  const renderPrivateMode = () => {
    if (showSettingsScreen) return renderSettingsScreen();
    return (
      <div id="private-space" className="flex flex-col h-full bg-background text-foreground">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-background z-10">
          <div className="flex items-center gap-3">
             <Shield size={16} />
             <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase">PRIVATE SPACE</h2>
          </div>
          <button onClick={() => {
            setValidatedPin(null);
            setMode('normal');
          }} className="px-3 py-1 border border-border text-[9px] uppercase font-bold tracking-widest hover:bg-foreground hover:text-background transition-colors">
            EXIT
          </button>
        </header>

        <main className="flex-1 overflow-y-auto hidden-scrollbar bg-secondary-bg">
          {privateView === 'menu' && (
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { id: 'vault', label: 'SECURE\nVAULT', icon: Lock },
                  { id: 'planning', label: 'SAFETY\nPLANNER', icon: BookOpen },
                  { id: 'sos', label: 'SILENT\nSOS', icon: AlertTriangle },
                  { id: 'contacts', label: 'ACTION\nCONTACTS', icon: Phone },
                  { id: 'safety-check', label: 'DEVICE\nMONITOR', icon: Scan },
                  { id: 'ai', label: 'AI\nASSISTANT', icon: Shield },
                  { id: 'library', label: 'HELP\nLIBRARY', icon: BookOpen },
                  { id: 'settings', label: 'SECURITY\nSETTINGS', icon: SettingsIcon },
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'settings') {
                        setShowSettingsScreen(true);
                      } else {
                        setPrivateView(item.id as PrivateView);
                      }
                    }}
                    className="aspect-square border border-foreground p-5 flex flex-col justify-between items-start text-left bg-background hover:bg-secondary-bg transition-all group"
                  >
                    <item.icon size={20} className="text-muted group-hover:text-foreground transition-colors" />
                    <div className="flex flex-col gap-2 w-full">
                       <span className="text-[10px] font-bold uppercase tracking-widest whitespace-pre-line leading-tight">
                         {item.label}
                       </span>
                       <div className="w-6 h-0.5 bg-foreground opacity-20 group-hover:opacity-100 transition-all"></div>
                    </div>
                  </button>
                ))}
              </div>

               <div className="space-y-6">
                {!user ? (
                   <div className="border border-foreground p-6 bg-background space-y-4">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Cloud Sync Disabled</h3>
                        <p className="text-[9px] text-muted uppercase tracking-widest leading-relaxed">Securely backup your encrypted vault to a private cloud account.</p>
                      </div>
                      <Button onClick={async () => {
                        try {
                          await loginWithGoogle();
                        } catch (e) {
                          showAlert('Sign in failed.', 'Cloud Error');
                        }
                      }} className="w-full">
                        <Cloud size={14} /> SIGN IN WITH GOOGLE
                      </Button>
                      <p className="text-[8px] text-muted uppercase tracking-widest italic text-center">Data is encrypted with your PIN BEFORE being uploaded.</p>
                   </div>
                ) : (
                  <div className="border border-foreground p-6 bg-background space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Cloud Health: Active</h3>
                        <p className="text-[9px] text-muted uppercase tracking-widest">{user.email}</p>
                      </div>
                      <button onClick={logout} className="p-2 border border-border hover:bg-foreground hover:text-background transition-colors">
                        <LogOut size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <Button 
                        onClick={async () => {
                          setIsSyncing(true);
                          try {
                            await Storage.syncToCloud();
                            showAlert('Cloud backup success.', 'Sync Complete');
                          } catch (e) {
                            showAlert('Sync failed.', 'Cloud Error');
                          } finally {
                            setIsSyncing(false);
                          }
                        }}
                        className={cn("text-[9px]", isSyncing && "animate-pulse")}
                       >
                         {isSyncing ? <RefreshCcw size={12} className="animate-spin" /> : <RefreshCcw size={12} />} PUSH TO CLOUD
                       </Button>
                       <Button 
                        onClick={async () => {
                          showConfirm('Replace local data with cloud backup?', async () => {
                            setIsSyncing(true);
                            try {
                              await Storage.pullFromCloud();
                              await loadData();
                              showAlert('Data restored from cloud.', 'Restore Complete');
                            } catch (e) {
                              showAlert('Restore failed.', 'Cloud Error');
                            } finally {
                              setIsSyncing(false);
                            }
                          }, { title: 'Pull From Cloud' });
                        }}
                        className="text-[9px]"
                       >
                         <CheckCircle size={12} /> PULL FROM CLOUD
                       </Button>
                    </div>
                  </div>
                )}

                {showSecuritySettings && (
                  <div className="border border-foreground p-6 bg-background space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Security Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-widest text-muted">Auto-Lock Timer</label>
                        <button 
                          onClick={async () => {
                            const newVal = !autoLockEnabled;
                            setAutoLockEnabled(newVal);
                            await Storage.saveSetting('autoLockEnabled', newVal);
                          }}
                          className={cn("px-3 py-1 text-[9px] font-bold uppercase tracking-widest border", autoLockEnabled ? "bg-foreground text-background" : "text-muted border-border")}
                        >
                          {autoLockEnabled ? "ENABLED" : "DISABLED"}
                        </button>
                      </div>
                      {autoLockEnabled && (
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-widest text-muted">Lock After (Mins)</label>
                          <select 
                            value={autoLockMinutes}
                            onChange={async (e) => {
                              const val = parseInt(e.target.value);
                              setAutoLockMinutes(val);
                              await Storage.saveSetting('autoLockMinutes', val);
                            }}
                            className="bg-transparent text-[10px] font-bold uppercase tracking-widest border-none focus:ring-0 cursor-pointer"
                          >
                            {[1, 2, 5, 10, 15, 30].map(m => (
                              <option key={m} value={m}>{m}m</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                   <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted mb-3">System Metrics</h3>
                   <div className="border border-border p-4 bg-background space-y-2">
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider">
                         <span className="text-muted">Encryption</span>
                         <span className="font-bold">AES-256 Active</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider">
                         <span className="text-muted">Cloud Check</span>
                         <span className="font-bold">{user ? "SYNC ACTIVE" : "AIR-GAPPED"}</span>
                      </div>
                   </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                   <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted mb-3">Quick Actions</h3>
                   <div className="grid grid-cols-2 gap-2">
                     <Button onClick={() => { setDarkMode(!darkMode); Storage.saveSetting('darkMode', !darkMode); }} className="text-[9px]">
                       {darkMode ? <Sun size={12} /> : <Moon size={12} />} {darkMode ? 'LIGHT MODE' : 'DARK MODE'}
                     </Button>
                     <Button onClick={handleExportBackup} className="text-[9px]">
                       <Download size={12} /> EXPORT BACKUP
                     </Button>
                   </div>
                </div>

                <div className="pt-4 border-t border-border">
                   <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF4444] mb-3">Safety Termination</h3>
                   <Button 
                    onClick={async () => {
                      showConfirm('DANGER: This will permanently delete ALL data including vault, contacts, and logs. This cannot be undone.', async () => {
                        const isAuthorized = await verifyStepUpAuth();
                        if (isAuthorized) {
                          await VaultService.emergencyWipe();
                          window.location.reload();
                        }
                      }, { title: 'Emergency System Wipe', danger: true });
                    }}
                    variant="danger" 
                    className="w-full text-[#FF4444] border-[#FF4444]/30"
                   >
                     <Trash2 size={14} /> EMERGENCY SYSTEM WIPE
                   </Button>
                </div>
              </div>
            </div>
          )}

          {privateView === 'sos' && (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center bg-background">
              <div className="mb-12 border border-border p-10 w-full">
                <AlertTriangle size={32} className={cn("mx-auto mb-6", sosActive ? "text-foreground" : "text-muted")} />
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2">SOS PROTOCOL</h3>
                <p className="text-[10px] text-muted uppercase tracking-widest leading-loose">
                  {contacts.length > 0 
                    ? `Hold for 3 seconds to send "${contacts[0].codeMessage}" to ${contacts[0].name}.`
                    : 'Add emergency contacts first to enable SOS.'}
                </p>
              </div>
              
              <button 
                id="sos-hold-button"
                onMouseDown={startSosHold}
                onTouchStart={startSosHold}
                onMouseUp={cancelSosHold}
                onTouchEnd={cancelSosHold}
                className={cn(
                  "w-48 h-48 border-2 flex flex-col items-center justify-center text-[11px] font-bold uppercase tracking-widest transition-all duration-300",
                  sosActive ? "bg-foreground text-background border-foreground" : "bg-transparent border-foreground text-foreground flex-col"
                )}
              >
                <div className="mb-2">{sosActive ? "SENT" : "HOLD FOR"}</div>
                <div className="text-lg tracking-tighter">{sosActive ? "SILENT" : "SOS"}</div>
              </button>

              {sosActive && (
                <div className="mt-8 space-y-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest opacity-60">SOS sent. No local activity visible.</p>
                  {contacts.slice(0, 3).map(c => (
                    <a key={c.id} href={`sms:${c.phone}?body=${encodeURIComponent(c.codeMessage)}`} className="block text-[9px] uppercase tracking-widest text-muted hover:text-foreground underline">
                      Send to {c.name} →
                    </a>
                  ))}
                </div>
              )}
              
              <Button onClick={() => setPrivateView('menu')} variant="ghost" className="mt-12 opacity-50 hover:opacity-100">
                <ChevronLeft size={16} /> RETURN TO SYSTEM
              </Button>
            </div>
          )}

          {privateView === 'ai' && (
            <div className="h-full flex flex-col bg-background">
              <header className="p-6 border-b border-border bg-secondary-bg">
                 <div className="flex gap-2 mb-2 flex-wrap">
                   <span className={cn(
                     "px-2 py-1 border text-[8px] font-bold uppercase tracking-widest",
                     activeEngine === 'gemma' ? "border-foreground bg-foreground text-background" : "border-border bg-background"
                   )}>
                     {activeEngine === 'gemma' ? 'Gemma 4' : 'Local Engine'}
                   </span>
                   <span className={cn(
                     "px-2 py-1 border text-[8px] font-bold uppercase tracking-widest",
                     isOnline ? "border-foreground bg-background" : "border-border bg-background text-muted"
                   )}>
                     {isOnline ? '● Online' : '○ Offline'}
                   </span>
                   <span className="px-2 py-1 border border-border text-[8px] font-bold uppercase tracking-widest bg-background">Secure E2E</span>
                 </div>
                 <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Safety Intelligence Assistant</h3>
              </header>
              <div className="flex-1 overflow-y-auto p-6 space-y-8 hidden-scrollbar">
                {aiMessages.length === 0 && (
                  <div className="text-center py-20 opacity-30">
                    <Shield size={24} className="mx-auto mb-4" />
                    <p className="text-[9px] uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                      {isOnline 
                        ? 'Gemma 4 safety assistant ready. Ask any safety-related question.' 
                        : 'Offline mode active. Using local safety knowledge base.'}
                    </p>
                  </div>
                )}
                {aiMessages.map((m, i) => (
                  <div key={i} className={cn("flex flex-col", m.role === 'assistant' ? "items-start" : "items-end")}>
                    <div className={cn(
                      "p-4 text-[10px] leading-relaxed max-w-[85%]",
                      m.role === 'assistant' ? "border border-foreground bg-background font-medium" : "bg-secondary-bg text-muted border border-border"
                    )}>
                      {m.role === 'assistant' ? (
                        <div className="markdown-body">
                          <Markdown>{m.content}</Markdown>
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                    <div className="text-[8px] uppercase tracking-[0.2em] mt-2 opacity-40 font-mono">
                      {m.role === 'assistant' ? (activeEngine === 'gemma' ? 'Gemma 4' : 'Local Engine') : 'User Input'}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex flex-col items-start">
                    <div className="p-4 border border-foreground bg-background">
                      <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest animate-pulse opacity-60">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground animate-ping" />
                        {isOnline ? 'Processing with Gemma 4...' : 'Searching local safety protocols...'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border bg-secondary-bg">
                <div className="flex border border-foreground bg-background overflow-hidden">
                  <input 
                    id="ai-prompt-input"
                    className="flex-1 px-4 py-3 text-[10px] focus:outline-none uppercase tracking-wider placeholder:lowercase placeholder:italic"
                    placeholder="Input situation for safety logic..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (handleAskAssistant(aiInput), setAiInput(''))}
                  />
                  <button 
                    id="ai-send-btn"
                    onClick={() => { handleAskAssistant(aiInput); setAiInput(''); }}
                    disabled={isAiLoading}
                    className={cn(
                      "bg-foreground text-background px-5 uppercase text-[10px] font-bold tracking-widest",
                      isAiLoading ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 active:opacity-100"
                    )}
                  >
                    {isAiLoading ? '...' : 'SEND'}
                  </button>
                </div>
                <button onClick={() => { setPrivateView('menu'); setAiMessages([]); setActiveEngine('local'); }} className="w-full mt-4 text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 hover:opacity-100 py-2">
                  RETURN TO SYSTEM CORE
                </button>
              </div>
            </div>
          )}

          {privateView === 'library' && (
            <div className="p-6 space-y-8">
              {SAFETY_LIBRARY.map((tip, i) => (
                <div key={i} className="border-b border-border pb-8">
                  <div className="text-[10px] uppercase text-muted mb-2 tracking-widest">{tip.category}</div>
                  <div className="markdown-body">
                    <Markdown>{tip.content}</Markdown>
                  </div>
                </div>
              ))}
              <Button onClick={() => setPrivateView('menu')} variant="ghost" className="w-full">
                <ChevronLeft size={16} /> BACK TO MENU
              </Button>
            </div>
          )}

           {privateView === 'vault' && (
             <div className="p-6 space-y-4">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium uppercase tracking-widest">SECURE VAULT</h3>
                  <Lock size={16} className="text-muted" />
               </div>
               
               {vaultItems.length === 0 ? (
                 <div className="py-12 px-6 text-center border border-dashed border-border space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-1">Your Secure Vault is protected with AES-256 encryption</p>
                      <p className="text-[9px] text-muted uppercase tracking-widest leading-relaxed">Store photos, notes, documents, and audio securely on-device</p>
                    </div>
                 </div>
               ) : (
                <div className="space-y-2">
                  {vaultItems.map(item => (
                    <div 
                      key={item.id} 
                      className="p-4 border border-border flex justify-between items-center group cursor-pointer hover:bg-secondary-bg transition-colors"
                      onClick={async (e) => {
                        if ((e.target as HTMLElement).closest('.delete-btn')) return;
                        try {
                          if (!validatedPin) {
                            showAlert('Session expired. Please re-authenticate.', 'Session Error');
                            setMode('normal');
                            return;
                          }
                          const isAuthorized = await verifyStepUpAuth();
                          if (!isAuthorized) return;
                          const decrypted = await VaultService.decrypt(item.encryptedPayload, validatedPin);
                          setDecryptedItem({ type: item.type, label: item.label, content: decrypted });
                        } catch (err) {
                          showAlert('Failed to decrypt item. Authentication error.', 'Decrypt Error');
                        }
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium uppercase tracking-tighter flex items-center gap-2">
                          <span className="text-[8px] bg-foreground text-background px-1 py-0.5">{item.type}</span>
                          {item.label}
                        </div>
                        <div className="text-[10px] text-muted font-mono">{new Date(item.timestamp).toLocaleString()}</div>
                      </div>
                      <button 
                        className="delete-btn p-2"
                        onClick={async (e) => {
                          e.stopPropagation();
                          showConfirm('Permanently delete this entry?', async () => {
                            const isAuthorized = await verifyStepUpAuth();
                            if (!isAuthorized) return;
                            await Storage.deleteVaultItem(item.id);
                            setVaultItems(vaultItems.filter(v => v.id !== item.id));
                          }, { title: 'Delete Vault Entry', danger: true });
                        }}
                      >
                        <Trash2 size={16} className="text-muted hover:text-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
               )}

               {/* Inline vault creation form */}
               {!showVaultForm ? (
                 <div className="grid grid-cols-2 gap-2">
                   {(['text', 'image', 'voice', 'document'] as const).map(t => (
                     <button key={t} onClick={() => {
                       if (t === 'image' || t === 'document') { handleFileUpload(t); return; }
                       if (t === 'voice') { toggleRecording(); return; }
                       setVaultFormType(t); setShowVaultForm(true);
                     }} className={cn(
                       "border border-border p-3 text-[9px] font-bold uppercase tracking-widest hover:bg-secondary-bg transition-colors",
                       recording && t === 'voice' && "animate-pulse border-[#FF4444] text-[#FF4444]"
                     )}>
                       {recording && t === 'voice' ? '■ STOP REC' : `+ ${t}`}
                     </button>
                   ))}
                 </div>
               ) : (
                 <div className="border border-foreground p-4 space-y-3">
                   <div className="text-[9px] font-bold uppercase tracking-widest">New {vaultFormType} entry</div>
                   <Input placeholder="Entry title" value={vaultFormLabel} onChange={e => setVaultFormLabel(e.target.value)} />
                   <textarea
                     placeholder="Content to encrypt..."
                     value={vaultFormContent}
                     onChange={e => setVaultFormContent(e.target.value)}
                     className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground placeholder:text-muted rounded-none h-24 resize-none"
                   />
                   <div className="flex gap-2">
                     <button onClick={() => { setShowVaultForm(false); setVaultFormLabel(''); setVaultFormContent(''); }} className="flex-1 border border-border py-2 text-[9px] font-bold uppercase tracking-widest">
                       Cancel
                     </button>
                     <button onClick={async () => {
                       if (!vaultFormLabel || !vaultFormContent || !validatedPin) return;
                       try {
                         const newItem = await VaultService.createEntry(vaultFormType, vaultFormLabel, vaultFormContent, validatedPin);
                         setVaultItems([...vaultItems, newItem]);
                         setShowVaultForm(false); setVaultFormLabel(''); setVaultFormContent('');
                       } catch (err) {
                         showAlert('Encryption failed. Check secure session.', 'Vault Error');
                       }
                     }} className="flex-1 bg-foreground text-background py-2 text-[9px] font-bold uppercase tracking-widest">
                       Encrypt & Save
                     </button>
                   </div>
                 </div>
               )}

               <Button onClick={() => setPrivateView('menu')} variant="ghost" className="w-full">
                <ChevronLeft size={16} /> BACK TO MENU
              </Button>

             </div>
          )}

          {privateView === 'safety-check' && (
            <div className="p-8 text-center space-y-6">
              <Scan size={48} className="mx-auto text-muted mb-4" />
              <h3 className="text-lg font-medium">DEVICE SAFETY CHECK</h3>
              <p className="text-sm text-muted">Scanning for surveillance tools, remote access, and system vulnerabilities.</p>
              
              <div className="py-10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                  className="h-1 bg-foreground"
                />
                <div className="text-[10px] mt-2 font-mono">SCANNING SYSTEM PERMISSIONS...</div>
              </div>

              <div className="space-y-4 text-left border border-border p-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-foreground"></div>
                  <span className="text-sm">Accessibility Services: Clean</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-foreground"></div>
                  <span className="text-sm">Device Admin: No unauthorized apps</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-foreground"></div>
                  <span className="text-sm">Screen Monitoring: None detected</span>
                </div>
              </div>

              <div className="p-6 bg-foreground text-background text-sm font-bold tracking-widest">
                STATUS: SAFE
              </div>

              <Button onClick={() => setPrivateView('menu')} variant="ghost" className="w-full">
                <ChevronLeft size={16} /> BACK
              </Button>
            </div>
          )}

          {privateView === 'contacts' && (
            <div className="p-6 space-y-6">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium uppercase tracking-widest">EMERGENCY CONTACTS</h3>
                  <Phone size={16} className="text-muted" />
               </div>

               <div className="space-y-2">
                 {contacts.map(c => (
                   <div key={c.id} className="p-4 border border-border flex justify-between items-center">
                     <div>
                       <div className="text-sm font-medium">{c.name}</div>
                       <div className="text-xs text-muted">{c.phone}</div>
                       <div className="text-[10px] bg-border px-2 py-0.5 mt-1 inline-block uppercase font-mono">{c.codeMessage}</div>
                     </div>
                     <button onClick={async () => {
                       showConfirm('Delete this contact?', async () => {
                         const isAuthorized = await verifyStepUpAuth();
                         if (!isAuthorized) return;
                         await Storage.deleteContact(c.id);
                         setContacts(contacts.filter(item => item.id !== c.id));
                       }, { title: 'Delete Contact', danger: true });
                     }}>
                       <Trash2 size={16} className="text-muted" />
                     </button>
                   </div>
                 ))}
               </div>

               <div className="pt-6 border-t border-border space-y-2">
                 <Input 
                   placeholder="Name" 
                   value={contactName} 
                   onChange={(e) => setContactName(e.target.value)} 
                 />
                 <Input 
                   placeholder="Phone Number" 
                   value={contactPhone} 
                   onChange={(e) => setContactPhone(e.target.value)} 
                 />
                 <Input 
                   placeholder="Coded Message (e.g. 'Got groceries')" 
                   value={contactCode} 
                   onChange={(e) => setContactCode(e.target.value)} 
                 />
                 <Button onClick={async () => {
                   if (!contactName || !contactPhone) return;
                   const newC: EmergencyContact = { 
                     id: crypto.randomUUID(), 
                     name: contactName, 
                     phone: contactPhone, 
                     codeMessage: contactCode 
                   };
                   await Storage.saveContact(newC);
                   setContacts([...contacts, newC]);
                   setContactName('');
                   setContactPhone('');
                   setContactCode('');
                 }} className="w-full">
                   ADD TRUSTED CONTACT
                 </Button>
               </div>
               <Button onClick={() => setPrivateView('menu')} variant="ghost" className="w-full">
                <ChevronLeft size={16} /> BACK
              </Button>
            </div>
          )}

          {privateView === 'planning' && (
             <div className="p-6 space-y-6">
               <h3 className="text-sm font-medium uppercase tracking-widest">SAFETY PLANNING</h3>
               
               {[
                 { title: 'Immediate Exit', tasks: ['Keep gas tank full', 'Hide keys in accessible spot', 'Identify 2 exit routes'] },
                 { title: 'Document Prep', tasks: ['Scan passports to Vault', 'Withdraw cash', 'Gather birth certificates'] },
                 { title: 'Digital Safety', tasks: ['Enable 2FA on main email', 'Clear search history', 'Check location settings'] },
               ].map((section, idx) => (
                 <div key={idx} className="space-y-3">
                   <div className="text-xs font-bold uppercase border-b border-border pb-1">{section.title}</div>
                   {section.tasks.map((task, tidx) => {
                     const key = `${idx}-${tidx}`;
                     return (
                       <div key={tidx} className={cn("flex items-center gap-3 p-3 bg-background border border-border", planChecks[key] && "opacity-60")}>
                         <input 
                           type="checkbox" 
                           className="w-4 h-4 accent-foreground" 
                           checked={!!planChecks[key]}
                           onChange={() => {
                             const updated = { ...planChecks, [key]: !planChecks[key] };
                             setPlanChecks(updated);
                             Storage.saveSetting('planChecks', updated);
                           }}
                         />
                         <span className={cn("text-xs", planChecks[key] && "line-through")}>{task}</span>
                       </div>
                     );
                   })}
                 </div>
               ))}
               <Button onClick={() => setPrivateView('menu')} variant="ghost" className="w-full">
                <ChevronLeft size={16} /> BACK
              </Button>
             </div>
          )}
        </main>
      </div>
    );
  };

  const SplashScreen = () => (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="absolute inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8"
    >
      <div className="space-y-4 text-center">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.2em" }}
          animate={{ opacity: 1, letterSpacing: "0.4em" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-[10px] font-medium lowercase text-foreground/60"
        >
          quietink
        </motion.div>
      </div>

      <motion.div 
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 40, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
        className="h-[1px] bg-foreground/10 mt-8"
      />
    </motion.div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f0f0f0] dark:bg-[#1a1a1a]">
    <div className={cn("relative w-[390px] h-[844px] max-h-[100vh] flex flex-col border border-border shadow-2xl rounded-[2rem] bg-background", darkMode && "dark")} id="app-root" style={{ overflow: 'clip', fontSize: fontSize === 'small' ? '11px' : fontSize === 'large' ? '14px' : '12px' }}>
      <div className="flex-1 flex flex-col overflow-hidden rounded-[2rem]">
      <input type="file" ref={fileInputRef} className="hidden" />
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" />
        ) : (
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 overflow-hidden"
          >
            {mode === 'normal' ? renderNormalMode() : mode === 'onboarding' ? renderOnboarding() : renderPrivateMode()}
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {decryptedItem && (
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50}} className="bg-background/95 backdrop-blur-sm flex flex-col p-6 rounded-[2rem]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Decrypted Record</div>
              <h3 className="text-sm font-bold uppercase tracking-tighter text-foreground">{decryptedItem.label}</h3>
            </div>
            <button onClick={() => setDecryptedItem(null)} className="p-2 border border-border hover:bg-foreground hover:text-background transition-colors">
              <ChevronLeft size={16} />
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-center overflow-hidden">
            {decryptedItem.type === 'image' && (
              <img src={decryptedItem.content} alt={decryptedItem.label} className="max-w-full max-h-full object-contain border border-border" referrerPolicy="no-referrer" />
            )}
            {decryptedItem.type === 'voice' && (
              <div className="p-10 border border-border bg-background text-center">
                <div className="text-muted mb-6 uppercase tracking-widest text-[10px]">Secure Audio Stream</div>
                <audio controls src={decryptedItem.content} className="w-full" />
              </div>
            )}
            {decryptedItem.type === 'text' && (
              <div className="p-6 border border-border bg-background overflow-y-auto font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                {decryptedItem.content}
              </div>
            )}
            {(decryptedItem.type === 'document' || decryptedItem.type === 'location') && (
              <div className="p-6 border border-border bg-background">
                <p className="text-[10px] uppercase font-mono mb-4 text-muted break-all">{decryptedItem.content.substring(0, 500)}{decryptedItem.content.length > 500 ? '...' : ''}</p>
                <Button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = decryptedItem.content;
                    link.download = decryptedItem.label;
                    link.click();
                  }}
                  className="w-full"
                >
                  DOWNLOAD & VIEW
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <p className="text-[8px] uppercase tracking-widest text-muted italic">Temporary Decrypted Buffer • Not cached on disk</p>
          </div>
        </div>
      )}

      <ModalRenderer />
    </div>
    </div>
  );
}
