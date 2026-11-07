'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function GirisPage() {
  const [email, setEmail]           = useState('')
  const [sifre, setSifre]           = useState('')
  const [hata, setHata]             = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const router = useRouter()

  const girisYap = async (e: React.FormEvent) => {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')

    let sonuc
    try {
      sonuc = await supabase.auth.signInWithPassword({ email, password: sifre })
    } catch {
      setHata('Bağlantı hatası. Lütfen tekrar deneyin.')
      setYukleniyor(false)
      return
    }
    const { data, error } = sonuc

    if (error || !data?.user) {
      setHata('E-posta veya şifre hatalı.')
      setYukleniyor(false)
      return
    }

    const { data: profil } = await supabase
      .from('profiller').select('rol').eq('id', data.user.id).single()

    router.push(profil?.rol === 'yonetici' ? '/dashboard' : '/sakin')
  }

  const girdi: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1px solid #e5e7eb',
    borderRadius: '12px', fontSize: '14px', outline: 'none', background: '#fff', color: '#111827'
  }
  const etiket: React.CSSProperties = { display: 'block', fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '8px' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box', background: '#2e7d9f', backgroundImage: 'linear-gradient(135deg, #1a3c5e 0%, #2e7d9f 60%, #4db8d4 100%)', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', width: '80px', height: '80px', lineHeight: '80px', borderRadius: '16px', marginBottom: '16px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)' }}>
            <span style={{ fontSize: '36px' }}>🏢</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>Aidat Yönetim Sistemi</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,.75)' }}>Hesabınıza giriş yapın</p>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,.25)', padding: '32px' }}>
          <form onSubmit={girisYap} method="post" action="#">
            {hata && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', marginBottom: '20px' }}>
                ⚠️ {hata}
              </div>
            )}
            <div style={{ marginBottom: '20px' }}>
              <label style={etiket}>E-posta Adresi</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="ornek@site.com" autoComplete="username" style={girdi} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={etiket}>Şifre</label>
              <input type="password" value={sifre} onChange={e => setSifre(e.target.value)}
                required placeholder="••••••••" autoComplete="current-password" style={girdi} />
            </div>
            <button type="submit" disabled={yukleniyor}
              style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', background: yukleniyor ? '#9ca3af' : '#2e7d9f', backgroundImage: yukleniyor ? 'none' : 'linear-gradient(135deg, #1a3c5e, #2e7d9f)' }}>
              {yukleniyor ? 'Giriş yapılıyor...' : '🚀 Giriş Yap'}
            </button>
          </form>
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>© {new Date().getFullYear()} Aidat Yönetim Sistemi</p>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: '12px', marginTop: '24px' }}>Güvenli bağlantı ile korunmaktadır 🔒</p>
      </div>
    </div>
  )
}
