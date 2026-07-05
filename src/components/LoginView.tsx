import React, { useState, useEffect } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import appLogo from '../assets/app_logo.jpg';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Compass,
  Scan,
  Globe,
  User,
  Users,
  Building,
  Phone,
  ArrowLeft,
  Heart,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginView: React.FC = () => {
  const { darkMode, setUser, language, setLanguage, teamMembers } = useTasky() as any;
  const { t } = useTranslation();
  
  // Navigation mode tab
  const [viewMode, setViewMode] = useState<'login' | 'personal-family' | 'company'>('login');

  // Login Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Personal & Family Form states
  const [pfName, setPfName] = useState('');
  const [pfEmail, setPfEmail] = useState('');
  const [pfPassword, setPfPassword] = useState('');
  const [pfWorkspaceName, setPfWorkspaceName] = useState('');
  const [pfWorkspaceType, setPfWorkspaceType] = useState<'Family' | 'Single'>('Family');

  // Company Join request states
  const [cCompanyName, setCCompanyName] = useState('');
  const [cContactName, setCContactName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cMembersCount, setCMembersCount] = useState<number>(10);
  const [cMessage, setCMessage] = useState('');
  const [cSuccessRequest, setCSuccessRequest] = useState<any>(null);
  
  // UX states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Save successful password in simulated keychain for biometric auto-fill
  const saveToKeychain = (userEmail: string, userPass: string) => {
    try {
      const keychainRaw = localStorage.getItem('tasky_secure_keychain');
      const keychain = keychainRaw ? JSON.parse(keychainRaw) : {};
      // Ensure we encode UTF-8 properly to prevent Latin1 errors
      const utf8Safe = btoa(unescape(encodeURIComponent(userPass)));
      keychain[userEmail.toLowerCase()] = utf8Safe; // basic obfuscation mimicking local keychain
      localStorage.setItem('tasky_secure_keychain', JSON.stringify(keychain));
    } catch (e) {
      console.error("Error writing to keychain:", e);
    }
  };

  // Get password from simulated keychain
  const getFromKeychain = (userEmail: string): string | null => {
    try {
      const keychainRaw = localStorage.getItem('tasky_secure_keychain');
      if (keychainRaw) {
        const keychain = JSON.parse(keychainRaw);
        const obfuscated = keychain[userEmail.toLowerCase()];
        if (obfuscated) {
          // Decode UTF-8 safely
          return decodeURIComponent(escape(atob(obfuscated)));
        }
      }
      if (userEmail.toLowerCase() === 'spidereg2010@gmail.com') {
        return 'Sspidereg.com';
      }
      return null;
    } catch {
      if (userEmail.toLowerCase() === 'spidereg2010@gmail.com') {
        return 'Sspidereg.com';
      }
      return null;
    }
  };

  const validateForm = () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();

      // 1. Check if the user is in the team members list
      const matchedMember = teamMembers?.find((tm: any) => tm.email && tm.email.toLowerCase() === cleanEmail);
      if (matchedMember) {
        if (matchedMember.password === password) {
          const mockUser = {
            uid: matchedMember.id,
            email: matchedMember.email.toLowerCase(),
            displayName: matchedMember.name,
            emailVerified: true
          };
          localStorage.setItem('tasky_local_user', JSON.stringify(mockUser));
          setUser(mockUser);
          saveToKeychain(email, password);
          setSuccess('Welcome back!');
          return;
        } else {
          setError('Invalid email or password. Please verify your credentials.');
          setLoading(false);
          return;
        }
      }

      // 2. Check if the user is the admin fallback account
      if (cleanEmail === 'spidereg2010@gmail.com' && password === 'Sspidereg.com') {
        const mockUser = {
          uid: 'local-spidereg2010',
          email: cleanEmail,
          displayName: 'Spider Eg',
          emailVerified: true
        };
        localStorage.setItem('tasky_local_user', JSON.stringify(mockUser));
        setUser(mockUser);
        saveToKeychain(email, password);
        setSuccess('Welcome back (Local Sandbox Mode Activated)!');
        return;
      }

      // 3. Fallback to Firebase Authentication
      try {
        await signInWithEmailAndPassword(auth, email, password);
        saveToKeychain(email, password);
        setSuccess('Welcome back!');
      } catch (fbErr: any) {
        console.warn("Firebase authentication failed:", fbErr);
        throw fbErr;
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      let message = err.message || 'An unexpected error occurred. Please try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePFSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!pfName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!pfEmail.trim() || !/\S+@\S+\.\S+/.test(pfEmail)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (pfPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, pfEmail, pfPassword);
      const uid = userCredential.user.uid;

      // 2. Create organization
      const orgId = `org-fp-${Date.now()}`;
      const finalWorkspaceName = pfWorkspaceName.trim() || `${pfName}'s ${pfWorkspaceType === 'Family' ? 'Family Circle' : 'Workspace'}`;
      
      await setDoc(doc(db, 'organizations', orgId), {
        id: orgId,
        name: finalWorkspaceName,
        type: pfWorkspaceType,
        createdAt: new Date().toISOString()
      });

      // 3. Create manager team member record
      const memberId = `tm-fb-${uid}`;
      await setDoc(doc(db, 'team', memberId), {
        id: memberId,
        name: pfName.trim(),
        role: pfWorkspaceType === 'Family' ? 'Family Manager' : 'Personal Owner',
        rank: 'Manager', // Manager rank can add Users to their Family Plan
        avatar: pfName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'M',
        email: pfEmail.toLowerCase().trim(),
        password: pfPassword,
        orgId
      });

      // 4. Save to keychain and login
      saveToKeychain(pfEmail, pfPassword);
      const mockUser = {
        uid: uid,
        email: pfEmail.toLowerCase().trim(),
        displayName: pfName.trim(),
        emailVerified: true
      };
      localStorage.setItem('tasky_local_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setSuccess('Workspace created successfully! Welcome to your new task dashboard.');
    } catch (err: any) {
      console.error("Personal/Family Registration Error:", err);
      let msg = err.message || 'An error occurred during account registration.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered in the system.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!cCompanyName.trim() || !cContactName.trim()) {
      setError('Company name and Contact person are required.');
      return;
    }
    if (!cEmail.trim() || !/\S+@\S+\.\S+/.test(cEmail)) {
      setError('A valid contact email is required.');
      return;
    }
    if (!cPhone.trim()) {
      setError('A contact phone number is required.');
      return;
    }

    setLoading(true);
    try {
      const requestId = `req-${Date.now()}`;
      const newRequest = {
        id: requestId,
        companyName: cCompanyName.trim(),
        contactName: cContactName.trim(),
        email: cEmail.toLowerCase().trim(),
        phone: cPhone.trim(),
        membersCount: Number(cMembersCount) || 10,
        message: cMessage.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // 1. Save join request to Firestore
      await setDoc(doc(db, 'join_requests', requestId), newRequest);

      // 2. Prepare prefilled mailto link
      const subject = encodeURIComponent(`Company Plan Registration Request: ${cCompanyName.trim()}`);
      const body = encodeURIComponent(
        `Hello Tasky Team,\n\n` +
        `We would like to submit a request to register a new Company Workspace on Tasky.\n\n` +
        `--- Company Details ---\n` +
        `Company Name: ${cCompanyName.trim()}\n` +
        `Contact Person: ${cContactName.trim()}\n` +
        `Email: ${cEmail.toLowerCase().trim()}\n` +
        `Phone: ${cPhone.trim()}\n` +
        `Expected Members: ${cMembersCount}\n` +
        `Notes/Requirements: ${cMessage.trim() || 'None'}\n\n` +
        `Best regards,\n` +
        `${cContactName.trim()}`
      );
      const mailtoUrl = `mailto:webtasky@gmail.com?subject=${subject}&body=${body}`;

      // Save success details to show manual send email button
      setCSuccessRequest({
        id: requestId,
        mailtoUrl,
        companyName: cCompanyName.trim(),
        email: cEmail.toLowerCase().trim()
      });

      setSuccess('Your request has been saved in our system! To complete registration, you must send an actual confirmation email to webtasky@gmail.com using the button below.');
    } catch (err: any) {
      console.error("Company registration error:", err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Skip Login/Guest Mode Flow
  const handleGuestAccess = () => {
    // We can simulate an anonymous sign in or just save an "isGuest" flag in local storage
    localStorage.setItem('tasky_guest_mode', 'true');
    // Reload page to trigger context evaluation or simply trigger a dispatch/window event
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#e0e4f5] via-[#f5e1e7] to-[#e8eaf6] dark:from-[#131524] dark:via-[#311424] dark:to-[#0a0b10] text-neutral-800 dark:text-neutral-100 font-sans p-4 overflow-hidden relative transition-colors duration-500">
      
      {/* Floating Language Selection */}
      <div className="absolute top-6 right-6 z-50 flex gap-1 p-1 rounded-xl bg-white/40 dark:bg-black/20 border border-white/50 dark:border-white/5 shadow-md">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all flex items-center gap-1 ${
            language === 'en'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>EN</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('el')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all flex items-center gap-1 ${
            language === 'el'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>EL</span>
        </button>
      </div>

      {/* Dynamic ambient bubble background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-pink-500/10 dark:bg-pink-500/5 blur-3xl -z-10 animate-pulse duration-[8000ms]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-[440px] relative"
        id="login-container"
      >
        {/* Glassmorphic Card Wrapper */}
        <div className="glass-panel p-8 sm:p-10 rounded-[32px] shadow-2xl border border-white/40 dark:border-white/5 relative overflow-hidden flex flex-col items-center">
          
          {/* Logo / Brand Header */}
          <div className="flex flex-col items-center gap-2.5 mb-6">
            <motion.img 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              src={appLogo}
              alt="Tasky Logo"
              className="w-14 h-14 object-cover rounded-2xl shadow-xl shadow-indigo-500/30"
            />
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1">
              {viewMode === 'login' ? t('login.title') : viewMode === 'personal-family' ? 'Create Your Account' : 'Request Company Plan'}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium text-center max-w-[300px]">
              {viewMode === 'login' 
                ? t('login.subtitle') 
                : viewMode === 'personal-family' 
                ? 'Register your own individual or family-shared workspace instantly.' 
                : 'Fill details below to log request. An email manual send is required.'}
            </p>
          </div>

          {/* Segmented Control / Tab Switcher */}
          <div className="flex w-full bg-neutral-200/50 dark:bg-black/25 p-1 rounded-2xl mb-6 gap-1 border border-neutral-300/10 text-[11px] font-bold shrink-0 shadow-inner">
            <button 
              type="button" 
              onClick={() => { setViewMode('login'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                viewMode === 'login' 
                  ? 'bg-indigo-500 text-white shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Sign In
            </button>
            <button 
              type="button" 
              onClick={() => { setViewMode('personal-family'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                viewMode === 'personal-family' 
                  ? 'bg-indigo-500 text-white shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Personal/Family
            </button>
            <button 
              type="button" 
              onClick={() => { setViewMode('company'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${
                viewMode === 'company' 
                  ? 'bg-indigo-500 text-white shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Company Request
            </button>
          </div>

          {/* Alert messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-2xl mb-4 flex items-start gap-2 text-xs font-medium"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-2xl mb-4 flex items-start gap-2 text-xs font-medium"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic view modes rendering */}
          <div className="w-full">
            {viewMode === 'login' && (
              /* TAB 1: STANDARD SIGN IN */
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* Email Address input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                    {t('login.email')}
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-xs outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
                      {t('login.password')}
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-xs outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1 rounded hover:bg-neutral-300/30 dark:hover:bg-white/5 text-neutral-400 dark:text-neutral-500 cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 mt-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer ${
                    loading ? 'opacity-85 pointer-events-none' : ''
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t('login.button')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {viewMode === 'personal-family' && (
              /* TAB 2: PERSONAL & FAMILY REGISTRATION (INSTANT) */
              <form onSubmit={handlePFSubmit} className="w-full space-y-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                    Your Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <input
                      type="text"
                      placeholder="e.g. John Smith"
                      value={pfName}
                      onChange={(e) => setPfName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-xs outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <input
                      type="email"
                      placeholder="e.g. john@smithfamily.com"
                      value={pfEmail}
                      onChange={(e) => setPfEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-xs outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={pfPassword}
                      onChange={(e) => setPfPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-xs outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Workspace / Circle Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                    Workspace Plan Name <span className="text-[9px] text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <input
                      type="text"
                      placeholder="e.g. The Smith Family Plan"
                      value={pfWorkspaceName}
                      onChange={(e) => setPfWorkspaceName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-xs outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium"
                    />
                  </div>
                </div>

                {/* Plan Type Selection */}
                <div className="space-y-1 pb-1">
                  <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                    Select Your Plan Type
                  </label>
                  <div className="relative flex items-center">
                    <Users className="absolute left-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                    <select
                      value={pfWorkspaceType}
                      onChange={(e) => setPfWorkspaceType(e.target.value as 'Family' | 'Single')}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-200/50 dark:bg-neutral-900/40 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs outline-none text-neutral-800 dark:text-neutral-100 font-medium [&>option]:bg-neutral-100 dark:[&>option]:bg-neutral-900"
                    >
                      <option value="Family">Family Plan (Multiple Shared Accounts)</option>
                      <option value="Single">Personal Plan (Individual Account)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Free Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {viewMode === 'company' && (
              /* TAB 3: COMPANY REGISTRATION (REQUEST & EMAIL) */
              <div>
                {cSuccessRequest ? (
                  /* Custom Mail Prompt */
                  <div className="space-y-4 text-center">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left text-xs text-amber-700 dark:text-amber-300 space-y-2">
                      <p className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        Verification Action Required
                      </p>
                      <p className="leading-relaxed">
                        Your request has been filed in the system. As requested, <strong>your company must also send an actual confirmation email manually to webtasky@gmail.com</strong>.
                      </p>
                    </div>

                    <div className="bg-black/10 dark:bg-black/25 border border-white/5 p-4 rounded-2xl text-left text-[11px] font-mono space-y-1.5 text-neutral-600 dark:text-neutral-300">
                      <div className="text-neutral-400 font-bold uppercase tracking-wider text-[9px] mb-1">Filed Details</div>
                      <div><strong>Company:</strong> {cSuccessRequest.companyName}</div>
                      <div><strong>Email:</strong> {cSuccessRequest.email}</div>
                      <div><strong>To:</strong> webtasky@gmail.com</div>
                    </div>

                    <a 
                      href={cSuccessRequest.mailtoUrl}
                      className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Send Actual Email Now</span>
                    </a>

                    <button 
                      type="button"
                      onClick={() => {
                        setCSuccessRequest(null);
                        setSuccess(null);
                        setViewMode('login');
                      }}
                      className="text-xs font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  /* Request form */
                  <form onSubmit={handleCompanySubmit} className="w-full space-y-3">
                    {/* Company Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                        Company Name
                      </label>
                      <div className="relative flex items-center">
                        <Building className="absolute left-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                        <input
                          type="text"
                          placeholder="e.g. Acme Corp"
                          value={cCompanyName}
                          onChange={(e) => setCCompanyName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-xs outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    {/* Contact Person Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                        Contact Person
                      </label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3.5 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                        <input
                          type="text"
                          placeholder="e.g. Sarah Connor"
                          value={cContactName}
                          onChange={(e) => setCContactName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-xs outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Email Address */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                          Email Address
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-3 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                          <input
                            type="email"
                            placeholder="work@company.com"
                            value={cEmail}
                            onChange={(e) => setCEmail(e.target.value)}
                            className="w-full pl-9 pr-2 py-2.5 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-[11px] outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 font-medium"
                            required
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                          Phone Number
                        </label>
                        <div className="relative flex items-center">
                          <Phone className="absolute left-3 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                          <input
                            type="tel"
                            placeholder="+1 234 567 89"
                            value={cPhone}
                            onChange={(e) => setCPhone(e.target.value)}
                            className="w-full pl-9 pr-2 py-2.5 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-[11px] outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 font-medium"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Expected Members */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                          Expected Members
                        </label>
                        <div className="relative flex items-center">
                          <Users className="absolute left-3 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                          <input
                            type="number"
                            min="2"
                            max="5000"
                            value={cMembersCount}
                            onChange={(e) => setCMembersCount(Number(e.target.value))}
                            className="w-full pl-9 pr-2 py-2.5 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 focus:bg-white rounded-2xl text-[11px] outline-none text-neutral-800 dark:text-neutral-100 font-medium"
                            required
                          />
                        </div>
                      </div>

                      {/* Manual Alert indicator */}
                      <div className="flex items-center text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold p-2 bg-indigo-500/10 border border-indigo-500/10 rounded-2xl">
                        Requires manual email verification to webtasky@gmail.com
                      </div>
                    </div>

                    {/* Notes/Requirements */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 px-1">
                        Special Instructions / Requirements
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. We require custom templates or specific training..."
                        value={cMessage}
                        onChange={(e) => setCMessage(e.target.value)}
                        className="w-full p-3 bg-neutral-200/30 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl text-xs outline-none transition-all duration-300 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>File Request to Join</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-3 my-5 shrink-0">
            <div className="flex-1 h-px bg-neutral-200 dark:bg-white/5" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              OR
            </span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-white/5" />
          </div>

          {/* Guest Pass button */}
          <button
            onClick={handleGuestAccess}
            className="w-full py-2.5 bg-neutral-200/50 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-300/20 dark:border-white/5 text-neutral-600 dark:text-neutral-300 font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
          >
            <Compass className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>{t('login.guestMode')}</span>
          </button>

        </div>
      </motion.div>

    </div>
  );
};
