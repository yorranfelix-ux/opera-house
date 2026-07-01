'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

export default function Dashboard() {
  const [contadores, setContadores] = useState({
    pedidosAndamento: 0,
    pedidosAtrasados: 0,
    aptoEntrega: 0,
    atsAbertas: 0,
  })

  useEffect(() => {
    async function buscar() {
      const hoje = new Date().toISOString().split('T')[0]

      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id, status, prazo_prometido')
        .not('status', 'in', '(entregue,cancelado)')

      const { data: itens } = await supabase
        .from('itens_pedido')
        .select('id, apto_entrega, pedido_id')

      const { data: ats } = await supabase
        .from('assistencias_tecnicas')
        .select('id, status')
        .in('status', ['aberta', 'aguardando_retirada', 'em_reparo', 'enviado_fornecedor', 'aguardando_devolucao'])

      const pedidosAtivos = pedidos || []
      const itensData = itens || []

      const atrasados = pedidosAtivos.filter(p => p.prazo_prometido && p.prazo_prometido < hoje).length
      const aptoIds = new Set(itensData.filter(i => i.apto_entrega).map(i => i.pedido_id))

      setContadores({
        pedidosAndamento: pedidosAtivos.length,
        pedidosAtrasados: atrasados,
        aptoEntrega: aptoIds.size,
        atsAbertas: (ats || []).length,
      })
    }
    buscar()
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <Sidebar ativa="/dashboard" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '52px', background: '#fff', borderBottom: '0.5px solid #e8e7e3', display: 'flex', alignItems: 'center', padding: '0 22px', fontSize: '15px', fontWeight: '500', color: '#1a1a2e' }}>
          Dashboard operacional
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ background: '#1a1a2e', borderRadius: '14px', padding: '24px', marginBottom: '20px', color: '#fff' }}>
            <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Bem-vindo ao</div>
            <div style={{ fontSize: '22px', fontWeight: '500', marginBottom: '6px' }}>OPERA HOUSE</div>
            <div style={{ fontSize: '13px', color: '#6a6a8a' }}>Sistema operacional de pedidos — loja de móveis</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Pedidos em andamento', value: contadores.pedidosAndamento, color: '#C9A84C' },
              { label: 'Pedidos atrasados', value: contadores.pedidosAtrasados, color: '#A32D2D' },
              { label: 'Com item apto p/ agendar', value: contadores.aptoEntrega, color: '#3B6D11' },
              { label: 'ATs abertas', value: contadores.atsAbertas, color: '#185FA5' },
            ].map((card) => (
              <div key={card.label} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>{card.label}</div>
                <div style={{ fontSize: '28px', fontWeight: '500', color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
