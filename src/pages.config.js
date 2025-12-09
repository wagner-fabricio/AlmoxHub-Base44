import Dashboard from './pages/Dashboard';
import OrdensServico from './pages/OrdensServico';
import Regionais from './pages/Regionais';
import Almoxarifados from './pages/Almoxarifados';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "OrdensServico": OrdensServico,
    "Regionais": Regionais,
    "Almoxarifados": Almoxarifados,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};