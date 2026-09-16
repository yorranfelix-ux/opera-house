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
    icone: 'âŠž',
    titulo: 'Dashboard',
    descricao: 'VisÃ£o geral do negÃ³cio em tempo real â€” alertas, mÃ©tricas e calendÃ¡rio de compromissos.',
    passos: [
      { titulo: 'Cards de mÃ©tricas', texto: 'No topo aparecem os totais: pedidos ativos, ATs abertas, ocorrÃªncias pendentes e entregas do mÃªs. Clique em qualquer card para ir direto ao mÃ³dulo correspondente.' },
      { titulo: 'Painel de alertas', texto: 'Lista automÃ¡tica de situaÃ§Ãµes que precisam de atenÃ§Ã£o: pedidos com prazo vencido, ATs sem movimentaÃ§Ã£o hÃ¡ mais de 7 dias, ocorrÃªncias abertas hÃ¡ mais de 3 dias, itens aguardando tecido fornecido, itens sem previsÃ£o de chegada cadastrada, e itens que requerem higienizaÃ§Ã£o ou impermeabilizaÃ§Ã£o ainda nÃ£o marcados como aptos para entrega.' },
      { titulo: 'CalendÃ¡rio de compromissos', texto: 'Mostra as entregas agendadas e retiradas de AT nos prÃ³ximos 21 dias. Dias com compromisso ficam destacados â€” clique no dia para ver o detalhe de cada compromisso.' },
      { titulo: 'Lembretes', texto: 'Bloco de anotaÃ§Ãµes rÃ¡pidas no lado direito da tela. Digite o lembrete e pressione Enter ou clique em "+". Os lembretes ficam salvos permanentemente no navegador (nÃ£o somem Ã  meia-noite) e sÃ³ sÃ£o removidos quando vocÃª clica no "âœ•" de cada um.' },
    ],
    dicas: [
      'Atualize a pÃ¡gina para carregar os dados mais recentes â€” o dashboard nÃ£o atualiza automaticamente.',
      'Alertas em vermelho indicam situaÃ§Ã£o crÃ­tica (prazo vencido, longa inatividade). Clique no item do alerta para ir direto ao pedido ou AT.',
    ],
  },
  {
    id: 'pedidos',
    icone: 'ðŸ“‹',
    titulo: 'Pedidos',
    descricao: 'Cadastro e acompanhamento de todos os pedidos de venda.',
    passos: [
      { titulo: 'Criar um pedido', texto: 'Clique em "+ Novo pedido". O formulÃ¡rio abre com um seletor de status: escolha "Compra confirmada" para lanÃ§ar um pedido normal, ou "Pendente" para registrar um pedido que ainda aguarda alguma informaÃ§Ã£o antes de ser finalizado no sistema. Preencha o nÃºmero do pedido (geralmente o cÃ³digo do orÃ§amento), selecione o cliente, o profissional responsÃ¡vel (arquiteto/designer), a data da venda e o prazo prometido ao cliente.' },
      { titulo: 'Pedidos pendentes', texto: 'Use o status "Pendente" para registrar pedidos jÃ¡ vendidos que ainda aguardam alguma informaÃ§Ã£o para ser cadastrados por completo â€” por exemplo, aguardando liberaÃ§Ã£o de uma consultora ou aprovaÃ§Ã£o financeira. Ao escolher "Pendente", aparecem dois campos extras: "ResponsÃ¡vel" (quem estÃ¡ aguardando a resoluÃ§Ã£o) e "O que estÃ¡ pendente?" (descriÃ§Ã£o livre do que falta). Essa descriÃ§Ã£o aparece na listagem ao lado do badge roxo. Quando a pendÃªncia for resolvida, edite o pedido e mude o status para "Compra confirmada".' },
      { titulo: 'Buscar pedidos', texto: 'Use a barra de busca para localizar por nÃºmero do pedido ou nome do cliente.' },
      { titulo: 'Filtrar por situaÃ§Ã£o', texto: 'Use os botÃµes de filtro para segmentar a lista: "Em aberto" mostra todos os pedidos em andamento (incluindo pendentes); "Pendente" mostra apenas os pedidos aguardando informaÃ§Ãµes; "Prontos" mostra apenas os pedidos com status Apto p/ agendamento (todos os itens prontos); "Atrasados" mostra pedidos cujo prazo prometido jÃ¡ venceu e ainda nÃ£o foram entregues; "Entregues" mostra os concluÃ­dos; "Cancelados" mostra apenas os cancelados com o motivo.' },
      { titulo: 'Filtrar por profissional', texto: 'Use o select de profissional na barra de filtros para ver apenas os pedidos vinculados a um arquiteto ou designer especÃ­fico. Esse filtro combina com os demais.' },
      { titulo: 'Abrir detalhes', texto: 'Clique no nÃºmero do pedido (em dourado) ou no nome do cliente para abrir a pÃ¡gina de detalhes, onde vocÃª gerencia itens, semÃ¡foro, pagamento e imprime o resumo.' },
      { titulo: 'Data de entrega', texto: 'Pedidos entregues exibem a data de entrega logo abaixo do badge de status na listagem. Essa data Ã© preenchida automaticamente quando o pedido Ã© marcado como "Entregue" â€” seja pela conclusÃ£o de uma entrega no mÃ³dulo Entregas, seja por alteraÃ§Ã£o manual do status.' },
      { titulo: 'Cancelar pedido', texto: 'Ao editar um pedido e selecionar o status "Cancelado", aparece um campo obrigatÃ³rio para informar o motivo do cancelamento. O nÃºmero do pedido cancelado nÃ£o pode ser reutilizado em novos pedidos â€” o sistema avisa caso haja conflito.' },
      { titulo: 'Consultora responsÃ¡vel', texto: 'No formulÃ¡rio do pedido hÃ¡ um campo "Consultora responsÃ¡vel" disponÃ­vel em todos os pedidos â€” informe o nome da consultora vinculada ao projeto (ex: Carolina, Adriana). Esse campo Ã© independente do status e pode ser preenchido tanto em pedidos normais quanto em pedidos com status Pendente.' },
      { titulo: 'Editar um pedido', texto: 'Clique em "Editar" na linha do pedido para alterar dados como status, prazo prometido, profissional vinculado, consultora responsÃ¡vel e observaÃ§Ãµes gerais.' },
      { titulo: 'Exportar CSV', texto: 'Clique em "â†“ Exportar CSV" para baixar a lista de pedidos em formato compatÃ­vel com Excel.' },
    ],
    dicas: [
      'Todos os filtros (busca, status, profissional) sÃ£o salvos automaticamente â€” ao voltar para a pÃ¡gina eles estarÃ£o como vocÃª deixou.',
      'Pedidos pendentes aparecem em "Em aberto" e tambÃ©m no filtro "Pendente". Ao resolver a pendÃªncia, edite o pedido e mude o status para "Compra confirmada".',
      'Pedidos entregues ou cancelados somem do filtro "Em aberto". Use "Todos" para encontrÃ¡-los.',
      'Pedidos entregues que ainda possuem AT ativa exibem a tag vermelha "AT ativa" diretamente na lista â€” facilitando identificar clientes que precisam de atenÃ§Ã£o pÃ³s-entrega.',
    ],
  },
  {
    id: 'pedido-detalhe',
    icone: 'ðŸ“„',
    titulo: 'Detalhes do Pedido',
    descricao: 'Dentro de cada pedido vocÃª gerencia itens, semÃ¡foro, pagamento, ATs e imprime o resumo.',
    passos: [
      { titulo: 'Adicionar itens', texto: 'Na seÃ§Ã£o "Itens" clique em "+ Adicionar item". Informe a descriÃ§Ã£o, quantidade, status do item, fornecedor responsÃ¡vel e previsÃ£o de chegada. Marque as flags necessÃ¡rias: "Requer iÃ§amento na entrega", "Requer envio de tecido fornecido", "Requer retirada na loja" e os tratamentos especiais "HigienizaÃ§Ã£o" e/ou "ImpermeabilizaÃ§Ã£o". Cada flag gera uma tag visual no item e alertas no Dashboard enquanto nÃ£o forem concluÃ­das.' },
      { titulo: 'Excluir item', texto: 'Cada item possui um botÃ£o "Excluir" abaixo do botÃ£o "Editar". Ao clicar, um modal de confirmaÃ§Ã£o exibe o nome do item â€” confirme para excluir permanentemente. Essa aÃ§Ã£o Ã© registrada no histÃ³rico do pedido.' },
      { titulo: 'Buscar itens no pedido', texto: 'No topo da lista de itens hÃ¡ um campo de busca que filtra em tempo real por descriÃ§Ã£o ou nome do fornecedor â€” Ãºtil para pedidos com muitos itens.' },
      { titulo: 'Itens tipo Tecido â€” envio ao fornecedor', texto: 'Ao criar ou editar um item com tipo "Tecido", aparece uma seÃ§Ã£o roxa com os campos "Data de envio" e "NF de envio". Preencha quando o tecido for enviado ao fornecedor. A data e NF de envio aparecem na linha do item na listagem do pedido.' },
      { titulo: 'Retirada na loja', texto: 'Ao marcar "Requer retirada na loja" em um item, uma tag amarela "Retirada loja" aparece no item para sinalizar que o produto precisa ser buscado na loja antes da entrega ao cliente. Use para produtos do Outlet, peÃ§as entregues na loja, ou qualquer situaÃ§Ã£o em que a equipe precise buscar o item antes da entrega.' },
      { titulo: 'Tratamentos especiais', texto: 'Marque "Requer higienizaÃ§Ã£o" ou "Requer impermeabilizaÃ§Ã£o" nos itens que precisam de procedimento antes da entrega. Tags azuis aparecem no item para lembrete visual da equipe. O Dashboard exibe um alerta enquanto o item nÃ£o for marcado como "Apto entrega", sinalizando que o tratamento ainda estÃ¡ pendente.' },
      { titulo: 'Data de recebimento na lista de itens', texto: 'Na tabela de itens do pedido, a coluna "Recebido" exibe a data em que o item chegou ao estoque. Esse campo Ã© preenchido ao editar o item â€” informe a data de recebimento no formulÃ¡rio de ediÃ§Ã£o. Quando ainda nÃ£o preenchido aparece "â€”".' },
      { titulo: 'Status dos itens', texto: 'Cada item tem seu prÃ³prio status independente: Criado â†’ Aguard. compra â†’ Em produÃ§Ã£o â†’ Em transporte â†’ Recebido â†’ Conferido OK â†’ Apto entrega â†’ Entregue. Atualize conforme a produÃ§Ã£o avanÃ§a.' },
      { titulo: 'Status automÃ¡tico: Apto p/ agendamento', texto: 'Quando todos os itens do pedido sÃ£o marcados como "Apto entrega", o status do pedido muda automaticamente para "Apto p/ agendamento". Isso sinaliza que o pedido pode ser incluÃ­do na programaÃ§Ã£o de entregas sem intervenÃ§Ã£o manual.' },
      { titulo: 'NF / Romaneio de entrega', texto: 'No cabeÃ§alho do pedido hÃ¡ um campo para registrar o documento fiscal. Escolha o tipo (NF para Nota Fiscal ou Romaneio para entregas sem NF) e informe o nÃºmero. Esse nÃºmero aparece no resumo impresso do pedido.' },
      { titulo: 'Ãcones de alerta nos itens', texto: 'O Ã­cone âš ï¸ em um item indica que hÃ¡ uma ocorrÃªncia aberta vinculada a ele. O Ã­cone ðŸ”§ indica que o item tem uma AT ativa. Ambos sÃ£o links â€” clique para navegar diretamente.' },
      { titulo: 'SemÃ¡foro de prioridade', texto: 'O semÃ¡foro fica no topo da pÃ¡gina. Clique em uma cor para alterar manualmente: ðŸŸ¢ Verde = no prazo Â· ðŸŸ¡ Amarelo = atenÃ§Ã£o (prazo prÃ³ximo) Â· ðŸ”´ Vermelho = atrasado Â· ðŸ”µ Azul = aguardando retorno do cliente Â· ðŸŸ£ Roxo = aguardando fornecedor Â· ðŸŸ© Verde limÃ£o = pronto p/ entrega. O semÃ¡foro tambÃ©m Ã© atualizado automaticamente ao abrir o pedido: vermelho quando o prazo venceu, amarelo quando faltam 7 dias ou menos, verde quando o prazo estÃ¡ ok. O verde limÃ£o (Pronto p/ entrega) Ã© definido automaticamente quando todos os itens ficam aptos para entrega e nÃ£o Ã© sobrescrito pela atualizaÃ§Ã£o automÃ¡tica.' },
      { titulo: 'Pagamento', texto: 'No bloco de pagamento selecione o status: Pendente, Pendente Boleto (boleto emitido mas ainda nÃ£o compensado), Parcial ou Pago. Use o campo de observaÃ§Ãµes para registrar detalhes como nÃºmero de parcelas, data de vencimento ou cÃ³digo de cheque. O bloco Ã© colapsÃ¡vel â€” clique no cabeÃ§alho para expandir ou recolher.' },
      { titulo: 'HistÃ³rico de alteraÃ§Ãµes', texto: 'Toda mudanÃ§a no pedido e nos itens Ã© registrada automaticamente: status alterado, item adicionado, semÃ¡foro modificado. O histÃ³rico fica na parte inferior da pÃ¡gina e Ã© colapsÃ¡vel â€” clique no cabeÃ§alho para expandir. Mostra todos os registros sem limite de quantidade.' },
      { titulo: 'Imprimir resumo', texto: 'Clique em "ðŸ–¨ï¸ Imprimir" para gerar o documento completo do pedido â€” inclui dados do cliente, todos os itens, prazo prometido, semÃ¡foro, status de pagamento e observaÃ§Ãµes.' },
    ],
    dicas: [
      'O contador de ATs ativas aparece no topo da pÃ¡gina. Clique nele para ver as ATs do pedido.',
      'Itens com flags de tratamento especial (higienizaÃ§Ã£o, impermeabilizaÃ§Ã£o, tecido fornecido, retirada na loja) exibem tags coloridas para lembrete visual. Os de higienizaÃ§Ã£o e impermeabilizaÃ§Ã£o geram alertas no Dashboard enquanto o item nÃ£o estiver como "Apto entrega".',
      'Quando nÃ£o hÃ¡ NF (entrega com romaneio), selecione "Romaneio" no campo de documento e informe o nÃºmero do romaneio.',
    ],
  },
  {
    id: 'clientes',
    icone: 'ðŸ‘¤',
    titulo: 'Clientes',
    descricao: 'Cadastro completo de clientes com endereÃ§o e contato.',
    passos: [
      { titulo: 'Cadastrar cliente', texto: 'Clique em "+ Novo cliente". Preencha nome completo, telefone, e-mail e o endereÃ§o completo: rua, nÃºmero, bairro, cidade, estado e CEP. O endereÃ§o Ã© usado automaticamente para montar a rota no Google Maps no mÃ³dulo de Entregas.' },
      { titulo: 'Buscar cliente', texto: 'Use a barra de busca para localizar por nome ou cidade.' },
      { titulo: 'Visualizar cadastro', texto: 'Clique em "Ver" na linha do cliente para abrir um painel de leitura com todos os dados cadastrados â€” contato, endereÃ§o completo e observaÃ§Ãµes â€” sem precisar entrar no modo de ediÃ§Ã£o.' },
      { titulo: 'Editar cliente', texto: 'Clique em "Editar" para atualizar qualquer dado do cadastro, incluindo endereÃ§o e contato.' },
    ],
    dicas: [
      'Cadastre o endereÃ§o completo desde o inÃ­cio â€” sem ele a funÃ§Ã£o "Abrir rota no Maps" nÃ£o consegue incluir o cliente na rota.',
      'A busca global (Ctrl+K) tambÃ©m localiza clientes pelo nome.',
    ],
  },
  {
    id: 'fornecedores',
    icone: 'ðŸ­',
    titulo: 'Fornecedores',
    descricao: 'Cadastro de fornecedores vinculados a itens de pedido e assistÃªncias tÃ©cnicas.',
    passos: [
      { titulo: 'Cadastrar fornecedor', texto: 'Clique em "+ Novo fornecedor". Informe razÃ£o social, nome fantasia, CNPJ, telefone de contato e observaÃ§Ãµes. Fornecedores cadastrados ficam disponÃ­veis para seleÃ§Ã£o nos itens de pedido e nas ATs.' },
      { titulo: 'Buscar fornecedor', texto: 'Use a busca por nome fantasia ou razÃ£o social.' },
      { titulo: 'Visualizar cadastro', texto: 'Clique em "Ver" na linha do fornecedor para abrir um painel de leitura com todos os dados cadastrados â€” razÃ£o social, contatos, CNPJ, prazo mÃ©dio e observaÃ§Ãµes â€” sem precisar entrar no modo de ediÃ§Ã£o.' },
      { titulo: 'Editar fornecedor', texto: 'Clique em "Editar" para atualizar dados de contato ou observaÃ§Ãµes.' },
    ],
    dicas: [
      'Vincule o fornecedor ao item do pedido para rastrear de onde vem cada peÃ§a do projeto.',
      'Nas ATs de devoluÃ§Ã£o ao fornecedor, o fornecedor vinculado ao item Ã© prÃ©-selecionado automaticamente.',
    ],
  },
  {
    id: 'profissionais',
    icone: 'ðŸ› ï¸',
    titulo: 'Profissionais',
    descricao: 'Cadastro de arquitetos, designers e outros profissionais parceiros.',
    passos: [
      { titulo: 'Cadastrar profissional', texto: 'Clique em "+ Novo profissional". Informe nome, tipo (Arquiteto, Designer de Interiores, Decoradorâ€¦), dados de contato e a data de nascimento. O profissional fica disponÃ­vel para seleÃ§Ã£o na criaÃ§Ã£o de pedidos.' },
      { titulo: 'Dados bancÃ¡rios', texto: 'Na seÃ§Ã£o "Dados BancÃ¡rios" do cadastro informe banco, tipo de conta (corrente ou poupanÃ§a), agÃªncia, conta, CPF/CNPJ do titular, nome do titular e chave Pix. Essas informaÃ§Ãµes ficam salvas no cadastro do profissional e podem ser consultadas a qualquer momento clicando em "Ver".' },
      { titulo: 'Visualizar cadastro', texto: 'Clique em "Ver" na linha do profissional para abrir um painel de leitura com todos os dados cadastrados â€” contato, dados bancÃ¡rios e Pix â€” sem precisar entrar no modo de ediÃ§Ã£o.' },
      { titulo: 'Filtrar por situaÃ§Ã£o', texto: 'Use os botÃµes "Ativos / Inativos / Todos" para filtrar a lista. "Inativos" mostra profissionais que foram desativados mas mantÃªm o histÃ³rico de pedidos preservado.' },
      { titulo: 'Ativar / Desativar', texto: 'Profissionais inativos nÃ£o aparecem nas opÃ§Ãµes de seleÃ§Ã£o de novos pedidos, mas os pedidos jÃ¡ vinculados a eles nÃ£o sÃ£o afetados.' },
      { titulo: 'Filtrar pedidos por profissional', texto: 'Na listagem de Pedidos, use o select "Todos os profissionais" para filtrar e ver apenas os pedidos de um parceiro especÃ­fico â€” Ãºtil para calcular comissÃµes ou preparar relatÃ³rios por parceiro.' },
      { titulo: 'Lembrete de aniversÃ¡rio', texto: 'Ao acessar a aba de Profissionais, se houver algum profissional fazendo aniversÃ¡rio no dia, um banner amarelo Ã© exibido no topo da lista com os nomes dos aniversariantes â€” por exemplo: "ðŸŽ‚ Aniversariante de hoje: JoÃ£o Silva". Use para enviar uma lembranÃ§a ou mensagem ao colaborador.' },
    ],
    dicas: [
      'Desative profissionais que nÃ£o trabalham mais com a empresa em vez de excluÃ­-los â€” assim o histÃ³rico dos pedidos antigos fica preservado.',
      'Cadastre a data de nascimento dos profissionais para receber o lembrete automÃ¡tico de aniversÃ¡rio ao acessar a aba.',
      'Use o botÃ£o "Ver" para consultar rapidamente os dados bancÃ¡rios na hora de efetuar um pagamento â€” sem precisar entrar no modo de ediÃ§Ã£o.',
    ],
  },
  {
    id: 'assistencia',
    icone: 'ðŸ”§',
    titulo: 'AssistÃªncia TÃ©cnica (AT)',
    descricao: 'Controle completo de assistÃªncias tÃ©cnicas abertas para clientes.',
    passos: [
      { titulo: 'Abrir uma AT', texto: 'Clique em "+ Nova AT". No campo de pedido, use a caixa de busca para localizar rapidamente pelo nÃºmero do pedido ou nome do cliente â€” o select filtra em tempo real conforme vocÃª digita. Selecione o pedido, depois o item com problema. Escolha o tipo: Retirada do cliente, Visita tÃ©cnica no cliente, ou DevoluÃ§Ã£o ao fornecedor. Descreva o problema relatado. Se precisar retirar o produto, marque "Requer retirada" e informe o endereÃ§o e a data agendada.' },
      { titulo: 'Fluxo de status', texto: 'O status avanÃ§a conforme o processo: Aberta â†’ Aguard. retirada â†’ Em reparo â†’ Enviado ao fornecedor â†’ Aguard. devoluÃ§Ã£o â†’ Resolvida. Dentro da AT, altere o status e registre as observaÃ§Ãµes de cada etapa.' },
      { titulo: 'Filtros da lista', texto: 'Por padrÃ£o a lista mostra apenas ATs ativas (aberta, aguard. retirada, em reparo, enviado fornecedor, aguard. devoluÃ§Ã£o). Use o filtro para ver "Finalizadas" (resolvidas e canceladas) ou "Todas". Use a busca para localizar pelo nÃºmero da AT, nÃºmero do pedido ou nome do cliente.' },
      { titulo: 'Registrar informaÃ§Ãµes da AT', texto: 'Dentro da AT registre: observaÃ§Ãµes gerais do processo, laudo/observaÃ§Ãµes do fornecedor, nÃºmero da NF de envio ao fornecedor, transportadora usada e datas de cada etapa (retirada, envio, previsÃ£o de retorno, retorno efetivo, previsÃ£o de entrega).' },
      { titulo: 'Garantia', texto: 'Marque "Dentro da garantia" para sinalizar que o produto estÃ¡ coberto. Quando marcado, aparece um campo para registrar a data de vencimento da garantia. Essa informaÃ§Ã£o Ã© exibida no documento impresso da AT.' },
      { titulo: 'ObservaÃ§Ãµes cumulativas', texto: 'As observaÃ§Ãµes gerais da AT sÃ£o acumulativas: ao executar uma aÃ§Ã£o (iniciar processo, registrar retorno, resolver, cancelar) e informar uma observaÃ§Ã£o, ela Ã© adicionada ao campo "ObservaÃ§Ãµes gerais" sem apagar o que jÃ¡ estava registrado.' },
      { titulo: 'Imprimir AT', texto: 'Clique em "ðŸ–¨ï¸ Imprimir AT" para gerar o documento formal da assistÃªncia â€” inclui todos os dados, datas, descriÃ§Ã£o do problema, observaÃ§Ãµes, situaÃ§Ã£o de garantia e campos de assinatura do responsÃ¡vel tÃ©cnico e do cliente.' },
      { titulo: 'Resolver ou cancelar', texto: 'Quando o problema for solucionado, clique em "Resolver AT" e informe uma observaÃ§Ã£o de conclusÃ£o. Para cancelar sem resoluÃ§Ã£o use "Cancelar AT". Ambas as aÃ§Ãµes removem a AT da lista de ativas.' },
    ],
    dicas: [
      'ATs abertas a partir de uma OcorrÃªncia fecham a ocorrÃªncia de origem automaticamente.',
      'ATs sem movimentaÃ§Ã£o hÃ¡ mais de 7 dias aparecem como alerta no Dashboard.',
      'O nÃºmero da AT Ã© gerado automaticamente no formato: AT [Pedido]-[Ano]-[SequÃªncia].',
      'A busca global (Ctrl+K) localiza ATs tanto pelo nÃºmero quanto pela descriÃ§Ã£o do problema.',
    ],
  },
  {
    id: 'ocorrencias',
    icone: 'âš ï¸',
    titulo: 'OcorrÃªncias',
    descricao: 'Registro inicial de problemas relatados por clientes â€” etapa anterior Ã  AT formal.',
    passos: [
      { titulo: 'Registrar ocorrÃªncia', texto: 'Clique em "+ Nova ocorrÃªncia". No campo de pedido, use a caixa de busca para localizar pelo nÃºmero ou nome do cliente. Selecione o pedido, o item com problema (opcional) e descreva o que o cliente relatou. A ocorrÃªncia fica com status "Aberta" atÃ© ser tratada pela equipe.' },
      { titulo: 'Converter em AT', texto: 'Se a ocorrÃªncia exigir reparo formal, clique em "Abrir AT" dentro da ocorrÃªncia. O sistema cria a AT com o pedido e a descriÃ§Ã£o jÃ¡ preenchidos e fecha a ocorrÃªncia automaticamente com a observaÃ§Ã£o de que foi convertida.' },
      { titulo: 'Resolver diretamente', texto: 'Se o problema for resolvido sem virar AT (cliente desistiu, era dÃºvida de uso, problema simples) clique em "Resolver" e adicione uma observaÃ§Ã£o de encerramento.' },
      { titulo: 'Cancelar', texto: 'Use "Cancelar" quando a ocorrÃªncia foi registrada por engano ou duplicada.' },
    ],
    dicas: [
      'OcorrÃªncias abertas hÃ¡ mais de 3 dias aparecem automaticamente como alerta no Dashboard.',
      'Itens com ocorrÃªncia aberta mostram o Ã­cone âš ï¸ na pÃ¡gina de detalhes do pedido.',
    ],
  },
  {
    id: 'entregas',
    icone: 'ðŸšš',
    titulo: 'Entregas',
    descricao: 'ProgramaÃ§Ã£o e controle das entregas com rota no Maps e impressÃ£o para a equipe.',
    passos: [
      { titulo: 'Agendar entrega de pedido', texto: 'Clique em "+ Agendar entrega" e selecione o tipo "ðŸšš Entrega". Use a caixa de busca para localizar o pedido pelo nÃºmero ou nome do cliente. Selecione o pedido e a data. Se a entrega requer iÃ§amento, marque "Requer iÃ§amento" e descreva as condiÃ§Ãµes â€” ex: "Apartamento 12Âº andar, iÃ§amento pela varanda".' },
      { titulo: 'Agendar AssistÃªncia TÃ©cnica nas Entregas', texto: 'Clique em "+ Agendar entrega" e selecione o tipo "ðŸ”§ AssistÃªncia". Use a caixa de busca para localizar a AT pelo nÃºmero ou descriÃ§Ã£o do problema. Isso permite centralizar na aba Entregas tanto as entregas de pedido quanto as ATs do mesmo dia, facilitando o planejamento da equipe.' },
      { titulo: 'ObservaÃ§Ãµes visÃ­veis na lista', texto: 'As observaÃ§Ãµes de iÃ§amento aparecem em destaque laranja diretamente no cartÃ£o da entrega, sem precisar abrir o modal. ObservaÃ§Ãµes gerais aparecem logo abaixo com o Ã­cone ðŸ“.' },
      { titulo: 'Imprimir sequÃªncia', texto: 'Clique em "ðŸ–¨ï¸ SequÃªncia" para imprimir a folha de rota em formato paisagem â€” inclui motorista, veÃ­culo, placa, rodÃ­zio, data e a ordem das entregas. Pedidos aparecem como "P.123 â€” NOME CLIENTE" e ATs aparecem como "ðŸ”§ AT.123 â€” NOME CLIENTE", com a cidade na coluna RegiÃ£o.' },
      { titulo: 'Imprimir observaÃ§Ãµes', texto: 'Clique em "ðŸ“‹ ObservaÃ§Ãµes" para imprimir a folha de observaÃ§Ãµes da equipe â€” lista cada entrega e AT com endereÃ§o completo, iÃ§amento destacado em laranja, descriÃ§Ã£o do problema (para ATs) e todas as observaÃ§Ãµes especiais. Ideal para a equipe em campo.' },
      { titulo: 'Abrir rota no Maps', texto: 'Clique em "ðŸ“ Abrir rota no Maps" para abrir o Google Maps com a rota otimizada do dia, partindo do endereÃ§o de saÃ­da configurado em ConfiguraÃ§Ãµes.' },
      { titulo: 'ResponsÃ¡vel / montador', texto: 'No formulÃ¡rio de agendamento hÃ¡ um campo "ResponsÃ¡vel / montador" para registrar o nome de quem realizarÃ¡ a entrega ou montagem. Esse nome aparece no cartÃ£o da entrega (Ã­cone ðŸ‘·) e Ã© listado automaticamente na linha EQUIPE da folha de sequÃªncia do motorista.' },
      { titulo: 'Marcar como realizada', texto: 'ApÃ³s a entrega, abra o registro e marque como "Realizada" informando a data de entrega efetiva. Quando nÃ£o hÃ¡ outras entregas pendentes do mesmo pedido, o pedido Ã© marcado automaticamente como "Entregue" e a data de entrega Ã© registrada automaticamente.' },
      { titulo: 'Reagendar', texto: 'Se a entrega nÃ£o for realizada, marque como "Reagendada" informando o motivo. O motivo aparece no cartÃ£o da lista para referÃªncia.' },
    ],
    dicas: [
      'Configure o endereÃ§o de saÃ­da em ConfiguraÃ§Ãµes para que a rota no Maps parta do local correto.',
      'Use "ðŸ“‹ ObservaÃ§Ãµes" para entregar Ã  equipe que vai para a rua â€” ela tem tudo que precisa: endereÃ§o, telefone do cliente, iÃ§amento e instruÃ§Ãµes especiais.',
      'O filtro "Pendentes" mostra apenas entregas agendadas e reagendadas â€” use para ver o que ainda precisa ser feito.',
      'Pedidos com mÃºltiplas entregas sÃ³ sÃ£o marcados como "Entregue" quando a Ãºltima entrega pendente for realizada.',
    ],
  },
  {
    id: 'relatorios',
    icone: 'ðŸ“Š',
    titulo: 'RelatÃ³rios',
    descricao: 'AnÃ¡lises do negÃ³cio organizadas em 8 abas â€” com exportaÃ§Ã£o para CSV em todas.',
    passos: [
      { titulo: 'Filtro de perÃ­odo', texto: 'No topo da pÃ¡gina hÃ¡ botÃµes para filtrar o perÃ­odo de anÃ¡lise: Ãšltimos 6 meses, Ãšltimos 12 meses, Este ano, Ano anterior ou Todo o perÃ­odo. Ao trocar o perÃ­odo os dados sÃ£o recalculados instantaneamente â€” sem nova consulta ao banco. Os cards mostram o total do perÃ­odo selecionado e o total geral do sistema abaixo.' },
      { titulo: 'Cards de totais', texto: 'Exibem os totais do perÃ­odo selecionado: pedidos, entregas, ATs e ocorrÃªncias. Abaixo de cada nÃºmero aparece o total geral do sistema para comparaÃ§Ã£o.' },
      { titulo: 'Pedidos', texto: 'Duas tabelas: (1) Pedidos por mÃªs â€” quantos pedidos foram criados e quantos foram entregues em cada mÃªs do perÃ­odo; (2) Pedidos por status â€” distribuiÃ§Ã£o percentual de todos os pedidos do perÃ­odo.' },
      { titulo: 'Entregas', texto: 'Tabela do perÃ­odo selecionado com o nÃºmero de entregas agendadas, realizadas e a taxa de conclusÃ£o de cada mÃªs.' },
      { titulo: 'Prazos', texto: 'TrÃªs mÃ©tricas sobre pedidos entregues no perÃ­odo: (1) Tempo mÃ©dio de entrega em dias â€” da data da venda atÃ© a data de entrega; (2) Pedidos entregues dentro do prazo prometido; (3) Pedidos entregues fora do prazo.' },
      { titulo: 'Profissionais', texto: 'Ranking de arquitetos e designers por volume de pedidos no perÃ­odo â€” mostra o total de pedidos e quantos foram entregues para cada profissional.' },
      { titulo: 'ATs', texto: 'DistribuiÃ§Ã£o das AssistÃªncias TÃ©cnicas abertas no perÃ­odo por status, com total e percentual.' },
      { titulo: 'ATs p/ Fornecedor', texto: 'Ranking dos fornecedores que geraram mais assistÃªncias tÃ©cnicas no perÃ­odo â€” identifica quais tÃªm mais problemas de qualidade.' },
      { titulo: 'Pedidos p/ Fornecedor', texto: 'Lista apenas os fornecedores que possuem itens pendentes em pedidos ativos no momento â€” quem nÃ£o tem pendÃªncia nÃ£o aparece. Clique em um fornecedor para expandir e ver todos os pedidos vinculados, com nÃºmero do pedido, nome do cliente, descriÃ§Ã£o do item e previsÃ£o de chegada. Ideal para usar durante ligaÃ§Ãµes de cobranÃ§a de prazo: vocÃª vÃª todos os pedidos em aberto daquele fornecedor de uma vez e menciona cada nÃºmero. HÃ¡ tambÃ©m o botÃ£o "Exportar CSV deste fornecedor" para enviar a lista por e-mail. Esta aba sempre reflete o estado atual dos itens, independente do perÃ­odo selecionado.' },
      { titulo: 'OcorrÃªncias', texto: 'DistribuiÃ§Ã£o das ocorrÃªncias abertas no perÃ­odo por tipo, com o total e quantas ainda estÃ£o em aberto para cada categoria.' },
      { titulo: 'Tratamentos', texto: 'Quantos itens requerem cada tratamento especial (IÃ§amento, Tecido a enviar, Retirada na loja, HigienizaÃ§Ã£o, ImpermeabilizaÃ§Ã£o) e quantos jÃ¡ estÃ£o marcados como "Apto entrega". Esta aba sempre reflete o estado atual de todos os itens, independente do perÃ­odo selecionado.' },
      { titulo: 'Exportar CSV', texto: 'Cada aba tem um botÃ£o "Exportar CSV" que baixa os dados filtrados em formato compatÃ­vel com Excel.' },
      { titulo: 'Exportar PDF', texto: 'O botÃ£o "ðŸ–¨ï¸ Exportar PDF" no topo exporta a aba atual como PDF. Ao clicar, abre uma janela de impressÃ£o formatada com os dados do perÃ­odo selecionado â€” escolha "Salvar como PDF" na impressora para salvar o arquivo.' },
    ],
    dicas: [
      'Clique em "Atualizar" no topo para recarregar os dados mais recentes sem precisar recarregar a pÃ¡gina.',
      'A anÃ¡lise de Prazos sÃ³ considera pedidos com status "Entregue" que possuem data de venda registrada.',
      'Use "Este ano" e "Ano anterior" para comparar o desempenho entre os dois anos.',
      'A aba Tratamentos nÃ£o respeita o filtro de perÃ­odo â€” sempre mostra o estado atual dos itens cadastrados.',
    ],
  },
  {
    id: 'historico',
    icone: 'ðŸ•',
    titulo: 'HistÃ³rico',
    descricao: 'Log completo e automÃ¡tico de todas as alteraÃ§Ãµes feitas no sistema.',
    passos: [
      { titulo: 'O que Ã© registrado', texto: 'Tudo Ã© registrado automaticamente: pedidos criados e editados, itens adicionados, status alterados, semÃ¡foro modificado, ATs abertas e resolvidas, ocorrÃªncias registradas, entregas agendadas e muito mais.' },
      { titulo: 'Buscar no histÃ³rico', texto: 'Use a barra de busca para localizar por nÃºmero de pedido, nome do cliente ou qualquer palavra da descriÃ§Ã£o da aÃ§Ã£o.' },
      { titulo: 'Filtrar por tipo de evento', texto: 'Use o select de tipo para ver apenas uma categoria: pedido criado, item editado, AT atualizada, entrega agendada, etc.' },
      { titulo: 'Filtrar por pedido', texto: 'Selecione um pedido especÃ­fico no select para ver apenas as alteraÃ§Ãµes relacionadas a ele â€” Ãºtil para auditar o histÃ³rico completo de um projeto.' },
    ],
    dicas: [
      'O histÃ³rico Ã© somente leitura e nÃ£o pode ser editado â€” serve como trilha de auditoria de todas as aÃ§Ãµes.',
      'Use o filtro por pedido para apresentar ao cliente o histÃ³rico completo do projeto dele.',
    ],
  },
  {
    id: 'usuarios',
    icone: 'ðŸ‘¥',
    titulo: 'UsuÃ¡rios',
    descricao: 'Gerenciamento completo dos usuÃ¡rios com acesso ao sistema â€” sem precisar acessar o Supabase.',
    passos: [
      { titulo: 'Criar novo usuÃ¡rio', texto: 'Clique em "+ Novo usuÃ¡rio". Preencha nome completo, cargo, e-mail e defina uma senha inicial (mÃ­nimo 6 caracteres). O usuÃ¡rio Ã© criado imediatamente e jÃ¡ pode fazer login com as credenciais informadas.' },
      { titulo: 'Editar nome e cargo', texto: 'Clique em "Editar" na linha do usuÃ¡rio para atualizar o nome e o cargo. O nome e cargo aparecem no rodapÃ© do menu lateral de cada usuÃ¡rio.' },
      { titulo: 'Redefinir senha', texto: 'Clique em "Redefinir senha" para definir uma nova senha para qualquer usuÃ¡rio â€” Ãºtil quando alguÃ©m esquece a senha. Informe e confirme a nova senha (mÃ­nimo 6 caracteres).' },
      { titulo: 'Excluir usuÃ¡rio', texto: 'Clique em "Excluir" (botÃ£o vermelho) para remover permanentemente um usuÃ¡rio do sistema. O histÃ³rico de alteraÃ§Ãµes feitas por ele Ã© preservado com o nome registrado â€” apenas o acesso ao sistema Ã© revogado. Essa aÃ§Ã£o nÃ£o pode ser desfeita.' },
    ],
    dicas: [
      'Todo o gerenciamento de usuÃ¡rios Ã© feito direto pelo sistema â€” nÃ£o Ã© necessÃ¡rio acessar o painel do Supabase.',
      'Defina um cargo descritivo para cada usuÃ¡rio (ex: "Operacional e LogÃ­stica", "DireÃ§Ã£o") â€” ele aparece no menu lateral e ajuda a identificar quem estÃ¡ logado.',
      'Ao excluir um usuÃ¡rio, o histÃ³rico de aÃ§Ãµes dele no sistema permanece intacto para fins de auditoria.',
    ],
  },
  {
    id: 'configuracoes',
    icone: 'âš™ï¸',
    titulo: 'ConfiguraÃ§Ãµes',
    descricao: 'PersonalizaÃ§Ãµes do sistema para a operaÃ§Ã£o da empresa.',
    passos: [
      { titulo: 'EndereÃ§o de saÃ­da', texto: 'Configure o endereÃ§o de onde a equipe parte para as entregas (endereÃ§o da loja, depÃ³sito ou galpÃ£o). Esse endereÃ§o Ã© o ponto de partida da rota gerada no Google Maps pelo mÃ³dulo de Entregas.' },
      { titulo: 'Monitor de banco de dados', texto: 'Exibe o uso atual do banco de dados Supabase em relaÃ§Ã£o ao limite de 500 MB do plano gratuito. A barra de progresso fica verde atÃ© 70%, amarela entre 70% e 90%, e vermelha acima de 90%. Um aviso automÃ¡tico aparece quando o uso estÃ¡ elevado.' },
      { titulo: 'Backup de dados', texto: 'Clique em "â¬‡ Exportar backup" para baixar um arquivo JSON com todos os dados do sistema: pedidos, itens, clientes, fornecedores, profissionais, ATs, ocorrÃªncias e entregas. Clique em "ðŸ“‚ Visualizar backup" para abrir o arquivo baixado diretamente no sistema â€” vocÃª pode navegar entre as tabelas e buscar qualquer registro em tempo real sem precisar do Excel.' },
      { titulo: 'Limpeza de dados', texto: 'Permite excluir permanentemente pedidos entregues ou cancelados de um ano especÃ­fico para liberar espaÃ§o no banco. Selecione o ano e clique em "Ver o que serÃ¡ excluÃ­do" â€” o sistema mostra um resumo com a quantidade exata de pedidos, itens, ATs, ocorrÃªncias, entregas e histÃ³rico que serÃ£o removidos. Para confirmar, Ã© obrigatÃ³rio digitar a palavra CONFIRMAR no campo antes de o botÃ£o de exclusÃ£o ficar disponÃ­vel. Recomendado: exporte o backup antes de executar a limpeza.' },
      { titulo: 'Perfil do usuÃ¡rio logado', texto: 'Atualize seu prÃ³prio nome e cargo que aparecem no rodapÃ© do menu lateral. Cada usuÃ¡rio pode editar seu prÃ³prio perfil.' },
    ],
    dicas: [
      'O endereÃ§o de saÃ­da Ã© compartilhado entre todos os usuÃ¡rios â€” configure uma vez e vale para toda a equipe.',
      'Acompanhe o uso do banco de dados em ConfiguraÃ§Ãµes para saber quando o limite estÃ¡ se aproximando.',
      'Realize o backup antes de executar a limpeza â€” assim os dados ficam salvos mesmo apÃ³s a exclusÃ£o.',
      'A limpeza remove apenas pedidos com status entregue ou cancelado â€” pedidos em andamento nunca sÃ£o afetados.',
    ],
  },
]

