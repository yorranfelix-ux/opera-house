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
      { titulo: 'Painel de alertas', texto: 'Lista automática de situações que precisam de atenção: pedidos com prazo vencido, ATs sem movimentação há mais de 7 dias, ocorrências abertas há mais de 3 dias, itens aguardando tecido fornecido e itens sem previsão de chegada cadastrada.' },
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
      { titulo: 'Editar um pedido', texto: 'Clique em "Editar" na linha do pedido para alterar dados como status, prazo prometido, profissional vinculado e observações gerais.' },
      { titulo: 'Exportar CSV', texto: 'Clique em "↓ Exportar CSV" para baixar a lista de pedidos em formato compatível com Excel.' },
    ],
    dicas: [
      'Todos os filtros (busca, status, profissional) são salvos automaticamente — ao voltar para a página eles estarão como você deixou.',
      'Pedidos entregues ou cancelados somem do filtro "Em aberto". Use "Todos" para encontrá-los.',
    ],
  },
  {
    id: 'pedido-detalhe',
    icone: '📄',
    titulo: 'Detalhes do Pedido',
    descricao: 'Dentro de cada pedido você gerencia itens, semáforo, pagamento, ATs e imprime o resumo.',
    passos: [
      { titulo: 'Adicionar itens', texto: 'Na seção "Itens" clique em "+ Adicionar item". Informe a descrição, quantidade, status do item, se requer tecido fornecido pelo fornecedor, a previsão de chegada e o fornecedor responsável. Os itens são a base para o controle de produção.' },
      { titulo: 'Status dos itens', texto: 'Cada item tem seu próprio status independente: Criado → Aguard. compra → Em produção → Em transporte → Recebido → Conferido OK → Apto entrega → Entregue. Atualize conforme a produção avança.' },
      { titulo: 'Status automático: Apto p/ agendamento', texto: 'Quando todos os itens do pedido são marcados como "Apto entrega", o status do pedido muda automaticamente para "Apto p/ agendamento". Isso sinaliza que o pedido pode ser incluído na programação de entregas sem intervenção manual.' },
      { titulo: 'NF / Romaneio de entrega', texto: 'No cabeçalho do pedido há um campo para registrar o documento fiscal. Escolha o tipo (NF para Nota Fiscal ou Romaneio para entregas sem NF) e informe o número. Esse número aparece no resumo impresso do pedido.' },
      { titulo: 'Ícones de alerta nos itens', texto: 'O ícone ⚠️ em um item indica que há uma ocorrência aberta vinculada a ele. O ícone 🔧 indica que o item tem uma AT ativa. Ambos são links — clique para navegar diretamente.' },
      { titulo: 'Semáforo de prioridade', texto: 'O semáforo fica no topo da página. Clique em uma cor para alterar: 🟢 Verde = andamento normal · 🟡 Amarelo = atenção necessária · 🔴 Vermelho = urgente · 🔵 Azul = aguardando retorno do cliente · 🟣 Roxo = situação especial.' },
      { titulo: 'Pagamento', texto: 'No bloco de pagamento selecione o status (Pendente, Parcial ou Pago) e use o campo de observações para registrar detalhes como número de parcelas, data de vencimento ou código de cheque.' },
      { titulo: 'Histórico de alterações', texto: 'Toda mudança no pedido e nos itens é registrada automaticamente: status alterado, item adicionado, semáforo modificado. O histórico fica visível na parte inferior da página.' },
      { titulo: 'Imprimir resumo', texto: 'Clique em "🖨️ Imprimir" para gerar o documento completo do pedido — inclui dados do cliente, todos os itens, prazo prometido, semáforo, status de pagamento e observações.' },
    ],
    dicas: [
      'O contador de ATs ativas aparece no topo da página. Clique nele para ver as ATs do pedido.',
      'Itens com "Requer tecido fornecido" marcado aparecem como alerta no Dashboard enquanto o tecido não chegar.',
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
      { titulo: 'Cadastrar profissional', texto: 'Clique em "+ Novo profissional". Informe nome, tipo (Arquiteto, Designer de Interiores, Decorador…) e dados de contato. O profissional fica disponível para seleção na criação de pedidos.' },
      { titulo: 'Ativar / Desativar', texto: 'Profissionais inativos não aparecem nas opções de seleção de novos pedidos, mas os pedidos já vinculados a eles não são afetados.' },
      { titulo: 'Filtrar pedidos por profissional', texto: 'Na listagem de Pedidos, use o select "Todos os profissionais" para filtrar e ver apenas os pedidos de um parceiro específico — útil para calcular comissões ou preparar relatórios por parceiro.' },
    ],
    dicas: [
      'Desative profissionais que não trabalham mais com a empresa em vez de excluí-los — assim o histórico dos pedidos antigos fica preservado.',
    ],
  },
  {
    id: 'assistencia',
    icone: '🔧',
    titulo: 'Assistência Técnica (AT)',
    descricao: 'Controle completo de assistências técnicas abertas para clientes.',
    passos: [
      { titulo: 'Abrir uma AT', texto: 'Clique em "+ Nova AT". Selecione o pedido vinculado e o item com problema. Escolha o tipo: Retirada do cliente, Visita técnica no cliente, ou Devolução ao fornecedor. Descreva o problema relatado. Se precisar retirar o produto, marque "Requer retirada" e informe o endereço e a data agendada.' },
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
      { titulo: 'Registrar ocorrência', texto: 'Clique em "+ Nova ocorrência". Selecione o pedido, o item com problema (opcional) e descreva o que o cliente relatou. A ocorrência fica com status "Aberta" até ser tratada pela equipe.' },
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
      { titulo: 'Agendar entrega', texto: 'Clique em "+ Agendar entrega". Selecione o pedido e a data. Se a entrega requer içamento (apartamentos sem acesso de escada, peças muito pesadas), marque "Requer içamento" e descreva as condições no campo "Observações de içamento" — ex: "Apartamento 12º andar, içamento pela varanda".' },
      { titulo: 'Observações visíveis na lista', texto: 'As observações de içamento aparecem em destaque laranja diretamente no cartão da entrega, sem precisar abrir o modal. Observações gerais aparecem logo abaixo com o ícone 📝.' },
      { titulo: 'Imprimir sequência', texto: 'Clique em "🖨️ Sequência" para imprimir a folha de rota em formato paisagem — inclui motorista, veículo, placa, rodízio, data e a ordem das entregas com espaço para horários de chegada e saída em cada endereço.' },
      { titulo: 'Imprimir observações', texto: 'Clique em "📋 Observações" para imprimir a folha de observações da equipe — lista cada entrega com endereço completo, içamento destacado em laranja e todas as observações especiais. Ideal para a equipe em campo.' },
      { titulo: 'Abrir rota no Maps', texto: 'Clique em "📍 Abrir rota no Maps" para abrir o Google Maps com a rota otimizada do dia, partindo do endereço de saída configurado em Configurações.' },
      { titulo: 'Responsável / montador', texto: 'No formulário de agendamento há um campo "Responsável / montador" para registrar o nome de quem realizará a entrega ou montagem. Esse nome aparece no cartão da entrega (ícone 👷) e é listado automaticamente na linha EQUIPE da folha de sequência do motorista.' },
      { titulo: 'Marcar como realizada', texto: 'Após a entrega, abra o registro e marque como "Realizada" informando a data de entrega efetiva. Quando não há outras entregas pendentes do mesmo pedido, o pedido é marcado automaticamente como "Entregue".' },
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
    descricao: 'Visão consolidada de ATs, entregas, ocorrências e pedidos com exportação para CSV.',
    passos: [
      { titulo: 'Cards de totais', texto: 'No topo da página aparecem os totais gerais do banco de dados: total de ATs, total de entregas, total de ocorrências e total de pedidos cadastrados.' },
      { titulo: 'ATs por status', texto: 'Tabela com a distribuição das Assistências Técnicas por status (Aberta, Em reparo, No fornecedor, Resolvida etc.), com o total de cada um e o percentual de participação.' },
      { titulo: 'Entregas por mês', texto: 'Tabela dos últimos 6 meses com o número de entregas agendadas, realizadas e a taxa de conclusão de cada mês.' },
      { titulo: 'Ocorrências por tipo', texto: 'Distribuição das ocorrências por tipo, com o total e quantas ainda estão abertas para cada categoria.' },
      { titulo: 'Pedidos por status', texto: 'Distribuição dos pedidos por status (Em aberto, Apto p/ agendamento, Agendado, Entregue, Cancelado) com participação percentual.' },
      { titulo: 'Exportar CSV', texto: 'Cada aba tem um botão "Exportar CSV" que baixa os dados em formato compatível com Excel — útil para análises, apresentações ou relatórios gerenciais.' },
    ],
    dicas: [
      'Clique em "Atualizar" no topo para recarregar os dados mais recentes sem precisar recarregar a página.',
      'O CSV exportado usa ponto-e-vírgula como separador e UTF-8 com BOM — abre corretamente no Excel com acentuação.',
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
      { titulo: 'Perfil do usuário logado', texto: 'Atualize seu próprio nome e cargo que aparecem no rodapé do menu lateral. Cada usuário pode editar seu próprio perfil.' },
    ],
    dicas: [
      'O endereço de saída é compartilhado entre todos os usuários — configure uma vez e vale para toda a equipe.',
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
                Este sistema foi desenvolvido para a <strong style={{ color: '#c8c8e0' }}>Opera House</strong> gerenciar pedidos, assistências técnicas, entregas e o relacionamento com clientes e parceiros. Use o menu abaixo para navegar pelo guia de cada módulo.
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
