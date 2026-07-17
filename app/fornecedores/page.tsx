'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { registrarHistorico } from '../lib/historico'
import Sidebar from '../components/Sidebar'

interface Fornecedor {
  id: string
  razao_social: string
  nome_fantasia: string
  telefone: string
  whatsapp: string
  email: string
  contato_comercial: string
  prazo_medio_prometido: number
}

const formVazio = {
  razao_social: '', nome_fantasia: '', cnpj: '',
  telefone: '', whatsapp: '', email: '',
  contato_comercial: '', prazo_medio_prometido: '', observacoes: ''
}

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
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
      const salvo = sessionStorage.getItem('operare_filtros_fornecedores')
      if (salvo) {
        const f = JSON.parse(salvo)
        if (f.busca !== undefined) setBusca(f.busca)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem('operare_filtros_fornecedores', JSON.stringify({ busca })) } catch {}
  }, [busca])

  useEffect(() => { setPagina(1) }, [busca])

  useEffect(() => { buscarFornecedores() }, [])

  async function buscarFornecedores() {
    setLoading(true)
    const { data } = await supabase.from('fornecedores').select('*').order('nome_fantasia').range(0, 9999)
    setFornecedores(data || [])
    setLoading(false)
  }

  function abrirNovo() {
    setEditandoId(null)
    setForm(formVazio)
    setShowForm(true)
  }

  function abrirEdicao(f: Fornecedor) {
    setEditandoId(f.id)
    setForm({
      razao_social: f.razao_social || '',
      nome_fantasia: f.nome_fantasia || '',
      cnpj: (f as any).cnpj || '',
      telefone: f.telefone || '',
      whatsapp: f.whatsapp || '',
      email: f.email || '',
      contato_comercial: f.contato_comercial || '',
      prazo_medio_prometido: f.prazo_medio_prometido ? String(f.prazo_medio_prometido) : '',
      observacoes: (f as any).observacoes || '',
    })
    setShowForm(true)
  }

  async function excluirFornecedor(id: string, nome: string) {
    const { error } = await supabase.from('fornecedores').delete().eq('id', id)
    if (error) {
      if (error.message.includes('foreign key')) return alert(`Não é possível excluir "${nome}" pois existem itens de pedido ou ATs vinculados a este fornecedor.`)
      return alert('Erro ao excluir: ' + error.message)
    }
    await registrarHistorico({ tipo: 'fornecedor_excluido', descricao: `Fornecedor ${nome} excluído` })
    setExcluindoId(null)
    buscarFornecedores()
  }

  async function salvarFornecedor() {
    if (!form.razao_social) return alert('Razão social é obrigatória')
    setSalvando(true)
    try {
      const payload = {
        ...form,
        prazo_medio_prometido: form.prazo_medio_prometido ? parseInt(form.prazo_medio_prometido) : null
      }
      if (editandoId) {
        const { error } = await supabase.from('fornecedores').update(payload).eq('id', editandoId)
        if (error) return alert('Erro ao atualizar: ' + error.message)
        await registrarHistorico({ tipo: 'fornecedor_editado', descricao: `Fornecedor ${form.nome_fantasia || form.razao_social} editado` })
      } else {
        const { error } = await supabase.from('fornecedores').insert([payload])
        if (error) return alert('Erro ao salvar: ' + error.message)
        await registrarHistorico({ tipo: 'fornecedor_criado', descricao: `Fornecedor ${form.nome_fantasia || form.razao_social} cadastrado` })
      }
      setShowForm(false)
      setForm(formVazio)
      setEditandoId(null)
      buscarFornecedores()
    } finally {
      setSalvando(false)
    }
  }

  const filtrados = fornecedores.filter(f =>
    f.nome_fantasia?.toLowerCase().includes(busca.toLowerCase()) ||
    f.razao_social?.toLowerCase().includes(busca.toLowerCase())
  )
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITEMS_POR_PAGINA))
  const paginados = filtrados.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA)

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/fornecedores" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Fornecedores</span>
          <button onClick={abrirNovo} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            + Novo fornecedor
          </button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          <input
            placeholder="Buscar fornecedor..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: '300px', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', marginBottom: '16px', outline: 'none' }}
          />

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 130px 80px 130px', padding: '10px 16px', background: '#f7f6f3', fontSize: '11px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', gap: '8px' }}>
              <span>Nome fantasia</span><span>Razão social</span><span>Telefone</span><span>Contato</span><span>Prazo</span><span></span>
            </div>

            {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Carregando...</div>}

            {!loading && filtrados.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum fornecedor cadastrado ainda.</div>
            )}

            {paginados.map((f, i) => (
              <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 130px 80px 130px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{f.nome_fantasia || f.razao_social}</span>
                <span style={{ fontSize: '12px', color: '#555' }}>{f.razao_social}</span>
                <span style={{ fontSize: '12px', color: '#555' }}>{f.telefone || '—'}</span>
                <span style={{ fontSize: '12px', color: '#555' }}>{f.contato_comercial || '—'}</span>
                <span style={{ fontSize: '12px', color: '#555', textAlign: 'center' }}>{f.prazo_medio_prometido ? `${f.prazo_medio_prometido}d` : '—'}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => abrirEdicao(f)} style={{ padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}>Editar</button>
                  <button onClick={() => setExcluindoId(f.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #f0c0c0', background: '#FCEBEB', fontSize: '12px', cursor: 'pointer', color: '#791F1F' }}>Excluir</button>
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
        const f = fornecedores.find(x => x.id === excluindoId)!
        const nome = f?.nome_fantasia || f?.razao_social || ''
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '380px' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e', marginBottom: '8px' }}>Excluir {nome}?</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Esta ação não pode ser desfeita.</div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setExcluindoId(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
                <button onClick={() => excluirFornecedor(excluindoId, nome)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FCEBEB', color: '#791F1F', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Excluir</button>
              </div>
            </div>
          </div>
        )
      })()}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '520px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{editandoId ? 'Editar fornecedor' : 'Novo fornecedor'}</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {[
              { label: 'Razão social *', field: 'razao_social' },
              { label: 'Nome fantasia', field: 'nome_fantasia' },
              { label: 'CNPJ', field: 'cnpj' },
              { label: 'Telefone', field: 'telefone' },
              { label: 'WhatsApp', field: 'whatsapp' },
              { label: 'E-mail', field: 'email' },
              { label: 'Contato comercial', field: 'contato_comercial' },
              { label: 'Prazo médio prometido (dias)', field: 'prazo_medio_prometido' },
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
              <button onClick={salvarFornecedor} disabled={salvando} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : (editandoId ? 'Salvar alterações' : 'Salvar fornecedor')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
