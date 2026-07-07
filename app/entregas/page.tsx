'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { registrarHistorico } from '../lib/historico'
import Sidebar from '../components/Sidebar'

interface ClienteEntrega {
  nome: string
  cidade: string
  estado: string
  endereco: string
  numero: string
  bairro: string
  cep: string
}

interface Entrega {
  id: string
  pedido_id: string
  data_agendada: string
  data_realizada: string
  status: string
  requer_icamento: boolean
  observacoes_icamento: string
  observacoes: string
  pedidos: {
    numero_pedido: string
    clientes: ClienteEntrega
  }
}

interface Pedido {
  id: string
  numero_pedido: string
  clientes: { nome: string; cidade: string }
}

const STATUS_COR: Record<string, { bg: string; color: string; label: string }> = {
  agendada: { bg: '#E6F1FB', color: '#0C447C', label: 'Agendada' },
  realizada: { bg: '#EAF3DE', color: '#27500A', label: 'Realizada' },
  reagendada: { bg: '#FAEEDA', color: '#633806', label: 'Reagendada' },
  cancelada: { bg: '#f0efe9', color: '#888', label: 'Cancelada' },
}

const STATUS_LISTA = ['agendada', 'realizada', 'reagendada', 'cancelada']

const formVazio = {
  pedido_id: '', data_agendada: '', data_realizada: '',
  status: 'agendada', requer_icamento: false,
  observacoes_icamento: '', observacoes: '',
}

function montarEnderecoCliente(c: ClienteEntrega): string {
  return [c.endereco, c.numero, c.bairro, c.cidade, c.estado, c.cep]
    .filter(Boolean).join(', ')
}

async function abrirRotaMaps(entregas: Entrega[]) {
  const enderecos = entregas
    .map(e => montarEnderecoCliente(e.pedidos?.clientes))
    .filter(Boolean)
  if (enderecos.length === 0) return alert('Nenhum endereço cadastrado para os clientes deste dia.')

  const { data } = await supabase.from('configuracoes').select('valor').eq('chave', 'endereco_saida').single()
  const saida = data?.valor?.trim()

  const pontos = saida ? [saida, ...enderecos] : enderecos
  const url = 'https://www.google.com/maps/dir/' + pontos.map(e => encodeURIComponent(e)).join('/')
  window.open(url, '_blank')
}

