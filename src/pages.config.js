/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AlertasConfig from './pages/AlertasConfig';
import Almoxarifados from './pages/Almoxarifados';
import AuditLogs from './pages/AuditLogs';
import Categorias from './pages/Categorias';
import CentrosCusto from './pages/CentrosCusto';
import ConsentimentosPage from './pages/ConsentimentosPage';
import Dashboard from './pages/Dashboard';
import Documentacao from './pages/Documentacao';
import EmFluxo from './pages/EmFluxo';
import Fornecedores from './pages/Fornecedores';
import Home from './pages/Home';
import Instalacoes from './pages/Instalacoes';
import Mensagens from './pages/Mensagens';
import MeuPerfilMobile from './pages/MeuPerfilMobile';
import NewUserSetup from './pages/NewUserSetup';
import NotificationSettings from './pages/NotificationSettings';
import NotificationSettingsMobile from './pages/NotificationSettingsMobile';
import Notifications from './pages/Notifications';
import NotificationsMobile from './pages/NotificationsMobile';
import OrdensServico from './pages/OrdensServico';
import PendingApproval from './pages/PendingApproval';
import Pessoas from './pages/Pessoas';
import ProblemasRecebimento from './pages/ProblemasRecebimento';
import Projetos from './pages/Projetos';
import Regionais from './pages/Regionais';
import ThankYou from './pages/ThankYou';
import Transportadoras from './pages/Transportadoras';
import UserApproval from './pages/UserApproval';
import VeiculosAxia from './pages/VeiculosAxia';
import Equipes from './pages/Equipes';
import DelegacaoPermissoes from './pages/DelegacaoPermissoes';
import PortalTitular from './pages/PortalTitular';
import GestaoSolicitacoes from './pages/GestaoSolicitacoes';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AlertasConfig": AlertasConfig,
    "Almoxarifados": Almoxarifados,
    "AuditLogs": AuditLogs,
    "Categorias": Categorias,
    "CentrosCusto": CentrosCusto,
    "ConsentimentosPage": ConsentimentosPage,
    "Dashboard": Dashboard,
    "Documentacao": Documentacao,
    "EmFluxo": EmFluxo,
    "Fornecedores": Fornecedores,
    "Home": Home,
    "Instalacoes": Instalacoes,
    "Mensagens": Mensagens,
    "MeuPerfilMobile": MeuPerfilMobile,
    "NewUserSetup": NewUserSetup,
    "NotificationSettings": NotificationSettings,
    "NotificationSettingsMobile": NotificationSettingsMobile,
    "Notifications": Notifications,
    "NotificationsMobile": NotificationsMobile,
    "OrdensServico": OrdensServico,
    "PendingApproval": PendingApproval,
    "Pessoas": Pessoas,
    "ProblemasRecebimento": ProblemasRecebimento,
    "Projetos": Projetos,
    "Regionais": Regionais,
    "ThankYou": ThankYou,
    "Transportadoras": Transportadoras,
    "UserApproval": UserApproval,
    "VeiculosAxia": VeiculosAxia,
    "Equipes": Equipes,
    "DelegacaoPermissoes": DelegacaoPermissoes,
    "PortalTitular": PortalTitular,
    "GestaoSolicitacoes": GestaoSolicitacoes,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};