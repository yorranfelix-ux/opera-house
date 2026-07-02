'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Ocorrencia {
  id: string
  created_at: string
  tipo: string
  descricao: string
  observacoes: string
  status: string
  pedido_id: string
  item_id: string | null
  quantidade_afetada: number | null
  pedidos: { numero_pedido: string; clientes: { nome: string } }
  itens_pedido: { descricao: string } | null
}

interface Pedido {
  id: string
  numero_pedido: string
  clientes: { nome: string }
}

interface ItemPedido {
  id: string
  descricao: string
  quantidade: number
}

const TIPOS: Record<string, string> = {
  avaria: 'Avaria',
  medida_errada: 'Medida errada',
  cor_errada: 'Cor errada',
  faltando_peca: 'Faltando peça',
  defeito_fabricacao: 'Defeito de fabricação',
  outro: 'Outro',
}

const STATUS_LISTA = ['aberta', 'em_tratativa', 'resolvida', 'cancelada']

const STATUS_COR: Record<string, { bg: string; color: string; label: string }> = {
  aberta: { bg: '#FAECE7', color: '#712B13', label: 'Aberta' },
  em_tratativa: { bg: '#FAEEDA', color: '#633806', label: 'Em tratativa' },
  resolvida: { bg: '#EAF3DE', color: '#27500A', label: 'Resolvida' },
  cancelada: { bg: '#f0efe9', color: '#888', label: 'Cancelada' },
}

