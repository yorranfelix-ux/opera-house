'use client'

import { useState } from 'react'
import Sidebar from '../components/Sidebar'

interface Secao {
  id: string
  icone: string
  titulo: string
  descricao: string
  passos: { titulo: string; texto: string }[]
  dicas?: string[]
}

const SECOES: Secao[] = [
  {
    id: 'dashboard',
    icone: '⊞',
    titulo: 'Dashboard',
    descricao: 'Visão geral do negócio em tempo real — alertas, métricas e calendário de compromissos.',
    passos: [
      { titulo: 'Cards de métricas', texto: 'No topo aparecem os totais: pedidos ativos, ATs abertas, ocorrências pendentes e entregas do mês. Clique em qualquer card para ir direto ao módulo correspondente.' },
      { titulo: 'Painel de alertas', texto: 'Lista automática de situações que precisam de atenção: pedidos com prazo vencido, ATs sem movimentação há mais de 7 dias, ocorrências abertas há mais de 3 dias, itens aguardando tecido fornecido, itens sem previsão de chegada cadastrada, e itens que requerem higienização ou impermeabilização ainda não marcados como aptos para entrega.' },
      { titulo: 'Calendário de compromissos', texto: 'Mostra as entregas agendadas e retiradas de AT nos próximos 21 dias. Dias com compromisso ficam destacados — clique no dia para ver o detalhe de cada compromisso.' },
      { titulo: 'Lembretes', texto: 'Bloco de anotações rápidas no lado direito da tela. Digite o lembrete e pressione Enter ou clique em "+". Os lembretes ficam salvos permanentemente no navegador (não somem à meia-noite) e só são removidos quando você clica no "✕" de cada um.' },
    ],
    dicas: [
      'Atualize a página para carregar os dados mais recentes — o dashboard não atualiza automaticamente.',
      'Alertas em vermelho indicam situação crítica (prazo vencido, longa inatividade). Clique no item do alerta para ir direto ao pedido ou AT.',
    ],
  },
  {
    id: 'pedidos',
    icone: '📋',
    titulo: 'Pedidos',
    descricao: 'Cadastro e acompanhamento de todos os pedidos de venda.',
    passos: [
      { titulo: 'Criar um pedido', texto: 'Clique em "+ Novo pedido". Preencha o número do pedido (geralmente o código do orçamento), selecione o cliente, o profissional responsável (arquiteto/designer), a data da venda e o prazo prometido ao cliente. O status inicial é "Criado" automaticamente.' },
      { titulo: 'Buscar pedidos', texto: 'Use a barra de busca para localizar por número do pedido ou nome do cliente.' },
      { titulo: 'Filtrar por situação', texto: 'Use os botões "Em aberto / Entregues / Todos" para filtrar pelo status geral. "Em aberto" mostra todos os pedidos em andamento; "Entregues" mostra os concluídos e cancelados.' },
      { titulo: 'Filtrar por profissional', texto: 'Use o select de profissional na barra de filtros para ver apenas os pedidos vinculados a um arquiteto ou designer específico. Esse filtro combina com os demais.' },
      { titulo: 'Abrir detalhes', texto: 'Clique no número do pedido (em dourado) ou no nome do cliente para abrir a página de detalhes, onde você gerencia itens, semáforo, pagamento e imprime o resumo.' },
      { titulo: 'Data de entrega', texto: 'Pedidos entregues exibem a data de entrega logo abaixo do badge de status na listagem. Essa data é preenchida automaticamente quando o pedido é marcado como "Entregue" — seja pela conclusão de uma entrega no módulo Entregas, seja por alteração manual do status.' },
      { titulo: 'Editar um pedido', texto: 'Clique em "Editar" na linha do pedido para alterar dados como status, prazo prometido, profissional vinculado e observações gerais.' },
      { titulo: 'Exportar CSV', texto: 'Clique em "↓ Exportar CSV" para baixar a lista de pedidos em formato compatível com Excel.' },
    ],
    dicas: [
      'Todos os filtros (busca, status, profissional) são salvos automaticamente — ao voltar para a página eles estarão como você deixou.',
      'Pedidos entregues ou cancelados somem do filtro "Em aberto". Use "Todos" para encontrá-los.',
      'Pedidos entregues que ainda possuem AT ativa exibem a tag vermelha "AT ativa" diretamente na lista — facilitando identificar clientes que precisam de atenção pós-entrega.',
    ],
  },
  {
    id: 'pedido-detalhe',
    icone: '📄',
    titulo: 'Detalhes do Pedido',
    descricao: 'Dentro de cada pedido você gerencia itens, semáforo, pagamento, ATs e imprime o resumo.',
    passos: [
      { titulo: 'Adicionar itens', texto: 'Na seção "Itens" clique em "+ Adicionar item". Informe a descrição, quantidade, status do item, fornecedor responsável e previsão de chegada. Marque as flags necessárias: "Requer içamento na entrega", "Requer envio de tecido fornecido", "Requer retirada na loja" e os tratamentos especiais "Higienização" e/ou "Impermeabilização". Cada flag gera uma tag visual no item e alertas no Dashboard enquanto não forem concluídas.' },
      { titulo: 'Retirada na loja', texto: 'Ao marcar "Requer retirada na loja" em um item, uma tag amarela "Retirada loja" aparece no item para sinalizar que o produto precisa ser buscado na loja antes da entrega ao cliente. Use para produtos do Outlet, peças entregues na loja, ou qualquer situação em que a equipe precise buscar o item antes da entrega.' },
      { titulo: 'Tratamentos especiais', texto: 'Marque "Requer higienização" ou "Requer impermeabilização" nos itens que precisam de procedimento antes da entrega. Tags azuis aparecem no item para lembrete visual da equipe. O Dashboard exibe um alerta enquanto o item não for marcado como "Apto entrega", sinalizando que o tratamento ainda está pendente.' },
      { titulo: 'Data de recebimento na lista de itens', texto: 'Na tabela de itens do pedido, a coluna "Recebido" exibe a data em que o item chegou ao estoque. Esse campo é preenchido ao editar o item — informe a data de recebimento no formulário de edição. Quando ainda não preenchido aparece "—".' },
      { titulo: 'Status dos itens', texto: 'Cada item tem seu próprio status independente: Criado → Aguard. compra → Em produção → Em transporte → Recebido → Conferido OK → Apto entrega → Entregue. Atualize conforme a produção avança.' },
      { titulo: 'Status automático: Apto p/ agendamento', texto: 'Quando todos os itens do pedido são marcados como "Apto entrega", o status do pedido muda automaticamente para "Apto p/ agendamento". Isso sinaliza que o pedido pode ser incluído na programação de entregas sem intervenção manual.' },
      { titulo: 'NF / Romaneio de entrega', texto: 'No cabeçalho do pedido há um campo para registrar o documento fiscal. Escolha o tipo (NF para Nota Fiscal ou Romaneio para entregas sem NF) e informe o número. Esse número aparece no resumo impresso do pedido.' },
      { titulo: 'Ícones de alerta nos itens', texto: 'O ícone ⚠️ em um item indica que há uma ocorrência aberta vinculada a ele. O ícone 🔧 indica que o item tem uma AT ativa. Ambos são links — clique para navegar diretamente.' },
      { titulo: 'Semáforo de prioridade', texto: 'O semáforo fica no topo da página. Clique em uma cor para alterar: 🟢 Verde = andamento normal · 🟡 Amarelo = atenção necessária · 🔴 Vermelho = urgente · 🔵 Azul = aguardando retorno do cliente · 🟣 Roxo = situação especial.' },
      { titulo: 'Pagamento', texto: 'No bloco de pagamento selecione o status: Pendente, Pendente Boleto (boleto emitido mas ainda não compensado), Parcial ou Pago. Use o campo de observações para registrar detalhes como número de parcelas, data de vencimento ou código de cheque. O bloco é colapsável — clique no cabeçalho para expandir ou recolher.' },
      { titulo: 'Histórico de alterações', texto: 'Toda mudança no pedido e nos itens é registrada automaticamente: status alterado, item adicionado, semáforo modificado. O histórico fica na parte inferior da página e é colapsável — clique no cabeçalho para expandir. Mostra todos os registros sem limite de quantidade.' },
      { titulo: 'Imprimir resumo', texto: 'Clique em "🖨️ Imprimir" para gerar o documento completo do pedido — inclui dados do cliente, todos os itens, prazo prometido, semáforo, status de pagamento e observações.' },
    ],
    dicas: [
      'O contador de ATs ativas aparece no topo da página. Clique nele para ver as ATs do pedido.',
      'Itens com flags de tratamento especial (higienização, impermeabilização, tecido fornecido, retirada na loja) exibem tags coloridas para lembrete visual. Os de higienização e impermeabilização geram alertas no Dashboard enquanto o item não estiver como "Apto entrega".',
      'Quando não há NF (entrega com romaneio), selecione "Romaneio" no campo de documento e informe o número do romaneio.',
    ],
  },
  {
    id: 'clientes',
    icone: '👤',
    titulo: 'Clientes',
    descricao: 'Cadastro completo de clientes com endereço e contato.',
    passos: [
      { titulo: 'Cadastrar cliente', texto: 'Clique em "+ Novo cliente". Preencha nome completo, telefone, e-mail e o endereço completo: rua, número, bairro, cidade, estado e CEP. O endereço é usado automaticamente para montar a rota no Google Maps no módulo de Entregas.' },
      { titulo: 'Buscar cliente', texto: 'Use a barra de busca para localizar por nome ou cidade.' },
      { titulo: 'Editar cliente', texto: 'Clique em "Editar" para atualizar qualquer dado do cadastro, incluindo endereço e contato.' },
    ],
    dicas: [
      'Cadastre o endereço completo desde o início — sem ele a função "Abrir rota no Maps" não consegue incluir o cliente na rota.',
      'A busca global (Ctrl+K) também localiza clientes pelo nome.',
    ],
  },
  {
    id: 'fornecedores',
    icone: '🏭',
    titulo: 'Fornecedores',
    descricao: 'Cadastro de fornecedores vinculados a itens de pedido e assistências técnicas.',
    passos: [
      { titulo: 'Cadastrar fornecedor', texto: 'Clique em "+ Novo fornecedor". Informe razão social, nome fantasia, CNPJ, telefone de contato e observações. Fornecedores cadastrados ficam disponíveis para seleção nos itens de pedido e nas ATs.' },
      { titulo: 'Buscar fornecedor', texto: 'Use a busca por nome fantasia ou razão social.' },
      { titulo: 'Editar fornecedor', texto: 'Clique em "Editar" para atualizar dados de contato ou observações.' },
    ],
    dicas: [
      'Vincule o fornecedor ao item do pedido para rastrear de onde vem cada peça do projeto.',
      'Nas ATs de devolução ao fornecedor, o fornecedor vinculado ao item é pré-selecionado automaticamente.',
    ],
  },
  {
    id: 'profissionais',
    icone: '🛠️',
    titulo: 'Profissionais',
    descricao: 'Cadastro de arquitetos, designers e outros profissionais parceiros.',
    passos: [
      { titulo: 'Cadastrar profissional', texto: 'Clique em "+ Novo profissional". Informe nome, tipo (Arquiteto, Designer de Interiores, Decorador…), dados de contato e a data de nascimento. O profissional fica disponível para seleção na criação de pedidos.' },
      { titulo: 'Ativar / Desativar', texto: 'Profissionais inativos não aparecem nas opções de seleção de novos pedidos, mas os pedidos já vinculados a eles não são afetados.' },
      { titulo: 'Filtrar pedidos por profissional', texto: 'Na listagem de Pedidos, use o select "Todos os profissionais" para filtrar e ver apenas os pedidos de um parceiro específico — útil para calcular comissões ou preparar relatórios por parceiro.' },
      { titulo: 'Lembrete de aniversário', texto: 'Ao acessar a aba de Profissionais, se houver algum profissional fazendo aniversário no dia, um banner amarelo é exibido no topo da lista com os nomes dos aniversariantes — por exemplo: "🎂 Aniversariante de hoje: João Silva". Use para enviar uma lembrança ou mensagem ao colaborador.' },
    ],
    dicas: [
      'Desative profissionais que não trabalham mais com a empresa em vez de excluí-los — assim o histórico dos pedidos antigos fica preservado.',
      'Cadastre a data de nascimento dos profissionais para receber o lembrete automático de aniversário ao acessar a aba.',
    ],
  },
  {
    id: 'assistencia',
    icone: '🔧',
    titulo: 'Assistência Técnica (AT)',
    descricao: 'Controle completo de assistências técnicas abertas para clientes.',
    passos: [
      { titulo: 'Abrir uma AT', texto: 'Clique em "+ Nova AT". No campo de pedido, use a caixa de busca para localizar rapidamente pelo número do pedido ou nome do cliente — o select filtra em tempo real conforme você digita. Selecione o pedido, depois o item com problema. Escolha o tipo: Retirada do cliente, Visita técnica no cliente, ou Devolução ao fornecedor. Descreva o problema relatado. Se precisar retirar o produto, marque "Requer retirada" e informe o endereço e a data agendada.' },
      { titulo: 'Fluxo de status', texto: 'O status avança conforme o processo: Aberta → Aguard. retirada → Em reparo → Enviado ao fornecedor → Aguard. devolução → Resolvida. Dentro da AT, altere o status e registre as observações de cada etapa.' },
      { titulo: 'Filtros da lista', texto: 'Por padrão a lista mostra apenas ATs ativas (aberta, aguard. retirada, em reparo, enviado fornecedor, aguard. devolução). Use o filtro para ver "Finalizadas" (resolvidas e canceladas) ou "Todas". Use a busca para localizar pelo número da AT, número do pedido ou nome do cliente.' },
      { titulo: 'Registrar informações da AT', texto: 'Dentro da AT registre: observações gerais do processo, laudo/observações do fornecedor, número da NF de envio ao fornecedor, transportadora usada e datas de cada etapa (retirada, envio, previsão de retorno, retorno efetivo, previsão de entrega).' },
      { titulo: 'Garantia', texto: 'Marque "Dentro da garantia" para sinalizar que o produto está coberto. Quando marcado, aparece um campo para registrar a data de vencimento da garantia. Essa informação é exibida no documento impresso da AT.' },
      { titulo: 'Observações cumulativas', texto: 'As observações gerais da AT são acumulativas: ao executar uma ação (iniciar processo, registrar retorno, resolver, cancelar) e informar uma observação, ela é adicionada ao campo "Observações gerais" sem apagar o que já estava registrado.' },
      { titulo: 'Imprimir AT', texto: 'Clique em "🖨️ Imprimir AT" para gerar o documento formal da assistência — inclui todos os dados, datas, descrição do problema, observações, situação de garantia e campos de assinatura do responsável técnico e do cliente.' },
      { titulo: 'Resolver ou cancelar', texto: 'Quando o problema for solucionado, clique em "Resolver AT" e informe uma observação de conclusão. Para cancelar sem resolução use "Cancelar AT". Ambas as ações removem a AT da lista de ativas.' },
    ],
    dicas: [
      'ATs abertas a partir de uma Ocorrência fecham a ocorrência de origem automaticamente.',
      'ATs sem movimentação há mais de 7 dias aparecem como alerta no Dashboard.',
      'O número da AT é gerado automaticamente no formato: AT [Pedido]-[Ano]-[Sequência].',
      'A busca global (Ctrl+K) localiza ATs tanto pelo número quanto pela descrição do problema.',
    ],
  },
  {
    id: 'ocorrencias',
    icone: '⚠️',
    titulo: 'Ocorrências',
    descricao: 'Registro inicial de problemas relatados por clientes — etapa anterior à AT formal.',
    passos: [
      { titulo: 'Registrar ocorrência', texto: 'Clique em "+ Nova ocorrência". No campo de pedido, use a caixa de busca para localizar pelo número ou nome do cliente. Selecione o pedido, o item com problema (opcional) e descreva o que o cliente relatou. A ocorrência fica com status "Aberta" até ser tratada pela equipe.' },
      { titulo: 'Converter em AT', texto: 'Se a ocorrência exigir reparo formal, clique em "Abrir AT" dentro da ocorrência. O sistema cria a AT com o pedido e a descrição já preenchidos e fecha a ocorrência automaticamente com a observação de que foi convertida.' },
      { titulo: 'Resolver diretamente', texto: 'Se o problema for resolvido sem virar AT (cliente desistiu, era dúvida de uso, problema simples) clique em "Resolver" e adicione uma observação de encerramento.' },
      { titulo: 'Cancelar', texto: 'Use "Cancelar" quando a ocorrência foi registrada por engano ou duplicada.' },
    ],
    dicas: [
      'Ocorrências abertas há mais de 3 dias aparecem automaticamente como alerta no Dashboard.',
      'Itens com ocorrência aberta mostram o ícone ⚠️ na página de detalhes do pedido.',
    ],
  },
  {
    id: 'entregas',
    icone: '🚚',
    titulo: 'Entregas',
    descricao: 'Programação e controle das entregas com rota no Maps e impressão para a equipe.',
    passos: [
      { titulo: 'Agendar entrega', texto: 'Clique em "+ Agendar entrega". No campo de pedido, use a caixa de busca para localizar pelo número ou nome do cliente. Selecione o pedido e a data. Se a entrega requer içamento (apartamentos sem acesso de escada, peças muito pesadas), marque "Requer içamento" e descreva as condições no campo "Observações de içamento" — ex: "Apartamento 12º andar, içamento pela varanda".' },
      { titulo: 'Observações visíveis na lista', texto: 'As observações de içamento aparecem em destaque laranja diretamente no cartão da entrega, sem precisar abrir o modal. Observações gerais aparecem logo abaixo com o ícone 📝.' },
      { titulo: 'Imprimir sequência', texto: 'Clique em "🖨️ Sequência" para imprimir a folha de rota em formato paisagem — inclui motorista, veículo, placa, rodízio, data e a ordem das entregas com espaço para horários de chegada e saída em cada endereço.' },
      { titulo: 'Imprimir observações', texto: 'Clique em "📋 Observações" para imprimir a folha de observações da equipe — lista cada entrega com endereço completo, içamento destacado em laranja e todas as observações especiais. Ideal para a equipe em campo.' },
      { titulo: 'Abrir rota no Maps', texto: 'Clique em "📍 Abrir rota no Maps" para abrir o Google Maps com a rota otimizada do dia, partindo do endereço de saída configurado em Configurações.' },
      { titulo: 'Responsável / montador', texto: 'No formulário de agendamento há um campo "Responsável / montador" para registrar o nome de quem realizará a entrega ou montagem. Esse nome aparece no cartão da entrega (ícone 👷) e é listado automaticamente na linha EQUIPE da folha de sequência do motorista.' },
      { titulo: 'Marcar como realizada', texto: 'Após a entrega, abra o registro e marque como "Realizada" informando a data de entrega efetiva. Quando não há outras entregas pendentes do mesmo pedido, o pedido é marcado automaticamente como "Entregue" e a data de entrega é registrada automaticamente.' },
      { titulo: 'Reagendar', texto: 'Se a entrega não for realizada, marque como "Reagendada" informando o motivo. O motivo aparece no cartão da lista para referência.' },
    ],
    dicas: [
      'Configure o endereço de saída em Configurações para que a rota no Maps parta do local correto.',
      'Use "📋 Observações" para entregar à equipe que vai para a rua — ela tem tudo que precisa: endereço, telefone do cliente, içamento e instruções especiais.',
      'O filtro "Pendentes" mostra apenas entregas agendadas e reagendadas — use para ver o que ainda precisa ser feito.',
      'Pedidos com múltiplas entregas só são marcados como "Entregue" quando a última entrega pendente for realizada.',
    ],
  },
  {
    id: 'relatorios',
    icone: '📊',
    titulo: 'Relatórios',
    descricao: 'Análises do negócio organizadas em 8 abas — com exportação para CSV em todas.',
    passos: [
      { titulo: 'Filtro de período', texto: 'No topo da página há botões para filtrar o período de análise: Últimos 6 meses, Últimos 12 meses, Este ano, Ano anterior ou Todo o período. Ao trocar o período os dados são recalculados instantaneamente — sem nova consulta ao banco. Os cards mostram o total do período selecionado e o total geral do sistema abaixo.' },
      { titulo: 'Cards de totais', texto: 'Exibem os totais do período selecionado: pedidos, entregas, ATs e ocorrências. Abaixo de cada número aparece o total geral do sistema para comparação.' },
      { titulo: 'Pedidos', texto: 'Duas tabelas: (1) Pedidos por mês — quantos pedidos foram criados e quantos foram entregues em cada mês do período; (2) Pedidos por status — distribuição percentual de todos os pedidos do período.' },
      { titulo: 'Entregas', texto: 'Tabela do período selecionado com o número de entregas agendadas, realizadas e a taxa de conclusão de cada mês.' },
      { titulo: 'Prazos', texto: 'Três métricas sobre pedidos entregues no período: (1) Tempo médio de entrega em dias — da data da venda até a data de entrega; (2) Pedidos entregues dentro do prazo prometido; (3) Pedidos entregues fora do prazo.' },
      { titulo: 'Profissionais', texto: 'Ranking de arquitetos e designers por volume de pedidos no período — mostra o total de pedidos e quantos foram entregues para cada profissional.' },
      { titulo: 'ATs', texto: 'Distribuição das Assistências Técnicas abertas no período por status, com total e percentual.' },
      { titulo: 'ATs p/ Fornecedor', texto: 'Ranking dos fornecedores que geraram mais assistências técnicas no período — identifica quais têm mais problemas de qualidade.' },
      { titulo: 'Pedidos p/ Fornecedor', texto: 'Lista apenas os fornecedores que possuem itens pendentes em pedidos ativos no momento — quem não tem pendência não aparece. Clique em um fornecedor para expandir e ver todos os pedidos vinculados, com número do pedido, nome do cliente, descrição do item e previsão de chegada. Ideal para usar durante ligações de cobrança de prazo: você vê todos os pedidos em aberto daquele fornecedor de uma vez e menciona cada número. Há também o botão "Exportar CSV deste fornecedor" para enviar a lista por e-mail. Esta aba sempre reflete o estado atual dos itens, independente do período selecionado.' },
      { titulo: 'Ocorrências', texto: 'Distribuição das ocorrências abertas no período por tipo, com o total e quantas ainda estão em aberto para cada categoria.' },
      { titulo: 'Tratamentos', texto: 'Quantos itens requerem cada tratamento especial (Içamento, Tecido a enviar, Retirada na loja, Higienização, Impermeabilização) e quantos já estão marcados como "Apto entrega". Esta aba sempre reflete o estado atual de todos os itens, independente do período selecionado.' },
      { titulo: 'Exportar CSV', texto: 'Cada aba tem um botão "Exportar CSV" que baixa os dados filtrados em formato compatível com Excel.' },
      { titulo: 'Exportar PDF', texto: 'O botão "🖨️ Exportar PDF" no topo exporta a aba atual como PDF. Ao clicar, abre uma janela de impressão formatada com os dados do período selecionado — escolha "Salvar como PDF" na impressora para salvar o arquivo.' },
    ],
    dicas: [
      'Clique em "Atualizar" no topo para recarregar os dados mais recentes sem precisar recarregar a página.',
      'A análise de Prazos só considera pedidos com status "Entregue" que possuem data de venda registrada.',
      'Use "Este ano" e "Ano anterior" para comparar o desempenho entre os dois anos.',
      'A aba Tratamentos não respeita o filtro de período — sempre mostra o estado atual dos itens cadastrados.',
    ],
  },
  {
    id: 'historico',
    icone: '🕐',
    titulo: 'Histórico',
    descricao: 'Log completo e automático de todas as alterações feitas no sistema.',
    passos: [
      { titulo: 'O que é registrado', texto: 'Tudo é registrado automaticamente: pedidos criados e editados, itens adicionados, status alterados, semáforo modificado, ATs abertas e resolvidas, ocorrências registradas, entregas agendadas e muito mais.' },
      { titulo: 'Buscar no histórico', texto: 'Use a barra de busca para localizar por número de pedido, nome do cliente ou qualquer palavra da descrição da ação.' },
      { titulo: 'Filtrar por tipo de evento', texto: 'Use o select de tipo para ver apenas uma categoria: pedido criado, item editado, AT atualizada, entrega agendada, etc.' },
      { titulo: 'Filtrar por pedido', texto: 'Selecione um pedido específico no select para ver apenas as alterações relacionadas a ele — útil para auditar o histórico completo de um projeto.' },
    ],
    dicas: [
      'O histórico é somente leitura e não pode ser editado — serve como trilha de auditoria de todas as ações.',
      'Use o filtro por pedido para apresentar ao cliente o histórico completo do projeto dele.',
    ],
  },
  {
    id: 'usuarios',
    icone: '👥',
    titulo: 'Usuários',
    descricao: 'Gerenciamento completo dos usuários com acesso ao sistema — sem precisar acessar o Supabase.',
    passos: [
      { titulo: 'Criar novo usuário', texto: 'Clique em "+ Novo usuário". Preencha nome completo, cargo, e-mail e defina uma senha inicial (mínimo 6 caracteres). O usuário é criado imediatamente e já pode fazer login com as credenciais informadas.' },
      { titulo: 'Editar nome e cargo', texto: 'Clique em "Editar" na linha do usuário para atualizar o nome e o cargo. O nome e cargo aparecem no rodapé do menu lateral de cada usuário.' },
      { titulo: 'Redefinir senha', texto: 'Clique em "Redefinir senha" para definir uma nova senha para qualquer usuário — útil quando alguém esquece a senha. Informe e confirme a nova senha (mínimo 6 caracteres).' },
      { titulo: 'Excluir usuário', texto: 'Clique em "Excluir" (botão vermelho) para remover permanentemente um usuário do sistema. O histórico de alterações feitas por ele é preservado com o nome registrado — apenas o acesso ao sistema é revogado. Essa ação não pode ser desfeita.' },
    ],
    dicas: [
      'Todo o gerenciamento de usuários é feito direto pelo sistema — não é necessário acessar o painel do Supabase.',
      'Defina um cargo descritivo para cada usuário (ex: "Operacional e Logística", "Direção") — ele aparece no menu lateral e ajuda a identificar quem está logado.',
      'Ao excluir um usuário, o histórico de ações dele no sistema permanece intacto para fins de auditoria.',
    ],
  },
  {
    id: 'configuracoes',
    icone: '⚙️',
    titulo: 'Configurações',
    descricao: 'Personalizações do sistema para a operação da empresa.',
    passos: [
      { titulo: 'Endereço de saída', texto: 'Configure o endereço de onde a equipe parte para as entregas (endereço da loja, depósito ou galpão). Esse endereço é o ponto de partida da rota gerada no Google Maps pelo módulo de Entregas.' },
      { titulo: 'Monitor de banco de dados', texto: 'Exibe o uso atual do banco de dados Supabase em relação ao limite de 500 MB do plano gratuito. A barra de progresso fica verde até 70%, amarela entre 70% e 90%, e vermelha acima de 90%. Um aviso automático aparece quando o uso está elevado.' },
      { titulo: 'Backup de dados', texto: 'Clique em "⬇ Exportar backup" para baixar um arquivo JSON com todos os dados do sistema: pedidos, itens, clientes, fornecedores, profissionais, ATs, ocorrências e entregas. Clique em "📂 Visualizar backup" para abrir o arquivo baixado diretamente no sistema — você pode navegar entre as tabelas e buscar qualquer registro em tempo real sem precisar do Excel.' },
      { titulo: 'Limpeza de dados', texto: 'Permite excluir permanentemente pedidos entregues ou cancelados de um ano específico para liberar espaço no banco. Selecione o ano e clique em "Ver o que será excluído" — o sistema mostra um resumo com a quantidade exata de pedidos, itens, ATs, ocorrências, entregas e histórico que serão removidos. Para confirmar, é obrigatório digitar a palavra CONFIRMAR no campo antes de o botão de exclusão ficar disponível. Recomendado: exporte o backup antes de executar a limpeza.' },
      { titulo: 'Perfil do usuário logado', texto: 'Atualize seu próprio nome e cargo que aparecem no rodapé do menu lateral. Cada usuário pode editar seu próprio perfil.' },
    ],
    dicas: [
      'O endereço de saída é compartilhado entre todos os usuários — configure uma vez e vale para toda a equipe.',
      'Acompanhe o uso do banco de dados em Configurações para saber quando o limite está se aproximando.',
      'Realize o backup antes de executar a limpeza — assim os dados ficam salvos mesmo após a exclusão.',
      'A limpeza remove apenas pedidos com status entregue ou cancelado — pedidos em andamento nunca são afetados.',
    ],
  },
]

