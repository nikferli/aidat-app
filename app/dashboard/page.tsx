'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [kullanici, setKullanici] = useState<any>(null)
  const [bloklar, setBloklar]     = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const router   = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    const yukle = async () => {
      // Oturum kontrolü
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/giris'); return }

      // Profil
      const { data: profil } = await supabase
        .from('profiller')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profil?.rol !== 'yonetici') { router.push('/giris'); return }
      setKullanici(profil)

      // Bloklar
      const { data: bl } = await supabase
        .from('bloklar')
        .select('*')
        .order('blok_adi')
      setBloklar(bl || [])

      setYukleniyor(false)
    }
    yukle()
  }, [])

  const cikisYap = async () => {
    await supabase.auth.signOut()
    router.push('/giris')
  }

  if (yukleniyor) return (
    <div style={{
      minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center',
      fontFamily:'sans-serif', color:'#1a3c5e'
    }}>
      Yükleniyor...
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'sans-serif'}}>

      {/* Topbar */}
      <div style={{
        background:'#1a3c5e', color:'#fff',
        padding:'12px 24px',
        display:'flex', justifyContent:'space-between', alignItems:'center'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <span style={{fontSize:'1.4rem'}}>🏢</span>
          <span style={{fontWeight:'700', fontSize:'1rem'}}>Aidat Yönetim Sistemi</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
          <span style={{fontSize:'.85rem', opacity:.8}}>
            👤 {kullanici?.ad_soyad}
          </span>
          <button
            onClick={cikisYap}
            style={{
              background:'rgba(255,255,255,.15)',
              border:'1px solid rgba(255,255,255,.3)',
              color:'#fff', padding:'6px 14px',
              borderRadius:'8px', cursor:'pointer',
              fontSize:'.82rem'
            }}
          >
            Çıkış
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div style={{padding:'32px 24px', maxWidth:'1200px', margin:'0 auto'}}>
        <h2 style={{color:'#1a3c5e', marginBottom:'24px'}}>
          Hoş geldiniz, {kullanici?.ad_soyad} 👋
        </h2>

        {/* Blok Kartları */}
        <h3 style={{color:'#374151', marginBottom:'16px'}}>Bloklar</h3>
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',
          gap:'16px', marginBottom:'32px'
        }}>
          {bloklar.map(b => (
            <div key={b.id} style={{
              background:'#fff', borderRadius:'12px',
              padding:'20px', textAlign:'center',
              boxShadow:'0 2px 8px rgba(0,0,0,.08)',
              border:'1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize:'2rem', fontWeight:'800',
                color:'#1a3c5e', marginBottom:'4px'
              }}>
                {b.blok_adi}
              </div>
              <div style={{color:'#6b7280', fontSize:'.85rem'}}>
                {b.aciklama}
              </div>
            </div>
          ))}
        </div>

        {/* Yakında */}
        <div style={{
          background:'#eff6ff', border:'1px solid #bfdbfe',
          borderRadius:'12px', padding:'20px'
        }}>
          <h3 style={{color:'#1e40af', margin:'0 0 8px'}}>🚀 Yakında Eklenecekler</h3>
          <ul style={{color:'#3730a3', margin:0, paddingLeft:'20px', lineHeight:'2'}}>
            <li>Sakin yönetimi</li>
            <li>Aidat tahakkuk ve takibi</li>
            <li>Ödeme bildirimleri</li>
            <li>Arıza / talep takibi</li>
            <li>Bildirim sistemi</li>
          </ul>
        </div>
      </div>
    </div>
  )
}