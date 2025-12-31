import { useState, useEffect } from 'react';
import { Plus, Pause, Trash2, Activity, ShieldCheck, User } from 'lucide-react';
import { authService } from './services/auth';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setIsLoggedIn(true);
      setUser(currentUser);
    }
  }, []);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-indigo-500/30">
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Monitra
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <User className="w-4 h-4" />
              <span>{user?.name}</span>
            </div>
            <button
              onClick={() => { authService.logout(); setIsLoggedIn(false); }}
              className="text-sm font-medium text-white/40 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-white/40 mt-1">Real-time status of your services</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-all active:scale-95 shadow-xl shadow-white/10">
              <Plus className="w-4 h-4" />
              Add Monitor
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MonitorCard title="Cloudflare API" url="https://api.cloudflare.com" status="up" latency={42} />
            <MonitorCard title="Main Database" url="db.monitra.internal" status="up" latency={12} />
            <MonitorCard title="Legacy Auth" url="https://auth-old.acme.co" status="down" latency={0} />
          </div>
        </div>
      </main>
    </div>
  );
}

function MonitorCard({ title, url, status, latency }: any) {
  return (
    <div className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <h3 className="font-semibold text-lg text-white/90 group-hover:text-white transition-colors">{title}</h3>
            <span className="text-xs text-white/30 truncate max-w-[200px]">{url}</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
            {status}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Latency</span>
            <span className="text-sm font-medium text-white/60">{latency > 0 ? `${latency}ms` : '--'}</span>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all">
              <Pause className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-red-400 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: any) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await authService.register({ name, email, password });
      } else {
        await authService.login({ email, password });
      }
      onLogin();
    } catch (error) {
      alert('Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tighter text-white">Monitra</span>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-500 delay-150">
          <h2 className="text-2xl font-bold mb-6 text-center">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1 ml-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-colors"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-colors"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-all active:scale-[0.98] mt-6 shadow-xl shadow-white/5">
              {isRegister ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="w-full mt-6 text-sm text-white/40 hover:text-white transition-colors"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
