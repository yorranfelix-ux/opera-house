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
      { titulo: 'Painel de alertas', texto: 'Lista automática de situações que precisam de atenção: pedidos atrasados, ATs sem movimentação há mais de 7 dias, ocorrências abertas há mais de 3 dias, itens aguardando tecido e itens sem previsão de chegada.' },
      { titulo: 'Calendário', texto: 'Mostra as entregas e retiradas de AT agendadas nos próximos 21 dias. Dias com compromisso ficam destacados — clique no dia para ver o detalhe.' },
      { titulo: 'Lembretes do dia', texto: 'Bloco de anotações rápidas no lado direito. Escreva um lembrete e pressione Enter ou clique em "+". Os lembretes ficam salvos permanentemente no navegador até você excluí-los.' },
    ],
    dicas: [
      'O dashboard atualiza os dados ao entrar na página — atualize o navegador para ver o estado mais recente.',
      'Alertas em vermelho indicam situação crítica (atraso, longa inatividade). Amarelo indica atenção.',
    ],
  },
  {
    id: 'pedidos',
    icone: '📋',
    titulo: 'Pedidos',
    descricao: 'Cadastro e acompanhamento de todos os pedidos de venda.',
    passos: [
      { titulo: 'Criar um pedido', texto: 'Clique em "+ Novo pedido" no canto superior direito. Preencha o número do pedido (geralmente o código do orçamento), selecione o cliente, o profissional responsável (arquiteto/designer), a data da venda e o prazo prometido ao cliente. O status inicial é "Criado".' },
      { titulo: 'Filtrar pedidos', texto: 'Use a barra de busca para localizar por número ou nome do cliente. Use os botões "Em aberto / Entregues / Todos" para filtrar por situação. Use o select de profissional para ver apenas os pedidos de um arquiteto específico. Os filtros são combinados e salvos automaticamente.' },
      { titulo: 'Abrir um pedido', texto: 'Clique no número do pedido (em dourado) ou no nome do cliente para abrir a página de detalhes, onde você gerencia itens, semáforo, ATs e pagamento.' },
      { titulo: 'Editar um pedido', texto: 'Clique em "Editar" na linha do pedido para alterar dados cadastrais como status, prazo, profissional e observações.' },
      { titulo: 'Exportar CSV', texto: 'Clique em "↓ Exportar CSV" para baixar a lista atual em formato compatível com Excel.' },
    ],
    dicas: [
      'O semáforo (verde/amarelo/vermelho/azul/roxo) é configurado dentro da página do pedido e serve como sinalização visual de prioridade.',
      'Pedidos entregues ou cancelados somem do filtro "Em aberto" — use "Todos" para encontrá-los.',
    ],
  },
  {
    id: 'pedido-detalhe',
    icone: '📄',
    titulo: 'Detalhes do Pedido',
    descricao: 'Dentro de cada pedido você gerencia itens, ATs, pagamento e imprime o resumo.',
    passos: [
      { titulo: 'Itens do pedido', texto: 'Na seção "Itens" você adiciona cada produto/serviço do pedido. Para cada item informe: descrição, quantidade, status, se requer tecido fornecido, a previsão de chegada e o fornecedor. O status do item avança conforme a produção.' },
      { titulo: 'Semáforo', texto: 'O semáforo é o indicador de prioridade do pedido. Clique em uma cor para alterá-la: Verde = normal, Amarelo = atenção, Vermelho = urgente, Azul = aguardando cliente, Roxo = especial.' },
      { titulo: 'Pagamento', texto: 'No bloco de pagamento selecione o status (Pendente, Parcial ou Pago) e adicione observações como número de parcelas ou data de cheque.' },
      { titulo: 'Histórico de alterações', texto: 'Toda mudança feita no pedido e nos itens é registrada automaticamente no histórico, com data, hora e descrição da alteração.' },
      { titulo: 'Imprimir pedido', texto: 'Clique em "🖨️ Imprimir" para gerar um resumo completo do pedido em PDF — inclui dados do cliente, itens, prazo, semáforo e observações.' },
    ],
    dicas: [
      'O ícone ⚠️ em um item indica que há uma ocorrência aberta vinculada a ele.',
      'O ícone 🔧 indica que o item tem uma AT ativa.',
    ],
  },
  {
    id: 'clientes',
    icone: '👤',
    titulo: 'Clientes',
    descricao: 'Cadastro completo de clientes com endereço e contato.',
    passos: [
      { titulo: 'Cadastrar cliente', texto: 'Clique em "+ Novo cliente". Preencha nome, telefone, e-mail e o endereço completo (rua, número, bairro, cidade, estado, CEP). O endereço é usado para montar a rota de entregas no Google Maps.' },
      { titulo: 'Buscar cliente', texto: 'Use a busca para localizar por nome ou cidade.' },
      { titulo: 'Editar cliente', texto: 'Clique em "Editar" na linha do cliente para atualizar qualquer informação de cadastro.' },
    ],
    dicas: [
      'Cadastre o endereço completo desde o início — ele é essencial para a função de rota do módulo de Entregas.',
    ],
  },
  {
    id: 'fornecedores',
    icone: '🏭',
    titulo: 'Fornecedores',
    descricao: 'Cadastro de fornecedores vinculados a itens de pedido e ATs.',
    passos: [
      { titulo: 'Cadastrar fornecedor', texto: 'Clique em "+ Novo fornecedor". Informe razão social, nome fantasia, CNPJ, contato e observações. O fornecedor pode ser vinculado a itens de pedido e a assistências técnicas.' },
      { titulo: 'Buscar fornecedor', texto: 'Use a busca por nome fantasia ou razão social.' },
    ],
  },
  {
    id: 'profissionais',
    icone: '⚙️',
    titulo: 'Profissionais',
    descricao: 'Cadastro de arquitetos, designers e outros profissionais parceiros.',
    passos: [
      { titulo: 'Cadastrar profissional', texto: 'Clique em "+ Novo profissional". Informe nome, tipo (Arquiteto, Designer, Decorador…) e contato. Profissionais cadastrados aparecem para seleção na criação de pedidos.' },
      { titulo: 'Ativar / Desativar', texto: 'Profissionais inativos não aparecem na lista de seleção de novos pedidos, mas os pedidos existentes não são afetados.' },
    ],
    dicas: [
      'Use o filtro por profissional na listagem de Pedidos para ver rapidamente a carteira de cada parceiro.',
    ],
  },
  {
    id: 'assistencia',
    icone: '🔧',
    titulo: 'Assistência Técnica (AT)',
    descricao: 'Controle completo de assistências técnicas abertas para clientes.',
    passos: [
      { titulo: 'Abrir uma AT', texto: 'Clique em "+ Nova AT". Selecione o pedido vinculado, o item com problema, o tipo de AT (Retirada do cliente, Visita técnica, Devolução ao fornecedor…) e descreva o problema. Se precisar de retirada, marque a opção e informe o endereço e data agendada.' },
      { titulo: 'Acompanhar status', texto: 'O status da AT avança conforme o processo: Aberta → Aguard. retirada → Em reparo → Enviado fornecedor → Aguard. devolução → Resolvida. Acesse a AT e altere o status manualmente conforme a evolução.' },
      { titulo: 'Filtros da lista', texto: 'Por padrão a lista mostra apenas ATs ativas. Use o filtro para ver "Finalizadas" (resolvidas e canceladas) ou "Todas".' },
      { titulo: 'Registrar observações', texto: 'Dentro da AT você pode registrar observações gerais, observações do fornecedor (laudo técnico) e informações de envio (NF, transportadora).' },
      { titulo: 'Imprimir AT', texto: 'Clique em "🖨️ Imprimir AT" para gerar o documento da AT — inclui todos os dados, datas, problema, observações e campo de assinatura do cliente.' },
      { titulo: 'Resolver ou cancelar', texto: 'Ao resolver a AT, informe uma observação de conclusão. A AT passa para "Resolvida" e sai da lista de ativas.' },
    ],
    dicas: [
      'ATs abertas a partir de uma Ocorrência fecham a ocorrência automaticamente.',
      'O histórico da AT registra todas as alterações de status e observações com data e hora.',
    ],
  },
  {
    id: 'ocorrencias',
    icone: '⚠️',
    titulo: 'Ocorrências',
    descricao: 'Registro de problemas relatados por clientes antes da abertura formal de uma AT.',
    passos: [
      { titulo: 'Registrar ocorrência', texto: 'Clique em "+ Nova ocorrência". Selecione o pedido, o item com problema e descreva o que foi relatado. A ocorrência fica com status "Aberta" até ser tratada.' },
      { titulo: 'Converter em AT', texto: 'Se a ocorrência evoluir para um reparo formal, clique em "Abrir AT" dentro da ocorrência. O sistema cria a AT com os dados preenchidos e fecha a ocorrência automaticamente.' },
      { titulo: 'Resolver ou cancelar', texto: 'Se a ocorrência foi resolvida sem virar AT (ex: cliente desistiu, era dúvida de uso), marque como "Resolvida" ou "Cancelada" com uma observação.' },
    ],
    dicas: [
      'Ocorrências abertas há mais de 3 dias aparecem como alerta no Dashboard.',
    ],
  },
  {
    id: 'entregas',
    icone: '🚚',
    titulo: 'Entregas',
    descricao: 'Programação e controle das entregas com rota e impressão para a equipe.',
    passos: [
      { titulo: 'Agendar entrega', texto: 'Clique em "+ Agendar entrega". Selecione o pedido, informe a data agendada e se requer içamento (apartamentos sem acesso de escada). Se houver içamento, descreva as condições no campo de observações de içamento.' },
      { titulo: 'Organizar o dia', texto: 'As entregas são agrupadas por dia. Dentro de cada dia você pode ver o endereço completo de cada cliente e as observações cadastradas.' },
      { titulo: 'Imprimir sequência', texto: 'Clique em "🖨️ Sequência" para imprimir a folha de rota com motorista, veículo, placa e a ordem de entregas — usada pela equipe na saída.' },
      { titulo: 'Imprimir observações', texto: 'Clique em "📋 Observações" para imprimir a folha com o endereço completo de cada cliente, flag de içamento destacada e todas as observações especiais — essencial para a equipe em campo.' },
      { titulo: 'Abrir rota no Maps', texto: 'Clique em "📍 Abrir rota no Maps" para abrir o Google Maps com a rota completa do dia partindo do endereço de saída configurado.' },
      { titulo: 'Reagendar', texto: 'Se uma entrega não for realizada, marque como "Reagendada" informando o motivo. O motivo aparece na lista para referência futura.' },
    ],
    dicas: [
      'Configure o endereço de saída em Configurações → Endereço de Saída para que a rota no Maps comece de lá.',
      'Içamento e observações cadastradas aparecem diretamente no cartão da entrega na lista, sem precisar abrir o modal.',
    ],
  },
  {
    id: 'historico',
    icone: '🕐',
    titulo: 'Histórico',
    descricao: 'Log completo de todas as alterações feitas no sistema.',
    passos: [
      { titulo: 'Consultar histórico', texto: 'O histórico mostra todas as ações registradas: pedidos criados/editados, itens adicionados, ATs abertas, status alterados, entregas agendadas e muito mais.' },
      { titulo: 'Filtrar registros', texto: 'Use a busca para localizar por número de pedido, cliente ou descrição da ação. Use o filtro por tipo de evento para focar em uma categoria.' },
      { titulo: 'Filtrar por pedido', texto: 'Selecione um pedido no select para ver apenas as alterações relacionadas a ele.' },
    ],
    dicas: [
      'O histórico é somente leitura — ele registra tudo automaticamente, sem necessidade de ação do usuário.',
    ],
  },
  {
    id: 'usuarios',
    icone: '👥',
    titulo: 'Usuários',
    descricao: 'Gerenciamento dos usuários com acesso ao sistema.',
    passos: [
      { titulo: 'Convidar usuário', texto: 'O convite de novos usuários é feito pelo painel do Supabase (acesso do administrador). Após o cadastro, o usuário deve acessar o sistema e completar seu perfil.' },
      { titulo: 'Perfil do usuário', texto: 'Cada usuário tem nome e cargo exibidos no rodapé da barra lateral. Para atualizar, acesse Configurações no menu.' },
    ],
  },
  {
    id: 'configuracoes',
    icone: '⚙️',
    titulo: 'Configurações',
    descricao: 'Personalizações do sistema para sua empresa.',
    passos: [
      { titulo: 'Endereço de saída', texto: 'Configure o endereço de onde a equipe de entregas parte (ex: endereço da loja ou depósito). Esse endereço é o ponto de partida da rota no Google Maps.' },
      { titulo: 'Perfil de usuário', texto: 'Atualize seu nome e cargo exibidos no menu lateral.' },
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

        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px', maxWidth: '860px' }}>

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
                { tecla: 'Ctrl + K', acao: 'Abrir busca global — localiza pedidos, clientes, fornecedores e ATs' },
                { tecla: 'Enter', acao: 'Confirmar lembrete no Dashboard' },
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
