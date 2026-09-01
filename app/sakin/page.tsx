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

const gecikFaizi = (tutar: number, sonOdemeTarihi: string, aylikOran = 3) => {
  const bugun = new Date()
  const sonOdeme = new Date(sonOdemeTarihi)
  if (bugun <= sonOdeme) return 0
  const gun = Math.floor((bugun.getTime() - sonOdeme.getTime()) / (1000 * 60 * 60 * 24))
  return Math.round(tutar * (aylikOran / 100) / 30 * gun * 100) / 100
}

function OdemeGecmisi({ daireId, kullanici }: { daireId: number, kullanici: any }) {
  const [odemeler, setOdemeler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yil, setYil] = useState(new Date().getFullYear())
  

  
const makbuzAc = (odeme: any) => {
  const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8">
<title>Ödeme Makbuzu</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; color: #1f2937; }
  .wrap { max-width: 600px; margin: 40px auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #1a3c5e, #2e7d9f); color: #fff; padding: 28px 32px; }
  .header h2 { margin: 0 0 4px; font-size: 1.2rem; }
  .header p { margin: 0; opacity: .8; font-size: .85rem; }
  .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 14px; border-radius: 20px; font-weight: 700; font-size: .85rem; margin-top: 12px; }
  .body { padding: 28px 32px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: .9rem; }
  .row .label { color: #6b7280; }
  .row .value { font-weight: 700; }
  .total { display: flex; justify-content: space-between; padding: 14px 0; font-size: 1.1rem; font-weight: 800; color: #1a3c5e; border-top: 2px solid #1a3c5e; margin-top: 8px; }
  .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: .78rem; color: #9ca3af; }
  .makbuz-no { font-size: .78rem; opacity: .7; margin-top: 4px; }
  @media print { @page { size: A5; margin: 10mm } .no-print { display: none } }
</style></head>
<body>
  <div class="no-print" style="position:fixed;top:12px;right:16px;display:flex;gap:8px">
    <button onclick="window.close()" style="padding:7px 16px;background:#e5e7eb;border:none;border-radius:7px;cursor:pointer;font-weight:700">← Geri</button>
    <button onclick="window.print()" style="padding:7px 16px;background:#1a3c5e;color:#fff;border:none;border-radius:7px;cursor:pointer;font-weight:700">🖨️ Yazdır / PDF</button>
  </div>
  <div class="wrap">
    <div class="header">
      <h2>🏢 Aidat Yönetim Sistemi</h2>
      <p>Resmi Ödeme Makbuzu</p>
      <div class="badge">✓ Ödeme Onaylandı</div>
      <div class="makbuz-no">Makbuz No: MKB-${odeme.id}-${new Date(odeme.odeme_tarihi).getFullYear()}</div>
    </div>
    <div class="body">
      <div class="row"><span class="label">Sakin</span><span class="value">${kullanici?.ad_soyad || '—'}</span></div>
      <div class="row"><span class="label">Aidat Türü</span><span class="value">${odeme.tahakkuk?.aidat_turleri?.tur_adi || '—'}</span></div>
      <div class="row"><span class="label">Dönem</span><span class="value">${ayAdi(odeme.tahakkuk?.donem_ay)} ${odeme.tahakkuk?.donem_yil}</span></div>
      <div class="row"><span class="label">Ödeme Tarihi</span><span class="value">${new Date(odeme.odeme_tarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
      <div class="row"><span class="label">Ödeme Yöntemi</span><span class="value">${({ nakit: 'Nakit', havale: 'Havale', eft: 'EFT', kredi_karti: 'Kredi Kartı', diger: 'Diğer' } as any)[odeme.odeme_yontemi] || odeme.odeme_yontemi}</span></div>
      ${odeme.aciklama ? `<div class="row"><span class="label">Açıklama</span><span class="value">${odeme.aciklama}</span></div>` : ''}
      <div class="total"><span>Ödenen Tutar</span><span>${paraFormat(Number(odeme.tutar))}</span></div>
    </div>
    <div class="footer">
      Bu makbuz elektronik olarak oluşturulmuştur.<br>
      Makbuz No: MKB-${odeme.id}-${new Date(odeme.odeme_tarihi).getFullYear()} · ${new Date().toLocaleDateString('tr-TR')}
    </div>
  </div>
</body></html>`

  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}  

  useEffect(() => {
    if (!daireId) return
    const yukle = async () => {
      setYukleniyor(true)
      const { data: thData } = await supabase.from('tahakkuklar').select('id, donem_yil, donem_ay, aidat_turleri(tur_adi)').eq('daire_id', daireId)
      if (!thData || thData.length === 0) { setOdemeler([]); setYukleniyor(false); return }
      const ids = thData.map((t: any) => t.id)
      const { data: odemeData } = await supabase.from('odemeler').select('*').in('tahakkuk_id', ids).order('odeme_tarihi', { ascending: false })
      const thMap: any = {}
      thData.forEach((t: any) => { thMap[t.id] = t })
      setOdemeler((odemeData || []).map((o: any) => ({ ...o, tahakkuk: thMap[o.tahakkuk_id] })).filter((o: any) => o.tahakkuk && new Date(o.odeme_tarihi).getFullYear() === yil))
      setYukleniyor(false)
    }
    yukle()
  }, [daireId, yil])

  const yontemler: any = { nakit: 'Nakit', havale: 'Havale', eft: 'EFT', kredi_karti: 'Kredi Kartı', diger: 'Diğer' }
  const toplam = odemeler.reduce((acc, o) => acc + Number(o.tutar), 0)

  if (yukleniyor) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Yükleniyor...</div>

  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>🕐 Ödeme Geçmişim</h2>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: '.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Toplam Ödenen ({yil})</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#16a34a' }}>{paraFormat(toplam)}</div>
        </div>
        <select value={yil} onChange={e => setYil(parseInt(e.target.value))} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {odemeler.length === 0 ? (
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#6b7280' }}>Bu yılda ödeme kaydı bulunamadı.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#16a34a', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>🕐 Ödeme Kayıtlarım</div>
          {odemeler.map((o, i) => (
            <div key={o.id} style={{ padding: '14px 20px', borderBottom: i < odemeler.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#374151' }}>{o.tahakkuk?.aidat_turleri?.tur_adi}</div>
                <div style={{ color: '#6b7280', fontSize: '.8rem' }}>{ayAdi(o.tahakkuk?.donem_ay)} {o.tahakkuk?.donem_yil}</div>
                <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{new Date(o.odeme_tarihi).toLocaleDateString('tr-TR')} · {yontemler[o.odeme_yontemi] || o.odeme_yontemi}</div>
              </div>
<div style={{ textAlign: 'right' }}>
  <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#16a34a' }}>{paraFormat(Number(o.tutar))}</div>
  <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>✓ Ödendi</span>
  <br />
  <button onClick={() => makbuzAc(o)} style={{ background: '#eff6ff', color: '#1a3c5e', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '.72rem', fontWeight: '700', marginTop: '4px' }}>
    🖨️ Makbuz
  </button>
</div>            
</div>
          ))}
          <div style={{ padding: '14px 20px', background: '#f0fdf4', display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#16a34a' }}>
            <span>Toplam</span><span>{paraFormat(toplam)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ArizaBildir({ daireId, kullaniciId }: { daireId: number, kullaniciId: string }) {
  const [talepler, setTalepler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [mesaj, setMesaj] = useState<any>(null)
  const [form, setForm] = useState({ kategori: '', baslik: '', aciklama: '', oncelik: 'normal' })
  const kategoriler = [
    { grup: 'Teknik', items: ['Asansör','Elektrik','Su / Tesisat','Isıtma / Doğalgaz','İnternet / Uydu'] },
    { grup: 'Ortak Alan', items: ['Temizlik','Bahçe / Peyzaj','Otopark','Güvenlik','Aydınlatma'] },
    { grup: 'Diğer', items: ['Gürültü Şikayeti','Öneri','Diğer'] },
  ]

  useEffect(() => {
    if (!kullaniciId) return
    supabase.from('ariza_talepler').select('*').eq('kullanici_id', kullaniciId).order('olusturma', { ascending: false })
      .then(({ data }) => { setTalepler(data || []); setYukleniyor(false) })
  }, [kullaniciId])

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.kategori) { setMesaj({ tip: 'hata', metin: 'Lütfen kategori seçin.' }); return }
    setGonderiliyor(true); setMesaj(null)
    const { error } = await supabase.from('ariza_talepler').insert({ kullanici_id: kullaniciId, daire_id: daireId, kategori: form.kategori, baslik: form.baslik, aciklama: form.aciklama, oncelik: form.oncelik, durum: 'acik' })
    if (error) { setMesaj({ tip: 'hata', metin: 'Gönderilemedi: ' + error.message }) }
    else {
      setMesaj({ tip: 'basari', metin: 'Bildiriminiz yöneticiye iletildi.' })
      setForm({ kategori: '', baslik: '', aciklama: '', oncelik: 'normal' })
      const { data } = await supabase.from('ariza_talepler').select('*').eq('kullanici_id', kullaniciId).order('olusturma', { ascending: false })
      setTalepler(data || [])
    }
    setGonderiliyor(false)
  }

  const durumRenk: any = { acik: { bg: '#fef3c7', renk: '#92400e', etiket: '🔓 Açık' }, islemde: { bg: '#dbeafe', renk: '#1e40af', etiket: '⚙️ İşlemde' }, tamamlandi: { bg: '#dcfce7', renk: '#166534', etiket: '✅ Tamamlandı' }, iptal: { bg: '#f3f4f6', renk: '#6b7280', etiket: '❌ İptal' } }

  if (yukleniyor) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Yükleniyor...</div>

  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>🔧 Arıza / Talep Bildir</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#d97706', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>🔧 Yeni Arıza / Talep</div>
          <div style={{ padding: '20px' }}>
            {mesaj && <div style={{ background: mesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: mesaj.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '.85rem', fontWeight: '600' }}>{mesaj.metin}</div>}
            <form onSubmit={gonder}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Kategori</label>
                <select value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))} required style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                  <option value="">-- Seçin --</option>
                  {kategoriler.map(g => <optgroup key={g.grup} label={g.grup}>{g.items.map(item => <option key={item} value={item}>{item}</option>)}</optgroup>)}
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Başlık</label>
                <input type="text" required value={form.baslik} onChange={e => setForm(f => ({ ...f, baslik: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Açıklama</label>
                <textarea rows={3} required value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Öncelik</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ value: 'dusuk', label: '🟢 Düşük' }, { value: 'normal', label: '🔵 Normal' }, { value: 'yuksek', label: '🔴 Yüksek' }].map(o => (
                    <button key={o.value} type="button" onClick={() => setForm(f => ({ ...f, oncelik: o.value }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '.8rem', fontWeight: '700', border: form.oncelik === o.value ? '2px solid #1a3c5e' : '1px solid #d1d5db', background: form.oncelik === o.value ? '#eff6ff' : '#fff', color: form.oncelik === o.value ? '#1a3c5e' : '#6b7280' }}>{o.label}</button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={gonderiliyor} style={{ width: '100%', padding: '11px', background: gonderiliyor ? '#9ca3af' : '#d97706', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '.9rem', fontWeight: '700', cursor: 'pointer' }}>
                {gonderiliyor ? 'Gönderiliyor...' : '🔧 Bildirimi Gönder'}
              </button>
            </form>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#374151', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>📋 Taleplerim</div>
          {talepler.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Henüz talep yok.</div>
            : talepler.map((t, i) => {
              const d = durumRenk[t.durum] || durumRenk.acik
              return (
                <div key={t.id} style={{ padding: '14px 20px', borderBottom: i < talepler.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ background: '#f3f4f6', color: '#374151', padding: '1px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>{t.kategori}</span>
                    <span style={{ background: d.bg, color: d.renk, padding: '1px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>{d.etiket}</span>
                  </div>
                  <div style={{ fontWeight: '700', color: '#374151', fontSize: '.85rem' }}>{t.baslik}</div>
                  <div style={{ color: '#6b7280', fontSize: '.78rem' }}>{t.aciklama}</div>
                  {t.yonetici_notu && <div style={{ background: '#f0fdf4', borderRadius: '6px', padding: '8px', marginTop: '6px', fontSize: '.78rem', color: '#166534' }}><strong>Yönetici:</strong> {t.yonetici_notu}</div>}
                  <div style={{ color: '#9ca3af', fontSize: '.72rem', marginTop: '4px' }}>{new Date(t.olusturma).toLocaleDateString('tr-TR')}</div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

function OdemeBildir({ daireId }: { daireId: number }) {
  const [tahakkuklar, setTahakkuklar]   = useState<any[]>([])
  const [gecmis, setGecmis]             = useState<any[]>([])
  const [yukleniyor, setYukleniyor]     = useState(true)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [mesaj, setMesaj]               = useState<any>(null)
  const [seciliIds, setSeciliIds]       = useState<Set<number>>(new Set())
  const [odemeForm, setOdemeForm]       = useState({ odeme_tarihi: new Date().toISOString().split('T')[0], odeme_yontemi: 'havale', aciklama: '' })

  useEffect(() => {
    if (!daireId) return
    const yukle = async () => {
      const { data: th } = await supabase.from('tahakkuklar').select('*, aidat_turleri(tur_adi)').eq('daire_id', daireId).neq('durum', 'odendi').order('donem_yil').order('donem_ay')
      setTahakkuklar(th || [])
      const { data: gb } = await supabase.from('odeme_bildirimleri').select('*, tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))').eq('daire_id', daireId).order('olusturma', { ascending: false }).limit(10)
      setGecmis(gb || [])
      setYukleniyor(false)
    }
    yukle()
  }, [daireId])

  const toggleSec = (id: number) => {
    setSeciliIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const tumunuSec = () => {
    if (seciliIds.size === tahakkuklar.length) setSeciliIds(new Set())
    else setSeciliIds(new Set(tahakkuklar.map(t => t.id)))
  }

  const seciliToplam = tahakkuklar.filter(t => seciliIds.has(t.id)).reduce((acc, t) => acc + Number(t.tutar), 0)

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (seciliIds.size === 0) { setMesaj({ tip: 'hata', metin: 'Lütfen en az bir borç seçin.' }); return }
    setGonderiliyor(true); setMesaj(null)
    const { data: { session } } = await supabase.auth.getSession()
    let basarili = 0, hata = 0
    for (const tahakkukId of Array.from(seciliIds)) {
      const th = tahakkuklar.find(t => t.id === tahakkukId)
      if (!th) continue
      const { error } = await supabase.from('odeme_bildirimleri').insert({
        kullanici_id: session?.user.id, daire_id: daireId, tahakkuk_id: tahakkukId,
        tutar: Number(th.tutar), odeme_tarihi: odemeForm.odeme_tarihi,
        odeme_yontemi: odemeForm.odeme_yontemi, aciklama: odemeForm.aciklama, durum: 'bekliyor'
      })
      if (error) hata++; else basarili++
    }
    if (basarili > 0) {
      setMesaj({ tip: 'basari', metin: `${basarili} borç için ödeme bildirimi yöneticiye iletildi.` })
      setSeciliIds(new Set())
      const { data: gb } = await supabase.from('odeme_bildirimleri').select('*, tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))').eq('daire_id', daireId).order('olusturma', { ascending: false }).limit(10)
      setGecmis(gb || [])
    } else {
      setMesaj({ tip: 'hata', metin: 'Gönderim sırasında hata oluştu.' })
    }
    setGonderiliyor(false)
  }

  const durumRenk: any = { bekliyor: { bg: '#fef3c7', renk: '#92400e', etiket: '⏳ Bekliyor' }, onaylandi: { bg: '#dcfce7', renk: '#166534', etiket: '✅ Onaylandı' }, reddedildi: { bg: '#fee2e2', renk: '#991b1b', etiket: '❌ Reddedildi' } }

  if (yukleniyor) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Yükleniyor...</div>

  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>✉️ Ödeme Bildir</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>✉️ Ödeme Yaptım</div>
          <div style={{ padding: '20px' }}>
            {/* IBAN Bilgisi */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', color: '#1e40af', marginBottom: '8px', fontSize: '.9rem' }}>🏦 Ödeme Hesap Bilgileri</div>
              <div style={{ fontSize: '.85rem', color: '#1e3a8a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#6b7280' }}>Banka</span>
                  <span style={{ fontWeight: '700' }}>Garanti Bankası</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#6b7280' }}>Hesap Sahibi</span>
                  <span style={{ fontWeight: '700' }}>Site Yönetimi</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>IBAN</span>
                  <span style={{ fontWeight: '800', letterSpacing: '1px', fontFamily: 'monospace' }}>TR00 0006 2000 0000 0000 0000 00</span>
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '.78rem', color: '#6b7280' }}>⚠️ Açıklama kısmına adınızı ve daire numaranızı yazmayı unutmayın.</div>
            </div>
            {mesaj && <div style={{ background: mesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: mesaj.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '.85rem', fontWeight: '600' }}>{mesaj.metin}</div>}
            {tahakkuklar.length === 0 ? <div style={{ textAlign: 'center', color: '#16a34a', padding: '24px', fontWeight: '700' }}>✅ Açık borç yok!</div> : (
              <form onSubmit={gonder}>
                {/* Borç Seçimi */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: '700', fontSize: '.82rem', color: '#374151' }}>Hangi Borçları Ödedim?</label>
                    <button type="button" onClick={tumunuSec} style={{ background: '#eff6ff', color: '#1a3c5e', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '.75rem', fontWeight: '700' }}>
                      {seciliIds.size === tahakkuklar.length ? '✕ Seçimi Kaldır' : '✓ Tümünü Seç'}
                    </button>
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    {tahakkuklar.map((t, i) => (
                      <div key={t.id} onClick={() => toggleSec(t.id)}
                        style={{ padding: '10px 14px', borderBottom: i < tahakkuklar.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: seciliIds.has(t.id) ? '#eff6ff' : '#fff', transition: 'background .15s' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${seciliIds.has(t.id) ? '#1a3c5e' : '#d1d5db'}`, background: seciliIds.has(t.id) ? '#1a3c5e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {seciliIds.has(t.id) && <span style={{ color: '#fff', fontSize: '.7rem', fontWeight: '800' }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '.85rem', color: '#374151' }}>{t.aidat_turleri?.tur_adi}</div>
                          <div style={{ color: '#6b7280', fontSize: '.75rem' }}>{ayAdi(t.donem_ay)} {t.donem_yil}{t.durum === 'gecikti' ? ' · ⚠️ Gecikmiş' : ''}</div>
                        </div>
                        <div style={{ fontWeight: '800', color: t.durum === 'gecikti' ? '#dc2626' : '#374151', fontSize: '.9rem' }}>{paraFormat(Number(t.tutar))}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seçili Toplam */}
                {seciliIds.size > 0 && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#166534', fontSize: '.85rem', fontWeight: '600' }}>{seciliIds.size} borç seçildi</span>
                    <span style={{ color: '#166534', fontWeight: '800', fontSize: '1rem' }}>{paraFormat(seciliToplam)}</span>
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Ödeme Tarihi</label>
                  <input type="date" required value={odemeForm.odeme_tarihi} onChange={e => setOdemeForm(f => ({ ...f, odeme_tarihi: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Ödeme Yöntemi</label>
                  <select value={odemeForm.odeme_yontemi} onChange={e => setOdemeForm(f => ({ ...f, odeme_yontemi: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                    <option value="havale">Havale</option><option value="eft">EFT</option><option value="nakit">Nakit</option><option value="kredi_karti">Kredi Kartı</option><option value="diger">Diğer</option>
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Açıklama <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span></label>
                  <textarea rows={2} value={odemeForm.aciklama} onChange={e => setOdemeForm(f => ({ ...f, aciklama: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                <button type="submit" disabled={gonderiliyor || seciliIds.size === 0}
                  style={{ width: '100%', padding: '11px', background: gonderiliyor || seciliIds.size === 0 ? '#9ca3af' : '#1a3c5e', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '.9rem', fontWeight: '700', cursor: seciliIds.size === 0 ? 'not-allowed' : 'pointer' }}>
                  {gonderiliyor ? 'Gönderiliyor...' : seciliIds.size === 0 ? 'Borç Seçin' : `✉️ ${seciliIds.size} Borç İçin Bildir (${paraFormat(seciliToplam)})`}
                </button>
              </form>
            )}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#374151', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>📋 Bildirim Geçmişim</div>
          {gecmis.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Henüz bildirim yok.</div>
            : gecmis.map((b, i) => {
              const d = durumRenk[b.durum] || durumRenk.bekliyor
              return (
                <div key={b.id} style={{ padding: '14px 20px', borderBottom: i < gecmis.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#374151', fontSize: '.85rem' }}>{b.tahakkuklar?.aidat_turleri?.tur_adi}</div>
                    <div style={{ color: '#6b7280', fontSize: '.75rem' }}>{ayAdi(b.tahakkuklar?.donem_ay)} {b.tahakkuklar?.donem_yil}</div>
                    <div style={{ color: '#9ca3af', fontSize: '.72rem' }}>{new Date(b.olusturma).toLocaleDateString('tr-TR')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#374151' }}>{paraFormat(Number(b.tutar))}</div>
                    <span style={{ background: d.bg, color: d.renk, padding: '2px 8px', borderRadius: '20px', fontSize: '.7rem', fontWeight: '700' }}>{d.etiket}</span>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

function Duyurular() {
  const [duyurular, setDuyurular] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  useEffect(() => {
    supabase.from('duyurular').select('*').order('olusturma', { ascending: false }).then(({ data }) => { setDuyurular(data || []); setYukleniyor(false) })
  }, [])
  if (yukleniyor) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Yükleniyor...</div>
  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📢 Duyurular</h2>
      {duyurular.length === 0 ? <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#6b7280' }}>Henüz duyuru yok.</div>
        : duyurular.map(d => (
          <div key={d.id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', borderLeft: '4px solid #1a3c5e' }}>
            <div style={{ fontWeight: '700', color: '#1a3c5e', marginBottom: '8px' }}>📢 {d.baslik}</div>
            {d.icerik && <div style={{ color: '#374151', fontSize: '.9rem', lineHeight: '1.6' }}>{d.icerik}</div>}
            <div style={{ color: '#9ca3af', fontSize: '.75rem', marginTop: '10px' }}>{new Date(d.olusturma).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        ))}
    </div>
  )
}

function Profil({ kullanici, setKullanici }: { kullanici: any, setKullanici: any }) {
  const [form, setForm] = useState({ ad_soyad: kullanici?.ad_soyad || '', telefon: kullanici?.telefon || '' })
  const [sifre, setSifre] = useState({ yeni: '', yeni2: '' })
  const [mesaj, setMesaj] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [istatistik, setIstatistik] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(kullanici?.avatar_url || null)
  const [avatarYukleniyor, setAvatarYukleniyor] = useState(false)

  useEffect(() => {
    const yukle = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: daireData } = await supabase.from('daireler').select('id').eq('kullanici_id', session.user.id).single()
      if (daireData) {
        const { data: th } = await supabase.from('tahakkuklar').select('id, tutar, durum').eq('daire_id', daireData.id)
        const ids = th?.map((t: any) => t.id) || []
        let toplamOdenen = 0, odemeSayisi = 0
        if (ids.length > 0) {
          const { data: od } = await supabase.from('odemeler').select('tutar').in('tahakkuk_id', ids)
          toplamOdenen = od?.reduce((acc, o) => acc + Number(o.tutar), 0) || 0
          odemeSayisi = od?.length || 0
        }
        const toplamBorc = th?.filter((t: any) => t.durum !== 'odendi').reduce((acc: number, t: any) => acc + Number(t.tutar), 0) || 0
        setIstatistik({ odemeSayisi, toplamBorc })
      }
    }
    yukle()
  }, [])

  const avatarYukle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0]
    if (!dosya) return
    if (dosya.size > 2 * 1024 * 1024) { setMesaj({ tip: 'hata', metin: 'Dosya 2MB\'dan küçük olmalı.' }); return }

    setAvatarYukleniyor(true)
    setMesaj(null)

    const uzanti = dosya.name.split('.').pop()
    const dosyaAdi = `${kullanici.id}/avatar.${uzanti}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(dosyaAdi, dosya, { upsert: true })

    if (uploadError) { setMesaj({ tip: 'hata', metin: 'Yükleme hatası: ' + uploadError.message }); setAvatarYukleniyor(false); return }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(dosyaAdi)
    const yeniUrl = urlData.publicUrl + '?t=' + Date.now()

    await supabase.from('profiller').update({ avatar_url: urlData.publicUrl }).eq('id', kullanici.id)
    setAvatarUrl(yeniUrl)
    setKullanici((k: any) => ({ ...k, avatar_url: urlData.publicUrl }))
    setMesaj({ tip: 'basari', metin: 'Profil fotoğrafı güncellendi!' })
    setAvatarYukleniyor(false)
  }

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    setYukleniyor(true); setMesaj(null)
    if (sifre.yeni && sifre.yeni !== sifre.yeni2) { setMesaj({ tip: 'hata', metin: 'Şifreler eşleşmiyor.' }); setYukleniyor(false); return }
    const { error } = await supabase.from('profiller').update({ ad_soyad: form.ad_soyad, telefon: form.telefon }).eq('id', kullanici.id)
    if (error) { setMesaj({ tip: 'hata', metin: error.message }); setYukleniyor(false); return }
    if (sifre.yeni) await supabase.auth.updateUser({ password: sifre.yeni })
    setKullanici((k: any) => ({ ...k, ad_soyad: form.ad_soyad, telefon: form.telefon }))
    setSifre({ yeni: '', yeni2: '' })
    setMesaj({ tip: 'basari', metin: 'Profil güncellendi.' })
    setYukleniyor(false)
  }

  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>👤 Profilim</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Sol: Profil Kartı */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', width: '90px', margin: '0 auto 12px' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profil" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1a3c5e' }} />
            ) : (
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#1a3c5e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', color: '#fff', fontWeight: '800' }}>
                {kullanici?.ad_soyad?.charAt(0)?.toUpperCase()}
              </div>
            )}
            {/* Fotoğraf yükle butonu */}
            <label style={{ position: 'absolute', bottom: 0, right: 0, background: '#f0a500', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
              <span style={{ fontSize: '.8rem' }}>{avatarYukleniyor ? '⏳' : '📷'}</span>
              <input type="file" accept="image/*" onChange={avatarYukle} style={{ display: 'none' }} disabled={avatarYukleniyor} />
            </label>
          </div>
          <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1a3c5e' }}>{kullanici?.ad_soyad}</div>
          <div style={{ color: '#6b7280', fontSize: '.82rem', marginBottom: '4px' }}>{kullanici?.telefon || 'Telefon yok'}</div>
<div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
  <span style={{ color: '#9ca3af', fontSize: '.75rem' }}>Fotoğraf değiştirmek için 📷 tıklayın</span>
  {avatarUrl && (
    <button type="button" onClick={async () => {
      await supabase.storage.from('avatars').remove([`${kullanici.id}/avatar.jpg`, `${kullanici.id}/avatar.png`, `${kullanici.id}/avatar.jpeg`, `${kullanici.id}/avatar.webp`])
      await supabase.from('profiller').update({ avatar_url: null }).eq('id', kullanici.id)
      setAvatarUrl(null)
      setKullanici((k: any) => ({ ...k, avatar_url: null }))
      setMesaj({ tip: 'basari', metin: 'Profil fotoğrafı kaldırıldı.' })
    }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '.72rem', fontWeight: '700' }}>
      🗑️ Kaldır
    </button>
  )}
</div>          {istatistik && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
              <div><div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#16a34a' }}>{istatistik.odemeSayisi}</div><div style={{ color: '#6b7280', fontSize: '.75rem' }}>Ödeme</div></div>
              <div><div style={{ fontWeight: '800', fontSize: '1rem', color: istatistik.toplamBorc > 0 ? '#dc2626' : '#16a34a' }}>{Number(istatistik.toplamBorc).toLocaleString('tr-TR')} ₺</div><div style={{ color: '#6b7280', fontSize: '.75rem' }}>Borç</div></div>
            </div>
          )}
        </div>

        {/* Sağ: Form */}
        <div>
          {mesaj && <div style={{ background: mesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: mesaj.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '.85rem', fontWeight: '600' }}>{mesaj.metin}</div>}
          <form onSubmit={kaydet}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', marginBottom: '14px' }}>👤 Kişisel Bilgiler</div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Ad Soyad</label>
                <input type="text" required value={form.ad_soyad} onChange={e => setForm(f => ({ ...f, ad_soyad: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Telefon</label>
                <input type="text" value={form.telefon} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', marginBottom: '14px' }}>🔒 Şifre Değiştir <span style={{ color: '#9ca3af', fontWeight: '400', fontSize: '.8rem' }}>(boş = değişmez)</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Yeni Şifre</label>
                  <input type="password" value={sifre.yeni} onChange={e => setSifre(s => ({ ...s, yeni: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Tekrar</label>
                  <input type="password" value={sifre.yeni2} onChange={e => setSifre(s => ({ ...s, yeni2: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <button type="submit" disabled={yukleniyor} style={{ padding: '11px 24px', background: yukleniyor ? '#9ca3af' : '#1a3c5e', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '.9rem', fontWeight: '700', cursor: 'pointer' }}>
              {yukleniyor ? 'Kaydediliyor...' : '💾 Kaydet'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Ekstre({ daireId, kullanici }: { daireId: number, kullanici: any }) {
  const [hareketler, setHareketler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtre, setFiltre] = useState({ yil_bas: new Date().getFullYear(), ay_bas: 1, yil_bitis: new Date().getFullYear(), ay_bitis: new Date().getMonth() + 1 })

  const yukle = async () => {
    if (!daireId) return
    setYukleniyor(true)
    const { data: thData } = await supabase.from('tahakkuklar').select('*, aidat_turleri(tur_adi)').eq('daire_id', daireId).gte('donem_yil', filtre.yil_bas).lte('donem_yil', filtre.yil_bitis).order('donem_yil').order('donem_ay')
    if (!thData || thData.length === 0) { setHareketler([]); setYukleniyor(false); return }
    const filtreli = thData.filter((t: any) => { const d = t.donem_yil * 100 + t.donem_ay; return d >= filtre.yil_bas * 100 + filtre.ay_bas && d <= filtre.yil_bitis * 100 + filtre.ay_bitis })
    const ids = filtreli.map((t: any) => t.id)
    const { data: odemeData } = await supabase.from('odemeler').select('tahakkuk_id, tutar').in('tahakkuk_id', ids)
    const odemeMap: any = {}
    odemeData?.forEach((o: any) => { if (!odemeMap[o.tahakkuk_id]) odemeMap[o.tahakkuk_id] = 0; odemeMap[o.tahakkuk_id] += Number(o.tutar) })
    setHareketler(filtreli.map((t: any) => ({ ...t, odenen: odemeMap[t.id] || 0, kalan: Math.max(0, Number(t.tutar) - (odemeMap[t.id] || 0)) })))
    setYukleniyor(false)
  }

  useEffect(() => { yukle() }, [daireId])

  const toplamTahakkuk = hareketler.reduce((acc, h) => acc + Number(h.tutar), 0)
  const toplamOdenen   = hareketler.reduce((acc, h) => acc + h.odenen, 0)
  const toplamKalan    = hareketler.reduce((acc, h) => acc + h.kalan, 0)
  const tahsilatOrani  = toplamTahakkuk > 0 ? Math.round(toplamOdenen / toplamTahakkuk * 100) : 100

  if (yukleniyor) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Yükleniyor...</div>

  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📄 Aidat Ekstresi</h2>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb' }}>
        <div style={{ fontWeight: '700', fontSize: '.85rem', color: '#374151', marginBottom: '12px' }}>📅 Dönem Seçin</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[{ label: 'Başlangıç Yılı', key: 'yil_bas', type: 'yil' }, { label: 'Başlangıç Ayı', key: 'ay_bas', type: 'ay' }, { label: 'Bitiş Yılı', key: 'yil_bitis', type: 'yil' }, { label: 'Bitiş Ayı', key: 'ay_bitis', type: 'ay' }].map(f => (
            <div key={f.key} style={{ flex: 1, minWidth: '110px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '.78rem', color: '#6b7280', marginBottom: '4px' }}>{f.label}</label>
              {f.type === 'yil' ? (
                <select value={(filtre as any)[f.key]} onChange={e => setFiltre(prev => ({ ...prev, [f.key]: parseInt(e.target.value) }))} style={{ width: '100%', padding: '7px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                  {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              ) : (
                <select value={(filtre as any)[f.key]} onChange={e => setFiltre(prev => ({ ...prev, [f.key]: parseInt(e.target.value) }))} style={{ width: '100%', padding: '7px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                  {Array.from({length:12},(_,i) => i+1).map(m => <option key={m} value={m}>{ayAdi(m)}</option>)}
                </select>
              )}
            </div>
          ))}
          <button onClick={yukle} style={{ padding: '9px 16px', background: '#1a3c5e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>🔍 Görüntüle</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[{ label: 'Tahakkuk', deger: toplamTahakkuk, renk: '#1a3c5e' }, { label: 'Ödenen', deger: toplamOdenen, renk: '#16a34a' }, { label: 'Kalan', deger: toplamKalan, renk: toplamKalan > 0 ? '#dc2626' : '#16a34a' }, { label: 'Oran', deger: null, renk: '#d97706' }].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: '.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: k.renk }}>{k.deger !== null ? Number(k.deger).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : `%${tahsilatOrani}`}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>📄 Ekstre — {ayAdi(filtre.ay_bas)} {filtre.yil_bas} / {ayAdi(filtre.ay_bitis)} {filtre.yil_bitis}</div>
        {hareketler.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Bu dönemde kayıt bulunamadı.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Dönem','Tür','Son Ödeme','Tahakkuk','Ödenen','Kalan','Durum'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: ['Tahakkuk','Ödenen','Kalan'].includes(h) ? 'right' : 'left', color: '#6b7280', fontWeight: '700', fontSize: '.72rem', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hareketler.map((h, i) => {
                  const [bg, fg] = h.durum === 'odendi' ? ['#dcfce7','#166534'] : h.durum === 'gecikti' ? ['#fee2e2','#991b1b'] : h.odenen > 0 ? ['#fef3c7','#92400e'] : ['#f3f4f6','#6b7280']
                  const durumText = h.durum === 'odendi' ? '✓ Ödendi' : h.durum === 'gecikti' ? '⚠ Gecikti' : h.odenen > 0 ? '◑ Kısmi' : '○ Bekliyor'
                  return (
                    <tr key={h.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '9px 12px', fontWeight: '600' }}>{ayAdi(h.donem_ay)} {h.donem_yil}</td>
                      <td style={{ padding: '9px 12px' }}>{h.aidat_turleri?.tur_adi}</td>
                      <td style={{ padding: '9px 12px', color: '#6b7280' }}>{h.son_odeme_tarihi ? new Date(h.son_odeme_tarihi).toLocaleDateString('tr-TR') : '—'}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right' }}>{Number(h.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: h.odenen > 0 ? '#16a34a' : '#6b7280' }}>{h.odenen > 0 ? Number(h.odenen).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '—'}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: h.kalan > 0 ? '#dc2626' : '#6b7280', fontWeight: h.kalan > 0 ? '700' : '400' }}>{h.kalan > 0 ? Number(h.kalan).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '—'}</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ background: bg, color: fg, padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>{durumText}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SakinPanel() {
  const [kullanici, setKullanici]     = useState<any>(null)
  const [daire, setDaire]             = useState<any>(null)
  const [tahakkuklar, setTahakkuklar] = useState<any[]>([])
  const [odemeler, setOdemeler]       = useState<any>({})
  const [yukleniyor, setYukleniyor]   = useState(true)
  const [aktifSayfa, setAktifSayfa]   = useState('borclarim')
  const [menuAcik, setMenuAcik]       = useState(false)
  const router = useRouter()

  useEffect(() => {
    const yukle = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/giris'); return }
      const { data: profil } = await supabase.from('profiller').select('*').eq('id', session.user.id).single()
      if (!profil) { router.push('/giris'); return }
      if (profil.rol === 'yonetici') { router.push('/dashboard'); return }
      setKullanici(profil)
      const { data: daireData } = await supabase.from('daireler').select('*').eq('kullanici_id', session.user.id).single()
      if (daireData) {
        const { data: blokData } = await supabase.from('bloklar').select('blok_adi').eq('id', daireData.blok_id).single()
        setDaire({ ...daireData, blok_adi: blokData?.blok_adi || '' })
        const { data: th } = await supabase.from('tahakkuklar').select('*, aidat_turleri(tur_adi)').eq('daire_id', daireData.id).neq('durum', 'odendi').order('donem_yil').order('donem_ay')
        setTahakkuklar(th || [])
        if (th && th.length > 0) {
          const ids = th.map((t: any) => t.id)
          const { data: odemeData } = await supabase.from('odemeler').select('*').in('tahakkuk_id', ids)
          const odemeMap: any = {}
          odemeData?.forEach((o: any) => { if (!odemeMap[o.tahakkuk_id]) odemeMap[o.tahakkuk_id] = 0; odemeMap[o.tahakkuk_id] += Number(o.tutar) })
          setOdemeler(odemeMap)
        }
      }
      setYukleniyor(false)
    }
    yukle()
  }, [])

  const cikisYap = async () => { await supabase.auth.signOut(); router.push('/giris') }

  const toplamAna  = tahakkuklar.reduce((acc, t) => acc + Math.max(0, Number(t.tutar) - (odemeler[t.id] || 0)), 0)
  const toplamFaiz = tahakkuklar.reduce((acc, t) => { const k = Math.max(0, Number(t.tutar) - (odemeler[t.id] || 0)); return t.son_odeme_tarihi && k > 0 ? acc + gecikFaizi(k, t.son_odeme_tarihi) : acc }, 0)

  if (yukleniyor) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#1a3c5e' }}>Yükleniyor...</div>

  const menuler = [
    { id: 'borclarim', ikon: '📋', etiket: 'Borçlarım' },
    { id: 'odeme_gecmisi', ikon: '🕐', etiket: 'Ödeme Geçmişi' },
    { id: 'ekstre', ikon: '📄', etiket: 'Ekstre' },
    { id: 'odeme_bildir', ikon: '✉️', etiket: 'Ödeme Bildir' },
    { id: 'ariza_bildir', ikon: '🔧', etiket: 'Arıza Bildir' },
    { id: 'profil', ikon: '👤', etiket: 'Profilim' },
    { id: 'duyurular', ikon: '📢', etiket: 'Duyurular' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setMenuAcik(!menuAcik)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>☰</button>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', lineHeight: 1 }}>🏢 Aidat Sistemi</div>
            {daire && <div style={{ fontSize: '.72rem', opacity: .7 }}>{daire.blok_adi} Blok — Daire {daire.daire_no}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {kullanici?.avatar_url ? (
            <img src={kullanici.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.3)' }} />
          ) : null}
          <span style={{ fontSize: '.8rem', opacity: .8 }}>👤 {kullanici?.ad_soyad?.split(' ')[0]}</span>
          <button onClick={cikisYap} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '.78rem' }}>Çıkış</button>
        </div>
      </div>

      {menuAcik && <div onClick={() => setMenuAcik(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 98 }} />}

      <div style={{ width: '220px', background: '#1a3c5e', padding: '16px 0', position: 'fixed', top: '49px', left: 0, bottom: 0, transform: menuAcik ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .25s ease', zIndex: 99, overflowY: 'auto' }}>
        {menuler.map(m => (
          <button key={m.id} onClick={() => { setAktifSayfa(m.id); setMenuAcik(false) }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 20px', border: 'none', cursor: 'pointer', background: aktifSayfa === m.id ? 'rgba(255,255,255,.15)' : 'transparent', color: aktifSayfa === m.id ? '#fff' : 'rgba(255,255,255,.7)', fontSize: '.9rem', fontWeight: aktifSayfa === m.id ? '700' : '400', borderLeft: aktifSayfa === m.id ? '3px solid #f0a500' : '3px solid transparent' }}>
            {m.ikon} {m.etiket}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        {aktifSayfa === 'borclarim' && (
          <div>
            <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📋 Borçlarım</h2>
            {!daire ? (
              <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '16px', color: '#92400e' }}>Henüz bir daireye atanmadınız.</div>
            ) : tahakkuklar.length === 0 ? (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#166534', fontWeight: '700' }}>✅ Tüm borçlarınız ödenmiş! 🎉</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  {[{ etiket: 'Ana Borç', deger: toplamAna, renk: '#dc2626' }, { etiket: 'Tahmini Faiz', deger: toplamFaiz, renk: '#d97706' }, { etiket: 'Toplam (Tahmini)', deger: toplamAna + toplamFaiz, renk: '#1a3c5e' }].map(k => (
                    <div key={k.etiket} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <div style={{ color: '#6b7280', fontSize: '.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.etiket}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: k.renk }}>{paraFormat(k.deger)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '.78rem', color: '#92400e' }}>
                  ⚠️ Gösterilen faiz <strong>tahmini</strong> olup yönetici tarafından ayrıca tahakkuk edildiğinde kesinleşir.
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ background: '#dc2626', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>📋 Bekleyen Borçlarım</div>
                  {tahakkuklar.map((t, i) => {
                    const odenen = odemeler[t.id] || 0
                    const kalan = Number(t.tutar) - odenen
                    const faiz = t.son_odeme_tarihi && kalan > 0 ? gecikFaizi(kalan, t.son_odeme_tarihi) : 0
                    const gecikti = t.son_odeme_tarihi && new Date(t.son_odeme_tarihi) < new Date()
                    return (
                      <div key={t.id} style={{ padding: '14px 20px', borderBottom: i < tahakkuklar.length - 1 ? '1px solid #f3f4f6' : 'none', background: odenen > 0 ? '#fffbeb' : '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: '700', color: '#374151' }}>{t.aidat_turleri?.tur_adi}</div>
                            <div style={{ color: '#6b7280', fontSize: '.8rem' }}>{ayAdi(t.donem_ay)} {t.donem_yil}</div>
                            {t.son_odeme_tarihi && <div style={{ color: gecikti ? '#dc2626' : '#6b7280', fontSize: '.75rem' }}>Son: {new Date(t.son_odeme_tarihi).toLocaleDateString('tr-TR')}</div>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {odenen > 0 && <div style={{ fontSize: '.8rem' }}>Ödenen: <span style={{ color: '#16a34a', fontWeight: '700' }}>{paraFormat(odenen)}</span></div>}
                            {faiz > 0 && <div style={{ fontSize: '.8rem' }}>Faiz: <span style={{ color: '#d97706', fontWeight: '700' }}>{paraFormat(faiz)}</span></div>}
                            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#dc2626' }}>{paraFormat(kalan + faiz)}</div>
                            <span style={{ background: gecikti ? '#fee2e2' : '#fef3c7', color: gecikti ? '#dc2626' : '#d97706', padding: '1px 6px', borderRadius: '20px', fontSize: '.7rem', fontWeight: '700' }}>{gecikti ? 'Gecikti' : 'Bekliyor'}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ padding: '14px 20px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#1a3c5e' }}>
                    <span>Genel Toplam</span><span>{paraFormat(toplamAna + toplamFaiz)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
		{aktifSayfa === 'odeme_gecmisi' && <OdemeGecmisi daireId={daire?.id} kullanici={kullanici} />}
        {aktifSayfa === 'ekstre' && <Ekstre daireId={daire?.id} kullanici={kullanici} />}
        {aktifSayfa === 'odeme_bildir' && <OdemeBildir daireId={daire?.id} />}
        {aktifSayfa === 'ariza_bildir' && <ArizaBildir daireId={daire?.id} kullaniciId={kullanici?.id} />}
        {aktifSayfa === 'profil' && <Profil kullanici={kullanici} setKullanici={setKullanici} />}
        {aktifSayfa === 'duyurular' && <Duyurular />}
      </div>
    </div>
  )
}