export default function Ajuda() {
  const [aberta, setAberta] = useState<string | null>('dashboard')

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/ajuda" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Central de Ajuda</span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>

          {/* Intro */}
          <div style={{ background: '#1a1a2e', borderRadius: '14px', padding: '24px 28px', marginBottom: '28px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '32px', flexShrink: 0 }}>🎭</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#C9A84C', marginBottom: '6px' }}>Bem-vindo ao Opera House ERP</div>
              <div style={{ fontSize: '13px', color: '#a0a0c0', lineHeight: '1.7' }}>
                Este sistema foi desenvolvido para a <strong style={{ color: '#c8c8e0' }}>Opera House</strong> gerenciar pedidos, assistências técnicas, entregas e o relacionamento com clientes e parceiros. Cada membro da equipe acessa com seu próprio login — as ações de cada usuário ficam registradas no histórico do sistema. Use o menu abaixo para navegar pelo guia de cada módulo.
              </div>
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(201,168,76,0.12)', borderRadius: '8px', fontSize: '12px', color: '#c8b87a', lineHeight: '1.6' }}>
                🔒 <strong>Sessão expirada:</strong> se o sistema ficar sem uso por um longo período, a sessão pode expirar. Quando isso acontecer, um aviso aparecerá na tela — basta clicar em <em>"Recarregar página"</em> para voltar a usar normalmente.
              </div>
            </div>
          </div>

          {/* Atalhos rápidos */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '18px 22px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>Atalhos do sistema</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { tecla: 'Ctrl + K', acao: 'Abrir busca global — localiza pedidos, clientes, fornecedores e ATs (inclusive pela descrição do problema)' },
                { tecla: '↑ ↓', acao: 'Navegar pelos resultados da busca global' },
                { tecla: 'Enter', acao: 'Abrir o resultado selecionado na busca global / confirmar lembrete no Dashboard' },
                { tecla: 'Esc', acao: 'Fechar modal ou busca global' },
                { tecla: 'Clique no número', acao: 'Abrir detalhes do pedido ou AT' },
              ].map(a => (
                <div key={a.tecla} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ background: '#1a1a2e', color: '#C9A84C', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.tecla}</span>
                  <span style={{ fontSize: '12px', color: '#555', lineHeight: '1.5' }}>{a.acao}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fluxo básico */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '18px 22px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>Fluxo básico de um pedido</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', rowGap: '8px' }}>
              {[
                'Cadastrar cliente',
                'Criar pedido',
                'Adicionar itens',
                'Acompanhar produção',
                'Agendar entrega',
                'Marcar como entregue',
              ].map((etapa, i, arr) => (
                <div key={etapa} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                  <div style={{ background: '#f0efe9', border: '0.5px solid #e8e7e3', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', color: '#1a1a2e', fontWeight: '500', whiteSpace: 'nowrap' }}>
                    {etapa}
                  </div>
                  {i < arr.length - 1 && (
                    <span style={{ fontSize: '14px', color: '#C9A84C', padding: '0 6px' }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Acordeão de módulos */}
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>Guia por módulo</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SECOES.map(secao => {
              const open = aberta === secao.id
              return (
                <div key={secao.id} style={{ background: '#fff', borderRadius: '12px', border: `0.5px solid ${open ? '#C9A84C' : '#e8e7e3'}`, overflow: 'hidden', transition: 'border-color 200ms' }}>
                  {/* Header */}
                  <button
                    onClick={() => setAberta(open ? null : secao.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{secao.icone}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>{secao.titulo}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{secao.descricao}</div>
                    </div>
                    <svg
                      width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', flexShrink: 0 }}
                    >
                      <polyline points="2,4 7,10 12,4"/>
                    </svg>
                  </button>

                  {/* Conteúdo */}
                  {open && (
                    <div style={{ padding: '0 20px 20px', borderTop: '0.5px solid #f0efe9' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px' }}>
                        {secao.passos.map((passo, i) => (
                          <div key={i} style={{ display: 'flex', gap: '14px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1a1a2e', color: '#C9A84C', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                              {i + 1}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e', marginBottom: '3px' }}>{passo.titulo}</div>
                              <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.6' }}>{passo.texto}</div>
                            </div>
                          </div>
                        ))}

                        {secao.dicas && secao.dicas.length > 0 && (
                          <div style={{ background: '#fffbf0', border: '0.5px solid #f0d88a', borderRadius: '8px', padding: '12px 14px', marginTop: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#7a5c00', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>💡 Dicas</div>
                            {secao.dicas.map((dica, i) => (
                              <div key={i} style={{ fontSize: '12px', color: '#665000', lineHeight: '1.6', marginBottom: i < secao.dicas!.length - 1 ? '6px' : '0' }}>
                                • {dica}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Rodapé */}
          <div style={{ marginTop: '28px', padding: '16px 20px', background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>💬</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e', marginBottom: '2px' }}>Dúvidas ou sugestões?</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Entre em contato com o administrador do sistema para reportar problemas ou solicitar novas funcionalidades.</div>
            </div>
          </div>

          <div style={{ height: '32px' }} />
        </div>
      </div>
    </div>
  )
}