const formVazio = {
  pedido_id: '', item_id: '', quantidade_afetada: '',
  tipo: 'avaria', descricao: '', observacoes: '', status: 'aberta',
}

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([])
  const [showForm, setShowForm] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'abertas' | 'resolvidas' | 'todas'>('abertas')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [expandidoId, setExpandidoId] = useState<string | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)

  useEffect(() => { buscarOcorrencias(); buscarPedidos() }, [])

  useEffect(() => {
    if (form.pedido_id) buscarItensPedido(form.pedido_id)
    else setItensPedido([])
  }, [form.pedido_id])

  async function buscarOcorrencias() {
    const { data } = await supabase
      .from('ocorrencias')
      .select('*, pedidos(numero_pedido, clientes(nome))')
      .order('created_at', { ascending: false })
    const ocorrenciasData = (data as unknown as Ocorrencia[]) || []

    // Busca itens separadamente para evitar falha silenciosa no join
    const itemIds = ocorrenciasData.map(o => o.item_id).filter(Boolean) as string[]
    if (itemIds.length > 0) {
      const { data: itens } = await supabase
        .from('itens_pedido')
        .select('id, descricao')
        .in('id', itemIds)
      const itensMap = Object.fromEntries((itens || []).map(it => [it.id, it]))
      ocorrenciasData.forEach(o => {
        if (o.item_id && itensMap[o.item_id]) {
          o.itens_pedido = itensMap[o.item_id]
        }
      })
    }

    setOcorrencias(ocorrenciasData)
  }

  async function buscarPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, clientes(nome)')
      .order('numero_pedido', { ascending: false })
    setPedidos((data as unknown as Pedido[]) || [])
  }

  async function buscarItensPedido(pedidoId: string) {
    const { data } = await supabase
      .from('itens_pedido')
      .select('id, descricao, quantidade')
      .eq('pedido_id', pedidoId)
      .order('created_at')
    setItensPedido((data as unknown as ItemPedido[]) || [])
  }

  function abrirNovo() {
    setEditandoId(null)
    setForm(formVazio)
    setItensPedido([])
    setShowForm(true)
  }

  function abrirEdicao(o: Ocorrencia) {
    setEditandoId(o.id)
    setForm({
      pedido_id: o.pedido_id || '',
      item_id: o.item_id || '',
      quantidade_afetada: o.quantidade_afetada ? String(o.quantidade_afetada) : '',
      tipo: o.tipo || 'avaria',
      descricao: o.descricao || '',
      observacoes: o.observacoes || '',
      status: o.status || 'aberta',
    })
    setShowForm(true)
  }

  async function excluir(id: string) {
    const { error } = await supabase.from('ocorrencias').delete().eq('id', id)
    if (error) return alert('Erro ao excluir: ' + error.message)
    setExcluindoId(null)
    buscarOcorrencias()
  }

  async function salvar() {
    if (!form.pedido_id) return alert('Selecione o pedido')
    if (!form.descricao) return alert('Descrição é obrigatória')
    const payload = {
      pedido_id: form.pedido_id,
      item_id: form.item_id || null,
      quantidade_afetada: form.quantidade_afetada ? parseInt(form.quantidade_afetada) : null,
      tipo: form.tipo,
      descricao: form.descricao,
      observacoes: form.observacoes,
      status: form.status,
    }
    if (editandoId) {
      const { error } = await supabase.from('ocorrencias').update(payload).eq('id', editandoId)
      if (error) return alert('Erro: ' + error.message)
    } else {
      const { error } = await supabase.from('ocorrencias').insert([{ ...payload, status: 'aberta' }])
      if (error) return alert('Erro: ' + error.message)
    }
    setShowForm(false)
    setForm(formVazio)
    setEditandoId(null)
    buscarOcorrencias()
  }

  const STATUS_ABERTAS = ['aberta', 'em_tratativa']
  const filtradas = ocorrencias.filter(o => {
    const buscaOk = o.pedidos?.numero_pedido?.includes(busca) ||
      o.pedidos?.clientes?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      o.descricao?.toLowerCase().includes(busca.toLowerCase())
    if (!buscaOk) return false
    if (filtroStatus === 'abertas') return STATUS_ABERTAS.includes(o.status)
    if (filtroStatus === 'resolvidas') return o.status === 'resolvida' || o.status === 'cancelada'
    return true
  })

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/ocorrencias" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Ocorrências</span>
          <button onClick={abrirNovo} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            + Nova ocorrência
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <input
              placeholder="Buscar por pedido, cliente ou descrição..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '300px', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '4px', background: '#fff', border: '0.5px solid #e8e7e3', borderRadius: '8px', padding: '3px' }}>
              {([
                { key: 'abertas', label: 'Em aberto' },
                { key: 'resolvidas', label: 'Resolvidas' },
                { key: 'todas', label: 'Todas' },
              ] as const).map(op => (
                <button key={op.key} onClick={() => setFiltroStatus(op.key)}
                  style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '500', cursor: 'pointer', background: filtroStatus === op.key ? '#1a1a2e' : 'transparent', color: filtroStatus === op.key ? '#C9A84C' : '#888' }}>
                  {op.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#aaa' }}>{filtradas.length} ocorrência{filtradas.length !== 1 ? 's' : ''}</span>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 160px 130px 110px 100px 120px', padding: '8px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', gap: '8px' }}>
              <span>Pedido</span><span>Item / Descrição</span><span>Tipo</span><span>Status</span><span>Qtd afetada</span><span>Data</span><span></span>
            </div>

            {filtradas.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhuma ocorrência encontrada.</div>
            )}

            {filtradas.map((o, i) => {
              const expandido = expandidoId === o.id
              return (
                <div key={o.id} style={{ borderTop: '0.5px solid #f0efe9', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                  {/* Linha resumo */}
                  <div
                    onClick={() => setExpandidoId(expandido ? null : o.id)}
                    style={{ display: 'grid', gridTemplateColumns: '100px 1fr 160px 130px 110px 100px 120px', padding: '12px 16px', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{o.pedidos?.numero_pedido}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{o.pedidos?.clientes?.nome}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>
                      {o.itens_pedido?.descricao || '—'}
                    </div>
                    <span style={{ fontSize: '12px', color: '#555' }}>{TIPOS[o.tipo] || o.tipo}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '500', background: STATUS_COR[o.status]?.bg || '#f0efe9', color: STATUS_COR[o.status]?.color || '#555', display: 'inline-block' }}>
                      {STATUS_COR[o.status]?.label || o.status}
                    </span>
                    <span style={{ fontSize: '12px', color: '#555', textAlign: 'center' }}>
                      {o.quantidade_afetada ? `${o.quantidade_afetada} pç${o.quantidade_afetada !== 1 ? 's' : ''}` : '—'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#888' }}>
                      {new Date(o.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => abrirEdicao(o)}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '11px', cursor: 'pointer', color: '#555' }}>
                        Editar
                      </button>
                      {['aberta', 'em_tratativa'].includes(o.status) && (
                        <a href={`/assistencia?pedido_id=${o.pedido_id}&item_id=${o.item_id || ''}&descricao=${encodeURIComponent(o.descricao)}&ocorrencia_id=${o.id}`}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #3C3489', background: '#EEEDFE', fontSize: '11px', cursor: 'pointer', color: '#3C3489', textDecoration: 'none', display: 'block', textAlign: 'center', fontWeight: '500' }}>
                          Abrir AT
                        </a>
                      )}
                      <button onClick={() => setExcluindoId(o.id)}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '0.5px solid #f0c0c0', background: '#FCEBEB', fontSize: '11px', cursor: 'pointer', color: '#791F1F' }}>
                        Excluir
                      </button>
                    </div>
                  </div>

                  {/* Painel expandido com todos os detalhes */}
                  {expandido && (
                    <div style={{ margin: '0 16px 14px', background: '#f7f6f3', borderRadius: '10px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Pedido</div>
                        <div style={{ fontSize: '13px', color: '#1a1a2e', fontWeight: '500' }}>{o.pedidos?.numero_pedido}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{o.pedidos?.clientes?.nome}</div>
                      </div>
                      {o.itens_pedido?.descricao && (
                        <div>
                          <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Item</div>
                          <div style={{ fontSize: '13px', color: '#1a1a2e' }}>{o.itens_pedido.descricao}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Tipo</div>
                        <div style={{ fontSize: '13px', color: '#1a1a2e' }}>{TIPOS[o.tipo] || o.tipo}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Status</div>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '500', background: STATUS_COR[o.status]?.bg || '#f0efe9', color: STATUS_COR[o.status]?.color || '#555' }}>
                          {STATUS_COR[o.status]?.label || o.status}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Qtd afetada</div>
                        <div style={{ fontSize: '13px', color: '#1a1a2e' }}>{o.quantidade_afetada ? `${o.quantidade_afetada} peça${o.quantidade_afetada !== 1 ? 's' : ''}` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Data de abertura</div>
                        <div style={{ fontSize: '13px', color: '#1a1a2e' }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Descrição do problema</div>
                        <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.5' }}>{o.descricao || '—'}</div>
                      </div>
                      {o.observacoes && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>Observações</div>
                          <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.5' }}>{o.observacoes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {excluindoId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '380px' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e', marginBottom: '8px' }}>Excluir ocorrência?</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Esta ação não pode ser desfeita.</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setExcluindoId(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={() => excluir(excluindoId)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FCEBEB', color: '#791F1F', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '500px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{editandoId ? 'Editar ocorrência' : 'Nova ocorrência'}</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Pedido *</div>
              <select value={form.pedido_id} onChange={e => setForm({ ...form, pedido_id: e.target.value, item_id: '' })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                <option value="">Selecione o pedido</option>
                {pedidos.map(p => <option key={p.id} value={p.id}>{p.numero_pedido} — {(p.clientes as any)?.nome}</option>)}
              </select>
            </div>

            {itensPedido.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Item com ocorrência</div>
                <select value={form.item_id} onChange={e => setForm({ ...form, item_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Selecione o item (opcional)</option>
                  {itensPedido.map(it => <option key={it.id} value={it.id}>{it.descricao} (Qtd: {it.quantidade})</option>)}
                </select>
              </div>
            )}

            {form.pedido_id && itensPedido.length === 0 && (
              <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '8px', background: '#f7f6f3', fontSize: '12px', color: '#888' }}>
                Este pedido não tem itens cadastrados ainda.
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Quantidade de peças afetadas</div>
              <input
                type="number" min="1" value={form.quantidade_afetada}
                onChange={e => setForm({ ...form, quantidade_afetada: e.target.value })}
                placeholder="Ex: 2"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Tipo</div>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {editandoId && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Status</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                  {STATUS_LISTA.map(s => <option key={s} value={s}>{STATUS_COR[s]?.label || s}</option>)}
                </select>
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Descrição da ocorrência *</div>
              <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observações</div>
              <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={salvar} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                {editandoId ? 'Salvar alterações' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
