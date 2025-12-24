import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  ClipboardList, 
  MapPin, 
  Warehouse, 
  Building2,
  Users, 
  Tags, 
  FolderKanban,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Zap,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Ordens de Serviço', icon: ClipboardList, page: 'OrdensServico' },
  { name: 'Regionais', icon: MapPin, page: 'Regionais' },
  { name: 'Almoxarifados', icon: Warehouse, page: 'Almoxarifados' },
  { name: 'Instalações', icon: Building2, page: 'Instalacoes' },
  { name: 'Pessoas', icon: Users, page: 'Pessoas' },
  { name: 'Categorias', icon: Tags, page: 'Categorias' },
  { name: 'Projetos', icon: FolderKanban, page: 'Projetos' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [pessoa, setPessoa] = useState(null);
  const [isLoadingUserStatus, setIsLoadingUserStatus] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      let redirected = false;
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Verificar se usuário precisa completar cadastro ou está pendente de aprovação
        const pessoaData = await base44.entities.Pessoa.filter({ user_id: userData.id }).then(p => p[0]);
        setPessoa(pessoaData);
        
        // Se não tem registro de Pessoa, redirecionar para cadastro inicial
        if (!pessoaData && currentPageName !== 'NewUserSetup') {
          redirected = true;
          window.location.href = createPageUrl('NewUserSetup');
          return;
        }
        
        // Se tem registro mas está pendente de aprovação, redirecionar para tela de aguardo
        if (pessoaData && pessoaData.status_aprovacao === 'pendente' && currentPageName !== 'PendingApproval') {
          redirected = true;
          window.location.href = createPageUrl('PendingApproval');
          return;
        }
        
        // Se foi rejeitado, também vai para tela de pendente (pode ser customizado depois)
        if (pessoaData && pessoaData.status_aprovacao === 'rejeitado' && currentPageName !== 'PendingApproval') {
          redirected = true;
          window.location.href = createPageUrl('PendingApproval');
          return;
        }
        
        // Se não está ativo, redirecionar
        if (pessoaData && !pessoaData.ativo && currentPageName !== 'PendingApproval' && currentPageName !== 'NewUserSetup') {
          redirected = true;
          window.location.href = createPageUrl('PendingApproval');
          return;
        }
      } catch (e) {
        console.log('User not logged in');
      } finally {
        if (!redirected) {
          setIsLoadingUserStatus(false);
        }
      }
    };
    loadUser();
    
    const savedTheme = localStorage.getItem('almoxhub-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('almoxhub-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('almoxhub-theme', 'light');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Páginas que não devem exibir o layout (sidebar e header)
  const pagesWithoutLayout = ['NewUserSetup', 'PendingApproval', 'UserApproval'];
  const shouldHideLayout = pagesWithoutLayout.includes(currentPageName);

  // Se a página não deve ter layout, renderizar apenas o children
  if (shouldHideLayout) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <style>{`
          :root {
            --primary: 217 91% 60%;
            --primary-foreground: 0 0% 100%;
            --accent: 38 92% 50%;
          }
          .dark {
            --background: 222 47% 11%;
            --foreground: 210 40% 98%;
            --card: 222 47% 14%;
            --card-foreground: 210 40% 98%;
            --popover: 222 47% 14%;
            --popover-foreground: 210 40% 98%;
            --muted: 217 33% 17%;
            --muted-foreground: 215 20% 65%;
            --border: 217 33% 20%;
            --input: 217 33% 20%;
          }
        `}</style>
        {children}
      </div>
    );
  }

  // Mostrar tela de carregamento enquanto verifica status do usuário
  if (isLoadingUserStatus) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <style>{`
          :root {
            --primary: 217 91% 60%;
            --primary-foreground: 0 0% 100%;
            --accent: 38 92% 50%;
          }
          .dark {
            --background: 222 47% 11%;
            --foreground: 210 40% 98%;
            --card: 222 47% 14%;
            --card-foreground: 210 40% 98%;
            --popover: 222 47% 14%;
            --popover-foreground: 210 40% 98%;
            --muted: 217 33% 17%;
            --muted-foreground: 215 20% 65%;
            --border: 217 33% 20%;
            --input: 217 33% 20%;
          }
        `}</style>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <style>{`
        :root {
          --primary: 217 91% 60%;
          --primary-foreground: 0 0% 100%;
          --accent: 38 92% 50%;
        }
        .dark {
          --background: 222 47% 11%;
          --foreground: 210 40% 98%;
          --card: 222 47% 14%;
          --card-foreground: 210 40% 98%;
          --popover: 222 47% 14%;
          --popover-foreground: 210 40% 98%;
          --muted: 217 33% 17%;
          --muted-foreground: 215 20% 65%;
          --border: 217 33% 20%;
          --input: 217 33% 20%;
        }
      `}</style>
      
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
        {/* Sidebar Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700">
              <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">AlmoxHub</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Axia Energia</p>
                </div>
              </Link>
              <button 
                className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : ''}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 px-3 py-2">
                {pessoa?.foto_perfil ? (
                  <img
                    src={pessoa.foto_perfil}
                    alt={user?.full_name || 'Usuário'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="rounded-xl"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}