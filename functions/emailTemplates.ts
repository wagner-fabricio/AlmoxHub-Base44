import { ALERT_STYLES } from './alertConfig.js';
import { sanitizeHTML } from './utils/security.js';

/**
 * Retorna os estilos CSS padrão para e-mails
 */
export function getEstilosPadrao() {
  return `
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #ffffff; padding: 30px; }
    .info { background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .info-item { margin: 8px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
  `;
}

/**
 * Gera o footer padrão dos e-mails
 */
function getFooterPadrao() {
  return `
    <div class="footer">
      <p>Este é um alerta automático do sistema AlmoxHub. Por favor, não responda a este e-mail.</p>
      <p style="color: #0000FF; font-weight: bold; margin-top: 10px;">Axia Energia</p>
    </div>
  `;
}

/**
 * Template para alerta de OS atrasada
 */
export function gerarTemplateAlertaAtraso(lider, os, diasAtraso) {
  const styles = ALERT_STYLES.atraso;
  const nomeSeguro = sanitizeHTML(lider.nome);
  const codigoSeguro = sanitizeHTML(os.codigo);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${getEstilosPadrao()}
        .header { background: linear-gradient(135deg, ${styles.corPrimaria} 0%, ${styles.corSecundaria} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { border: 2px solid ${styles.corPrimaria}; }
        .alert-box { background: ${styles.corFundo}; border-left: 4px solid ${styles.corBorda}; padding: 15px; margin: 20px 0; }
        .label { font-weight: bold; color: ${styles.corPrimaria}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${styles.emoji} ${styles.titulo}</h1>
          <p style="font-size: 18px; margin: 10px 0 0 0;">${styles.subtitulo}</p>
        </div>
        <div class="content">
          <p>Olá <strong>${nomeSeguro}</strong>,</p>
          
          <div class="alert-box">
            <h3 style="margin-top: 0; color: ${styles.corPrimaria};">${styles.emoji} Atenção Necessária</h3>
            <p>A Ordem de Serviço sob sua responsabilidade está <strong>${diasAtraso} dia${diasAtraso > 1 ? 's' : ''} atrasada</strong> e requer ação imediata.</p>
          </div>
          
          <div class="info">
            <h3 style="margin-top: 0; color: ${styles.corPrimaria};">Detalhes da OS</h3>
            <div class="info-item"><span class="label">Código:</span> ${codigoSeguro}</div>
            <div class="info-item"><span class="label">Prazo Original:</span> ${new Date(os.prazo).toLocaleDateString('pt-BR')}</div>
            <div class="info-item"><span class="label">Dias em Atraso:</span> ${diasAtraso} dia${diasAtraso > 1 ? 's' : ''}</div>
            <div class="info-item"><span class="label">Status Atual:</span> ${os.status === 'elaboracao' ? 'Em Elaboração' : 'Em Execução'}</div>
            <div class="info-item"><span class="label">Progresso:</span> ${os.progresso || 0}%</div>
          </div>
          
          <p><strong>Ações Recomendadas:</strong></p>
          <ul>
            <li>Verifique o status atual da OS no sistema</li>
            <li>Atualize o progresso e as informações relevantes</li>
            <li>Se necessário, reavalie o prazo ou realoque recursos</li>
            <li>Entre em contato com a equipe se houver impedimentos</li>
          </ul>
          
          <p style="margin-top: 30px;">Atenciosamente,<br><strong>Sistema AlmoxHub</strong></p>
        </div>
        ${getFooterPadrao()}
      </div>
    </body>
    </html>
  `;
}

/**
 * Template para alerta de OS parada/inativa
 */
export function gerarTemplateAlertaInatividade(lider, os, diasParada) {
  const styles = ALERT_STYLES.inatividade;
  const nomeSeguro = sanitizeHTML(lider.nome);
  const codigoSeguro = sanitizeHTML(os.codigo);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${getEstilosPadrao()}
        .header { background: linear-gradient(135deg, ${styles.corPrimaria} 0%, ${styles.corSecundaria} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { border: 2px solid ${styles.corPrimaria}; }
        .warning-box { background: ${styles.corFundo}; border-left: 4px solid ${styles.corBorda}; padding: 15px; margin: 20px 0; }
        .label { font-weight: bold; color: ${styles.corPrimaria}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${styles.emoji} ${styles.titulo}</h1>
          <p style="font-size: 18px; margin: 10px 0 0 0;">${styles.subtitulo}</p>
        </div>
        <div class="content">
          <p>Olá <strong>${nomeSeguro}</strong>,</p>
          
          <div class="warning-box">
            <p>A OS <strong>${codigoSeguro}</strong> não possui atualizações há <strong>${diasParada} dias</strong>.</p>
          </div>
          
          <div class="info">
            <p><span class="label">Código:</span> ${codigoSeguro}</p>
            <p><span class="label">Última Atualização:</span> ${new Date(os.updated_date).toLocaleDateString('pt-BR')}</p>
            <p><span class="label">Status:</span> ${os.status === 'elaboracao' ? 'Em Elaboração' : 'Em Execução'}</p>
          </div>
          
          <p>Por favor, verifique se há algum impedimento ou se é necessário atualizar o status desta OS.</p>
          
          <p style="margin-top: 30px;">Atenciosamente,<br><strong>Sistema AlmoxHub</strong></p>
        </div>
        ${getFooterPadrao()}
      </div>
    </body>
    </html>
  `;
}

/**
 * Template para alerta de expedição sem seguro
 */
export function gerarTemplateAlertaSeguro(lider, os) {
  const styles = ALERT_STYLES.seguro;
  const nomeSeguro = sanitizeHTML(lider.nome);
  const codigoSeguro = sanitizeHTML(os.codigo);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${getEstilosPadrao()}
        .header { background: linear-gradient(135deg, ${styles.corPrimaria} 0%, ${styles.corSecundaria} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { border: 2px solid ${styles.corPrimaria}; }
        .info-box { background: ${styles.corFundo}; border-left: 4px solid ${styles.corBorda}; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${styles.emoji} ${styles.titulo}</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${nomeSeguro}</strong>,</p>
          
          <div class="info-box">
            <p>A expedição <strong>${codigoSeguro}</strong> possui transporte <strong>sem cobertura de seguro ativada</strong>.</p>
          </div>
          
          <p>Recomendamos avaliar a necessidade de ativar o seguro para proteger os materiais durante o transporte.</p>
          
          <p style="margin-top: 30px;">Atenciosamente,<br><strong>Sistema AlmoxHub</strong></p>
        </div>
        ${getFooterPadrao()}
      </div>
    </body>
    </html>
  `;
}

/**
 * Template para alerta de expedição sem transporte
 */
export function gerarTemplateAlertaTransporte(lider, os) {
  const styles = ALERT_STYLES.transporte;
  const nomeSeguro = sanitizeHTML(lider.nome);
  const codigoSeguro = sanitizeHTML(os.codigo);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        ${getEstilosPadrao()}
        .header { background: linear-gradient(135deg, ${styles.corPrimaria} 0%, ${styles.corSecundaria} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { border: 2px solid ${styles.corPrimaria}; }
        .info-box { background: ${styles.corFundo}; border-left: 4px solid ${styles.corBorda}; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${styles.emoji} ${styles.titulo}</h1>
        </div>
        <div class="content">
          <p>Olá <strong>${nomeSeguro}</strong>,</p>
          
          <div class="info-box">
            <p>A expedição <strong>${codigoSeguro}</strong> ainda <strong>não possui informações de transporte</strong> cadastradas.</p>
          </div>
          
          <p>Por favor, complete o detalhamento da expedição com as informações de transporte, transportadora, veículo e motorista.</p>
          
          <p style="margin-top: 30px;">Atenciosamente,<br><strong>Sistema AlmoxHub</strong></p>
        </div>
        ${getFooterPadrao()}
      </div>
    </body>
    </html>
  `;
}