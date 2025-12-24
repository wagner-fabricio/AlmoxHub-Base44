import Almoxarifados from './pages/Almoxarifados';
import Categorias from './pages/Categorias';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Instalacoes from './pages/Instalacoes';
import OrdensServico from './pages/OrdensServico';
import Pessoas from './pages/Pessoas';
import Projetos from './pages/Projetos';
import Regionais from './pages/Regionais';
import NewUserSetup from './pages/NewUserSetup';
import PendingApproval from './pages/PendingApproval';
import UserApproval from './pages/UserApproval';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Almoxarifados": Almoxarifados,
    "Categorias": Categorias,
    "Dashboard": Dashboard,
    "Home": Home,
    "Instalacoes": Instalacoes,
    "OrdensServico": OrdensServico,
    "Pessoas": Pessoas,
    "Projetos": Projetos,
    "Regionais": Regionais,
    "NewUserSetup": NewUserSetup,
    "PendingApproval": PendingApproval,
    "UserApproval": UserApproval,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};