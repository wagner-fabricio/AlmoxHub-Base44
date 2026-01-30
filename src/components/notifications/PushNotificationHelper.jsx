import { base44 } from '@/api/base44Client';

export const sendPushToUser = async (pessoa_id, notification_type, title, body, data = {}) => {
  try {
    await base44.functions.invoke('sendPushNotification', {
      pessoa_id,
      notification_type,
      title,
      body,
      data
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Não bloquear a operação principal se push falhar
  }
};

export const notifyOSAssignment = async (os, executor_id) => {
  await sendPushToUser(
    executor_id,
    'os_assignment',
    '📋 Nova OS Atribuída',
    `Você foi atribuído à OS ${os.codigo}`,
    {
      os_id: os.id,
      os_codigo: os.codigo,
      url: `/OrdensServico?os_id=${os.id}`
    }
  );
};

export const notifyStatusChange = async (os, pessoa_id, oldStatus, newStatus) => {
  const statusLabels = {
    elaboracao: 'Em Elaboração',
    execucao: 'Em Execução',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  };

  await sendPushToUser(
    pessoa_id,
    'os_status_change',
    '🔄 Status Alterado',
    `OS ${os.codigo}: ${statusLabels[oldStatus]} → ${statusLabels[newStatus]}`,
    {
      os_id: os.id,
      os_codigo: os.codigo,
      status_old: oldStatus,
      status_new: newStatus,
      url: `/OrdensServico?os_id=${os.id}`
    }
  );
};

export const notifyCommentMention = async (os, mentioned_pessoa_id, author_name) => {
  await sendPushToUser(
    mentioned_pessoa_id,
    'comment_mention',
    '💬 Você foi mencionado',
    `${author_name} mencionou você em um comentário da OS ${os.codigo}`,
    {
      os_id: os.id,
      os_codigo: os.codigo,
      url: `/OrdensServico?os_id=${os.id}`
    }
  );
};

export const notifyMessageMention = async (conversa, mentioned_pessoa_id, author_name, conversa_nome) => {
  await sendPushToUser(
    mentioned_pessoa_id,
    'message_mention',
    '💬 Menção em Mensagem',
    `${author_name} mencionou você em "${conversa_nome}"`,
    {
      conversa_id: conversa.id,
      url: `/Mensagens`
    }
  );
};