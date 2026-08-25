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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: sifre })

    if (error) {
      setHata('E-posta veya şifre hatalı.')
      setYukleniyor(false)
      return
    }

    const { data: profil } = await supabase
      .from('profiller').select('rol').eq('id', data.user.id).single()

    router.push(profil?.rol === 'yonetici' ? '/dashboard' : '/sakin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1a3c5e 0%, #2e7d9f 60%, #4db8d4 100%)' }}>

      {/* Kart */}
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.2)' }}>
            <span className="text-4xl">🏢</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Aidat Yönetim Sistemi</h1>
          <p className="text-white/70 text-sm mt-1">Hesabınıza giriş yapın</p>
        </div>

        {/* Form Kartı */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={girisYap} className="space-y-5">

            {hata && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <span>⚠️</span> {hata}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required placeholder="ornek@site.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#1a3c5e' } as any} />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Şifre
              </label>
              <input type="password" value={sifre}
                onChange={e => setSifre(e.target.value)}
                required placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#1a3c5e' } as any} />
            </div>

            <button type="submit" disabled={yukleniyor}
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
              style={{ background: yukleniyor ? '#9ca3af' : 'linear-gradient(135deg, #1a3c5e, #2e7d9f)' }}>
              {yukleniyor ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Giriş yapılıyor...
                </>
              ) : '🚀 Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Aidat Yönetim Sistemi
            </p>
          </div>
        </div>

        {/* Alt bilgi */}
        <p className="text-center text-white/50 text-xs mt-6">
          Güvenli bağlantı ile korunmaktadır 🔒
        </p>
      </div>
    </div>
  )
}