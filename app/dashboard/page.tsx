'use client'

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f7f6f3' }}>
      <div style={{ width: '200px', background: '#1a1a2e', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 20px 16px', fontSize: '18px', fontWeight: '500', color: '#fff' }}>
          Opera <span style={{ color: '#C9A84C' }}>House</span>
        </div>
        <div style={{ height: '0.5px', background: '#2d2d44', margin: '0 16px 12px' }} />
        {[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pedidos', href: '/pedidos' },
          { label: 'Clientes', href: '/clientes' },
          { label: 'Fornecedores', href: '/fornecedores' },
          { label: 'Assistência Técnica', href: '/assistencia' },
          { label: 'Ocorrências', href: '/ocorrencias' },
          { label: 'Entregas', href: '/entregas' },
        ].map((item) => (
          <a key={item.href} href={item.href} style={{ display: 'block', padding: '9px 20px', fontSize: '13px', color: '#8888aa', textDecoration: 'none', margin: '0 8px', borderRadius: '8px' }}>
            {item.label}
          </a>
        ))}
      </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Pedidos em andamento', value: '0', color: '#C9A84C' },
              { label: 'Pedidos atrasados', value: '0', color: '#A32D2D' },
              { label: 'Apto para agendar', value: '0', color: '#3B6D11' },
              { label: 'ATs abertas', value: '0', color: '#185FA5' },
            ].map((card) => (
              <div key={card.label} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>{card.label}</div>
                <div style={{ fontSize: '28px', fontWeight: '500', color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e8e7e3', padding: '20px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
            Nenhum pedido cadastrado ainda. Comece criando seu primeiro pedido.
          </div>
        </div>
      </div>
    </div>
  )
}