function formatarDataLabel(dataStr: string): string {
  const d = new Date(dataStr + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface ImpressaoInfo {
  dia: string
  entregas: Entrega[]
}

export default function Entregas() {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filtro, setFiltro] = useState<'pendentes' | 'realizadas' | 'todas'>('pendentes')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)
  const [impressao, setImpressao] = useState<ImpressaoInfo | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [infoMotorista, setInfoMotorista] = useState({ motorista: '', veiculo: '', placa: '', rodizio: '' })

  useEffect(() => {
    buscarEntregas()
    buscarPedidos()
  }, [])

  async function buscarEntregas() {
    const { data } = await supabase
      .from('entregas')
      .select('*, pedidos(numero_pedido, clientes(nome, cidade, estado, endereco, numero, bairro, cep))')
      .order('data_agendada', { ascending: true })
    setEntregas((data as unknown as Entrega[]) || [])
  }

  async function buscarPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, clientes(nome, cidade)')
      .not('status', 'in', '(entregue,cancelado)')
      .order('numero_pedido', { ascending: false })
    setPedidos((data as unknown as Pedido[]) || [])
  }

  function abrirNovo() {
    setEditandoId(null)
    setForm(formVazio)
    setShowForm(true)
  }

  function abrirEdicao(e: Entrega) {
    setEditandoId(e.id)
    setForm({
      pedido_id: e.pedido_id || '',
      data_agendada: e.data_agendada || '',
      data_realizada: e.data_realizada || '',
      status: e.status || 'agendada',
      requer_icamento: e.requer_icamento || false,
      observacoes_icamento: e.observacoes_icamento || '',
      observacoes: e.observacoes || '',
    })
    setShowForm(true)
  }

  async function salvar() {
    if (!form.pedido_id) return alert('Selecione o pedido')
    if (!form.data_agendada) return alert('Data agendada é obrigatória')
    setSalvando(true)
    try {
      const payload = {
        pedido_id: form.pedido_id,
        data_agendada: form.data_agendada,
        data_realizada: form.data_realizada || null,
        status: form.status,
        requer_icamento: form.requer_icamento,
        observacoes_icamento: form.observacoes_icamento,
        observacoes: form.observacoes,
      }
      const pedidoSel = pedidos.find(p => p.id === form.pedido_id)
      const numPedido = pedidoSel?.numero_pedido || '?'
      if (editandoId) {
        const { error } = await supabase.from('entregas').update(payload).eq('id', editandoId)
        if (error) return alert('Erro: ' + error.message)
        await registrarHistorico({ tipo: 'pedido_editado', descricao: `Entrega do Pedido ${numPedido} atualizada para ${form.data_agendada ? new Date(form.data_agendada + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}`, pedidoId: form.pedido_id })
      } else {
        const { error } = await supabase.from('entregas').insert([{ ...payload, status: 'agendada' }])
        if (error) return alert('Erro: ' + error.message)
        await registrarHistorico({ tipo: 'pedido_editado', descricao: `Entrega do Pedido ${numPedido} agendada para ${form.data_agendada ? new Date(form.data_agendada + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}`, pedidoId: form.pedido_id })
      }
      setShowForm(false)
      setForm(formVazio)
      setEditandoId(null)
      buscarEntregas()
    } finally {
      setSalvando(false)
    }
  }

  const STORAGE_KEY_MOTORISTA = 'operare_motorista_info'

  function carregarInfoMotorista() {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY_MOTORISTA)
      if (salvo) return JSON.parse(salvo)
    } catch {}
    return { motorista: '', veiculo: '', placa: '', rodizio: '' }
  }

  function abrirImpressao(dia: string, entregasDia: Entrega[]) {
    setImpressao({ dia, entregas: entregasDia })
    setInfoMotorista(carregarInfoMotorista())
  }

  function salvarInfoMotorista(info: typeof infoMotorista) {
    localStorage.setItem(STORAGE_KEY_MOTORISTA, JSON.stringify(info))
  }

  function imprimir(info: ImpressaoInfo, motorista: typeof infoMotorista) {
    salvarInfoMotorista(motorista)

    const dataFormatada = (() => {
      const d = new Date(info.dia + 'T12:00:00')
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    })()

    const TOTAL_LINHAS = 16
    const linhasVazias = Math.max(0, TOTAL_LINHAS - info.entregas.length)

    const rowsHtml = info.entregas.map(e => {
      const c = e.pedidos?.clientes
      const nomeAbrev = (c?.nome || '').substring(0, 14).toUpperCase()
      const label = `P.${e.pedidos?.numero_pedido}-${nomeAbrev}`
      const regiao = (c?.cidade || '').toUpperCase()
      return `
        <tr style="height:32px;">
          <td style="padding:4px 8px;border-right:1px solid #000;font-size:10px;font-weight:600;">${label}</td>
          <td style="padding:4px 8px;border-right:1px solid #000;"></td>
          <td style="padding:4px 8px;border-right:1px solid #000;"></td>
          <td style="padding:4px 8px;border-right:1px solid #000;"></td>
          <td style="padding:4px 8px;font-size:10px;font-weight:500;">${regiao}</td>
        </tr>`
    }).join('')

    const emptyRows = Array.from({ length: linhasVazias }).map(() => `
      <tr style="height:32px;">
        <td style="border-right:1px solid #000;"></td>
        <td style="border-right:1px solid #000;"></td>
        <td style="border-right:1px solid #000;"></td>
        <td style="border-right:1px solid #000;"></td>
        <td></td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Sequência de Entregas — ${dataFormatada}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm 14mm; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:11px; color:#000; background:#fff; }
    table { border-collapse:collapse; width:100%; }
    td, th { border:1px solid #000; }
  </style>
</head>
<body>

<!-- LOGO -->
<table style="margin-bottom:10px;border:none;">
  <tr>
    <td style="border:none;text-align:center;padding:4px 0 10px;">
      <table style="margin:0 auto;border:none;border-collapse:separate;border-spacing:0;">
        <tr>
          <td style="background:#1a1a2e;border:2px solid #1a1a2e;width:56px;height:56px;text-align:center;vertical-align:middle;border-radius:6px;">
            <span style="color:#C9A84C;font-size:28px;font-weight:900;font-style:italic;font-family:Georgia,serif;">h</span>
          </td>
          <td style="border:none;padding-left:12px;vertical-align:middle;text-align:left;">
            <div style="font-size:22px;font-weight:900;letter-spacing:2px;line-height:1.15;color:#1a1a2e;">OPERA</div>
            <div style="font-size:22px;font-weight:900;letter-spacing:2px;line-height:1.15;color:#1a1a2e;">HOUSE</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- LINHA 1: Motorista | Rodízio | Data -->
<table style="margin-bottom:-1px;">
  <tr>
    <td style="padding:6px 10px;width:30%;">
      <span style="font-size:10px;font-weight:bold;">Motorista:</span>
      <span style="font-size:12px;font-weight:bold;margin-left:6px;">${motorista.motorista}</span>
    </td>
    <td style="padding:6px 10px;width:46%;text-align:center;background:#f5f5f5;">
      <span style="font-size:10px;font-weight:bold;">RODÍZIO:</span>
      <span style="font-size:10px;font-weight:bold;margin-left:6px;">${motorista.rodizio || 'PLACA FINAL ___ ___-FEIRA'}</span>
    </td>
    <td style="padding:6px 10px;width:24%;text-align:right;">
      <span style="font-size:10px;font-weight:bold;">DATA:</span>
      <span style="font-size:12px;font-weight:bold;margin-left:6px;">${dataFormatada}</span>
    </td>
  </tr>
</table>

<!-- LINHA 2: Veículo | Placa | Combustível | Litros | KM -->
<table style="margin-bottom:-1px;">
  <tr>
    <td style="padding:6px 10px;width:18%;">
      <span style="font-size:10px;font-weight:bold;">Veículo:</span>
      <span style="font-size:11px;margin-left:6px;">${motorista.veiculo}</span>
    </td>
    <td style="padding:6px 10px;width:22%;">
      <span style="font-size:10px;font-weight:bold;">Placa:</span>
      <span style="font-size:11px;margin-left:6px;">${motorista.placa}</span>
    </td>
    <td style="padding:6px 10px;width:22%;">
      <span style="font-size:10px;font-weight:bold;">Combustível: R$:</span>
      <span style="display:inline-block;border-bottom:1px solid #000;width:60px;margin-left:4px;"></span>
    </td>
    <td style="padding:6px 10px;width:18%;">
      <span style="font-size:10px;font-weight:bold;">Litros:</span>
      <span style="display:inline-block;border-bottom:1px solid #000;width:50px;margin-left:4px;"></span>
    </td>
    <td style="padding:6px 10px;width:20%;">
      <span style="font-size:10px;font-weight:bold;">KM:</span>
      <span style="display:inline-block;border-bottom:1px solid #000;width:70px;margin-left:4px;"></span>
    </td>
  </tr>
</table>

<!-- TABELA DE ENTREGAS -->
<table>
  <thead>
    <tr style="background:#1a1a2e;">
      <th style="padding:6px 8px;font-size:10px;width:24%;text-align:center;color:#C9A84C;font-weight:bold;">Cliente / Fornecedor</th>
      <th style="padding:6px 8px;font-size:10px;width:22%;text-align:center;color:#C9A84C;font-weight:bold;">Nome legível</th>
      <th style="padding:6px 8px;font-size:10px;width:16%;text-align:center;color:#C9A84C;font-weight:bold;">Horário de Chegada</th>
      <th style="padding:6px 8px;font-size:10px;width:16%;text-align:center;color:#C9A84C;font-weight:bold;">Horário de Saída</th>
      <th style="padding:6px 8px;font-size:10px;width:22%;text-align:center;color:#C9A84C;font-weight:bold;">Região</th>
    </tr>
  </thead>
  <tbody>
    ${rowsHtml}
    ${emptyRows}
  </tbody>
</table>

<!-- EQUIPE -->
<table style="margin-top:-1px;">
  <tr>
    <td style="padding:7px 10px;">
      <span style="font-size:10px;font-weight:bold;">EQUIPE:</span>
      <span style="display:inline-block;border-bottom:1px solid #000;width:400px;margin-left:8px;"></span>
    </td>
  </tr>
</table>

<!-- KM / HORÁRIOS -->
<table style="margin-top:-1px;">
  <tr>
    <td style="padding:8px 10px;width:50%;">
      <span style="font-size:10px;font-weight:bold;">KM DE SAÍDA:</span>
      <span style="display:inline-block;border-bottom:1px solid #000;width:180px;margin-left:8px;"></span>
    </td>
    <td style="padding:8px 10px;width:50%;">
      <span style="font-size:10px;font-weight:bold;">HORÁRIO DE SAÍDA:</span>
      <span style="display:inline-block;border-bottom:1px solid #000;width:160px;margin-left:8px;"></span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 10px;">
      <span style="font-size:10px;font-weight:bold;">KM DE CHEGADA:</span>
      <span style="display:inline-block;border-bottom:1px solid #000;width:180px;margin-left:8px;"></span>
    </td>
    <td style="padding:8px 10px;">
      <span style="font-size:10px;font-weight:bold;">HORÁRIO DE CHEGADA:</span>
      <span style="display:inline-block;border-bottom:1px solid #000;width:160px;margin-left:8px;"></span>
    </td>
  </tr>
</table>

<script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`

    const janela = window.open('', '_blank', 'width=900,height=600')
    if (!janela) return
    janela.document.write(html)
    janela.document.close()
  }

  async function deletarEntrega(id: string, numeroPedido: string) {
    if (!confirm(`Remover o agendamento do Pedido ${numeroPedido}? O pedido não será excluído, apenas o agendamento de entrega.`)) return
    const { error } = await supabase.from('entregas').delete().eq('id', id)
    if (error) return alert('Erro: ' + error.message)
    buscarEntregas()
  }

  const filtradas = entregas.filter(e => {
    if (filtro === 'pendentes') return e.status === 'agendada' || e.status === 'reagendada'
    if (filtro === 'realizadas') return e.status === 'realizada'
    return true
  })

  // Agrupar por data
  const porDia = filtradas.reduce<Record<string, Entrega[]>>((acc, e) => {
    const d = e.data_agendada || 'sem-data'
    if (!acc[d]) acc[d] = []
    acc[d].push(e)
    return acc
  }, {})
  const diasOrdenados = Object.keys(porDia).sort()

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/entregas" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Programação de Entregas</span>
          <button onClick={abrirNovo} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            + Agendar entrega
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#fff', border: '0.5px solid #e8e7e3', borderRadius: '8px', padding: '3px', width: 'fit-content', marginBottom: '20px' }}>
            {([
              { key: 'pendentes', label: 'Pendentes' },
              { key: 'realizadas', label: 'Realizadas' },
              { key: 'todas', label: 'Todas' },
            ] as const).map(op => (
              <button
                key={op.key}
                onClick={() => setFiltro(op.key)}
                style={{ padding: '5px 16px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '500', cursor: 'pointer', background: filtro === op.key ? '#1a1a2e' : 'transparent', color: filtro === op.key ? '#C9A84C' : '#888' }}
              >
                {op.label}
              </button>
            ))}
          </div>

          {diasOrdenados.length === 0 && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '40px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
              Nenhuma entrega agendada.
            </div>
          )}

          {diasOrdenados.map(dia => {
            const entregasDia = porDia[dia]
            const atrasado = dia < hoje && entregasDia.some(e => e.status === 'agendada' || e.status === 'reagendada')
            const temEndereco = entregasDia.some(e => e.pedidos?.clientes?.endereco)

            return (
              <div key={dia} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: atrasado ? '#A32D2D' : '#1a1a2e', textTransform: 'capitalize' }}>
                      {formatarDataLabel(dia)}
                    </span>
                    {atrasado && (
                      <span style={{ fontSize: '10px', background: '#FCEBEB', color: '#791F1F', padding: '2px 8px', borderRadius: '6px', fontWeight: '500' }}>Atrasado</span>
                    )}
                    <span style={{ fontSize: '11px', color: '#aaa' }}>{entregasDia.length} entrega{entregasDia.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => abrirImpressao(dia, entregasDia)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '7px', border: '0.5px solid #e8e7e3', background: '#fff', color: '#555', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                    >
                      🖨️ Imprimir sequência
                    </button>
                    <button
                      onClick={() => abrirRotaMaps(entregasDia)}
                      title={temEndereco ? 'Abrir rota no Google Maps' : 'Cadastre os endereços dos clientes para usar esta função'}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '7px', border: '0.5px solid #C9A84C', background: '#fff', color: '#C9A84C', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                    >
                      📍 Abrir rota no Maps
                    </button>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
                  {entregasDia.map((e, i) => {
                    const c = e.pedidos?.clientes
                    const enderecoCompleto = c ? montarEnderecoCliente(c) : ''
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderTop: i > 0 ? '0.5px solid #f0efe9' : 'none', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', color: '#C9A84C', fontWeight: '600' }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>Pedido {e.pedidos?.numero_pedido}</span>
                            <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '6px', fontWeight: '500', background: STATUS_COR[e.status]?.bg || '#f0efe9', color: STATUS_COR[e.status]?.color || '#555' }}>
                              {STATUS_COR[e.status]?.label || e.status}
                            </span>
                            {e.requer_icamento && (
                              <span style={{ fontSize: '10px', background: '#FAEEDA', color: '#633806', padding: '1px 6px', borderRadius: '6px', fontWeight: '500' }}>Içamento</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#555' }}>{c?.nome}</div>
                          {enderecoCompleto ? (
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{enderecoCompleto}</div>
                          ) : (
                            <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{c?.cidade} {c?.estado} — endereço completo não cadastrado</div>
                          )}
                          {e.observacoes && (
                            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', fontStyle: 'italic' }}>{e.observacoes}</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            onClick={() => abrirEdicao(e)}
                            style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555', whiteSpace: 'nowrap' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deletarEntrega(e.id, e.pedidos?.numero_pedido || '—')}
                            style={{ padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #FCEBEB', background: '#FCEBEB', fontSize: '12px', cursor: 'pointer', color: '#A32D2D', whiteSpace: 'nowrap' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {impressao && (() => {
        const dataFormatada = (() => {
          const d = new Date(impressao.dia + 'T12:00:00')
          return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        })()
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '620px', display: 'flex', flexDirection: 'column' }}>

              {/* Cabeçalho do modal */}
              <div style={{ padding: '16px 24px', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Imprimir Sequência — {dataFormatada}</span>
                <button onClick={() => setImpressao(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
              </div>

              {/* Campos de preenchimento */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
                  Preencha os campos abaixo antes de imprimir. Os dados ficam salvos automaticamente para o próximo itinerário.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Motorista', key: 'motorista', placeholder: 'Ex: JONES' },
                    { label: 'Veículo', key: 'veiculo', placeholder: 'Ex: VW' },
                    { label: 'Placa', key: 'placa', placeholder: 'Ex: EYY5F33' },
                    { label: 'Rodízio', key: 'rodizio', placeholder: 'Ex: PLACA FINAL 3 TERÇA-FEIRA' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                      <input
                        value={infoMotorista[key as keyof typeof infoMotorista]}
                        onChange={e => {
                          const novo = { ...infoMotorista, [key]: e.target.value }
                          setInfoMotorista(novo)
                          salvarInfoMotorista(novo)
                        }}
                        placeholder={placeholder}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>

                {/* Resumo do que será impresso */}
                <div style={{ marginTop: '16px', padding: '12px', background: '#f7f6f3', borderRadius: '8px', border: '0.5px solid #e8e7e3' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a1a2e', marginBottom: '8px' }}>Entregas que aparecem na folha:</div>
                  {impressao.entregas.map((e, i) => {
                    const c = e.pedidos?.clientes
                    return (
                      <div key={e.id} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#555', padding: '3px 0', borderTop: i > 0 ? '0.5px solid #e8e7e3' : 'none' }}>
                        <span style={{ color: '#C9A84C', fontWeight: '600', minWidth: '16px' }}>{i + 1}.</span>
                        <span style={{ fontWeight: '500' }}>P.{e.pedidos?.numero_pedido}</span>
                        <span>—</span>
                        <span>{c?.nome}</span>
                        <span style={{ marginLeft: 'auto', color: '#888' }}>{c?.cidade}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Botões */}
              <div style={{ padding: '16px 24px', borderTop: '0.5px solid #e8e7e3', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setImpressao(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
                <button onClick={() => imprimir(impressao, infoMotorista)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>🖨️ Abrir folha para imprimir</button>
              </div>
            </div>
          </div>
        )
      })()}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{editandoId ? 'Editar entrega' : 'Agendar entrega'}</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Pedido *</div>
              <select value={form.pedido_id} onChange={e => setForm({ ...form, pedido_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Selecione o pedido</option>
                {pedidos.map(p => <option key={p.id} value={p.id}>{p.numero_pedido} — {(p.clientes as any)?.nome}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Data da entrega *</div>
              <input type="date" value={form.data_agendada} onChange={e => setForm({ ...form, data_agendada: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {editandoId && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</div>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                    {STATUS_LISTA.map(s => <option key={s} value={s}>{STATUS_COR[s]?.label || s}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Data realizada</div>
                  <input type="date" value={form.data_realizada} onChange={e => setForm({ ...form, data_realizada: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </>
            )}

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="icamento" checked={form.requer_icamento} onChange={e => setForm({ ...form, requer_icamento: e.target.checked })} />
              <label htmlFor="icamento" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Requer içamento</label>
            </div>

            {form.requer_icamento && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observações de içamento</div>
                <textarea value={form.observacoes_icamento} onChange={e => setForm({ ...form, observacoes_icamento: e.target.value })} rows={2}
                  placeholder="Ex: 3º andar, sem elevador..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observações</div>
              <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : (editandoId ? 'Salvar alterações' : 'Agendar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
