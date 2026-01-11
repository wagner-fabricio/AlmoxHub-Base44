import Almoxarifados from './pages/Almoxarifados';
import AuditLogs from './pages/AuditLogs';
import Categorias from './pages/Categorias';
import Dashboard from './pages/Dashboard';
import EmFluxo from './pages/EmFluxo';
import Home from './pages/Home';
import Instalacoes from './pages/Instalacoes';
import Mensagens from './pages/Mensagens';
import MeuPerfilMobile from './pages/MeuPerfilMobile';
import NewUserSetup from './pages/NewUserSetup';
import Notifications from './pages/Notifications';
import NotificationsMobile from './pages/NotificationsMobile';
import OrdensServico from './pages/OrdensServico';
import PendingApproval from './pages/PendingApproval';
import Pessoas from './pages/Pessoas';
import Projetos from './pages/Projetos';
import Regionais from './pages/Regionais';
import ThankYou from './pages/ThankYou';
import Transportadoras from './pages/Transportadoras';
import UserApproval from './pages/UserApproval';
import VeiculosAxia from './pages/VeiculosAxia';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Almoxarifados": Almoxarifados,
    "AuditLogs": AuditLogs,
    "Categorias": Categorias,
    "Dashboard": Dashboard,
    "EmFluxo": EmFluxo,
    "Home": Home,
    "Instalacoes": Instalacoes,
    "Mensagens": Mensagens,
    "MeuPerfilMobile": MeuPerfilMobile,
    "NewUserSetup": NewUserSetup,
    "Notifications": Notifications,
    "NotificationsMobile": NotificationsMobile,
    "OrdensServico": OrdensServico,
    "PendingApproval": PendingApproval,
    "Pessoas": Pessoas,
    "Projetos": Projetos,
    "Regionais": Regionais,
    "ThankYou": ThankYou,
    "Transportadoras": Transportadoras,
    "UserApproval": UserApproval,
    "VeiculosAxia": VeiculosAxia,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};