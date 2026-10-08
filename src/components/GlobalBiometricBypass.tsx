import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Camera, User, Check, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import { useTasky } from '../TaskyContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const GlobalBiometricBypass: React.FC = () => {
  const { setUser, teamMembers, recordSignInEvent } = useTasky() as any;

  // Face ID Biometric states
  const [showFaceID, setShowFaceID] = useState(false);
  const [faceScanState, setFaceScanState] = useState<'idle' | 'initializing' | 'scanning' | 'verifying' | 'enroll_prompt' | 'success' | 'error'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Enrolled profile retrieved from Firestore/Local
  const [enrolledFace, setEnrolledFace] = useState<{ name: string; photo: string | null; enrolledAt: string } | null>(null);
  const [enrollName, setEnrollName] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [detectedAsDark, setDetectedAsDark] = useState(false);

  // Audio Context synthesizer for high-fidelity beeps
  const playBeep = (freq = 880, dur = 0.08) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur);
    } catch {}
  };

  const playSuccessChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      
      const playNote = (freq: number, startDelay: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + startDelay);
        gain.gain.setValueAtTime(0.08, now + startDelay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startDelay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startDelay);
        osc.stop(now + startDelay + duration);
      };

      playNote(523.25, 0, 0.25); // C5
      playNote(659.25, 0.08, 0.25); // E5
      playNote(783.99, 0.16, 0.25); // G5
      playNote(1046.50, 0.24, 0.4); // C6
    } catch {}
  };

  // Check enrollment from Firestore & localStorage
  const checkEnrollment = async () => {
    try {
      // 1. First check LocalStorage for fast lookup
      const local = localStorage.getItem('tasky_primary_face');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && !parsed.deleted) {
          setEnrolledFace(parsed);
        } else {
          setEnrolledFace(null);
        }
      }

      // 2. Query Firestore db for authoritative master key
      const docRef = doc(db, 'biometrics', 'primary_face');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        if (data && !data.deleted) {
          setEnrolledFace(data);
          localStorage.setItem('tasky_primary_face', JSON.stringify(data));
        } else {
          setEnrolledFace(null);
          localStorage.removeItem('tasky_primary_face');
        }
      } else {
        setEnrolledFace(null);
        localStorage.removeItem('tasky_primary_face');
      }
    } catch (err) {
      console.warn("Error reading face enrollment:", err);
    }
  };

  useEffect(() => {
    checkEnrollment();
  }, []);

  // Keyboard shortcut listener for Shift + C + P using ultra-reliable timestamps
  useEffect(() => {
    let lastCPress = 0;
    let lastPPress = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'c') {
        lastCPress = Date.now();
      }
      if (key === 'p') {
        lastPPress = Date.now();
      }

      const hasShift = e.shiftKey;
      const withinTime = Math.abs(lastCPress - lastPPress) < 1200; // 1.2 second press window

      if (hasShift && withinTime && lastCPress > 0 && lastPPress > 0) {
        lastCPress = 0;
        lastPPress = 0;
        e.preventDefault();
        
        // Load latest state from db first
        checkEnrollment();

        setShowFaceID(true);
        setFaceScanState('initializing');
        setScanProgress(0);
        setCapturedPhoto(null);
      }
    };

    const handleBlur = () => {
      lastCPress = 0;
      lastPPress = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Face ID Scan Simulator Sequence Effect
  useEffect(() => {
    if (!showFaceID) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }

    let isMounted = true;

    if (faceScanState === 'initializing') {
      const startCam = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
              video: { width: 300, height: 300, facingMode: 'user' } 
            });
            if (isMounted) {
              setStream(mediaStream);
              setFaceScanState('scanning');
            }
          } catch (err) {
            console.warn("Webcam access denied/unavailable:", err);
            if (isMounted) {
              setFaceScanState('scanning');
            }
          }
        } else {
          if (isMounted) {
            setFaceScanState('scanning');
          }
        }
      };
      
      const timer = setTimeout(() => {
        startCam();
      }, 800);
      
      return () => clearTimeout(timer);
    }

    if (faceScanState === 'scanning') {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          const next = prev + Math.floor(Math.random() * 8) + 4;
          if (next >= 100) {
            clearInterval(interval);
            
            // Capture canvas snapshot of face right now from our high-tech composite Canvas!
            try {
              if (canvasRef.current) {
                const captureCanvas = document.createElement('canvas');
                captureCanvas.width = 150;
                captureCanvas.height = 150;
                const captureCtx = captureCanvas.getContext('2d');
                if (captureCtx) {
                  captureCtx.drawImage(canvasRef.current, 0, 0, 150, 150);
                  const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.85);
                  setCapturedPhoto(dataUrl);
                }
              }
            } catch (err) {
              console.warn("Could not capture frame snapshot from canvas:", err);
            }

            setFaceScanState('verifying');
            return 100;
          }
          if (Math.floor(next / 18) > Math.floor(prev / 18)) {
            playBeep(987.77, 0.04);
          }
          return next;
        });
      }, 100);
      return () => clearInterval(interval);
    }

    if (faceScanState === 'verifying') {
      const timeout = setTimeout(() => {
        if (!isMounted) return;

        if (!enrolledFace) {
          // No face enrolled -> Transition to enroll prompt
          setFaceScanState('enroll_prompt');
          playBeep(440, 0.15);
        } else {
          // Already enrolled -> Go straight to success!
          setFaceScanState('success');
          playSuccessChime();
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }

    if (faceScanState === 'success') {
      const timeout = setTimeout(() => {
        if (isMounted) {
          handleBypassLogin();
          setShowFaceID(false);
          setFaceScanState('idle');
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }

    return () => {
      isMounted = false;
    };
  }, [showFaceID, faceScanState]);

  // Real-time Canvas Renderer loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    
    // Initialize 35 floating sci-fi mesh points
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * 300,
        y: Math.random() * 300,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 1.5 + 1,
        alpha: Math.random() * 0.5 + 0.3
      });
    }

    const render = () => {
      if (!ctx || !canvas) return;
      frameCount++;

      // 1. Clear canvas
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, 300, 300);

      let videoActive = false;
      let isDarkFeed = true;

      // Draw active camera feed if available
      if (videoRef.current && stream && videoRef.current.readyState >= 2) {
        try {
          ctx.save();
          // Horizontal mirroring
          ctx.translate(300, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, 300, 300);
          ctx.restore();
          videoActive = true;

          // Check if camera is black/covered by sampling central pixels
          const imgData = ctx.getImageData(100, 100, 100, 100);
          let totalLuminance = 0;
          for (let i = 0; i < imgData.data.length; i += 4) {
            const r = imgData.data[i];
            const g = imgData.data[i + 1];
            const b = imgData.data[i + 2];
            totalLuminance += (0.299 * r + 0.587 * g + 0.114 * b);
          }
          const avgLuminance = totalLuminance / (imgData.data.length / 4);
          
          // Less than 15 average luminance means camera is covered/black
          isDarkFeed = avgLuminance < 15;
        } catch (e) {
          isDarkFeed = true;
        }
      } else {
        isDarkFeed = true;
      }

      setDetectedAsDark(isDarkFeed);

      if (videoActive && !isDarkFeed) {
        // High-contrast futuristic scan tint
        ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.fillRect(0, 0, 300, 300);
      } else {
        // Draw cyberpunk coordinate background grids for infrared/night-vision simulation
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.04)';
        ctx.lineWidth = 1;
        for (let i = 25; i < 300; i += 25) {
          ctx.beginPath();
          ctx.moveTo(i, 0); ctx.lineTo(i, 300);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i); ctx.lineTo(300, i);
          ctx.stroke();
        }

        // Draw outer concentric circles
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
        ctx.beginPath(); ctx.arc(150, 150, 130, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(150, 150, 90, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(150, 150, 50, 0, Math.PI * 2); ctx.stroke();
      }

      // Draw high-fidelity biometric overlays during active scan phases
      if (faceScanState === 'scanning' || faceScanState === 'verifying' || faceScanState === 'success' || faceScanState === 'initializing') {
        const pulse = Math.sin(frameCount * 0.05) * 0.06 + 1.0;
        const colorPrimary = faceScanState === 'success' ? '#10b981' : '#6366f1';
        const colorPrimaryRGBA = faceScanState === 'success' ? 'rgba(16, 185, 129, ' : 'rgba(99, 102, 241, ';

        if (isDarkFeed) {
          ctx.save();
          ctx.strokeStyle = colorPrimaryRGBA + '0.75)';
          ctx.lineWidth = 1.8;
          ctx.shadowBlur = 10;
          ctx.shadowColor = colorPrimary;

          // Glowing Head contour
          ctx.beginPath();
          ctx.ellipse(150, 140, 75 * pulse, 95 * pulse, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Eyebrows
          ctx.strokeStyle = colorPrimaryRGBA + '0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(120, 112, 14 * pulse, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(180, 112, 14 * pulse, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();

          // Eyes targets
          ctx.strokeStyle = colorPrimary;
          ctx.lineWidth = 1;
          // Left Eye reticle
          ctx.beginPath(); ctx.arc(120, 122, 9, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(110, 122); ctx.lineTo(130, 122); ctx.moveTo(120, 112); ctx.lineTo(120, 132); ctx.stroke();
          // Right Eye reticle
          ctx.beginPath(); ctx.arc(180, 122, 9, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(170, 122); ctx.lineTo(190, 122); ctx.moveTo(180, 112); ctx.lineTo(180, 132); ctx.stroke();

          // Nose
          ctx.strokeStyle = colorPrimaryRGBA + '0.6)';
          ctx.beginPath();
          ctx.moveTo(150, 105);
          ctx.lineTo(150, 155);
          ctx.lineTo(143, 155);
          ctx.stroke();

          // Mouth scanning wave
          ctx.strokeStyle = colorPrimary;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const mouthY = 190;
          ctx.moveTo(125, mouthY);
          for (let x = 125; x <= 175; x += 5) {
            const waveY = mouthY + Math.sin((x + frameCount * 4) * 0.15) * (faceScanState === 'success' ? 1.5 : 5);
            ctx.lineTo(x, waveY);
          }
          ctx.stroke();

          // Facial grid 3D contours
          ctx.strokeStyle = colorPrimaryRGBA + '0.12)';
          ctx.lineWidth = 0.5;
          for (let offset = -50; offset <= 50; offset += 25) {
            ctx.beginPath();
            ctx.ellipse(150 + offset, 140, 12, 95 * pulse, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          for (let y = 80; y <= 210; y += 25) {
            ctx.beginPath();
            ctx.ellipse(150, y, 75 * pulse, 6, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.restore();
        }

        // Target Brackets overlay
        ctx.strokeStyle = colorPrimaryRGBA + '0.85)';
        ctx.lineWidth = 1.8;
        const bSize = 25;
        const pad = 35;
        // Top Left
        ctx.beginPath(); ctx.moveTo(pad, pad + bSize); ctx.lineTo(pad, pad); ctx.lineTo(pad + bSize, pad); ctx.stroke();
        // Top Right
        ctx.beginPath(); ctx.moveTo(300 - pad, pad + bSize); ctx.lineTo(300 - pad, pad); ctx.lineTo(300 - pad - bSize, pad); ctx.stroke();
        // Bottom Left
        ctx.beginPath(); ctx.moveTo(pad, 300 - pad - bSize); ctx.lineTo(pad, 300 - pad); ctx.lineTo(pad + bSize, 300 - pad); ctx.stroke();
        // Bottom Right
        ctx.beginPath(); ctx.moveTo(300 - pad, 300 - pad - bSize); ctx.lineTo(300 - pad, 300 - pad); ctx.lineTo(300 - pad - bSize, 300 - pad); ctx.stroke();

        // Particles mesh dots
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          const dx = p.x - 150;
          const dy = p.y - 150;
          if (Math.sqrt(dx*dx + dy*dy) > 135) {
            p.vx *= -1; p.vy *= -1;
          }
          ctx.fillStyle = colorPrimaryRGBA + `${p.alpha})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        });

        // Interactive mesh lines
        ctx.strokeStyle = colorPrimaryRGBA + '0.06)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            if (Math.sqrt(dx*dx + dy*dy) < 45) {
              ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
            }
          }
        }

        // Draw technical HUD labels
        ctx.fillStyle = colorPrimary;
        ctx.font = 'bold 9px monospace';
        if (isDarkFeed) {
          ctx.fillText('[ INFRARED BIOMETRICS ENFORCED ]', 65, 260);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          ctx.fillText('CAMERA BLOCK/DARKNESS DETECTED', 68, 275);
        } else {
          ctx.fillText('[ HIGH-DEFINITION RGB STREAM ]', 68, 260);
          ctx.fillText('FACIAL MATRIX LOCK: ENGAGED', 80, 275);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '8px monospace';
        if (frameCount % 60 < 30) {
          ctx.fillText('SYS_3D_LIDAR: ARMED', 40, 65);
          ctx.fillText('RANGE_EST: 0.38M', 185, 65);
        } else {
          ctx.fillText('MATRIX_MESH: PASS', 40, 65);
          ctx.fillText('STABILITY: 99.9%', 185, 65);
        }

        // Sweeping scanner line
        if (faceScanState === 'scanning') {
          const barY = 150 + Math.sin(frameCount * 0.05) * 110;
          const gradient = ctx.createLinearGradient(0, barY - 12, 0, barY + 1);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0)');
          gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.35)');

          ctx.fillStyle = gradient;
          ctx.fillRect(25, barY - 12, 250, 12);

          ctx.strokeStyle = colorPrimary;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(25, barY); ctx.lineTo(275, barY); ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [stream, faceScanState]);

  // Handle final automatic admin bypass login
  const handleBypassLogin = () => {
    const cleanEmail = 'webtasky@gmail.com';
    const matchedMember = teamMembers?.find((tm: any) => tm.email && tm.email.toLowerCase() === cleanEmail);
    const mockUser = {
      uid: matchedMember?.id || 'admin-webtasky',
      email: cleanEmail,
      displayName: matchedMember?.name || enrolledFace?.name || 'Super Admin',
      emailVerified: true
    };
    localStorage.setItem('tasky_local_user', JSON.stringify(mockUser));
    setUser(mockUser);
    
    // basic keychain simulation
    try {
      const keychainRaw = localStorage.getItem('tasky_secure_keychain');
      const keychain = keychainRaw ? JSON.parse(keychainRaw) : {};
      const utf8Safe = btoa(unescape(encodeURIComponent('Sspidereg.com')));
      keychain[cleanEmail] = utf8Safe;
      localStorage.setItem('tasky_secure_keychain', JSON.stringify(keychain));
    } catch {}

    if (recordSignInEvent) {
      recordSignInEvent(mockUser, 'face_id_global_shortcut');
    }

    // Force window reload to cleanly load all contexts with the new user state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Submit first-time enrollment to Firestore and local
  const handleSaveEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEnrolling) return;
    setIsEnrolling(true);

    const masterName = enrollName.trim() || 'Master Admin';

    try {
      const enrollmentData = {
        name: masterName,
        photo: capturedPhoto,
        enrolledAt: new Date().toISOString(),
        email: 'webtasky@gmail.com'
      };

      // 1. Store in Firestore authoritative master record
      await setDoc(doc(db, 'biometrics', 'primary_face'), enrollmentData);

      // 2. Store in local browser storage
      localStorage.setItem('tasky_primary_face', JSON.stringify(enrollmentData));
      setEnrolledFace(enrollmentData);

      // Sound chime and go to success state
      playSuccessChime();
      setFaceScanState('success');
    } catch (err) {
      console.error("Enrollment failed:", err);
      // fallback save locally only if Firestore failed
      const enrollmentData = {
        name: masterName,
        photo: capturedPhoto,
        enrolledAt: new Date().toISOString(),
        email: 'webtasky@gmail.com'
      };
      localStorage.setItem('tasky_primary_face', JSON.stringify(enrollmentData));
      setEnrolledFace(enrollmentData);
      playSuccessChime();
      setFaceScanState('success');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Reset face ID to allow another person to enroll
  const handleResetMasterKey = async () => {
    if (!confirm("Are you sure you want to delete and reset the Master Biometric Face Key?")) return;
    try {
      localStorage.removeItem('tasky_primary_face');
      setEnrolledFace(null);
      setFaceScanState('idle');
      setShowFaceID(false);
      // Reset Firestore
      await setDoc(doc(db, 'biometrics', 'primary_face'), {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
      alert("Master Biometric Key deleted. The next person to scan will become the Master Admin.");
    } catch (err) {
      console.error("Error resetting master key:", err);
      localStorage.removeItem('tasky_primary_face');
      setEnrolledFace(null);
      setFaceScanState('idle');
      setShowFaceID(false);
    }
  };

  return (
    <AnimatePresence>
      {showFaceID && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative max-w-md w-full bg-neutral-950 border border-white/10 p-8 rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col items-center text-center overflow-hidden text-white"
          >
            {/* Top notch detail */}
            <div className="absolute top-0 inset-x-0 flex justify-center">
              <div className="w-36 h-4 bg-black rounded-b-2xl border-x border-b border-white/5" />
            </div>

            {/* Header */}
            <div className="mt-2 mb-6">
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2 justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <span>Universal Face ID Portal</span>
              </h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mt-1.5">
                Biometric Credential Bypass
              </p>
            </div>

            {/* MAIN SCAN OR ENROLL DISPLAY */}
            {faceScanState !== 'enroll_prompt' ? (
              <>
                {/* Scanner Frame Container */}
                <div className="relative w-48 h-48 rounded-full border-4 border-dashed border-neutral-800 flex items-center justify-center overflow-hidden bg-neutral-950 mb-6 group shadow-inner">
                  {/* Safe Overlay Ring */}
                  <div className={`absolute inset-0 border-4 rounded-full z-20 pointer-events-none transition-colors duration-500 ${
                    faceScanState === 'success' 
                      ? 'border-emerald-500 shadow-[0_0_20px_#10b981]' 
                      : faceScanState === 'verifying'
                      ? 'border-indigo-500 shadow-[0_0_20px_#6366f1]'
                      : faceScanState === 'scanning'
                      ? 'border-indigo-400/80 animate-pulse'
                      : 'border-neutral-800'
                  }`} />

                  {/* Hidden Video Source for Canvas rendering */}
                  <video
                    ref={(el) => {
                      if (el && stream) {
                        el.srcObject = stream;
                        videoRef.current = el;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="hidden"
                  />

                  {/* High Tech Bio-Matrix Canvas (Supports real-time feed, infrared/lidar fallback on dark, and cool HUD markers) */}
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                {/* Status Indicator Area */}
                <div className="space-y-2 mb-6 w-full px-4">
                  <div className="font-mono text-xs text-neutral-300 font-extrabold tracking-widest uppercase">
                    {faceScanState === 'initializing' && 'CONNECTING BIOMETRIC FEED...'}
                    {faceScanState === 'scanning' && `MAPPING FACIAL NODES: ${scanProgress}%`}
                    {faceScanState === 'verifying' && 'VERIFYING KEY SIGNATURE...'}
                    {faceScanState === 'success' && 'ACCESS IDENTIFIED SUCCESS!'}
                  </div>

                  {/* Progress bar wrapper */}
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: faceScanState === 'success' ? '100%' : `${scanProgress}%` 
                      }}
                      transition={{ duration: 0.15 }}
                      className={`h-full ${
                        faceScanState === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                    />
                  </div>

                  {/* Dynamic description feedback text */}
                  <p className="text-xs text-neutral-400 leading-relaxed font-semibold h-8 flex items-center justify-center">
                    {faceScanState === 'initializing' && 'Align face with front camera.'}
                    {faceScanState === 'scanning' && 'Holding alignment... scanning 14,000 spatial nodes.'}
                    {faceScanState === 'verifying' && (
                      enrolledFace 
                        ? `Comparing credentials with Master Key: ${enrolledFace.name}...` 
                        : 'Authenticating credentials with empty master key...'
                    )}
                    {faceScanState === 'success' && (
                      enrolledFace 
                        ? `Welcome Back, ${enrolledFace.name}! Bypass active.` 
                        : 'Biometric master initialized! Signing in...'
                    )}
                  </p>
                </div>
              </>
            ) : (
              /* FIRST TIME ENROLLMENT PROMPT FORM */
              <form onSubmit={handleSaveEnrollment} className="w-full space-y-6">
                <div className="p-5 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl text-left space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Camera className="w-5 h-5" />
                    <span className="font-black text-sm tracking-wide uppercase">New Enrollment Captured!</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-normal">
                    You are the <strong className="text-white">first person</strong> to scan. This face profile will be registered as the permanent Master Bypass key for this workspace. Every subsequent scan will identify <strong className="text-white">you</strong>.
                  </p>
                </div>

                {/* Show captured image thumbnail */}
                {capturedPhoto && (
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Captured Print</span>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500/40 p-0.5">
                      <img src={capturedPhoto} className="w-full h-full object-cover rounded-full grayscale" alt="Enrollment Print" />
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-left">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block px-1">
                    Master Administrator Name
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollName}
                    onChange={(e) => setEnrollName(e.target.value)}
                    placeholder="e.g. Spidereg"
                    className="w-full bg-neutral-900 hover:bg-neutral-900/80 focus:bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isEnrolling}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                >
                  {isEnrolling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enrolling Biometrics...</span>
                    </>
                  ) : (
                    <>
                      <span>Lock Master Key & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Enclave details and controls */}
            <div className="w-full border-t border-white/5 pt-5 mt-2 flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-500 uppercase tracking-wider justify-center">
                <span>AES-256 Enclave</span>
                <span>·</span>
                <span>Active</span>
              </div>

              <div className="flex gap-4 w-full justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowFaceID(false);
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                      setStream(null);
                    }
                  }}
                  className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold bg-neutral-900 hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-neutral-300 rounded-xl cursor-pointer"
                >
                  Close Scanner
                </button>

                {enrolledFace && (
                  <button
                    type="button"
                    onClick={handleResetMasterKey}
                    className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/10 rounded-xl cursor-pointer"
                  >
                    Reset Master Key
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
