import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: bloklar, error } = await supabase
    .from('bloklar')
    .select('*')
    .order('blok_adi')

  return (
    <main style={{padding:'40px', fontFamily:'sans-serif'}}>
      <h1 style={{color:'#1a3c5e', marginBottom:'8px'}}>
        🏢 Aidat Yönetim Sistemi
      </h1>
      <p style={{color:'green', fontWeight:'bold', marginBottom:'24px'}}>
        ✅ Supabase bağlantısı çalışıyor!
      </p>

      {error && <p style={{color:'red'}}>Hata: {error.message}</p>}

      <h2>Bloklar</h2>
      <ul>
        {bloklar?.map(b => (
          <li key={b.id} style={{fontSize:'1.1rem', margin:'6px 0'}}>
            <strong>{b.blok_adi} Blok</strong> — {b.aciklama}
          </li>
        ))}
      </ul>
    </main>
  )
}