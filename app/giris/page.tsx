'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function GirisPage() {
  const [email, setEmail]       = useState('')
  const [sifre, setSifre]       = useState('')
  const [hata, setHata]         = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const router  = useRouter()
  const supabase = createBrowserClient()

  const girisYap = async (e: React.FormEvent) => {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: sifre,
    })

    if (error) {
      setHata('E-posta veya şifre hatalı.')
      setYukleniyor(false)
      return
    }

    // Rolü kontrol et
    const { data: profil } = await supabase
      .from('profiller')
      .select('rol')
      .eq('id', data.user.id)
      .single()

    if (profil?.rol === 'yonetici') {
      router.push('/dashboard')
    } else {
      router.push('/sakin')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a3c5e, #2e7d9f)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)'
      }}>
        <div style={{textAlign:'center', marginBottom:'2rem'}}>
          <div style={{
            fontSize: '2.5rem',
            marginBottom: '8px'
          }}>🏢</div>
          <h1 style={{color:'#1a3c5e', fontSize:'1.4rem', margin:0}}>
            Aidat Yönetim Sistemi
          </h1>
          <p style={{color:'#6b7280', fontSize:'.85rem', margin:'4px 0 0'}}>
            Lütfen giriş yapın
          </p>
        </div>

        <form onSubmit={girisYap}>
          {hata && (
            <div style={{
              background:'#fee2e2', color:'#dc2626',
              padding:'10px 14px', borderRadius:'8px',
              marginBottom:'16px', fontSize:'.85rem'
            }}>
              {hata}
            </div>
          )}

          <div style={{marginBottom:'16px'}}>
            <label style={{
              display:'block', fontWeight:'700',
              fontSize:'.85rem', marginBottom:'6px', color:'#374151'
            }}>
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="ornek@site.com"
              style={{
                width:'100%', padding:'10px 14px',
                border:'1px solid #d1d5db', borderRadius:'10px',
                fontSize:'1rem', boxSizing:'border-box'
              }}
            />
          </div>

          <div style={{marginBottom:'24px'}}>
            <label style={{
              display:'block', fontWeight:'700',
              fontSize:'.85rem', marginBottom:'6px', color:'#374151'
            }}>
              Şifre
            </label>
            <input
              type="password"
              value={sifre}
              onChange={e => setSifre(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width:'100%', padding:'10px 14px',
                border:'1px solid #d1d5db', borderRadius:'10px',
                fontSize:'1rem', boxSizing:'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={yukleniyor}
            style={{
              width:'100%', padding:'12px',
              background: yukleniyor ? '#9ca3af' : '#1a3c5e',
              color:'#fff', border:'none', borderRadius:'10px',
              fontSize:'1rem', fontWeight:'700', cursor:'pointer'
            }}
          >
            {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}