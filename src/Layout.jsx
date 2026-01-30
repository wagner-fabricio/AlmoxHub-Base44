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
  Loader2,
  UserCircle,
  MessageSquare,
  Truck,
  Shield,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from '@/components/notifications/NotificationBell';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Em Fluxo', icon: Zap, page: 'EmFluxo' },
  { name: 'Ordens de Serviço', icon: ClipboardList, page: 'OrdensServico' },
  { name: 'Projetos', icon: FolderKanban, page: 'Projetos' },
  { name: 'Mensagens', icon: MessageSquare, page: 'Mensagens' },
  { name: 'Regionais', icon: MapPin, page: 'Regionais' },
  { name: 'Almoxarifados', icon: Warehouse, page: 'Almoxarifados' },
  { name: 'Instalações', icon: Building2, page: 'Instalacoes' },
  { name: 'Pessoas', icon: Users, page: 'Pessoas' },
  { name: 'Categorias', icon: Tags, page: 'Categorias' },
  { name: 'Veículos Axia', icon: Truck, page: 'VeiculosAxia' },
  { name: 'Transportadoras', icon: Building2, page: 'Transportadoras' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [pessoa, setPessoa] = useState(null);
  const [isLoadingUserStatus, setIsLoadingUserStatus] = useState(true);
  const [regional, setRegional] = useState(null);
  const [almoxarifados, setAlmoxarifados] = useState([]);

  useEffect(() => {
    // Detectar mobile e redirecionar para EmFluxo
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (isMobile && currentPageName !== 'EmFluxo' && currentPageName !== 'MeuPerfilMobile' && currentPageName !== 'NotificationsMobile' && currentPageName !== 'NewUserSetup' && currentPageName !== 'PendingApproval' && currentPageName !== 'UserApproval' && currentPageName !== 'ThankYou') {
      window.location.href = createPageUrl('EmFluxo');
      return;
    }

    const loadUser = async () => {
      let redirected = false;
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Verificar se usuário precisa completar cadastro ou está pendente de aprovação
        const pessoaData = await base44.entities.Pessoa.filter({ user_id: userData.id }).then(p => p[0]);
        setPessoa(pessoaData);

        // Carregar dados adicionais se pessoa existe
        if (pessoaData) {
          if (pessoaData.regional_id) {
            const regionalData = await base44.entities.Regional.filter({ id: pessoaData.regional_id }).then(r => r[0]);
            setRegional(regionalData);
          }
          if (pessoaData.almoxarifados_ids?.length > 0) {
            const almoxData = await base44.entities.Almoxarifado.list();
            const userAlmox = almoxData.filter(a => pessoaData.almoxarifados_ids.includes(a.id));
            setAlmoxarifados(userAlmox);
          }
        }
        
        // Se não tem registro de Pessoa, redirecionar para cadastro inicial
        if (!pessoaData && currentPageName !== 'NewUserSetup') {
          redirected = true;
          window.location.href = createPageUrl('NewUserSetup');
          return;
        }
        
        // Se tem registro mas não está aprovado OU não está ativo, redirecionar para tela de aguardo
        if (pessoaData && (pessoaData.status_aprovacao !== 'aprovado' || !pessoaData.ativo) && currentPageName !== 'PendingApproval') {
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

    const savedCollapsed = localStorage.getItem('almoxhub-sidebar-collapsed');
    if (savedCollapsed === 'true') {
      setSidebarCollapsed(true);
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
    base44.auth.logout(createPageUrl('ThankYou'));
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('almoxhub-sidebar-collapsed', !sidebarCollapsed);
  };

  // Páginas que não devem exibir o layout (sidebar e header)
  const pagesWithoutLayout = ['NewUserSetup', 'PendingApproval', 'UserApproval', 'ThankYou', 'MeuPerfilMobile', 'NotificationsMobile'];
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
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https:;" />
      
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
          bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
        `}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700">
              {!sidebarCollapsed ? (
                <>
                  <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0000FF' }}>
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-slate-900 dark:text-white">AlmoxHub</h1>
                      <p className="text-xs" style={{ color: '#0A003C' }}>Axia Energia</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                        onClick={toggleSidebarCollapse}
                        className="hidden lg:block p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                        title="Recolher menu"
                      >
                        <span className="font-bold text-lg">«</span>
                      </button>
                    <button 
                      className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to={createPageUrl('Dashboard')} className="flex justify-center">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#0000FF' }}>
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </Link>
                  <button
                    onClick={toggleSidebarCollapse}
                    className="hidden lg:block p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
                    title="Expandir menu"
                  >
                    <span className="font-bold text-lg">»</span>
                  </button>
                </>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {(menuItems || []).map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`
                      flex items-center gap-3 rounded-xl transition-all duration-200
                      ${sidebarCollapsed ? 'px-4 py-3 justify-center' : 'px-4 py-3'}
                      ${isActive 
                        ? 'font-medium shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }
                    `}
                    style={isActive ? { 
                      backgroundColor: darkMode ? 'rgba(0, 0, 255, 0.1)' : '#E6E6FF',
                      color: '#0000FF'
                    } : {}}
                    onClick={() => setSidebarOpen(false)}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <Icon className={`w-5 h-5 ${sidebarCollapsed ? '' : 'shrink-0'}`} style={isActive ? { color: '#0000FF' } : {}} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              {!sidebarCollapsed ? (
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
                    <DropdownMenuContent align="end" className="w-72">
                      <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-700">
                        <p className="font-medium text-slate-900 dark:text-white mb-2">{user?.full_name}</p>
                        {pessoa && (
                          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                            {pessoa.funcoes?.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Funções:</span>
                                <span className="flex-1">
                                  {(pessoa.funcoes || []).map(f => {
                                    const labels = { gestor: 'Gestor', lider: 'Líder', almoxarife: 'Almoxarife' };
                                    return labels[f];
                                  }).join(', ')}
                                </span>
                              </div>
                            )}
                            {regional && (
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Regional:</span>
                                <span className="flex-1">{regional.sigla}</span>
                              </div>
                            )}
                            {almoxarifados.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Almoxarifados:</span>
                                <span className="flex-1">
                                  {(almoxarifados || []).slice(0, 2).map(a => a && a.nome).filter(n => n).join(', ')}
                                  {almoxarifados.length > 2 && ` +${almoxarifados.length - 2}`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <DropdownMenuItem onClick={() => window.location.href = createPageUrl('Pessoas') + '?view=me'}>
                        <UserCircle className="w-4 h-4 mr-2" />
                        Ver perfil completo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = createPageUrl('NotificationSettings')}>
                        <Bell className="w-4 h-4 mr-2" />
                        Notificações
                      </DropdownMenuItem>
                      {user?.role === 'admin' && (
                        <DropdownMenuItem onClick={() => window.location.href = createPageUrl('AuditLogs')}>
                          <Shield className="w-4 h-4 mr-2" />
                          Logs de Auditoria
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair
                      </DropdownMenuItem>
                      </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex justify-center">
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
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="font-medium text-slate-900 dark:text-white mb-2">{user?.full_name}</p>
                      {pessoa && (
                        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                          {pessoa.funcoes?.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Funções:</span>
                              <span className="flex-1">
                                {(pessoa?.funcoes || []).map(f => {
                                  const labels = { gestor: 'Gestor', lider: 'Líder', almoxarife: 'Almoxarife' };
                                  return labels[f];
                                }).join(', ')}
                              </span>
                            </div>
                          )}
                          {regional && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Regional:</span>
                              <span className="flex-1">{regional.sigla}</span>
                            </div>
                          )}
                          {almoxarifados.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Almoxarifados:</span>
                              <span className="flex-1">
                                {almoxarifados.slice(0, 2).map(a => a.nome).join(', ')}
                                {almoxarifados.length > 2 && ` +${almoxarifados.length - 2}`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <DropdownMenuItem onClick={() => window.location.href = createPageUrl('Pessoas') + '?view=me'}>
                      <UserCircle className="w-4 h-4 mr-2" />
                      Ver perfil completo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = createPageUrl('NotificationSettings')}>
                      <Bell className="w-4 h-4 mr-2" />
                      Notificações
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                    {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => window.location.href = createPageUrl('AuditLogs')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Logs de Auditoria
                    </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                  </DropdownMenu>
                  )}
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

            <div className="flex items-center gap-2">
              <NotificationBell />
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
          <main className={`flex-1 bg-slate-50 dark:bg-slate-900 ${currentPageName === 'Mensagens' ? 'overflow-hidden' : 'overflow-auto'}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}