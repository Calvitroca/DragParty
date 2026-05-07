/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Camera, 
  Sparkles, 
  Crown, 
  LogOut, 
  CheckCircle2, 
  ChevronRight,
  PartyPopper,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { cn } from './lib/utils';

interface RegistrationData {
  dragName: string;
  performanceMusic: string;
  photoUrl: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [registration, setRegistration] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        console.log("Auth state changed, user:", u?.uid);
        setUser(u);
        if (u) {
          await checkRegistration(u.uid);
          // If we have a user, consider the invitation "accepted" automatically
          setAccepted(true);
        }
      } catch (err) {
        console.error("Error in auth state change:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkRegistration = async (uid: string) => {
    try {
      console.log("Checking registration for:", uid);
      const q = query(collection(db, 'registrations'), where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        console.log("Registration found:", data);
        setRegistration(data);
      } else {
        console.log("No registration found for user");
        setRegistration(null);
      }
    } catch (error) {
      console.error("Firestore query error:", error);
      // We don't want to throw here to avoid blocking the main thread, 
      // but we handle it via our custom error handler if it's a permission issue
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.LIST, 'registrations');
      }
    }
  };

  const handleLogin = async () => {
    try {
      console.log("Initiating Google Login...");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful, uid:", result.user.uid);
      
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        console.log("Creating new user profile...");
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setRegistration(null);
    setAccepted(false);
    setIsEditing(false);
  };

  const onSubmit = async (data: RegistrationData) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const registrationId = `reg_${user.uid}`;
      const regData = {
        userId: user.uid,
        ...data,
        status: registration?.status || 'pending',
        createdAt: registration?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'registrations', registrationId), regData);
      setRegistration(regData);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a0b2e] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div id="app-root" className="min-h-screen bg-dark-bg text-white font-sans selection:bg-neon-pink/30 flex flex-col overflow-x-hidden">
      {/* Background Decorative Text */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <div className="text-[25rem] font-black italic opacity-[0.03] uppercase tracking-tighter select-none rotate-[-10deg]">
          DRAG
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 w-full p-6 lg:p-8 flex justify-between items-center border-b border-white/10 shrink-0">
        <div className="text-xl lg:text-3xl font-black tracking-tighter italic uppercase text-neon-pink flex items-center gap-2">
          <Sparkles className="w-6 h-6 lg:w-8 lg:h-8" />
          GLAMOUR // GUTS
        </div>
        <div className="hidden md:flex gap-8 uppercase text-[10px] font-black tracking-[0.3em] text-white/40">
          <span className="hover:text-neon-lime cursor-pointer transition-colors">Main Event</span>
          <span className="hover:text-neon-lime cursor-pointer transition-colors">Performers</span>
          <span className="hover:text-neon-lime cursor-pointer transition-colors">Rules</span>
        </div>
        {user && (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-[10px] font-black uppercase tracking-widest border border-white/10"
          >
            {user.displayName?.split(' ')[0]} <LogOut className="w-3 h-3" />
          </button>
        )}
      </nav>

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">
        <AnimatePresence mode="wait">
          {!accepted && !user && !registration ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -100 }}
              className="flex-1 flex flex-col lg:flex-row"
            >
              {/* Left Section: Invitation Text */}
              <div className="lg:w-3/5 p-8 lg:p-16 flex flex-col justify-center border-r border-white/10">
                <div className="space-y-2 mb-8">
                  <h2 className="text-xl lg:text-3xl font-black uppercase tracking-[0.2em] text-neon-lime italic">La Gran Gala</h2>
                  <h1 className="text-6xl lg:text-[7rem] font-black leading-[0.85] uppercase tracking-tighter italic flex flex-col">
                    <span>Estas</span>
                    <span>Invitado</span>
                    <span className="text-neon-pink">A La Drag</span>
                    <span className="font-display not-italic text-white">Queen Party</span>
                  </h1>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-6 mt-4">
                  <button
                    id="accept-button"
                    onClick={() => setAccepted(true)}
                    className="group relative px-12 py-6 bg-neon-lime text-black font-black text-2xl uppercase italic shadow-[8px_8px_0px_#FF00FF] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-4"
                  >
                    ¿ACEPTAS LOBA? <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>

                <div className="mt-16 lg:mt-auto grid grid-cols-2 lg:grid-cols-3 gap-8 text-[10px] lg:text-xs font-black uppercase tracking-[0.2em]">
                  <div className="space-y-1">
                    <p className="text-white/30 text-[8px]">CUÁNDO</p>
                    <p className="text-white/90">24 OCT 2026</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white/30 text-[8px]">DÓNDE</p>
                    <p className="text-white/90">The Neon Basement</p>
                  </div>
                  <div className="hidden lg:block space-y-1">
                    <p className="text-white/30 text-[8px]">DRESS CODE</p>
                    <p className="text-white/90">Extravaganza Eleganza</p>
                  </div>
                </div>
              </div>

              {/* Right Section: Decorative / Side content */}
              <div className="lg:w-2/5 bg-deep-purple p-8 lg:p-16 flex flex-col justify-center items-center text-center">
                 <div className="relative">
                    <div className="absolute inset-0 bg-neon-pink blur-[100px] opacity-20" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="relative w-48 h-48 border-2 border-white/5 rounded-full flex items-center justify-center border-dashed"
                    >
                      <Crown className="w-20 h-20 text-neon-pink" />
                    </motion.div>
                 </div>
                 <p className="mt-12 text-sm lg:text-xl font-bold italic text-white/40 max-w-xs uppercase tracking-tight">
                   "Solo las reinas más audaces se atreven a brillar bajo el neón."
                 </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 overflow-y-auto"
            >
              <div className="max-w-5xl mx-auto p-6 lg:p-12">
                <AnimatePresence mode="wait">
                  {(accepted || user) && (!registration || isEditing) ? (
                    <motion.div
                      key="registration-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12"
                    >
                      <div className="space-y-8">
                        <div className="space-y-2">
                          <h2 className="text-5xl lg:text-7xl font-black uppercase italic tracking-tighter text-white">
                            Registro <span className="text-neon-pink">Real</span>
                          </h2>
                          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Completa tu transformación para asegurar tu lugar.</p>
                        </div>

                        {!user ? (
                           <div className="bg-deep-purple border-2 border-neon-lime p-8 lg:p-16 relative shadow-[12px_12px_0px_rgba(204,255,0,0.1)]">
                             <div className="absolute -top-4 left-6 bg-neon-lime text-black px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                               Identidad Secreta
                             </div>
                             <div className="space-y-8 text-center">
                                <ShieldCheck className="w-16 h-16 text-neon-lime mx-auto" />
                                <div className="space-y-2">
                                  <h3 className="text-2xl font-black uppercase italic">¿Quién eres, querida?</h3>
                                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-relaxed">Loggeate con Google para guardar tu progreso y registro en la nube de purpurina.</p>
                                </div>
                                <button
                                  id="google-login"
                                  onClick={handleLogin}
                                  className="w-full bg-white text-black font-black py-5 flex items-center justify-center gap-3 hover:bg-neon-lime transition-all uppercase italic text-sm"
                                >
                                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                  </svg>
                                  Entrar con Google
                                </button>
                             </div>
                           </div>
                        ) : (
                          <div className="bg-white/5 border border-white/10 p-8 lg:p-12 relative">
                            {isEditing && (
                              <div className="absolute top-4 right-4">
                                <button 
                                  onClick={() => setIsEditing(false)}
                                  className="px-3 py-1 bg-white/10 text-[8px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                            <RegistrationForm onSubmit={onSubmit} submitting={submitting} initialValues={registration} />
                          </div>
                        )}
                      </div>

                      <div className="hidden lg:flex flex-col justify-center gap-12">
                         <div className="space-y-4 border-l-2 border-neon-pink pl-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-pink">Requisito #1</p>
                            <h4 className="text-2xl font-black uppercase italic leading-tight">Nombre que imponga respeto.</h4>
                         </div>
                         <div className="space-y-4 border-l-2 border-neon-lime pl-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-lime">Requisito #2</p>
                            <h4 className="text-2xl font-black uppercase italic leading-tight">Música que incendie el lugar.</h4>
                         </div>
                         <div className="space-y-4 border-l-2 border-white/20 pl-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Requisito #3</p>
                            <h4 className="text-2xl font-black uppercase italic leading-tight">Look que deje ciegos.</h4>
                         </div>
                      </div>
                    </motion.div>
                  ) : registration && !isEditing ? (
                    <motion.div
                      key="success-view"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-2xl mx-auto text-center space-y-12 py-12"
                    >
                      <div className="relative inline-block group">
                        <div className="absolute inset-0 bg-neon-lime blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative w-40 h-40 bg-neon-pink rounded-none mx-auto flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-[12px_12px_0px_#CCFF00]">
                          <CheckCircle2 className="w-20 h-20 text-white" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h2 className="text-6xl lg:text-8xl font-black uppercase italic tracking-tighter leading-none">
                          ¡ESTÁS <br /> <span className="text-neon-lime">DENTRO!</span>
                        </h2>
                        <p className="text-xl lg:text-2xl font-bold text-white/50 tracking-tight">
                          Tu registro como <span className="text-neon-pink italic underline decoration-neon-lime decoration-4 underline-offset-8 font-black">{registration.dragName}</span> ha sido recibido.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-deep-purple border-2 border-white/5 p-8 text-left space-y-2 hover:border-neon-pink/30 hover:bg-neon-pink/5 transition-all">
                          <Music className="w-8 h-8 text-neon-pink mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">EL HIMNO</p>
                          <p className="text-xl font-black italic uppercase tracking-tighter">{registration.performanceMusic}</p>
                        </div>
                        <div className="bg-deep-purple border-2 border-white/5 p-8 text-left space-y-2 hover:border-neon-lime/30 hover:bg-neon-lime/5 transition-all">
                          <Sparkles className="w-8 h-8 text-neon-lime mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">ESTADO REAL</p>
                          <p className="text-xl font-black italic uppercase tracking-tighter">{registration.status}</p>
                        </div>
                      </div>

                      <div className="pt-12 flex flex-col items-center gap-6">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-8 py-4 bg-white text-black font-black uppercase italic text-sm hover:bg-neon-pink hover:text-white transition-all shadow-[6px_6px_0px_rgba(255,255,255,0.1)] items-center flex gap-4"
                        >
                          Actualizar Datos <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Marquee Bottom Bar */}
      <footer className="relative z-20 h-10 lg:h-12 bg-neon-lime text-black flex items-center overflow-hidden border-t-2 border-black shrink-0">
        <div className="flex animate-marquee whitespace-nowrap font-black uppercase italic text-[10px] lg:text-xs tracking-tighter py-2">
          <span className="px-8">NO SCUM ALLOWED // ONLY REAL QUEENS // SHASHAY AWAY // SERVE THE LOOK // NO SCUM ALLOWED // ONLY REAL QUEENS // SHASHAY AWAY // SERVE THE LOOK // NO SCUM ALLOWED // ONLY REAL QUEENS // SHASHAY AWAY // SERVE THE LOOK // NO SCUM ALLOWED // ONLY REAL QUEENS // SHASHAY AWAY // SERVE THE LOOK // NO SCUM ALLOWED // ONLY REAL QUEENS // SHASHAY AWAY // SERVE THE LOOK</span>
          <span className="px-8">NO SCUM ALLOWED // ONLY REAL QUEENS // SHASHAY AWAY // SERVE THE LOOK // NO SCUM ALLOWED // ONLY REAL QUEENS // SHASHAY AWAY // SERVE THE LOOK // NO SCUM ALLOWED // ONLY REAL QUEENS // SHASHAY AWAY // SERVE THE LOOK // NO SCUM ALLOWED // ONLY REAL QUEENS // SHASHAY AWAY // SERVE THE LOOK // NO SCUM ALLOWED // ONLY REAL QUEENS // SHASHAY AWAY // SERVE THE LOOK</span>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}

function RegistrationForm({ onSubmit, submitting, initialValues }: { onSubmit: (data: RegistrationData) => void, submitting: boolean, initialValues?: any }) {
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationData>({
    defaultValues: initialValues
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
      <div className="space-y-10">
        <div className="space-y-4">
          <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-neon-lime">Nombre de Draga</label>
          <div className="relative border-b-2 border-white/20 focus-within:border-neon-pink transition-colors">
            <input
              {...register('dragName', { required: '¡Necesitamos tu nombre artístico, reina!' })}
              placeholder="Ej. 'La Veneno de Marte'"
              className={cn(
                "w-full bg-transparent py-4 outline-none text-2xl lg:text-4xl font-black italic uppercase tracking-tighter placeholder:text-white/10",
                errors.dragName && "text-red-500"
              )}
            />
          </div>
          {errors.dragName && <p className="text-red-500 text-[10px] font-bold uppercase italic tracking-widest">{errors.dragName.message}</p>}
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-neon-pink">Música para Performance</label>
          <div className="relative border-b-2 border-white/20 focus-within:border-neon-lime transition-colors">
            <input
              {...register('performanceMusic', { required: '¿Con qué vas a incendiar la pista?' })}
              placeholder="Artista - Canción"
              className={cn(
                "w-full bg-transparent py-4 outline-none text-2xl lg:text-4xl font-black italic uppercase tracking-tighter placeholder:text-white/10",
                errors.performanceMusic && "text-red-500"
              )}
            />
          </div>
          {errors.performanceMusic && <p className="text-red-500 text-[10px] font-bold uppercase italic tracking-widest">{errors.performanceMusic.message}</p>}
        </div>

        <div className="space-y-4">
           <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Sube tu Look (Foto URL)</label>
           <div className="space-y-4">
             <div className="relative border-b-2 border-white/20 focus-within:border-neon-pink transition-colors">
                <input
                  {...register('photoUrl')}
                  placeholder="Link a tu esplendor..."
                  className="w-full bg-transparent py-4 outline-none text-xl font-bold placeholder:text-white/10"
                />
             </div>
             <div className="p-8 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center group hover:border-neon-pink transition-colors">
                <Camera className="w-8 h-8 text-white/20 mb-2 group-hover:text-neon-pink transition-colors" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Link directo a imagen (postimages/imgur)</p>
             </div>
           </div>
        </div>
      </div>

      <button
        disabled={submitting}
        type="submit"
        className="w-full bg-neon-pink text-white font-black py-6 text-2xl uppercase italic shadow-[10px_10px_0px_#CCFF00] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        ) : (
          initialValues ? 'Actualizar Mi Brillo' : 'Confirmar Asistencia'
        )}
      </button>

      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 text-center italic">
        * Al registrarte aceptas brillar más que las estrellas y dejarlo todo en la pista.
      </p>
    </form>
  );
}
