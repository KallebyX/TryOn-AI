import { Link } from 'react-router-dom';
import { ShoppingBag, LayoutDashboard, Camera, User, Sparkles, LogIn, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 overflow-x-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Camera className="h-6 w-6" />
          <span>TryOn AI</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-gray-600 transition-colors">
            Loja
          </Link>
          <Link to="/profile" className="text-sm font-medium hover:text-gray-600 transition-colors flex items-center gap-1">
            <User className="h-4 w-4" />
            Perfil
          </Link>
          <Link to="/ai-lab" className="text-sm font-medium hover:text-gray-600 transition-colors flex items-center gap-1 text-indigo-600">
            <Sparkles className="h-4 w-4" />
            Laboratório IA
          </Link>
          <Link to="/admin" className="text-sm font-medium hover:text-gray-600 transition-colors flex items-center gap-1">
            <LayoutDashboard className="h-4 w-4" />
            Painel Admin
          </Link>
          <div className="h-4 w-px bg-gray-300 mx-2"></div>
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} alt="Profile" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              <button onClick={logOut} className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <LogIn className="h-4 w-4" />
              Entrar
            </button>
          )}
          <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors ml-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-black text-[10px] font-bold text-white flex items-center justify-center">
              0
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
