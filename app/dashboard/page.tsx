'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const paraFormat = (tutar: number) =>
  tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'

const ayAdi = (ay: number) => {
  const aylar = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                 'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  return aylar[ay]
}

export default function Dashboard() {
  const [kullanici, setKullanici]         = useState<any>(null)
  const [istatistik, setIstatistik]       = useState<any>({})
  const [sakinler, setSakinler]           = useState<any[]>([])
  const [bildirimler, setBildirimler]     = useState<any[]>([])
  const [arizalar, setArizalar]           = useState<any[]>([])
  const [daireler, setDaireler]           = useState<any[]>([])
  const [aidatTurleri, setAidatTurleri]   = useState<any[]>([])
  const [yukleniyor, setYukleniyor]       = useState(true)
  const [aktifSayfa, setAktifSayfa]       = useState('dashboard')
  const [tahakkukMesaj, setTahakkukMesaj] = useState<any>(null)
  const [tahakkukYukleniyor, setTahakkukYukleniyor] = useState(false)
  const [tahakkukForm, setTahakkukForm]   = useState({
    daire_id: '',
    tur_id: '',
    tutar: '',
    donem_yil: new Date().getFullYear(),
    donem_ay: new Date().getMonth() + 1,
    son_odeme_tarihi: '',
    toplu: false
  })
  const router = useRouter()

  useEffect(() => {
    const yukle = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/giris'); return }

      const { data: profil } = await supabase
        .from('profiller').select('*')
        .eq('id', session.user.id).single()
      if (profil?.rol !== 'yonetici') { router.push('/giris'); return }
      setKullanici(profil)

      // İstatistikler
      const [
        { count: toplamSakin },
        { count: toplamDaire },
        { count: dolDaire },
        { count: bekleyenBildirim },
        { count: acikAriza },
        { data: tahakkukData },
      ] = await Promise.all([
        supabase.from('profiller').select('*', { count: 'exact', head: true }).eq('rol', 'sakin'),
        supabase.from('daireler').select('*', { count: 'exact', head: true }),
        supabase.from('daireler').select('*', { count: 'exact', head: true }).eq('durum', 'dolu'),
        supabase.from('odeme_bildirimleri').select('*', { count: 'exact', head: true }).eq('durum', 'bekliyor'),
        supabase.from('ariza_talepler').select('*', { count: 'exact', head: true }).eq('durum', 'acik'),
        supabase.from('tahakkuklar').select('tutar, durum'),
      ])

      const toplamTahakkuk = tahakkukData?.reduce((a, t) => a + Number(t.tutar), 0) || 0
      const gecikmisTahakkuk = tahakkukData
        ?.filter(t => t.durum === 'gecikti')
        .reduce((a, t) => a + Number(t.tutar), 0) || 0

      setIstatistik({
        toplamSakin, toplamDaire, dolDaire,
        bekleyenBildirim, acikAriza,
        toplamTahakkuk, gecikmisTahakkuk
      })

      // Sakinler
      const { data: sakinData } = await supabase
        .from('profiller').select('*')
        .eq('rol', 'sakin').order('ad_soyad')
      setSakinler(sakinData || [])

      // Bekleyen bildirimler
      const { data: bildirimData } = await supabase
        .from('odeme_bildirimleri')
        .select('*, profiller(ad_soyad), tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))')
        .eq('durum', 'bekliyor')
        .order('olusturma', { ascending: false })
      setBildirimler(bildirimData || [])

      // Arıza talepler
      const { data: arizaData } = await supabase
        .from('ariza_talepler')
        .select('*, profiller(ad_soyad)')
        .eq('durum', 'acik')
        .order('olusturma', { ascending: false })
      setArizalar(arizaData || [])

      // Daireler
      const { data: daireData } = await supabase
        .from('daireler')
        .select('*, bloklar(blok_adi), profiller(ad_soyad)')
        .order('blok_id').order('daire_no')
      setDaireler(daireData || [])

      // Aidat türleri
      const { data: turData } = await supabase
        .from('aidat_turleri').select('*').eq('durum', 'aktif')
      setAidatTurleri(turData || [])

      setYukleniyor(false)
    }
    yukle()
  }, [])

  const cikisYap = async () => {
    await supabase.auth.signOut()
    router.push('/giris')
  }

  const bildirimOnayla = async (id: number, tahakkukId: number, tutar: number) => {
    await supabase.from('odemeler').insert({
      tahakkuk_id: tahakkukId,
      odeme_tarihi: new Date().toISOString().split('T')[0],
      tutar, odeme_yontemi: 'havale',
      aciklama: 'Sakin bildirimi onaylandı'
    })
    await supabase.from('odeme_bildirimleri').update({ durum: 'onaylandi' }).eq('id', id)
    const { data } = await supabase
      .from('odeme_bildirimleri')
      .select('*, profiller(ad_soyad), tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))')
      .eq('durum', 'bekliyor').order('olusturma', { ascending: false })
    setBildirimler(data || [])
    setIstatistik((s: any) => ({ ...s, bekleyenBildirim: Math.max(0, (s.bekleyenBildirim || 1) - 1) }))
  }

  const bildirimReddet = async (id: number) => {
    await supabase.from('odeme_bildirimleri').update({ durum: 'reddedildi' }).eq('id', id)
    const { data } = await supabase
      .from('odeme_bildirimleri')
      .select('*, profiller(ad_soyad), tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))')
      .eq('durum', 'bekliyor').order('olusturma', { ascending: false })
    setBildirimler(data || [])
    setIstatistik((s: any) => ({ ...s, bekleyenBildirim: Math.max(0, (s.bekleyenBildirim || 1) - 1) }))
  }

  const arizaDurumGuncelle = async (id: number, durum: string) => {
    await supabase.from('ariza_talepler').update({ durum }).eq('id', id)
    const { data } = await supabase
      .from('ariza_talepler').select('*, profiller(ad_soyad)')
      .eq('durum', 'acik').order('olusturma', { ascending: false })
    setArizalar(data || [])
  }

  const turSecildi = (turId: string) => {
    const tur = aidatTurleri.find(t => t.id === parseInt(turId))
    setTahakkukForm(f => ({
      ...f, tur_id: turId,
      tutar: tur ? String(tur.varsayilan_tutar) : ''
    }))
  }

  const tahakkukKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    setTahakkukYukleniyor(true)
    setTahakkukMesaj(null)

    const hedefDaireler = tahakkukForm.toplu
      ? daireler.filter(d => d.durum === 'dolu')
      : daireler.filter(d => d.id === parseInt(tahakkukForm.daire_id))

    if (hedefDaireler.length === 0) {
      setTahakkukMesaj({ tip: 'hata', metin: 'Daire bulunamadı.' })
      setTahakkukYukleniyor(false)
      return
    }

    let basarili = 0, atlailan = 0

    for (const daire of hedefDaireler) {
      const { error } = await supabase.from('tahakkuklar').insert({
        daire_id: daire.id,
        tur_id: parseInt(tahakkukForm.tur_id),
        donem_yil: tahakkukForm.donem_yil,
        donem_ay: tahakkukForm.donem_ay,
        tutar: parseFloat(tahakkukForm.tutar),
        son_odeme_tarihi: tahakkukForm.son_odeme_tarihi || null,
        durum: 'bekliyor'
      })
      if (error?.code === '23505') atlailan++
      else if (!error) basarili++
    }

    setTahakkukMesaj({
      tip: basarili > 0 ? 'basari' : 'hata',
      metin: `${basarili} tahakkuk oluşturuldu${atlailan > 0 ? `, ${atlailan} zaten mevcut (atlandı)` : ''}.`
    })
    setTahakkukYukleniyor(false)
  }

  if (yukleniyor) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'sans-serif', color: '#1a3c5e'
    }}>
      Yükleniyor...
    </div>
  )

  const menuler = [
    { id: 'dashboard',   ikon: '📊', etiket: 'Dashboard' },
    { id: 'sakinler',    ikon: '👥', etiket: 'Sakinler' },
    { id: 'tahakkuklar', ikon: '📋', etiket: 'Tahakkuklar' },
    { id: 'bildirimler', ikon: '✉️', etiket: `Ödeme Bildirimleri${(istatistik.bekleyenBildirim || 0) > 0 ? ` (${istatistik.bekleyenBildirim})` : ''}` },
    { id: 'arizalar',    ikon: '🔧', etiket: `Arıza Talepler${(istatistik.acikAriza || 0) > 0 ? ` (${istatistik.acikAriza})` : ''}` },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column'
    }}>
      {/* Topbar */}
      <div style={{
        background: '#1a3c5e', color: '#fff', padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🏢</span>
          <span style={{ fontWeight: '700', fontSize: '1rem' }}>
            Aidat Yönetim Sistemi — Admin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '.85rem', opacity: .8 }}>
            👤 {kullanici?.ad_soyad}
          </span>
          <button onClick={cikisYap} style={{
            background: 'rgba(255,255,255,.15)',
            border: '1px solid rgba(255,255,255,.3)',
            color: '#fff', padding: '6px 14px',
            borderRadius: '8px', cursor: 'pointer', fontSize: '.82rem'
          }}>Çıkış</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: '220px', background: '#1a3c5e',
          minHeight: 'calc(100vh - 49px)', padding: '16px 0', flexShrink: 0
        }}>
          {menuler.map(m => (
            <button key={m.id} onClick={() => setAktifSayfa(m.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 20px', border: 'none', cursor: 'pointer',
                background: aktifSayfa === m.id ? 'rgba(255,255,255,.15)' : 'transparent',
                color: aktifSayfa === m.id ? '#fff' : 'rgba(255,255,255,.7)',
                fontSize: '.85rem',
                fontWeight: aktifSayfa === m.id ? '700' : '400',
                borderLeft: aktifSayfa === m.id
                  ? '3px solid #f0a500' : '3px solid transparent',
              }}>
              {m.ikon} {m.etiket}
            </button>
          ))}
        </div>

        {/* İçerik */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>

          {/* DASHBOARD */}
          {aktifSayfa === 'dashboard' && (
            <div>
              <h2 style={{ color: '#1a3c5e', marginBottom: '24px' }}>
                Hoş geldiniz, {kullanici?.ad_soyad} 👋
              </h2>

              {/* Uyarılar */}
              {((istatistik.bekleyenBildirim || 0) > 0 || (istatistik.acikAriza || 0) > 0) && (
                <div style={{
                  background: '#fef3c7', border: '2px solid #f59e0b',
                  borderRadius: '12px', padding: '16px 20px', marginBottom: '24px'
                }}>
                  <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>
                    ⚠️ Dikkat Gerektiren Durumlar
                  </div>
                  {(istatistik.bekleyenBildirim || 0) > 0 && (
                    <div style={{ color: '#92400e', fontSize: '.9rem', marginBottom: '4px' }}>
                      • {istatistik.bekleyenBildirim} bekleyen ödeme bildirimi var
                      <button onClick={() => setAktifSayfa('bildirimler')} style={{
                        marginLeft: '8px', background: '#f59e0b',
                        color: '#fff', border: 'none', borderRadius: '6px',
                        padding: '2px 8px', cursor: 'pointer', fontSize: '.78rem'
                      }}>İncele →</button>
                    </div>
                  )}
                  {(istatistik.acikAriza || 0) > 0 && (
                    <div style={{ color: '#92400e', fontSize: '.9rem' }}>
                      • {istatistik.acikAriza} açık arıza talebi var
                      <button onClick={() => setAktifSayfa('arizalar')} style={{
                        marginLeft: '8px', background: '#f59e0b',
                        color: '#fff', border: 'none', borderRadius: '6px',
                        padding: '2px 8px', cursor: 'pointer', fontSize: '.78rem'
                      }}>İncele →</button>
                    </div>
                  )}
                </div>
              )}

              {/* İstatistik Kartları */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '16px', marginBottom: '32px'
              }}>
                {[
                  { etiket: 'Toplam Sakin',    deger: istatistik.toplamSakin || 0,                          renk: '#1a3c5e', ikon: '👥' },
                  { etiket: 'Dolu Daire',      deger: `${istatistik.dolDaire || 0}/${istatistik.toplamDaire || 0}`, renk: '#16a34a', ikon: '🏠' },
                  { etiket: 'Toplam Tahakkuk', deger: paraFormat(istatistik.toplamTahakkuk || 0),            renk: '#2e7d9f', ikon: '📋' },
                  { etiket: 'Gecikmiş Borç',   deger: paraFormat(istatistik.gecikmisTahakkuk || 0),          renk: '#dc2626', ikon: '⚠️' },
                  { etiket: 'Bekl. Bildirim',  deger: istatistik.bekleyenBildirim || 0,                     renk: '#d97706', ikon: '✉️' },
                  { etiket: 'Açık Arıza',      deger: istatistik.acikAriza || 0,                            renk: '#7c3aed', ikon: '🔧' },
                ].map(k => (
                  <div key={k.etiket} style={{
                    background: '#fff', borderRadius: '12px', padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                    border: '1px solid #e5e7eb', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{k.ikon}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: k.renk, marginBottom: '4px' }}>
                      {k.deger}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '.78rem', fontWeight: '600' }}>
                      {k.etiket}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bloklar */}
              <h3 style={{ color: '#374151', marginBottom: '16px' }}>🏢 Bloklar</h3>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px'
              }}>
                {['A','B','C','D'].map(b => (
                  <div key={b} style={{
                    background: '#fff', borderRadius: '12px', padding: '20px',
                    textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1a3c5e', marginBottom: '4px' }}>
                      {b}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '.85rem' }}>{b} Blok</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SAKİNLER */}
          {aktifSayfa === 'sakinler' && (
            <div>
              <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>👥 Sakin Listesi</h2>
              <div style={{
                background: '#fff', borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                border: '1px solid #e5e7eb', overflow: 'hidden'
              }}>
                <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
                  Toplam {sakinler.length} sakin
                </div>
                {sakinler.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                    Henüz sakin kaydı yok.
                  </div>
                ) : sakinler.map((s, i) => (
                  <div key={s.id} style={{
                    padding: '14px 20px',
                    borderBottom: i < sakinler.length - 1 ? '1px solid #f3f4f6' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#374151' }}>{s.ad_soyad}</div>
                      <div style={{ color: '#6b7280', fontSize: '.8rem' }}>{s.telefon || 'Telefon yok'}</div>
                    </div>
                    <span style={{
                      background: s.durum === 'aktif' ? '#dcfce7' : '#f3f4f6',
                      color: s.durum === 'aktif' ? '#166534' : '#6b7280',
                      padding: '2px 10px', borderRadius: '20px',
                      fontSize: '.75rem', fontWeight: '700'
                    }}>
                      {s.durum === 'aktif' ? '✓ Aktif' : 'Pasif'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAHAKKUKLAR */}
          {aktifSayfa === 'tahakkuklar' && (
            <div>
              <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📋 Tahakkuk Oluştur</h2>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '20px', alignItems: 'flex-start'
              }}>
                {/* Form */}
                <div style={{
                  background: '#fff', borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                  border: '1px solid #e5e7eb', overflow: 'hidden'
                }}>
                  <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
                    📋 Yeni Tahakkuk
                  </div>
                  <div style={{ padding: '20px' }}>
                    {tahakkukMesaj && (
                      <div style={{
                        background: tahakkukMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2',
                        color: tahakkukMesaj.tip === 'basari' ? '#166534' : '#991b1b',
                        borderRadius: '8px', padding: '12px 16px',
                        marginBottom: '16px', fontSize: '.85rem', fontWeight: '600'
                      }}>
                        {tahakkukMesaj.metin}
                      </div>
                    )}

                    <form onSubmit={tahakkukKaydet}>
                      {/* Toplu / Tekil */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{
                          display: 'block', fontWeight: '700',
                          fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                        }}>Kapsam</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[
                            { value: false, label: '🏠 Tek Daire' },
                            { value: true,  label: '🏢 Tüm Dolu Daireler' },
                          ].map(o => (
                            <button key={String(o.value)} type="button"
                              onClick={() => setTahakkukForm(f => ({ ...f, toplu: o.value }))}
                              style={{
                                flex: 1, padding: '8px', borderRadius: '8px',
                                cursor: 'pointer', fontSize: '.82rem', fontWeight: '700',
                                border: tahakkukForm.toplu === o.value
                                  ? '2px solid #1a3c5e' : '1px solid #d1d5db',
                                background: tahakkukForm.toplu === o.value ? '#eff6ff' : '#fff',
                                color: tahakkukForm.toplu === o.value ? '#1a3c5e' : '#6b7280'
                              }}>
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Daire seçimi */}
                      {!tahakkukForm.toplu && (
                        <div style={{ marginBottom: '14px' }}>
                          <label style={{
                            display: 'block', fontWeight: '700',
                            fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                          }}>Daire</label>
                          <select
                            value={tahakkukForm.daire_id}
                            onChange={e => setTahakkukForm(f => ({ ...f, daire_id: e.target.value }))}
                            required={!tahakkukForm.toplu}
                            style={{
                              width: '100%', padding: '9px 12px', borderRadius: '8px',
                              border: '1px solid #d1d5db', fontSize: '.85rem'
                            }}>
                            <option value="">-- Daire Seçin --</option>
                            {daireler.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.bloklar?.blok_adi} Blok - Daire {d.daire_no}
                                {d.profiller?.ad_soyad ? ` (${d.profiller.ad_soyad})` : ' (Boş)'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Aidat Türü */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{
                          display: 'block', fontWeight: '700',
                          fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                        }}>Aidat Türü</label>
                        <select
                          value={tahakkukForm.tur_id}
                          onChange={e => turSecildi(e.target.value)}
                          required
                          style={{
                            width: '100%', padding: '9px 12px', borderRadius: '8px',
                            border: '1px solid #d1d5db', fontSize: '.85rem'
                          }}>
                          <option value="">-- Tür Seçin --</option>
                          {aidatTurleri.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.tur_adi} ({paraFormat(Number(t.varsayilan_tutar))})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tutar */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{
                          display: 'block', fontWeight: '700',
                          fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                        }}>Tutar (₺)</label>
                        <input type="number" step="0.01" required
                          value={tahakkukForm.tutar}
                          onChange={e => setTahakkukForm(f => ({ ...f, tutar: e.target.value }))}
                          style={{
                            width: '100%', padding: '9px 12px', borderRadius: '8px',
                            border: '1px solid #d1d5db', fontSize: '.85rem',
                            boxSizing: 'border-box'
                          }} />
                      </div>

                      {/* Dönem */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{
                          display: 'block', fontWeight: '700',
                          fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                        }}>Dönem</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            value={tahakkukForm.donem_yil}
                            onChange={e => setTahakkukForm(f => ({ ...f, donem_yil: parseInt(e.target.value) }))}
                            style={{
                              flex: 1, padding: '9px 12px', borderRadius: '8px',
                              border: '1px solid #d1d5db', fontSize: '.85rem'
                            }}>
                            {[2024,2025,2026,2027].map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                          <select
                            value={tahakkukForm.donem_ay}
                            onChange={e => setTahakkukForm(f => ({ ...f, donem_ay: parseInt(e.target.value) }))}
                            style={{
                              flex: 1, padding: '9px 12px', borderRadius: '8px',
                              border: '1px solid #d1d5db', fontSize: '.85rem'
                            }}>
                            {Array.from({length:12},(_,i) => i+1).map(m => (
                              <option key={m} value={m}>{ayAdi(m)}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Son Ödeme */}
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'block', fontWeight: '700',
                          fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                        }}>
                          Son Ödeme Tarihi{' '}
                          <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span>
                        </label>
                        <input type="date"
                          value={tahakkukForm.son_odeme_tarihi}
                          onChange={e => setTahakkukForm(f => ({ ...f, son_odeme_tarihi: e.target.value }))}
                          style={{
                            width: '100%', padding: '9px 12px', borderRadius: '8px',
                            border: '1px solid #d1d5db', fontSize: '.85rem',
                            boxSizing: 'border-box'
                          }} />
                      </div>

                      <button type="submit" disabled={tahakkukYukleniyor}
                        style={{
                          width: '100%', padding: '11px',
                          background: tahakkukYukleniyor ? '#9ca3af' : '#1a3c5e',
                          color: '#fff', border: 'none', borderRadius: '10px',
                          fontSize: '.9rem', fontWeight: '700', cursor: 'pointer'
                        }}>
                        {tahakkukYukleniyor ? 'Kaydediliyor...' :
                          tahakkukForm.toplu ? '🏢 Tüm Dolu Dairelere Ekle' : '📋 Tahakkuk Ekle'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Bilgi */}
                <div>
                  <div style={{
                    background: '#fff', borderRadius: '12px', padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                    border: '1px solid #e5e7eb', marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: '700', color: '#1a3c5e', marginBottom: '12px' }}>
                      📊 Dolu Daireler ({daireler.filter(d => d.durum === 'dolu').length})
                    </div>
                    {daireler.filter(d => d.durum === 'dolu').map(d => (
                      <div key={d.id} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '.85rem'
                      }}>
                        <span style={{ fontWeight: '600' }}>
                          {d.bloklar?.blok_adi} Blok - Daire {d.daire_no}
                        </span>
                        <span style={{ color: '#6b7280' }}>
                          {d.profiller?.ad_soyad || 'Boş'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: '12px', padding: '16px'
                  }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', marginBottom: '8px' }}>
                      ℹ️ Bilgi
                    </div>
                    <ul style={{
                      color: '#3730a3', margin: 0, paddingLeft: '20px',
                      fontSize: '.85rem', lineHeight: '2'
                    }}>
                      <li>Aynı daire + tür + dönem kombinasyonu mükerrer oluşturulamaz</li>
                      <li>Toplu modda sadece dolu dairelere eklenir</li>
                      <li>Tür seçilince tutar otomatik gelir, değiştirilebilir</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ÖDEME BİLDİRİMLERİ */}
          {aktifSayfa === 'bildirimler' && (
            <div>
              <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>
                ✉️ Bekleyen Ödeme Bildirimleri
              </h2>
              {bildirimler.length === 0 ? (
                <div style={{
                  background: '#dcfce7', border: '1px solid #86efac',
                  borderRadius: '12px', padding: '32px', textAlign: 'center',
                  color: '#166534', fontWeight: '700'
                }}>
                  ✅ Bekleyen bildirim yok!
                </div>
              ) : bildirimler.map(b => (
                <div key={b.id} style={{
                  background: '#fff', borderRadius: '12px', padding: '20px',
                  marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                        {b.profiller?.ad_soyad}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '.85rem' }}>
                        {b.tahakkuklar?.aidat_turleri?.tur_adi} —
                        {ayAdi(b.tahakkuklar?.donem_ay)} {b.tahakkuklar?.donem_yil}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '.8rem' }}>
                        Yöntem: {b.odeme_yontemi} |
                        Tarih: {new Date(b.odeme_tarihi).toLocaleDateString('tr-TR')}
                      </div>
                      {b.aciklama && (
                        <div style={{ color: '#9ca3af', fontSize: '.78rem', marginTop: '4px' }}>
                          Not: {b.aciklama}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontWeight: '800', fontSize: '1.2rem',
                        color: '#16a34a', marginBottom: '8px'
                      }}>
                        {paraFormat(Number(b.tutar))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => bildirimOnayla(b.id, b.tahakkuk_id, b.tutar)}
                          style={{
                            background: '#16a34a', color: '#fff', border: 'none',
                            borderRadius: '8px', padding: '7px 14px',
                            cursor: 'pointer', fontSize: '.82rem', fontWeight: '700'
                          }}>✓ Onayla</button>
                        <button onClick={() => bildirimReddet(b.id)}
                          style={{
                            background: '#fee2e2', color: '#dc2626',
                            border: '1px solid #fca5a5', borderRadius: '8px',
                            padding: '7px 14px', cursor: 'pointer',
                            fontSize: '.82rem', fontWeight: '700'
                          }}>✗ Reddet</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ARIZA TALEPLERİ */}
          {aktifSayfa === 'arizalar' && (
            <div>
              <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>
                🔧 Açık Arıza Talepler
              </h2>
              {arizalar.length === 0 ? (
                <div style={{
                  background: '#dcfce7', border: '1px solid #86efac',
                  borderRadius: '12px', padding: '32px', textAlign: 'center',
                  color: '#166534', fontWeight: '700'
                }}>
                  ✅ Açık arıza talebi yok!
                </div>
              ) : arizalar.map(a => (
                <div key={a.id} style={{
                  background: '#fff', borderRadius: '12px', padding: '20px',
                  marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                  border: `1px solid ${a.oncelik === 'yuksek' ? '#fca5a5' : '#e5e7eb'}`
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{
                          background: '#f3f4f6', color: '#374151',
                          padding: '2px 8px', borderRadius: '20px',
                          fontSize: '.72rem', fontWeight: '700'
                        }}>{a.kategori}</span>
                        <span style={{
                          background: a.oncelik === 'yuksek' ? '#fee2e2' : '#dbeafe',
                          color: a.oncelik === 'yuksek' ? '#991b1b' : '#1e40af',
                          padding: '2px 8px', borderRadius: '20px',
                          fontSize: '.72rem', fontWeight: '700'
                        }}>{a.oncelik}</span>
                      </div>
                      <div style={{ fontWeight: '700', color: '#374151' }}>{a.baslik}</div>
                      <div style={{ color: '#6b7280', fontSize: '.82rem', marginTop: '4px' }}>
                        {a.aciklama}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '.75rem', marginTop: '4px' }}>
                        {a.profiller?.ad_soyad} | {new Date(a.olusturma).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button onClick={() => arizaDurumGuncelle(a.id, 'islemde')}
                        style={{
                          background: '#dbeafe', color: '#1e40af', border: 'none',
                          borderRadius: '8px', padding: '7px 14px',
                          cursor: 'pointer', fontSize: '.82rem', fontWeight: '700'
                        }}>⚙️ İşleme Al</button>
                      <button onClick={() => arizaDurumGuncelle(a.id, 'tamamlandi')}
                        style={{
                          background: '#dcfce7', color: '#166534', border: 'none',
                          borderRadius: '8px', padding: '7px 14px',
                          cursor: 'pointer', fontSize: '.82rem', fontWeight: '700'
                        }}>✅ Tamamlandı</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
