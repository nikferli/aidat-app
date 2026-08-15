'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SakinPanel() {
  const [kullanici, setKullanici]     = useState<any>(null)
  const [daire, setDaire]             = useState<any>(null)
  const [tahakkuklar, setTahakkuklar] = useState<any[]>([])
  const [yukleniyor, setYukleniyor]   = useState(true)
  const router = useRouter()

  useEffect(() => {
    const yukle = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/giris'); return }

      const { data: profil } = await supabase
        .from('profiller')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profil) { router.push('/giris'); return }
      if (profil.rol === 'yonetici') { router.push('/dashboard'); return }
      setKullanici(profil)

      // Daire
      const { data: daireData } = await supabase
        .from('daireler')
        .select('*')
        .eq('kullanici_id', session.user.id)
        .single()

      if (daireData) {
        const { data: blokData } = await supabase
          .from('bloklar')
          .select('blok_adi')
          .eq('id', daireData.blok_id)
          .single()

        setDaire({ ...daireData, blok_adi: blokData?.blok_adi || '' })

        const { data: th } = await supabase
          .from('tahakkuklar')
          .select('*, aidat_turleri(tur_adi)')
          .eq('daire_id', daireData.id)
          .neq('durum', 'odendi')
          .order('donem_yil', { ascending: false })
        setTahakkuklar(th || [])
      }

      setYukleniyor(false)
    }
    yukle()
  }, [])

  const cikisYap = async () => {
    await supabase.auth.signOut()
    router.push('/giris')
  }

  const ayAdi = (ay: number) => {
    const aylar = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                   'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
    return aylar[ay]
  }

  if (yukleniyor) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'sans-serif', color:'#1a3c5e'}}>
      Yükleniyor...
    </div>
  )

  return (
    <div style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'sans-serif'}}>
      <div style={{background:'#1a3c5e', color:'#fff', padding:'12px 24px',
        display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <span style={{fontSize:'1.4rem'}}>🏢</span>
          <span style={{fontWeight:'700', fontSize:'1rem'}}>Aidat Yönetim Sistemi</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
          <span style={{fontSize:'.85rem', opacity:.8}}>👤 {kullanici?.ad_soyad}</span>
          <button onClick={cikisYap} style={{
            background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)',
            color:'#fff', padding:'6px 14px', borderRadius:'8px',
            cursor:'pointer', fontSize:'.82rem'}}>Çıkış</button>
        </div>
      </div>

      <div style={{padding:'32px 24px', maxWidth:'800px', margin:'0 auto'}}>

        <div style={{background:'#fff', borderRadius:'12px', padding:'20px',
          marginBottom:'24px', boxShadow:'0 2px 8px rgba(0,0,0,.08)',
          border:'1px solid #e5e7eb'}}>
          <h2 style={{color:'#1a3c5e', margin:'0 0 12px'}}>🏠 Daire Bilgilerim</h2>
          {daire ? (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
              <div>
                <div style={{color:'#6b7280', fontSize:'.8rem', fontWeight:'700'}}>BLOK</div>
                <div style={{fontSize:'1.1rem', fontWeight:'700', color:'#1a3c5e'}}>
                  {daire.blok_adi} Blok
                </div>
              </div>
              <div>
                <div style={{color:'#6b7280', fontSize:'.8rem', fontWeight:'700'}}>DAİRE NO</div>
                <div style={{fontSize:'1.1rem', fontWeight:'700', color:'#1a3c5e'}}>
                  {daire.daire_no}
                </div>
              </div>
              <div>
                <div style={{color:'#6b7280', fontSize:'.8rem', fontWeight:'700'}}>KAT</div>
                <div style={{fontSize:'1.1rem', fontWeight:'700', color:'#1a3c5e'}}>
                  {daire.kat}. Kat
                </div>
              </div>
              <div>
                <div style={{color:'#6b7280', fontSize:'.8rem', fontWeight:'700'}}>DURUM</div>
                <span style={{background:'#dcfce7', color:'#16a34a',
                  padding:'2px 10px', borderRadius:'20px',
                  fontSize:'.85rem', fontWeight:'700'}}>Aktif</span>
              </div>
            </div>
          ) : (
            <p style={{color:'#6b7280'}}>Henüz bir daireye atanmamışsınız.</p>
          )}
        </div>

        <div style={{background:'#fff', borderRadius:'12px', padding:'20px',
          boxShadow:'0 2px 8px rgba(0,0,0,.08)', border:'1px solid #e5e7eb'}}>
          <h2 style={{color:'#1a3c5e', margin:'0 0 16px'}}>📋 Açık Borçlarım</h2>
          {tahakkuklar.length === 0 ? (
            <div style={{textAlign:'center', padding:'32px',
              color:'#16a34a', fontWeight:'700'}}>
              ✅ Tüm borçlarınız ödenmiş!
            </div>
          ) : (
            <div>
              {tahakkuklar.map(t => (
                <div key={t.id} style={{display:'flex', justifyContent:'space-between',
                  alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f3f4f6'}}>
                  <div>
                    <div style={{fontWeight:'700', color:'#374151'}}>
                      {t.aidat_turleri?.tur_adi}
                    </div>
                    <div style={{color:'#6b7280', fontSize:'.82rem'}}>
                      {ayAdi(t.donem_ay)} {t.donem_yil}
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:'800', fontSize:'1.1rem', color:'#1a3c5e'}}>
                      {Number(t.tutar).toLocaleString('tr-TR')} ₺
                    </div>
                    <span style={{
                      background: t.durum==='gecikti' ? '#fee2e2' : '#fef3c7',
                      color: t.durum==='gecikti' ? '#dc2626' : '#d97706',
                      padding:'2px 8px', borderRadius:'20px',
                      fontSize:'.75rem', fontWeight:'700'}}>
                      {t.durum === 'gecikti' ? 'Gecikti' : 'Bekliyor'}
                    </span>
                  </div>
                </div>
              ))}
              <div style={{display:'flex', justifyContent:'space-between',
                padding:'16px 0 0', fontWeight:'800', fontSize:'1.1rem', color:'#1a3c5e'}}>
                <span>Toplam</span>
                <span>
                  {tahakkuklar.reduce((t,a) => t + Number(a.tutar), 0)
                    .toLocaleString('tr-TR')} ₺
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}