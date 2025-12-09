import Dashboard from './pages/Dashboard';
import OrdensServico from './pages/OrdensServico';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "OrdensServico": OrdensServico,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};