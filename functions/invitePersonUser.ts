import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verificar se é admin ou gestor
        const pessoa = await base44.entities.Pessoa.filter({ user_id: user.id }).then(p => p[0]);
        if (user.role !== 'admin' && !pessoa?.funcoes?.includes('gestor')) {
            return Response.json({ error: 'Apenas administradores ou gestores podem enviar convites' }, { status: 403 });
        }

        const { pessoa_id } = await req.json();

        if (!pessoa_id) {
            return Response.json({ error: 'pessoa_id é obrigatório' }, { status: 400 });
        }

        // Buscar a pessoa
        const pessoaToInvite = await base44.entities.Pessoa.filter({ id: pessoa_id }).then(p => p[0]);

        if (!pessoaToInvite) {
            return Response.json({ error: 'Pessoa não encontrada' }, { status: 404 });
        }

        // Verificar se já tem user_id
        if (pessoaToInvite.user_id) {
            return Response.json({ 
                error: 'Esta pessoa já possui uma conta de usuário vinculada',
                user_id: pessoaToInvite.user_id 
            }, { status: 400 });
        }

        // Verificar se o email já está em uso por outro usuário
        const existingUser = await base44.asServiceRole.entities.User.filter({ 
            email: pessoaToInvite.email 
        }).then(users => users[0]);

        if (existingUser) {
            // Email já em uso - vincular o user_id existente
            await base44.entities.Pessoa.update(pessoa_id, {
                user_id: existingUser.id
            });

            return Response.json({ 
                success: true,
                message: 'Usuário já existia no sistema. Conta vinculada com sucesso!',
                user_id: existingUser.id,
                already_existed: true
            });
        }

        // Criar convite para novo usuário
        try {
            // Usar base44.asServiceRole para ter permissão de convidar
            await base44.asServiceRole.users.inviteUser(pessoaToInvite.email, 'user');

            // Buscar o user_id do usuário recém-convidado
            // Aguardar um pouco para garantir que o usuário foi criado
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newUser = await base44.asServiceRole.entities.User.filter({ 
                email: pessoaToInvite.email 
            }).then(users => users[0]);

            if (newUser) {
                // Atualizar o registro da pessoa com o user_id
                await base44.entities.Pessoa.update(pessoa_id, {
                    user_id: newUser.id
                });

                return Response.json({ 
                    success: true,
                    message: 'Convite enviado com sucesso! A pessoa receberá um e-mail para definir a senha.',
                    user_id: newUser.id
                });
            } else {
                return Response.json({ 
                    success: true,
                    message: 'Convite enviado! O vínculo será atualizado automaticamente quando o usuário acessar o sistema.',
                    user_id: null
                });
            }
        } catch (inviteError) {
            console.error('Erro ao enviar convite:', inviteError);
            return Response.json({ 
                error: 'Erro ao enviar convite. Verifique se o e-mail é válido.',
                details: inviteError.message 
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Erro na função invitePersonUser:', error);
        return Response.json({ 
            error: 'Erro ao processar solicitação',
            details: error.message 
        }, { status: 500 });
    }
});