export default function Ajuda() {
  const [aberta, setAberta] = useState<string | null>('dashboard')

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/ajuda" />

      <div className="page-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Central de Ajuda</span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>

          {/* Intro */}
          <div style={{ background: '#1a1a2e', borderRadius: '14px', padding: '24px 28px', marginBottom: '28px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '32px', flexShrink: 0 }}>ðŸŽ­</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#C9A84C', marginBottom: '6px' }}>Bem-vindo ao Opera House ERP</div>
              <div style={{ fontSize: '13px', color: '#a0a0c0', lineHeight: '1.7' }}>
                Este sistema foi desenvolvido para a <strong style={{ color: '#c8c8e0' }}>Opera House</strong> gerenciar pedidos, assistÃªncias tÃ©cnicas, entregas e o relacionamento com clientes e parceiros. Cada membro da equipe acessa com seu prÃ³prio login â€” as aÃ§Ãµes de cada usuÃ¡rio ficam registradas no histÃ³rico do sistema. Use o menu abaixo para navegar pelo guia de cada mÃ³dulo.
              </div>
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(201,168,76,0.12)', borderRadius: '8px', fontSize: '12px', color: '#c8b87a', lineHeight: '1.6' }}>
                ðŸ”’ <strong>SessÃ£o expirada:</strong> se o sistema ficar sem uso por um longo perÃ­odo, a sessÃ£o pode expirar. Quando isso acontecer, um aviso aparecerÃ¡ na tela â€” basta clicar em <em>"Recarregar pÃ¡gina"</em> para voltar a usar normalmente.
              </div>
            </div>
          </div>

          {/* Atalhos rÃ¡pidos */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '18px 22px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>Atalhos do sistema</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { tecla: 'Ctrl + K', acao: 'Abrir busca global â€” localiza pedidos, clientes, fornecedores e ATs (inclusive pela descriÃ§Ã£o do problema)' },
                { tecla: 'â†‘ â†“', acao: 'Navegar pelos resultados da busca global' },
                { tecla: 'Enter', acao: 'Abrir o resultado selecionado na busca global / confirmar lembrete no Dashboard' },
                { tecla: 'Esc', acao: 'Fechar modal ou busca global' },
                { tecla: 'Clique no nÃºmero', acao: 'Abrir detalhes do pedido ou AT' },
              ].map(a => (
                <div key={a.tecla} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ background: '#1a1a2e', color: '#C9A84C', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.tecla}</span>
                  <span style={{ fontSize: '12px', color: '#555', lineHeight: '1.5' }}>{a.acao}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fluxo bÃ¡sico */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '18px 22px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>Fluxo bÃ¡sico de um pedido</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', rowGap: '8px' }}>
              {[
                'Cadastrar cliente',
                'Criar pedido',
                'Adicionar itens',
                'Acompanhar produÃ§Ã£o',
                'Agendar entrega',
                'Marcar como entregue',
              ].map((etapa, i, arr) => (
                <div key={etapa} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                  <div style={{ background: '#f0efe9', border: '0.5px solid #e8e7e3', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', color: '#1a1a2e', fontWeight: '500', whiteSpace: 'nowrap' }}>
                    {etapa}
                  </div>
                  {i < arr.length - 1 && (
                    <span style={{ fontSize: '14px', color: '#C9A84C', padding: '0 6px' }}>â†’</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AcordeÃ£o de mÃ³dulos */}
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>Guia por mÃ³dulo</div>

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

                  {/* ConteÃºdo */}
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
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#7a5c00', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>ðŸ’¡ Dicas</div>
                            {secao.dicas.map((dica, i) => (
                              <div key={i} style={{ fontSize: '12px', color: '#665000', lineHeight: '1.6', marginBottom: i < secao.dicas!.length - 1 ? '6px' : '0' }}>
                                â€¢ {dica}
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

          {/* RodapÃ© */}
          <div style={{ marginTop: '28px', padding: '16px 20px', background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>ðŸ’¬</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e', marginBottom: '2px' }}>DÃºvidas ou sugestÃµes?</div>
              <div style={{ fontSize: '12px', color: '#888' }}>Entre em contato com o administrador do sistema para reportar problemas ou solicitar novas funcionalidades.</div>
            </div>
          </div>

          <div style={{ height: '32px' }} />
        </div>
      </div>
    </div>
  )
}
