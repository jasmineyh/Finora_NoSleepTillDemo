import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute({ unauthenticatedElement }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-[56px] h-[56px] rounded-2xl gradient-purple-pink flex items-center justify-center shadow-xl shadow-primary/30">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[60%] h-[60%]">
            <path d="M8 32 Q14 20 20 24 Q26 28 32 12" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M12 8 L12 32" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M12 8 L26 8" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M12 19 L22 19" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="29" cy="28" r="3" fill="rgba(255,255,255,0.8)"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-black tracking-tight text-foreground">Fin<span className="gradient-text">ora</span></p>
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mt-2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  return <Outlet />;
}