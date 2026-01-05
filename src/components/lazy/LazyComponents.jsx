import { lazy } from 'react';

// Componentes pesados carregados sob demanda
export const OSFormModal = lazy(() => import('@/components/os/OSFormModal'));
export const OSDetailModal = lazy(() => import('@/components/os/OSDetailModal'));
export const ProjetosGantt = lazy(() => import('@/components/projetos/ProjetosGantt'));
export const BulkUpdateModal = lazy(() => import('@/components/bulk/BulkUpdateModal'));
export const ChatArea = lazy(() => import('@/components/mensagens/ChatArea'));