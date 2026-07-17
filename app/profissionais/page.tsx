'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { registrarHistorico } from '../lib/historico'
import Sidebar from '../components/Sidebar'

interface Profissional {
  id: string
  nome: string
  tipo: string
  telefone: string
  whatsapp: string
  email: string
  observacoes: string
  ativo: boolean
  created_at: string
  data_nascimento: string | null
}

const TIPOS = ['Arquiteto(a)', 'Designer de Interiores', 'Decorador(a)', 'Engenheiro(a)', 'Outro']

const formVazio = {
  nome: '', tipo: 'Arquiteto(a)', telefone: '', whatsapp: '',
  email: '', observacoes: '', ativo: true, data_nascimento: '',
}

export default function Profissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)
  const [busca, setBusca] = useState('')
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [filtroAtivo, setFiltroAtivo] = useState<'ativos' | 'todos'>('ativos')
  const [salvando, setSalvando] = useState(false)
  const [aniversariantes, setAniversariantes] = useState<string[]>([])

  useEffect(() => { buscar() }, [])

  async function buscar() {
    setLoading(true)
    const { data } = await supabase.from('profissionais').select('*').order('nome').range(0, 9999)
    setProfissionais(data || [])
    const hoje = new Date()
    const anivs = (data || []).filter(p => {
      if (!p.data_nascimento) return false
      const nasc = new Date(p.data_nascimento + 'T12:00:00')
      return nasc.getDate() === hoje.getDate() && nasc.getMonth() === hoje.getMonth()
    })
    setAniversariantes(anivs.map(p => p.nome))
    setLoading(false)
  }

  function abrirNovo() {
    setEditandoId(null)
    setForm(formVazio)
    setShowForm(true)
  }

  function abrirEdicao(p: Profissional) {
    setEditandoId(p.id)
    setForm({
      nome: p.nome || '',
      tipo: p.tipo || 'Arquiteto(a)',
      telefone: p.telefone || '',
      whatsapp: p.whatsapp || '',
      email: p.email || '',
      observacoes: p.observacoes || '',
      ativo: p.ativo ?? true,
      data_nascimento: p.data_nascimento || '',
    })
    setShowForm(true)
  }

  async function excluir(id: string, nome: string) {
    const { error } = await supabase.from('profissionais').delete().eq('id', id)
    if (error) {
      if (error.message.includes('foreign key')) return alert(`Não é possível excluir "${nome}" pois existem pedidos vinculados a este profissional.`)
      return alert('Erro ao excluir: ' + error.message)
    }
    await registrarHistorico({ tipo: 'profissional_excluido', descricao: `Profissional ${nome} excluído` })
    setExcluindoId(null)
    buscar()
  }

  async function salvar() {
    if (!form.nome.trim()) return alert('Nome é obrigatório')
    setSalvando(true)
    try {
      const payload = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        telefone: form.telefone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        observacoes: form.observacoes || null,
        ativo: form.ativo,
        data_nascimento: form.data_nascimento || null,
      }
      if (editandoId) {
        const { error } = await supabase.from('profissionais').update(payload).eq('id', editandoId)
        if (error) return alert('Erro: ' + error.message)
        await registrarHistorico({ tipo: 'profissional_editado', descricao: `Profissional ${form.nome} (${form.tipo}) editado` })
      } else {
        const { error } = await supabase.from('profissionais').insert([payload])
        if (error) return alert('Erro: ' + error.message)
        await registrarHistorico({ tipo: 'profissional_criado', descricao: `Profissional ${form.nome} (${form.tipo}) cadastrado` })
      }
      setShowForm(false)
      setForm(formVazio)
      setEditandoId(null)
      buscar()
    } finally {
      setSalvando(false)
    }
  }

  const filtrados = profissionais.filter(p => {
    const ok = p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.tipo?.toLowerCase().includes(busca.toLowerCase()) ||
      p.email?.toLowerCase().includes(busca.toLowerCase())
    if (!ok) return false
    if (filtroAtivo === 'ativos') return p.ativo
    return true
  })

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block' }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/profissionais" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Profissionais</span>
          <button onClick={abrirNovo} style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            + Novo profissional
          </button>
        </div>

        {aniversariantes.length > 0 && (
          <div style={{ margin: '16px 24px 0', padding: '12px 16px', background: '#FFF9E6', border: '1px solid #F0D060', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#7A5800' }}>
            <span style={{ fontSize: '18px' }}>🎂</span>
            <span><strong>Aniversariante{aniversariantes.length > 1 ? 's' : ''} de hoje:</strong> {aniversariantes.join(' e ')}</span>
          </div>
        )}

        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <input
              placeholder="Buscar por nome, tipo ou e-mail..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '280px', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '4px', background: '#fff', border: '0.5px solid #e8e7e3', borderRadius: '8px', padding: '3px' }}>
              {([
                { key: 'ativos', label: 'Ativos' },
                { key: 'todos', label: 'Todos' },
              ] as const).map(op => (
                <button key={op.key} onClick={() => setFiltroAtivo(op.key)}
                  style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '500', cursor: 'pointer', background: filtroAtivo === op.key ? '#1a1a2e' : 'transparent', color: filtroAtivo === op.key ? '#C9A84C' : '#888' }}>
                  {op.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#aaa' }}>{filtrados.length} profissional{filtrados.length !== 1 ? 'is' : ''}</span>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 140px 60px 130px', padding: '10px 16px', background: '#f7f6f3', fontSize: '11px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', gap: '8px' }}>
              <span>Nome</span><span>Tipo</span><span>Telefone</span><span>E-mail</span><span>Status</span><span></span>
            </div>

            {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Carregando...</div>}
            {!loading && filtrados.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum profissional cadastrado.</div>}

            {filtrados.map((p, i) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 140px 60px 130px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{p.nome}</div>
                  {p.observacoes && <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{p.observacoes}</div>}
                </div>
                <span style={{ fontSize: '12px', color: '#555' }}>{p.tipo}</span>
                <div>
                  <div style={{ fontSize: '12px', color: '#555' }}>{p.telefone || '—'}</div>
                  {p.whatsapp && p.whatsapp !== p.telefone && <div style={{ fontSize: '11px', color: '#888' }}>WA: {p.whatsapp}</div>}
                </div>
                <span style={{ fontSize: '12px', color: '#555' }}>{p.email || '—'}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '500', background: p.ativo ? '#EAF3DE' : '#f0efe9', color: p.ativo ? '#27500A' : '#888' }}>
                  {p.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => abrirEdicao(p)} style={{ padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}>Editar</button>
                  <button onClick={() => setExcluindoId(p.id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #f0c0c0', background: '#FCEBEB', fontSize: '12px', cursor: 'pointer', color: '#791F1F' }}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {excluindoId && (() => {
        const p = profissionais.find(x => x.id === excluindoId)!
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '380px' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e', marginBottom: '8px' }}>Excluir {p?.nome}?</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Esta ação não pode ser desfeita.</div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setExcluindoId(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
                <button onClick={() => excluir(excluindoId, p?.nome)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FCEBEB', color: '#791F1F', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Excluir</button>
              </div>
            </div>
          </div>
        )
      })()}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>{editandoId ? 'Editar profissional' : 'Novo profissional'}</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Nome *</label>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputStyle} placeholder="Nome completo" />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} style={inputStyle} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={inputStyle} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="email@exemplo.com" />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Data de Nascimento</label>
              <input type="date" value={form.data_nascimento} onChange={e => setForm({ ...form, data_nascimento: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Observações</label>
              <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3}
                style={{ ...inputStyle, resize: 'vertical' }} placeholder="Informações adicionais..." />
            </div>

            {editandoId && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} />
                <label htmlFor="ativo" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>Profissional ativo</label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : (editandoId ? 'Salvar alterações' : 'Cadastrar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
