'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ── Yardımcı fonksiyonlar ──
const paraFormat = (tutar: number) =>
  tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'

const ayAdi = (ay: number) => {
  const aylar = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                 'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  return aylar[ay]
}

const gecikFaizi = (tutar: number, sonOdemeTarihi: string, yillikOran = 12) => {
  const bugun = new Date()
  const sonOdeme = new Date(sonOdemeTarihi)
  if (bugun <= sonOdeme) return 0
  const gun = Math.floor((bugun.getTime() - sonOdeme.getTime()) / (1000 * 60 * 60 * 24))
  return Math.round(tutar * (yillikOran / 100) / 365 * gun * 100) / 100
}

// ── Ödeme Geçmişi Component ──
function OdemeGecmisi({ daireId }: { daireId: number }) {
  const [odemeler, setOdemeler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yil, setYil] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!daireId) return
    const yukle = async () => {
      setYukleniyor(true)

      const { data: thData } = await supabase
        .from('tahakkuklar')
        .select('id, donem_yil, donem_ay, aidat_turleri(tur_adi)')
        .eq('daire_id', daireId)

      if (!thData || thData.length === 0) {
        setOdemeler([])
        setYukleniyor(false)
        return
      }

      const ids = thData.map((t: any) => t.id)
      const { data: odemeData } = await supabase
        .from('odemeler')
        .select('*')
        .in('tahakkuk_id', ids)
        .order('odeme_tarihi', { ascending: false })

      const thMap: any = {}
      thData.forEach((t: any) => { thMap[t.id] = t })

      const liste = (odemeData || [])
        .map((o: any) => ({ ...o, tahakkuk: thMap[o.tahakkuk_id] }))
        .filter((o: any) =>
          o.tahakkuk && new Date(o.odeme_tarihi).getFullYear() === yil
        )

      setOdemeler(liste)
      setYukleniyor(false)
    }
    yukle()
  }, [daireId, yil])

  const yontemler: any = {
    nakit: 'Nakit', havale: 'Havale', eft: 'EFT',
    kredi_karti: 'Kredi Kartı', diger: 'Diğer'
  }
  const toplam = odemeler.reduce((acc, o) => acc + Number(o.tutar), 0)

  if (yukleniyor) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
      Yükleniyor...
    </div>
  )

  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>🕐 Ödeme Geçmişim</h2>

      <div style={{
        background: '#fff', borderRadius: '12px', padding: '16px 20px',
        marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)',
        border: '1px solid #e5e7eb', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <div style={{
            color: '#6b7280', fontSize: '.75rem', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '.05em'
          }}>
            Toplam Ödenen ({yil})
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#16a34a' }}>
            {paraFormat(toplam)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '.85rem', color: '#6b7280', fontWeight: '600' }}>
            Yıl:
          </label>
          <select value={yil} onChange={e => setYil(parseInt(e.target.value))}
            style={{
              padding: '6px 12px', borderRadius: '8px',
              border: '1px solid #d1d5db', fontSize: '.85rem'
            }}>
            {[2026, 2025, 2024, 2023].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {odemeler.length === 0 ? (
        <div style={{
          background: '#f8fafc', borderRadius: '12px', padding: '40px',
          textAlign: 'center', color: '#6b7280'
        }}>
          Bu yılda ödeme kaydı bulunamadı.
        </div>
      ) : (
        <div style={{
          background: '#fff', borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,.06)',
          border: '1px solid #e5e7eb', overflow: 'hidden'
        }}>
          <div style={{
            background: '#16a34a', color: '#fff',
            padding: '12px 20px', fontWeight: '700'
          }}>
            🕐 Ödeme Kayıtlarım
          </div>
          {odemeler.map((o, i) => (
            <div key={o.id} style={{
              padding: '14px 20px',
              borderBottom: i < odemeler.length - 1 ? '1px solid #f3f4f6' : 'none',
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', gap: '12px', flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontWeight: '700', color: '#374151' }}>
                  {o.tahakkuk?.aidat_turleri?.tur_adi}
                </div>
                <div style={{ color: '#6b7280', fontSize: '.8rem' }}>
                  {ayAdi(o.tahakkuk?.donem_ay)} {o.tahakkuk?.donem_yil}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>
                  {new Date(o.odeme_tarihi).toLocaleDateString('tr-TR')}
                  &nbsp;·&nbsp;
                  {yontemler[o.odeme_yontemi] || o.odeme_yontemi}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#16a34a' }}>
                  {paraFormat(Number(o.tutar))}
                </div>
                <span style={{
                  background: '#dcfce7', color: '#16a34a',
                  padding: '1px 8px', borderRadius: '20px',
                  fontSize: '.72rem', fontWeight: '700'
                }}>✓ Ödendi</span>
              </div>
            </div>
          ))}
          <div style={{
            padding: '14px 20px', background: '#f0fdf4',
            display: 'flex', justifyContent: 'space-between',
            fontWeight: '800', color: '#16a34a', fontSize: '1rem'
          }}>
            <span>Toplam</span>
            <span>{paraFormat(toplam)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Ödeme Bildir Component ──
function OdemeBildir({ daireId }: { daireId: number }) {
  const [tahakkuklar, setTahakkuklar] = useState<any[]>([])
  const [gecmis, setGecmis] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [mesaj, setMesaj] = useState<{ tip: 'basari' | 'hata', metin: string } | null>(null)
  const [form, setForm] = useState({
    tahakkuk_id: '',
    tutar: '',
    odeme_tarihi: new Date().toISOString().split('T')[0],
    odeme_yontemi: 'havale',
    aciklama: ''
  })

  useEffect(() => {
    if (!daireId) return
    const yukle = async () => {
      const { data: th } = await supabase
        .from('tahakkuklar')
        .select('*, aidat_turleri(tur_adi)')
        .eq('daire_id', daireId)
        .neq('durum', 'odendi')
        .order('donem_yil').order('donem_ay')
      setTahakkuklar(th || [])

      const { data: gb } = await supabase
        .from('odeme_bildirimleri')
        .select('*, tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))')
        .eq('daire_id', daireId)
        .order('olusturma', { ascending: false })
        .limit(10)
      setGecmis(gb || [])
      setYukleniyor(false)
    }
    yukle()
  }, [daireId])

  const turSec = (id: string) => {
    const th = tahakkuklar.find(t => t.id === parseInt(id))
    setForm(f => ({ ...f, tahakkuk_id: id, tutar: th ? String(th.tutar) : '' }))
  }

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.tahakkuk_id) {
      setMesaj({ tip: 'hata', metin: 'Lütfen borç seçin.' })
      return
    }
    setGonderiliyor(true)
    setMesaj(null)

    const { data: { session } } = await supabase.auth.getSession()

    const { error } = await supabase
      .from('odeme_bildirimleri')
      .insert({
        kullanici_id: session?.user.id,
        daire_id: daireId,
        tahakkuk_id: parseInt(form.tahakkuk_id),
        tutar: parseFloat(form.tutar),
        odeme_tarihi: form.odeme_tarihi,
        odeme_yontemi: form.odeme_yontemi,
        aciklama: form.aciklama,
        durum: 'bekliyor'
      })

    if (error) {
      setMesaj({ tip: 'hata', metin: 'Gönderilemedi: ' + error.message })
    } else {
      setMesaj({
        tip: 'basari',
        metin: 'Bildiriminiz yöneticiye iletildi. Onaylandıktan sonra borcunuz kapanacak.'
      })
      setForm(f => ({ ...f, tahakkuk_id: '', tutar: '', aciklama: '' }))
      const { data: gb } = await supabase
        .from('odeme_bildirimleri')
        .select('*, tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))')
        .eq('daire_id', daireId)
        .order('olusturma', { ascending: false })
        .limit(10)
      setGecmis(gb || [])
    }
    setGonderiliyor(false)
  }

  const durumRenk: any = {
    bekliyor: { bg: '#fef3c7', renk: '#92400e', etiket: '⏳ Bekliyor' },
    onaylandi: { bg: '#dcfce7', renk: '#166534', etiket: '✅ Onaylandı' },
    reddedildi: { bg: '#fee2e2', renk: '#991b1b', etiket: '❌ Reddedildi' },
  }

  if (yukleniyor) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
      Yükleniyor...
    </div>
  )

  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>✉️ Ödeme Bildir</h2>

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
          <div style={{
            background: '#1a3c5e', color: '#fff',
            padding: '12px 20px', fontWeight: '700'
          }}>
            ✉️ Ödeme Yaptım, Bildir
          </div>
          <div style={{ padding: '20px' }}>
            {mesaj && (
              <div style={{
                background: mesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2',
                color: mesaj.tip === 'basari' ? '#166534' : '#991b1b',
                border: `1px solid ${mesaj.tip === 'basari' ? '#86efac' : '#fca5a5'}`,
                borderRadius: '8px', padding: '12px 16px',
                marginBottom: '16px', fontSize: '.85rem', fontWeight: '600'
              }}>
                {mesaj.metin}
              </div>
            )}

            {tahakkuklar.length === 0 ? (
              <div style={{
                textAlign: 'center', color: '#16a34a',
                padding: '24px', fontWeight: '700'
              }}>
                ✅ Açık borç bulunmuyor!
              </div>
            ) : (
              <form onSubmit={gonder}>
                {[
                  {
                    label: 'Hangi Borç İçin?', type: 'select',
                    value: form.tahakkuk_id,
                    onChange: (v: string) => turSec(v),
                    options: tahakkuklar.map(t => ({
                      value: String(t.id),
                      label: `${t.aidat_turleri?.tur_adi} — ${ayAdi(t.donem_ay)} ${t.donem_yil} — ${paraFormat(Number(t.tutar))}`
                    }))
                  },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: '14px' }}>
                    <label style={{
                      display: 'block', fontWeight: '700',
                      fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                    }}>{f.label}</label>
                    <select value={f.value} onChange={e => f.onChange(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '8px',
                        border: '1px solid #d1d5db', fontSize: '.85rem'
                      }}>
                      <option value="">-- Seçin --</option>
                      {f.options?.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                ))}

                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block', fontWeight: '700',
                    fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                  }}>Ödediğim Tutar (₺)</label>
                  <input type="number" step="0.01" required
                    value={form.tutar}
                    onChange={e => setForm(f => ({ ...f, tutar: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #d1d5db', fontSize: '.85rem',
                      boxSizing: 'border-box'
                    }} />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block', fontWeight: '700',
                    fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                  }}>Ödeme Tarihi</label>
                  <input type="date" required value={form.odeme_tarihi}
                    onChange={e => setForm(f => ({ ...f, odeme_tarihi: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #d1d5db', fontSize: '.85rem',
                      boxSizing: 'border-box'
                    }} />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block', fontWeight: '700',
                    fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                  }}>Ödeme Yöntemi</label>
                  <select value={form.odeme_yontemi}
                    onChange={e => setForm(f => ({ ...f, odeme_yontemi: e.target.value }))}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #d1d5db', fontSize: '.85rem'
                    }}>
                    <option value="havale">Havale</option>
                    <option value="eft">EFT</option>
                    <option value="nakit">Nakit</option>
                    <option value="kredi_karti">Kredi Kartı</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block', fontWeight: '700',
                    fontSize: '.82rem', color: '#374151', marginBottom: '6px'
                  }}>
                    Açıklama{' '}
                    <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span>
                  </label>
                  <textarea rows={3} value={form.aciklama}
                    onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
                    placeholder="Banka ref no, açıklama vb..."
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #d1d5db', fontSize: '.85rem',
                      boxSizing: 'border-box', resize: 'vertical'
                    }} />
                </div>

                <button type="submit" disabled={gonderiliyor}
                  style={{
                    width: '100%', padding: '11px',
                    background: gonderiliyor ? '#9ca3af' : '#1a3c5e',
                    color: '#fff', border: 'none', borderRadius: '10px',
                    fontSize: '.9rem', fontWeight: '700', cursor: 'pointer'
                  }}>
                  {gonderiliyor ? 'Gönderiliyor...' : '✉️ Bildirimi Gönder'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Geçmiş */}
        <div style={{
          background: '#fff', borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,.06)',
          border: '1px solid #e5e7eb', overflow: 'hidden'
        }}>
          <div style={{
            background: '#374151', color: '#fff',
            padding: '12px 20px', fontWeight: '700'
          }}>
            📋 Bildirim Geçmişim
          </div>
          {gecmis.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
              Henüz bildirim gönderilmedi.
            </div>
          ) : gecmis.map((b, i) => {
            const d = durumRenk[b.durum] || durumRenk.bekliyor
            return (
              <div key={b.id} style={{
                padding: '14px 20px',
                borderBottom: i < gecmis.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#374151', fontSize: '.85rem' }}>
                      {b.tahakkuklar?.aidat_turleri?.tur_adi}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '.75rem' }}>
                      {ayAdi(b.tahakkuklar?.donem_ay)} {b.tahakkuklar?.donem_yil}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '.72rem' }}>
                      {new Date(b.olusturma).toLocaleDateString('tr-TR')}
                    </div>
                    {b.red_neden && (
                      <div style={{
                        color: '#dc2626', fontSize: '.75rem',
                        marginTop: '4px', fontStyle: 'italic'
                      }}>
                        Red: {b.red_neden}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: '700', color: '#374151', fontSize: '.9rem' }}>
                      {paraFormat(Number(b.tutar))}
                    </div>
                    <span style={{
                      background: d.bg, color: d.renk,
                      padding: '2px 8px', borderRadius: '20px',
                      fontSize: '.7rem', fontWeight: '700',
                      display: 'inline-block', marginTop: '4px'
                    }}>
                      {d.etiket}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: '12px', padding: '16px 20px', marginTop: '20px'
      }}>
        <div style={{ fontWeight: '700', color: '#1e40af', marginBottom: '8px' }}>
          ℹ️ Nasıl Çalışır?
        </div>
        <ol style={{
          color: '#3730a3', margin: 0, paddingLeft: '20px',
          fontSize: '.85rem', lineHeight: '2'
        }}>
          <li>Havale/EFT yaptıktan sonra bu formu doldurun</li>
          <li>Yönetici bildiriminizi inceleyip onaylar</li>
          <li>Onaylandıktan sonra borcunuz kapanır</li>
        </ol>
      </div>
    </div>
  )
}

