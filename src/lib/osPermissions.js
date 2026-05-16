/**
 * Regras de permissão para edição de Ordens de Serviço.
 *
 * Hierarquia:
 *  - Admin (user.role === 'admin')                    → SEMPRE pode editar
 *  - Gestor (pessoa.funcoes inclui 'gestor')
 *      • OS global                                    → pode editar
 *      • OS normal                                    → pessoa.regional_id === os.regional_id
 *  - Líder/Almoxarife (pessoa.funcoes inclui 'lider' ou 'almoxarife')
 *      • OS normal                                    → almoxarifado da OS ∈ pessoa.almoxarifados_ids
 *      • OS global                                    → estar envolvido como líder, executor ou atendente
 *  - Outros                                           → não podem editar
 */

export function canEditOS(os, currentUser, currentPessoa) {
  if (!os || !currentUser) return false;

  // Admin pode tudo
  if (currentUser.role === 'admin') return true;

  if (!currentPessoa) return false;
  const funcoes = currentPessoa.funcoes || [];

  // Gestor
  if (funcoes.includes('gestor')) {
    if (os.is_global) return true;
    return currentPessoa.regional_id === os.regional_id;
  }

  // Líder ou Almoxarife
  const isLiderOuAlmoxarife = funcoes.includes('lider') || funcoes.includes('almoxarife');
  if (isLiderOuAlmoxarife) {
    if (os.is_global) {
      // Em OS global, precisa estar envolvido na OS
      const isLider = os.lider_id === currentPessoa.id;
      const isExecutor = (os.executores_ids || []).includes(currentPessoa.id);
      const isAtendente = os.atendente_nome && currentPessoa.nome &&
        os.atendente_nome.trim().toLowerCase() === currentPessoa.nome.trim().toLowerCase();
      return isLider || isExecutor || isAtendente;
    }
    // OS normal: precisa atender ao almoxarifado
    return (currentPessoa.almoxarifados_ids || []).includes(os.almoxarifado_id);
  }

  return false;
}