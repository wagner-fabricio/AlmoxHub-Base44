import Almoxarifados from './pages/Almoxarifados';
import Categorias from './pages/Categorias';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Instalacoes from './pages/Instalacoes';
import Mensagens from './pages/Mensagens';
import NewUserSetup from './pages/NewUserSetup';
import Notifications from './pages/Notifications';
import OrdensServico from './pages/OrdensServico';
import PendingApproval from './pages/PendingApproval';
import Pessoas from './pages/Pessoas';
import Projetos from './pages/Projetos';
import Regionais from './pages/Regionais';
import ThankYou from './pages/ThankYou';
import Transportadoras from './pages/Transportadoras';
import UserApproval from './pages/UserApproval';
import VeiculosAxia from './pages/VeiculosAxia';
import EmFluxo from './pages/EmFluxo';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Almoxarifados": Almoxarifados,
    "Categorias": Categorias,
    "Dashboard": Dashboard,
    "Home": Home,
    "Instalacoes": Instalacoes,
    "Mensagens": Mensagens,
    "NewUserSetup": NewUserSetup,
    "Notifications": Notifications,
    "OrdensServico": OrdensServico,
    "PendingApproval": PendingApproval,
    "Pessoas": Pessoas,
    "Projetos": Projetos,
    "Regionais": Regionais,
    "ThankYou": ThankYou,
    "Transportadoras": Transportadoras,
    "UserApproval": UserApproval,
    "VeiculosAxia": VeiculosAxia,
    "EmFluxo": EmFluxo,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};