'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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
    if (editandoId) {
      const { error } = await supabase.from('clientes').update(form).eq('id', editandoId)
      if (error) return alert('Erro ao atualizar: ' + error.message)
    } else {
      const { error } = await supabase.from('clientes').insert([form])
      if (error) return alert('Erro ao salvar: ' + error.message)
    }
    setShowForm(false)
    setForm(formVazio)
    setEditandoId(null)
    buscarClientes()
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.cidade?.toLowerCase().includes(busca.toLowerCase())
  )

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
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 130px 180px 120px 60px 72px', padding: '10px 16px', background: '#f7f6f3', fontSize: '11px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', gap: '8px' }}>
              <span>Nome</span><span>Telefone</span><span>E-mail</span><span>Cidade</span><span>UF</span><span></span>
            </div>

            {loading && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Carregando...</div>
            )}

            {!loading && clientesFiltrados.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum cliente cadastrado ainda.</div>
            )}

            {clientesFiltrados.map((cliente, i) => (
              <div key={cliente.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 130px 180px 120px 60px 72px', padding: '12px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '8px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{cliente.nome}</span>
                <span style={{ fontSize: '12px', color: '#555' }}>{cliente.telefone || '—'}</span>
                <span style={{ fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cliente.email || '—'}</span>
                <span style={{ fontSize: '12px', color: '#555' }}>{cliente.cidade || '—'}</span>
                <span style={{ fontSize: '12px', color: '#555' }}>{cliente.estado || '—'}</span>
                <button
                  onClick={() => abrirEdicao(cliente)}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555', whiteSpace: 'nowrap' }}
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

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
              <button onClick={salvarCliente} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                {editandoId ? 'Salvar alterações' : 'Salvar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
