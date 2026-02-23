import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Database, Cloud, Key, FileCode } from 'lucide-react';

export default function ImplementacaoSection() {
  return (
    <div className="space-y-6">
      {/* Stack Tecnológica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Stack Tecnológica Detalhada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Frontend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">React</span>
                  <Badge>18.2.0</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Tailwind CSS</span>
                  <Badge>Latest</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">React Query</span>
                  <Badge>5.84.1</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">React Router</span>
                  <Badge>6.26.0</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">shadcn/ui</span>
                  <Badge>Latest</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Recharts</span>
                  <Badge>2.15.4</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">React Leaflet</span>
                  <Badge>4.2.1</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Framer Motion</span>
                  <Badge>11.16.4</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Backend & Runtime</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Deno</span>
                  <Badge>Latest</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">Base44 SDK</span>
                  <Badge>0.8.6</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">DOMPurify</span>
                  <Badge>3.0.9</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">jsPDF</span>
                  <Badge>2.5.2</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">xlsx</span>
                  <Badge>0.18.5</Badge>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <span className="text-slate-600 dark:text-slate-400">date-fns</span>
                  <Badge>3.6.0</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modelo de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            Modelo de Dados e Entidades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">
              Entidades Principais (20+)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Core</p>
                <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                  <li>• OrdemServico (OS)</li>
                  <li>• Comentario</li>
                  <li>• AuditLog</li>
                  <li>• Notificacao</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Cadastros</p>
                <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                  <li>• Pessoa</li>
                  <li>• Regional</li>
                  <li>• Almoxarifado</li>
                  <li>• Instalacao</li>
                  <li>• Categoria</li>
                  <li>• Subcategoria</li>
                  <li>• Projeto</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Logística</p>
                <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                  <li>• OrdemSaida</li>
                  <li>• Transportadora</li>
                  <li>• VeiculoAxia</li>
                  <li>• ProblemaRecebimento</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
            <h4 className="font-semibold text-cyan-900 dark:text-cyan-200 mb-3">
              Comunicação
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-cyan-800 dark:text-cyan-200">
              <li>• Conversa</li>
              <li>• ParticipanteConversa</li>
              <li>• MensagemChat</li>
              <li>• NotificationPreferences</li>
              <li>• PushSubscription</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
              Campos Built-in (Todas Entidades)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">id</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">UUID único</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">created_date</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Timestamp criação</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">updated_date</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Timestamp atualização</p>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">created_by</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Email do criador</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Autenticação e Autorização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-600" />
            Autenticação e Autorização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-3">
              Base44 Auth (Gerenciado)
            </h4>
            <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
              <li>• <code className="px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded">base44.auth.me()</code> - Retorna usuário autenticado</li>
              <li>• <code className="px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded">base44.auth.isAuthenticated()</code> - Verifica se está autenticado</li>
              <li>• <code className="px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded">base44.auth.updateMe(data)</code> - Atualiza dados do usuário</li>
              <li>• <code className="px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded">base44.auth.logout(redirectUrl)</code> - Faz logout</li>
              <li>• <code className="px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded">base44.auth.redirectToLogin(nextUrl)</code> - Redireciona para login</li>
              <li>• <strong>SSO Disponível:</strong> Base44 suporta SSO corporativo (Azure AD, Okta, Google Workspace)</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
              Row Level Security (RLS)
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Políticas RLS implementadas em entidades sensíveis:
            </p>
            <pre className="text-xs bg-blue-100 dark:bg-blue-900 p-3 rounded overflow-x-auto">
{`// Exemplo: Pessoa
"rls": {
  "create": {
    "$or": [
      { "data.user_id": "{{user.id}}" },
      { "user_condition": { "role": "admin" } }
    ]
  },
  "update": {
    "$or": [
      { "data.user_id": "{{user.id}}" },
      { "user_condition": { "role": "admin" } }
    ]
  },
  "delete": {
    "user_condition": { "role": "admin" }
  }
}`}</pre>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3">
              Roles e Permissões
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Badge className="mb-2">admin</Badge>
                <ul className="space-y-1 text-green-800 dark:text-green-200">
                  <li>• Acesso total ao sistema</li>
                  <li>• Aprovar usuários (UserApproval)</li>
                  <li>• CRUD em cadastros base</li>
                  <li>• Visualizar Audit Logs</li>
                  <li>• Gerenciar todas regionais</li>
                </ul>
              </div>
              <div>
                <Badge className="mb-2">gestor</Badge>
                <ul className="space-y-1 text-green-800 dark:text-green-200">
                  <li>• Gerenciar OS da regional</li>
                  <li>• Aprovar OS</li>
                  <li>• Visualizar dashboard completo</li>
                  <li>• Acesso a problemas recebimento</li>
                </ul>
              </div>
              <div>
                <Badge className="mb-2">lider</Badge>
                <ul className="space-y-1 text-green-800 dark:text-green-200">
                  <li>• Criar/editar OS onde é líder</li>
                  <li>• Atribuir executores</li>
                  <li>• Gerenciar projetos</li>
                </ul>
              </div>
              <div>
                <Badge className="mb-2">almoxarife</Badge>
                <ul className="space-y-1 text-green-800 dark:text-green-200">
                  <li>• Executar OS atribuídas</li>
                  <li>• Atualizar progresso</li>
                  <li>• Picking e separação</li>
                  <li>• Conferência recebimento</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* APIs e Integrações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600" />
            APIs e Integrações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
              Base44 SDK - Entities API
            </h4>
            <pre className="text-xs bg-indigo-100 dark:bg-indigo-900 p-3 rounded overflow-x-auto">
{`// CRUD Operations
await base44.entities.OrdemServico.list(orderBy?, limit?)
await base44.entities.OrdemServico.filter(query, orderBy?, limit?)
await base44.entities.OrdemServico.create(data)
await base44.entities.OrdemServico.update(id, data)
await base44.entities.OrdemServico.delete(id)
await base44.entities.OrdemServico.schema()

// Real-time Subscriptions
const unsubscribe = base44.entities.OrdemServico.subscribe((event) => {
  // event: { type: 'create'|'update'|'delete', id, data, old_data }
  console.log('OS changed:', event);
});`}</pre>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">
              Backend Functions API
            </h4>
            <pre className="text-xs bg-purple-100 dark:bg-purple-900 p-3 rounded overflow-x-auto">
{`// Frontend (Platform V3+)
import { base44 } from "@/api/base44Client";

const response = await base44.functions.invoke('functionName', {
  param1: 'value1',
  param2: 'value2'
});

// response = { data, status, headers } (Axios response)
const result = response.data;

// Backend Function Structure (Deno)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { param1, param2 } = await req.json();
    
    // Business logic here
    const result = await processLogic(param1, param2);
    
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});`}</pre>
          </div>

          <div className="p-4 bg-teal-50 dark:bg-teal-950 rounded-lg">
            <h4 className="font-semibold text-teal-900 dark:text-teal-200 mb-3">
              Integrations API (Base44 Core)
            </h4>
            <pre className="text-xs bg-teal-100 dark:bg-teal-900 p-3 rounded overflow-x-auto">
{`// Upload File
const { file_url } = await base44.integrations.Core.UploadFile({ file });

// Send Email
await base44.integrations.Core.SendEmail({
  from_name: 'AlmoxHub',
  to: 'user@example.com',
  subject: 'Notification',
  body: 'Email content'
});

// Generate Image (AI)
const { url } = await base44.integrations.Core.GenerateImage({
  prompt: 'A warehouse with modern equipment',
  existing_image_urls: [] // optional
});

// Invoke LLM
const result = await base44.integrations.Core.InvokeLLM({
  prompt: 'Analyze this data',
  add_context_from_internet: false,
  response_json_schema: { type: 'object', properties: {...} }
});`}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Padrões de Código */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-rose-600" />
            Padrões de Código e Boas Práticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-rose-50 dark:bg-rose-950 rounded-lg">
            <h4 className="font-semibold text-rose-900 dark:text-rose-200 mb-3">
              Componentização
            </h4>
            <ul className="space-y-2 text-sm text-rose-800 dark:text-rose-200">
              <li>• <strong>Componentes pequenos:</strong> Máximo 200 linhas, idealmente {'<'}100</li>
              <li>• <strong>Separação de concerns:</strong> UI components vs Business components</li>
              <li>• <strong>Reutilização:</strong> components/ui (shadcn) para UI base</li>
              <li>• <strong>Organização:</strong> components/modulo/ComponenteEspecifico</li>
              <li>• <strong>Exemplo:</strong> components/os/OSFormModal, components/os/OSKanban</li>
            </ul>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
              State Management
            </h4>
            <pre className="text-xs bg-blue-100 dark:bg-blue-900 p-3 rounded overflow-x-auto">
{`// React Query para Server State
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { data: ordens, isLoading } = useQuery({
  queryKey: ['ordens', filters],
  queryFn: () => base44.entities.OrdemServico.filter(filters)
});

const mutation = useMutation({
  mutationFn: (data) => base44.entities.OrdemServico.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ordens'] });
  }
});

// React Context para App State
import { createContext, useContext } from 'react';
const AppContext = createContext();`}</pre>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3">
              Segurança
            </h4>
            <pre className="text-xs bg-green-100 dark:bg-green-900 p-3 rounded overflow-x-auto">
{`// Sanitização de HTML
import { sanitizeHTML } from '@/components/utils/sanitize';
const clean = sanitizeHTML(userInput);

// Sanitização de Texto
import { sanitizeText } from '@/components/utils/sanitize';
const safe = sanitizeText(userInput);

// SecureInput Component
import SecureInput from '@/components/security/SecureInput';
<SecureInput 
  value={text}
  onChange={setText}
  maxLength={100}
  allowedChars="alphanumeric"
/>

// Backend Auth Middleware
import { requireAuth } from './middleware/auth.js';
const { user, base44 } = await requireAuth(req, { requireAdmin: true });`}</pre>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-3">
              Error Handling
            </h4>
            <pre className="text-xs bg-amber-100 dark:bg-amber-900 p-3 rounded overflow-x-auto">
{`// Frontend - Não usar try/catch desnecessário
// Deixar erros bubbling para React Query error boundaries

// Backend - Sempre try/catch
try {
  const result = await dangerousOperation();
  return Response.json({ success: true, result });
} catch (error) {
  console.error('Error:', error);
  return Response.json({ 
    error: error.message,
    details: process.env.NODE_ENV === 'dev' ? error.stack : undefined
  }, { status: 500 });
}`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}