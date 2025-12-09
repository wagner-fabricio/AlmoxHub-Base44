import Dashboard from './pages/Dashboard';
import OrdensServico from './pages/OrdensServico';
import Regionais from './pages/Regionais';
import Almoxarifados from './pages/Almoxarifados';
import Pessoas from './pages/Pessoas';
import Categorias from './pages/Categorias';
import Projetos from './pages/Projetos';
import Instalacoes from './pages/Instalacoes';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "OrdensServico": OrdensServico,
    "Regionais": Regionais,
    "Almoxarifados": Almoxarifados,
    "Pessoas": Pessoas,
    "Categorias": Categorias,
    "Projetos": Projetos,
    "Instalacoes": Instalacoes,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};