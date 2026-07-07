'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { registrarHistorico } from '../lib/historico'
import Sidebar from '../components/Sidebar'

interface Cliente {
  id: string
  nome: string
  telefone: string
  whatsapp: string
  email: string
  cidade: string
  estado: string
  created_at: string
}

const formVazio = {
  nome: '', telefone: '', whatsapp: '', email: '',
  endereco: '', numero: '', complemento: '', bairro: '',
  cidade: '', estado: '', cep: '', observacoes: ''
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [busca, setBusca] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [pagina, setPagina] = useState(1)
  const ITEMS_POR_PAGINA = 25

  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem('operare_filtros_clientes')
      if (salvo) {
        const f = JSON.parse(salvo)
        if (f.busca !== undefined) setBusca(f.busca)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem('operare_filtros_clientes', JSON.stringify({ busca })) } catch {}
  }, [busca])

  useEffect(() => { setPagina(1) }, [busca])

  useEffect(() => { buscarClientes() }, [])

  async function buscarClientes() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('nome')
    setClientes(data || [])
    setLoading(false)
  }

  function abrirNovo() {
    setEditandoId(null)
    setForm(formVazio)
    setShowForm(true)
  }

  function abrirEdicao(c: Cliente) {
    setEditandoId(c.id)
    setForm({
      nome: c.nome || '',
      telefone: (c as any).telefone || '',
      whatsapp: (c as any).whatsapp || '',
      email: c.email || '',
      endereco: (c as any).endereco || '',
      numero: (c as any).numero || '',
      complemento: (c as any).complemento || '',
      bairro: (c as any).bairro || '',
      cidade: c.cidade || '',
      estado: c.estado || '',
      cep: (c as any).cep || '',
      observacoes: (c as any).observacoes || '',
    })
    setShowForm(true)
  }

  async function salvarCliente() {
    if (!form.nome) return alert('Nome é obrigatório')
    setSalvando(true)
    try {
      if (editandoId) {
        const { error } = await supabase.from('clientes').update(form).eq('id', editandoId)
        if (error) return alert('Erro ao atualizar: ' + error.message)
        await registrarHistorico({ tipo: 'cliente_editado', descricao: `Cliente ${form.nome} editado` })
      } else {
        const { error } = await supabase.from('clientes').insert([form])
        if (error) return alert('Erro ao salvar: ' + error.message)
        await registrarHistorico({ tipo: 'cliente_criado', descricao: `Cliente ${form.nome} cadastrado` })
      }
      setShowForm(false)
      setForm(formVazio)
      setEditandoId(null)
      buscarClientes()
    } finally {
      setSalvando(false)
    }
  }

  async function excluirCliente(id: string, nome: string) {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) {
      if (error.message.includes('foreign key')) return alert(`Não é possível excluir "${nome}" pois existem pedidos vinculados a este cliente.`)
      return alert('Erro ao excluir: ' + error.message)
    }
    await registrarHistorico({ tipo: 'cliente_excluido', descricao: `Cliente ${nome} excluído` })
    setExcluindoId(null)
    buscarClientes()
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.cidade?.toLowerCase().includes(busca.toLowerCase())
  )
  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / ITEMS_POR_PAGINA))
  const clientesPaginados = clientesFiltrados.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA)

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/clientes" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Clientes</span>
          <button onClick={abrirNovo} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            + Novo cliente
          </button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          <input
            placeholder="Buscar por nome ou cidade..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: '300px', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', marginBottom: '16px', outline: 'none' }}
          />

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 130px 180px 120px 60px 130px', padding: '10px 16px', background: '#f7f6f3', fontSize: '11px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', gap: '8px' }}>
              <span>Nome</span><span>Telefone</span><span>E-mail</span><span>Cidade</span><span>UF</span><span></span>
            </div>

            {loading && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Carregando...</div>
            )}

            {!loading && clientesFiltrados.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum cliente cadastrado ainda.</div>
            )}

            {clientesPaginados.map((cliente, i) => (
              <div key={cliente.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 130px 180px 120px 60px 130px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{cliente.nome}</span>
                <span style={{ fontSize: '12px', color: '#555' }}>{cliente.telefone || '—'}</span>
                <span style={{ fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cliente.email || '—'}</span>
                <span style={{ fontSize: '12px', color: '#555' }}>{cliente.cidade || '—'}</span>
                <span style={{ fontSize: '12px', color: '#555' }}>{cliente.estado || '—'}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => abrirEdicao(cliente)} style={{ padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}>Editar</button>
                  <button onClick={() => setExcluindoId(cliente.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #f0c0c0', background: '#FCEBEB', fontSize: '12px', cursor: 'pointer', color: '#791F1F' }}>Excluir</button>
                </div>
              </div>
            ))}

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9' }}>
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: pagina === 1 ? '#f7f6f3' : '#fff', fontSize: '12px', cursor: pagina === 1 ? 'default' : 'pointer', color: pagina === 1 ? '#ccc' : '#555' }}>
                  ← Anterior
                </button>
                <span style={{ fontSize: '12px', color: '#888' }}>Página {pagina} de {totalPaginas}</span>
                <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: pagina === totalPaginas ? '#f7f6f3' : '#fff', fontSize: '12px', cursor: pagina === totalPaginas ? 'default' : 'pointer', color: pagina === totalPaginas ? '#ccc' : '#555' }}>
                  Próxima →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {excluindoId && (() => {
        const c = clientes.find(x => x.id === excluindoId)!
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '380px' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e', marginBottom: '8px' }}>Excluir {c?.nome}?</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Esta ação não pode ser desfeita.</div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setExcluindoId(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
                <button onClick={() => excluirCliente(excluindoId, c?.nome)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FCEBEB', color: '#791F1F', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Excluir</button>
              </div>
            </div>
          </div>
        )
      })()}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '520px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{editandoId ? 'Editar cliente' : 'Novo cliente'}</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {[
              { label: 'Nome completo *', field: 'nome' },
              { label: 'Telefone', field: 'telefone' },
              { label: 'WhatsApp', field: 'whatsapp' },
              { label: 'E-mail', field: 'email' },
              { label: 'Endereço', field: 'endereco' },
              { label: 'Número', field: 'numero' },
              { label: 'Complemento', field: 'complemento' },
              { label: 'Bairro', field: 'bairro' },
              { label: 'Cidade', field: 'cidade' },
              { label: 'Estado (UF)', field: 'estado' },
              { label: 'CEP', field: 'cep' },
            ].map(({ label, field }) => (
              <div key={field} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                <input
                  value={form[field as keyof typeof form]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Observações</div>
              <textarea
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={salvarCliente} disabled={salvando} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : (editandoId ? 'Salvar alterações' : 'Salvar cliente')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
