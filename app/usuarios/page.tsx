'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { supabase } from '../lib/supabase'

interface Usuario {
  id: string
  nome: string
  cargo: string
  email: string
  created_at: string
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showSenhaModal, setShowSenhaModal] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', cargo: '' })
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({ nome: '', cargo: '', email: '', senha: '', confirmarSenha: '' })
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')

  useEffect(() => { buscarUsuarios() }, [])

  async function buscarUsuarios() {
    setLoading(true)
    const res = await fetch('/api/usuarios/listar')
    const data = await res.json()
    setUsuarios(data.usuarios || [])
    setLoading(false)
  }

  async function criarUsuario() {
    if (!form.nome || !form.email || !form.senha) return alert('Nome, e-mail e senha são obrigatórios')
    if (form.senha !== form.confirmarSenha) return alert('As senhas não coincidem')
    if (form.senha.length < 6) return alert('A senha deve ter no mínimo 6 caracteres')

    setSalvando(true)
    const res = await fetch('/api/usuarios/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: form.nome, cargo: form.cargo, email: form.email, senha: form.senha }),
    })
    const data = await res.json()
    setSalvando(false)

    if (data.error) return alert('Erro: ' + data.error)

    setShowForm(false)
    setForm({ nome: '', cargo: '', email: '', senha: '', confirmarSenha: '' })
    buscarUsuarios()
  }

  async function editarUsuario() {
    if (!editForm.nome) return alert('Nome é obrigatório')
    setSalvando(true)
    const { error } = await supabase.from('profiles').update({ nome: editForm.nome, cargo: editForm.cargo }).eq('id', showEditModal)
    setSalvando(false)
    if (error) return alert('Erro: ' + error.message)
    setShowEditModal(null)
    buscarUsuarios()
  }

  async function redefinirSenha() {
    if (!novaSenha || novaSenha.length < 6) return alert('A senha deve ter no mínimo 6 caracteres')
    if (novaSenha !== confirmarNovaSenha) return alert('As senhas não coincidem')
    setSalvando(true)
    const res = await fetch('/api/usuarios/senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: showSenhaModal, novaSenha }),
    })
    const data = await res.json()
    setSalvando(false)
    if (data.error) return alert('Erro: ' + data.error)
    setShowSenhaModal(null)
    setNovaSenha('')
    setConfirmarNovaSenha('')
    alert('Senha alterada com sucesso!')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/usuarios" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>Usuários</span>
          <button onClick={() => setShowForm(true)}
            style={{ background: '#1a1a2e', color: '#C9A84C', border: 'none', padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
            + Novo usuário
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', fontSize: '13px', padding: '40px' }}>Carregando...</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 200px 220px', padding: '8px 16px', background: '#f7f6f3', fontSize: '10px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', gap: '12px' }}>
                <span>Nome</span><span>Cargo</span><span>E-mail</span><span></span>
              </div>
              {usuarios.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Nenhum usuário encontrado.</div>
              )}
              {usuarios.map((u, i) => (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 200px 220px', padding: '14px 16px', borderTop: '0.5px solid #f0efe9', alignItems: 'center', gap: '12px', background: i % 2 === 0 ? '#fff' : '#faf9f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#C9A84C', fontWeight: '600', flexShrink: 0 }}>
                      {u.nome?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{u.nome}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#555' }}>{u.cargo || '—'}</span>
                  <span style={{ fontSize: '12px', color: '#555' }}>{u.email}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setShowEditModal(u.id); setEditForm({ nome: u.nome, cargo: u.cargo || '' }) }}
                      style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}>
                      Editar
                    </button>
                    <button onClick={() => { setShowSenhaModal(u.id); setNovaSenha('') }}
                      style={{ padding: '5px 12px', borderRadius: '6px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#555' }}>
                      Redefinir senha
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>Novo usuário</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            {[
              { label: 'Nome completo *', field: 'nome', type: 'text' },
              { label: 'Cargo', field: 'cargo', type: 'text' },
              { label: 'E-mail *', field: 'email', type: 'email' },
              { label: 'Senha *', field: 'senha', type: 'password' },
              { label: 'Confirmar senha *', field: 'confirmarSenha', type: 'password' },
            ].map(({ label, field, type }) => (
              <div key={field} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                <input
                  type={type}
                  value={form[field as keyof typeof form]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={criarUsuario} disabled={salvando}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '360px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>Editar usuário</span>
              <button onClick={() => setShowEditModal(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Nome completo</div>
              <input
                type="text"
                value={editForm.nome}
                onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Cargo</div>
              <input
                type="text"
                value={editForm.cargo}
                onChange={e => setEditForm({ ...editForm, cargo: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={editarUsuario} disabled={salvando}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSenhaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '360px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a2e' }}>Redefinir senha</span>
              <button onClick={() => setShowSenhaModal(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Nova senha</div>
              <input
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #e8e7e3', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Confirmar nova senha</div>
              <input
                type="password"
                value={confirmarNovaSenha}
                onChange={e => setConfirmarNovaSenha(e.target.value)}
                placeholder="Digite a senha novamente"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `0.5px solid ${confirmarNovaSenha && confirmarNovaSenha !== novaSenha ? '#f0c0c0' : '#e8e7e3'}`, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
              {confirmarNovaSenha && confirmarNovaSenha !== novaSenha && (
                <div style={{ fontSize: '11px', color: '#A32D2D', marginTop: '4px' }}>As senhas não coincidem</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSenhaModal(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '0.5px solid #e8e7e3', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={redefinirSenha} disabled={salvando}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#1a1a2e', color: '#C9A84C', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