// ── Ana Sayfa ──
export default function SakinPanel() {
  const [kullanici, setKullanici] = useState<any>(null)
  const [daire, setDaire] = useState<any>(null)
  const [tahakkuklar, setTahakkuklar] = useState<any[]>([])
  const [odemeler, setOdemeler] = useState<any>({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aktifSayfa, setAktifSayfa] = useState('borclarim')
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

      const { data: daireData } = await supabase
        .from('daireler').select('*')
        .eq('kullanici_id', session.user.id).single()

      if (daireData) {
        const { data: blokData } = await supabase
          .from('bloklar').select('blok_adi')
          .eq('id', daireData.blok_id).single()
        setDaire({ ...daireData, blok_adi: blokData?.blok_adi || '' })

        const { data: th } = await supabase
          .from('tahakkuklar')
          .select('*, aidat_turleri(tur_adi)')
          .eq('daire_id', daireData.id)
          .neq('durum', 'odendi')
          .order('donem_yil').order('donem_ay')
        setTahakkuklar(th || [])

        if (th && th.length > 0) {
          const ids = th.map((t: any) => t.id)
          const { data: odemeData } = await supabase
            .from('odemeler').select('*').in('tahakkuk_id', ids)
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

  const toplamAna = tahakkuklar.reduce((acc, t) => {
    const odenen = odemeler[t.id] || 0
    return acc + (Number(t.tutar) - odenen)
  }, 0)

  const toplamFaiz = tahakkuklar.reduce((acc, t) => {
    const odenen = odemeler[t.id] || 0
    const kalan = Number(t.tutar) - odenen
    if (t.son_odeme_tarihi && kalan > 0)
      return acc + gecikFaizi(kalan, t.son_odeme_tarihi)
    return acc
  }, 0)

  if (yukleniyor) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'sans-serif', color: '#1a3c5e'
    }}>
      Yükleniyor...
    </div>
  )

  const menuler = [
    { id: 'borclarim', ikon: '📋', etiket: 'Borçlarım' },
    { id: 'odeme_gecmisi', ikon: '🕐', etiket: 'Ödeme Geçmişi' },
    { id: 'odeme_bildir', ikon: '✉️', etiket: 'Ödeme Bildir' },
    { id: 'ariza_bildir', ikon: '🔧', etiket: 'Arıza Bildir' },
    { id: 'duyurular', ikon: '📢', etiket: 'Duyurular' },
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
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', lineHeight: '1' }}>
              Aidat Yönetim Sistemi
            </div>
            {daire && (
              <div style={{ fontSize: '.72rem', opacity: .7 }}>
                {daire.blok_adi} Blok — Daire {daire.daire_no}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '.82rem', opacity: .8 }}>👤 {kullanici?.ad_soyad}</span>
          <button onClick={cikisYap} style={{
            background: 'rgba(255,255,255,.15)',
            border: '1px solid rgba(255,255,255,.3)',
            color: '#fff', padding: '5px 12px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '.78rem'
          }}>Çıkış</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: '200px', background: '#1a3c5e',
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

          {/* BORÇLARIM */}
          {aktifSayfa === 'borclarim' && (
            <div>
              <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📋 Borçlarım</h2>
              {!daire ? (
                <div style={{
                  background: '#fef3c7', border: '1px solid #fcd34d',
                  borderRadius: '10px', padding: '16px', color: '#92400e'
                }}>
                  Henüz bir daireye atanmadınız.
                </div>
              ) : tahakkuklar.length === 0 ? (
                <div style={{
                  background: '#dcfce7', border: '1px solid #86efac',
                  borderRadius: '10px', padding: '24px', textAlign: 'center',
                  color: '#166534', fontSize: '1.1rem', fontWeight: '700'
                }}>
                  ✅ Tüm borçlarınız ödenmiş! 🎉
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                    gap: '12px', marginBottom: '20px'
                  }}>
                    {[
                      { etiket: 'Ana Borç', deger: toplamAna, renk: '#dc2626' },
                      { etiket: 'Gecikme Faizi', deger: toplamFaiz, renk: '#d97706' },
                      { etiket: 'Genel Toplam', deger: toplamAna + toplamFaiz, renk: '#1a3c5e' },
                    ].map(k => (
                      <div key={k.etiket} style={{
                        background: '#fff', borderRadius: '12px', padding: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                        border: '1px solid #e5e7eb', textAlign: 'center'
                      }}>
                        <div style={{
                          color: '#6b7280', fontSize: '.75rem', fontWeight: '700',
                          textTransform: 'uppercase', letterSpacing: '.05em',
                          marginBottom: '4px'
                        }}>
                          {k.etiket}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: k.renk }}>
                          {paraFormat(k.deger)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: '#fff', borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                    border: '1px solid #e5e7eb', overflow: 'hidden'
                  }}>
                    <div style={{
                      background: '#dc2626', color: '#fff',
                      padding: '12px 20px', fontWeight: '700'
                    }}>
                      📋 Bekleyen Borçlarım
                    </div>
                    {tahakkuklar.map((t, i) => {
                      const odenen = odemeler[t.id] || 0
                      const kalan = Number(t.tutar) - odenen
                      const faiz = t.son_odeme_tarihi && kalan > 0
                        ? gecikFaizi(kalan, t.son_odeme_tarihi) : 0
                      const gecikti = t.son_odeme_tarihi &&
                        new Date(t.son_odeme_tarihi) < new Date()
                      const kismi = odenen > 0
                      return (
                        <div key={t.id} style={{
                          padding: '14px 20px',
                          borderBottom: i < tahakkuklar.length - 1
                            ? '1px solid #f3f4f6' : 'none',
                          background: kismi ? '#fffbeb' : '#fff'
                        }}>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap'
                          }}>
                            <div>
                              <div style={{ fontWeight: '700', color: '#374151' }}>
                                {t.aidat_turleri?.tur_adi}
                              </div>
                              <div style={{ color: '#6b7280', fontSize: '.8rem' }}>
                                {ayAdi(t.donem_ay)} {t.donem_yil}
                              </div>
                              {t.son_odeme_tarihi && (
                                <div style={{
                                  color: gecikti ? '#dc2626' : '#6b7280',
                                  fontSize: '.75rem',
                                  fontWeight: gecikti ? '700' : '400'
                                }}>
                                  Son: {new Date(t.son_odeme_tarihi)
                                    .toLocaleDateString('tr-TR')}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {odenen > 0 && (
                                <div style={{ fontSize: '.8rem', marginBottom: '2px' }}>
                                  <span style={{ color: '#6b7280' }}>Ödenen: </span>
                                  <span style={{ color: '#16a34a', fontWeight: '700' }}>
                                    {paraFormat(odenen)}
                                  </span>
                                </div>
                              )}
                              {faiz > 0 && (
                                <div style={{ fontSize: '.8rem', marginBottom: '2px' }}>
                                  <span style={{ color: '#6b7280' }}>Faiz: </span>
                                  <span style={{ color: '#d97706', fontWeight: '700' }}>
                                    {paraFormat(faiz)}
                                  </span>
                                </div>
                              )}
                              <div style={{
                                fontWeight: '800', fontSize: '1.1rem', color: '#dc2626'
                              }}>
                                {paraFormat(kalan + faiz)}
                              </div>
                              <div style={{
                                display: 'flex', gap: '4px',
                                justifyContent: 'flex-end', marginTop: '2px'
                              }}>
                                {kismi && (
                                  <span style={{
                                    background: '#fef3c7', color: '#92400e',
                                    padding: '1px 6px', borderRadius: '20px',
                                    fontSize: '.7rem', fontWeight: '700'
                                  }}>Kısmi</span>
                                )}
                                <span style={{
                                  background: gecikti ? '#fee2e2' : '#fef3c7',
                                  color: gecikti ? '#dc2626' : '#d97706',
                                  padding: '1px 6px', borderRadius: '20px',
                                  fontSize: '.7rem', fontWeight: '700'
                                }}>
                                  {gecikti ? 'Gecikti' : 'Bekliyor'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div style={{
                      padding: '14px 20px', background: '#f8fafc',
                      display: 'flex', justifyContent: 'space-between',
                      fontWeight: '800', color: '#1a3c5e', fontSize: '1rem'
                    }}>
                      <span>Genel Toplam</span>
                      <span>{paraFormat(toplamAna + toplamFaiz)}</span>
                    </div>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '.8rem', marginTop: '12px' }}>
                    ℹ️ Ödeme için yöneticiyle iletişime geçin veya
                    "Ödeme Bildir" bölümünü kullanın.
                  </p>
                </>
              )}
            </div>
          )}

          {/* ÖDEME GEÇMİŞİ */}
          {aktifSayfa === 'odeme_gecmisi' && (
            <OdemeGecmisi daireId={daire?.id} />
          )}

          {/* ÖDEME BİLDİR */}
          {aktifSayfa === 'odeme_bildir' && (
            <OdemeBildir daireId={daire?.id} />
          )}

          {/* YAKINDA */}
          {aktifSayfa !== 'borclarim' &&
           aktifSayfa !== 'odeme_gecmisi' &&
           aktifSayfa !== 'odeme_bildir' && (
            <div style={{
              textAlign: 'center', padding: '60px 20px', color: '#6b7280'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚧</div>
              <h3 style={{ color: '#1a3c5e' }}>Yakında</h3>
              <p>Bu bölüm geliştiriliyor...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
