import React, { useState, useEffect } from 'react';
import { useTasky } from '../TaskyContext';
import { useTranslation } from '../translations';
import { motion } from 'motion/react';
import { X, Camera, AlertCircle } from 'lucide-react';

const compressImage = (base64Str: string, maxWidth = 256, maxHeight = 256): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export const ProfileSettingsModal: React.FC = () => {
  const { 
    currentUserProfile,
    updateTeamMember,
    isProfileModalOpen,
    setIsProfileModalOpen,
    language
  } = useTasky() as any;

  const { t } = useTranslation();
  const [profileEditName, setProfileEditName] = useState('');
  const [profileEditAvatar, setProfileEditAvatar] = useState('');
  const [profileEditRole, setProfileEditRole] = useState('');
  const [profileEditAccountCategory, setProfileEditAccountCategory] = useState<'Personal' | 'Family' | 'Company'>('Personal');
  const [profileEditFamilyRole, setProfileEditFamilyRole] = useState<'parent' | 'teen' | 'child' | ''>('');
  const [profileError, setProfileError] = useState('');
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  useEffect(() => {
    if (isProfileModalOpen && currentUserProfile) {
      setProfileEditName(currentUserProfile.name || '');
      setProfileEditAvatar(currentUserProfile.avatar || '');
      setProfileEditRole(currentUserProfile.role || '');
      setProfileEditAccountCategory(currentUserProfile.accountCategory || 'Personal');
      setProfileEditFamilyRole(currentUserProfile.familyRole || '');
      setProfileError('');
    }
  }, [isProfileModalOpen, currentUserProfile]);

  const handleProfileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileError(language === 'el' ? 'Παρακαλώ επιλέξτε μια έγκυρη εικόνα' : 'Please select a valid image file');
      return;
    }
    setIsUploadingProfile(true);
    setProfileError('');
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawBase64 = event.target?.result as string;
        if (rawBase64) {
          const base64 = await compressImage(rawBase64, 256, 256);
          setProfileEditAvatar(base64);
        }
        setIsUploadingProfile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setProfileError(language === 'el' ? 'Σφάλμα επεξεργασίας εικόνας' : 'Failed to process image');
      setIsUploadingProfile(false);
    }
  };

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileEditName.trim()) {
      setProfileError(language === 'el' ? 'Το όνομα δεν μπορεί να είναι κενό' : 'Name cannot be empty');
      return;
    }

    try {
      if (currentUserProfile) {
        const updatedProfile = {
          ...currentUserProfile,
          name: profileEditName.trim(),
          avatar: profileEditAvatar,
          role: profileEditRole.trim(),
          accountCategory: profileEditAccountCategory,
          familyRole: profileEditFamilyRole || undefined
        };
        await updateTeamMember(updatedProfile);
        setIsProfileModalOpen(false);
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    }
  };

  if (!isProfileModalOpen) return null;

  const profileName = currentUserProfile?.name || 'User';
  const initial = profileName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white">
              {language === 'el' ? 'Επεξεργασία Στοιχείων Προφίλ' : 'Edit Profile Details'}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {language === 'el' ? 'Ενημερώστε τα προσωπικά σας στοιχεία και την εικόνα προφίλ σας' : 'Update your personal details and avatar picture'}
            </p>
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 dark:text-neutral-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveProfileSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {profileError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Avatar Selector */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-900 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden shadow-md">
              {profileEditAvatar ? (
                <img 
                  src={profileEditAvatar} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                profileEditName ? profileEditName.slice(0, 2).toUpperCase() : initial
              )}
              {isUploadingProfile && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('profile-avatar-input')?.click()}
                disabled={isUploadingProfile}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl text-[11px] font-bold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                {language === 'el' ? 'Αλλαγή Εικόνας' : 'Change Image'}
              </button>
              {profileEditAvatar && (
                <button
                  type="button"
                  onClick={() => setProfileEditAvatar('')}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-[11px] font-bold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                >
                  {language === 'el' ? 'Αφαίρεση' : 'Remove'}
                </button>
              )}
            </div>
            <input 
              type="file" 
              id="profile-avatar-input" 
              className="hidden" 
              accept="image/*" 
              onChange={handleProfileFileChange}
            />
          </div>

          {/* Display Name Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              {language === 'el' ? 'Ονοματεπώνυμο' : 'Full Name'}
            </label>
            <input 
              type="text" 
              required
              value={profileEditName}
              onChange={(e) => setProfileEditName(e.target.value)}
              placeholder={language === 'el' ? 'Εισάγετε όνομα...' : 'Enter your name...'}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Email Address (Read-only) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              {language === 'el' ? 'Διεύθυνση Email' : 'Email Address'}
            </label>
            <div className="relative">
              <input 
                type="email" 
                readOnly
                disabled
                value={currentUserProfile?.email || 'guest@tasky.local'}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 rounded-xl text-neutral-500 dark:text-neutral-400 text-xs font-semibold select-all focus:outline-none cursor-not-allowed"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
                <span className="text-xs">🔒</span>
              </div>
            </div>
          </div>

          {/* Manual Role / Position */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              {language === 'el' ? 'Θέση / Ρόλος' : 'Role / Position'}
            </label>
            <input 
              type="text" 
              value={profileEditRole}
              onChange={(e) => setProfileEditRole(e.target.value)}
              placeholder={language === 'el' ? 'π.χ. Προγραμματιστής, Σχεδιαστής...' : 'e.g. Developer, Designer, Manager...'}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Account Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                {language === 'el' ? 'Κατηγορία Λογαριασμού' : 'Account Category'}
              </label>
              <select
                value={profileEditAccountCategory}
                onChange={(e: any) => setProfileEditAccountCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="Personal">{language === 'el' ? 'Προσωπικός' : 'Personal'}</option>
                <option value="Family">{language === 'el' ? 'Οικογενειακός' : 'Family'}</option>
                <option value="Company">{language === 'el' ? 'Εταιρικός' : 'Company'}</option>
              </select>
            </div>

            {/* Family Role (GDPR protection) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                {language === 'el' ? 'Οικογενειακός Ρόλος' : 'Family Role (GDPR)'}
              </label>
              <select
                value={profileEditFamilyRole}
                onChange={(e: any) => setProfileEditFamilyRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-800 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="">{language === 'el' ? 'Κανένας' : 'None'}</option>
                <option value="parent">{language === 'el' ? 'Γονέας' : 'Parent'}</option>
                <option value="teen">{language === 'el' ? 'Έφηβος' : 'Teenager'}</option>
                <option value="child">{language === 'el' ? 'Παιδί' : 'Child'}</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {language === 'el' ? 'Ακύρωση' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isUploadingProfile}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {language === 'el' ? 'Αποθήκευση' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
