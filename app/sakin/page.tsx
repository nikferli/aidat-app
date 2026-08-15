'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// PHP'deki paraFormat fonksiyonu
const paraFormat = (tutar: number) =>
  tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'

// PHP'deki ayAdi fonksiyonu
const ayAdi = (ay: number) => {
  const aylar = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                 'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  return aylar[ay]
}

// PHP'deki gecikFaizi fonksiyonu
const gecikFaizi = (tutar: number, sonOdemeTarihi: string, yillikOran = 12) => {
  const bugun = new Date()
  const sonOdeme = new Date(sonOdemeTarihi)
  if (bugun <= sonOdeme) return 0
  const gun = Math.floor((bugun.getTime() - sonOdeme.getTime()) / (1000 * 60 * 60 * 24))
  return Math.round(tutar * (yillikOran / 100) / 365 * gun * 100) / 100
}

export default function SakinPanel() {
  const [kullanici, setKullanici]     = useState<any>(null)
  const [daire, setDaire]             = useState<any>(null)
  const [tahakkuklar, setTahakkuklar] = useState<any[]>([])
  const [odemeler, setOdemeler]       = useState<any>({})
  const [yukleniyor, setYukleniyor]   = useState(true)
  const [aktifSayfa, setAktifSayfa]   = useState('borclarim')
  const router = useRouter()

  useEffect(() => {
    const yukle = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/giris'); return }

      const { data: profil } = await supabase
        .from('profiller').select('*')
        .eq('id', session.user.id).single()
      if (!profil) { router.push('/giris'); return }
      if (profil.rol === 'yonetici') { router.push('/dashboard'); return }
      setKullanici(profil)

      // Daire
      const { data: daireData } = await supabase
        .from('daireler').select('*')
        .eq('kullanici_id', session.user.id).single()

      if (daireData) {
        const { data: blokData } = await supabase
          .from('bloklar').select('blok_adi')
          .eq('id', daireData.blok_id).single()
        setDaire({ ...daireData, blok_adi: blokData?.blok_adi || '' })

        // Tahakkuklar
        const { data: th } = await supabase
          .from('tahakkuklar')
          .select('*, aidat_turleri(tur_adi)')
          .eq('daire_id', daireData.id)
          .neq('durum', 'odendi')
          .order('donem_yil').order('donem_ay')
        setTahakkuklar(th || [])

        // Her tahakkuk için ödemeleri al
        if (th && th.length > 0) {
          const ids = th.map((t: any) => t.id)
          const { data: odemeData } = await supabase
            .from('odemeler')
            .select('*')
            .in('tahakkuk_id', ids)

          // tahakkuk_id'ye göre grupla
          const odemeMap: any = {}
          odemeData?.forEach((o: any) => {
            if (!odemeMap[o.tahakkuk_id]) odemeMap[o.tahakkuk_id] = 0
            odemeMap[o.tahakkuk_id] += Number(o.tutar)
          })
          setOdemeler(odemeMap)
        }
      }
      setYukleniyor(false)
    }
    yukle()
  }, [])

  const cikisYap = async () => {
    await supabase.auth.signOut()
    router.push('/giris')
  }

  // Toplam hesapla
  const toplamAna = tahakkuklar.reduce((acc, t) => {
    const odenen = odemeler[t.id] || 0
    return acc + (Number(t.tutar) - odenen)
  }, 0)

  const toplamFaiz = tahakkuklar.reduce((acc, t) => {
    const odenen = odemeler[t.id] || 0
    const kalan  = Number(t.tutar) - odenen
    if (t.son_odeme_tarihi && kalan > 0)
      return acc + gecikFaizi(kalan, t.son_odeme_tarihi)
    return acc
  }, 0)

  if (yukleniyor) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'sans-serif', color:'#1a3c5e'}}>
      Yükleniyor...
    </div>
  )

  // Sidebar linkleri
  const menuler = [
    { id:'borclarim',     ikon:'📋', etiket:'Borçlarım' },
    { id:'odeme_gecmisi', ikon:'🕐', etiket:'Ödeme Geçmişi' },
    { id:'odeme_bildir',  ikon:'✉️', etiket:'Ödeme Bildir' },
    { id:'ariza_bildir',  ikon:'🔧', etiket:'Arıza Bildir' },
    { id:'duyurular',     ikon:'📢', etiket:'Duyurular' },
  ]

  return (
    <div style={{minHeight:'100vh', background:'#f8fafc', fontFamily:'sans-serif',
      display:'flex', flexDirection:'column'}}>

      {/* Topbar */}
      <div style={{background:'#1a3c5e', color:'#fff', padding:'12px 24px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        position:'sticky', top:0, zIndex:100}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <span style={{fontSize:'1.4rem'}}>🏢</span>
          <div>
            <div style={{fontWeight:'700', fontSize:'1rem', lineHeight:1}}>
              Aidat Yönetim Sistemi
            </div>
            {daire && (
              <div style={{fontSize:'.72rem', opacity:.7}}>
                {daire.blok_adi} Blok — Daire {daire.daire_no}
              </div>
            )}
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <span style={{fontSize:'.82rem', opacity:.8}}>👤 {kullanici?.ad_soyad}</span>
          <button onClick={cikisYap} style={{
            background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)',
            color:'#fff', padding:'5px 12px', borderRadius:'8px',
            cursor:'pointer', fontSize:'.78rem'}}>Çıkış</button>
        </div>
      </div>

      <div style={{display:'flex', flex:1}}>

        {/* Sidebar */}
        <div style={{width:'200px', background:'#1a3c5e', minHeight:'calc(100vh - 49px)',
          padding:'16px 0', flexShrink:0}}>
          {menuler.map(m => (
            <button key={m.id} onClick={() => setAktifSayfa(m.id)}
              style={{
                display:'block', width:'100%', textAlign:'left',
                padding:'10px 20px', border:'none', cursor:'pointer',
                background: aktifSayfa === m.id ? 'rgba(255,255,255,.15)' : 'transparent',
                color: aktifSayfa === m.id ? '#fff' : 'rgba(255,255,255,.7)',
                fontSize:'.85rem', fontWeight: aktifSayfa === m.id ? '700' : '400',
                borderLeft: aktifSayfa === m.id ? '3px solid #f0a500' : '3px solid transparent',
              }}>
              {m.ikon} {m.etiket}
            </button>
          ))}
        </div>

        {/* İçerik */}
        <div style={{flex:1, padding:'24px', overflowY:'auto'}}>

          {/* BORÇLARIM */}
          {aktifSayfa === 'borclarim' && (
            <div>
              <h2 style={{color:'#1a3c5e', marginBottom:'20px'}}>📋 Borçlarım</h2>

              {!daire ? (
                <div style={{background:'#fef3c7', border:'1px solid #fcd34d',
                  borderRadius:'10px', padding:'16px', color:'#92400e'}}>
                  Henüz bir daireye atanmadınız. Yönetici ile iletişime geçin.
                </div>
              ) : tahakkuklar.length === 0 ? (
                <div style={{background:'#dcfce7', border:'1px solid #86efac',
                  borderRadius:'10px', padding:'24px', textAlign:'center',
                  color:'#166534', fontSize:'1.1rem', fontWeight:'700'}}>
                  ✅ Tüm borçlarınız ödenmiş! 🎉
                </div>
              ) : (
                <>
                  {/* Özet kartlar */}
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                    gap:'12px', marginBottom:'20px'}}>
                    {[
                      {etiket:'Ana Borç',       deger:toplamAna,            renk:'#dc2626'},
                      {etiket:'Gecikme Faizi',  deger:toplamFaiz,           renk:'#d97706'},
                      {etiket:'Genel Toplam',   deger:toplamAna+toplamFaiz, renk:'#1a3c5e'},
                    ].map(k => (
                      <div key={k.etiket} style={{background:'#fff', borderRadius:'12px',
                        padding:'16px', boxShadow:'0 2px 8px rgba(0,0,0,.06)',
                        border:'1px solid #e5e7eb', textAlign:'center'}}>
                        <div style={{color:'#6b7280', fontSize:'.75rem',
                          fontWeight:'700', textTransform:'uppercase',
                          letterSpacing:'.05em', marginBottom:'4px'}}>
                          {k.etiket}
                        </div>
                        <div style={{fontSize:'1.2rem', fontWeight:'800', color:k.renk}}>
                          {paraFormat(k.deger)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Borç tablosu */}
                  <div style={{background:'#fff', borderRadius:'12px',
                    boxShadow:'0 2px 8px rgba(0,0,0,.06)', border:'1px solid #e5e7eb',
                    overflow:'hidden'}}>
                    <div style={{background:'#dc2626', color:'#fff',
                      padding:'12px 20px', fontWeight:'700'}}>
                      📋 Bekleyen Borçlarım
                    </div>
                    {tahakkuklar.map((t, i) => {
                      const odenen  = odemeler[t.id] || 0
                      const kalan   = Number(t.tutar) - odenen
                      const faiz    = t.son_odeme_tarihi && kalan > 0
                        ? gecikFaizi(kalan, t.son_odeme_tarihi) : 0
                      const gecikti = t.son_odeme_tarihi &&
                        new Date(t.son_odeme_tarihi) < new Date()
                      const kismi   = odenen > 0

                      return (
                        <div key={t.id} style={{
                          padding:'14px 20px',
                          borderBottom: i < tahakkuklar.length-1 ? '1px solid #f3f4f6' : 'none',
                          background: kismi ? '#fffbeb' : '#fff'
                        }}>
                          <div style={{display:'flex', justifyContent:'space-between',
                            alignItems:'flex-start', gap:'12px', flexWrap:'wrap'}}>
                            <div>
                              <div style={{fontWeight:'700', color:'#374151'}}>
                                {t.aidat_turleri?.tur_adi}
                              </div>
                              <div style={{color:'#6b7280', fontSize:'.8rem'}}>
                                {ayAdi(t.donem_ay)} {t.donem_yil}
                              </div>
                              {t.son_odeme_tarihi && (
                                <div style={{color: gecikti ? '#dc2626' : '#6b7280',
                                  fontSize:'.75rem', fontWeight: gecikti ? '700' : '400'}}>
                                  Son ödeme: {new Date(t.son_odeme_tarihi)
                                    .toLocaleDateString('tr-TR')}
                                </div>
                              )}
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{display:'flex', gap:'16px',
                                alignItems:'center', flexWrap:'wrap',
                                justifyContent:'flex-end'}}>
                                {odenen > 0 && (
                                  <div style={{fontSize:'.8rem'}}>
                                    <span style={{color:'#6b7280'}}>Ödenen: </span>
                                    <span style={{color:'#16a34a', fontWeight:'700'}}>
                                      {paraFormat(odenen)}
                                    </span>
                                  </div>
                                )}
                                {faiz > 0 && (
                                  <div style={{fontSize:'.8rem'}}>
                                    <span style={{color:'#6b7280'}}>Faiz: </span>
                                    <span style={{color:'#d97706', fontWeight:'700'}}>
                                      {paraFormat(faiz)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div style={{fontWeight:'800', fontSize:'1.1rem',
                                    color:'#dc2626'}}>
                                    {paraFormat(kalan + faiz)}
                                  </div>
                                  <div style={{display:'flex', gap:'4px',
                                    justifyContent:'flex-end', marginTop:'2px'}}>
                                    {kismi && (
                                      <span style={{background:'#fef3c7', color:'#92400e',
                                        padding:'1px 6px', borderRadius:'20px',
                                        fontSize:'.7rem', fontWeight:'700'}}>Kısmi</span>
                                    )}
                                    <span style={{
                                      background: gecikti ? '#fee2e2' : '#fef3c7',
                                      color: gecikti ? '#dc2626' : '#d97706',
                                      padding:'1px 6px', borderRadius:'20px',
                                      fontSize:'.7rem', fontWeight:'700'}}>
                                      {gecikti ? 'Gecikti' : 'Bekliyor'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Toplam */}
                    <div style={{padding:'14px 20px', background:'#f8fafc',
                      display:'flex', justifyContent:'space-between',
                      fontWeight:'800', color:'#1a3c5e', fontSize:'1rem'}}>
                      <span>Genel Toplam</span>
                      <span>{paraFormat(toplamAna + toplamFaiz)}</span>
                    </div>
                  </div>

                  <p style={{color:'#6b7280', fontSize:'.8rem', marginTop:'12px'}}>
                    ℹ️ Ödeme yapmak için lütfen site yöneticisiyle iletişime geçin
                    veya "Ödeme Bildir" bölümünü kullanın.
                  </p>
                </>
              )}
            </div>
          )}

          {/* YAKINDA */}
          {aktifSayfa !== 'borclarim' && (
            <div style={{textAlign:'center', padding:'60px 20px', color:'#6b7280'}}>
              <div style={{fontSize:'3rem', marginBottom:'16px'}}>🚧</div>
              <h3 style={{color:'#1a3c5e'}}>Yakında</h3>
              <p>Bu bölüm geliştiriliyor...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}