'use client'

import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
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
  const [kullanici, setKullanici]               = useState<any>(null)
  const [istatistik, setIstatistik]             = useState<any>({})
  const [sakinler, setSakinler]                 = useState<any[]>([])
  const [bildirimler, setBildirimler]           = useState<any[]>([])
  const [arizalar, setArizalar]                 = useState<any[]>([])
  const [daireler, setDaireler]                 = useState<any[]>([])
  const [aidatTurleri, setAidatTurleri]         = useState<any[]>([])
  const [duyurular, setDuyurular]               = useState<any[]>([])
  const [giderler, setGiderler]                 = useState<any[]>([])
  const [butce, setButce]                       = useState<any[]>([])
  const [odemeler, setOdemeler]                 = useState<any[]>([])
  const [yukleniyor, setYukleniyor]             = useState(true)
  const [aktifSayfa, setAktifSayfa]             = useState('dashboard')
  const [menuAcik, setMenuAcik]                 = useState(false)

  const [tahakkukMesaj, setTahakkukMesaj]       = useState<any>(null)
  const [tahakkukListesi, setTahakkukListesi]   = useState<any[]>([])
  const [faizListesi, setFaizListesi]           = useState<any[]>([])
  const [faizYukleniyor, setFaizYukleniyor]     = useState(false)
  const [faizMesaj, setFaizMesaj]               = useState<any>(null)
  const [faizOran, setFaizOran]                 = useState(3)
  const [tahakkukFiltre, setTahakkukFiltre]     = useState({ daire_id: '', yil: new Date().getFullYear() })
  const [tahakkukYukleniyor, setTahakkukYukleniyor] = useState(false)
  const [tahakkukForm, setTahakkukForm]         = useState({
    daire_id: '', tur_id: '', tutar: '',
    donem_yil: new Date().getFullYear(),
    donem_ay: new Date().getMonth() + 1,
    son_odeme_tarihi: '', toplu: false
  })

  const [sakinEkleForm, setSakinEkleForm]       = useState({ email: '', sifre: '', ad_soyad: '', telefon: '', daire_id: '' })
  const [sakinEkleMesaj, setSakinEkleMesaj]     = useState<any>(null)
  const [sakinEkleYukleniyor, setSakinEkleYukleniyor] = useState(false)

  const [duzenlenecekSakin, setDuzenlenecekSakin] = useState<any>(null)
  const [sifreSakin, setSifreSakin]               = useState<any>(null)
  const [yeniSifre, setYeniSifre]                 = useState('')
  const [sifreMesaj, setSifreMesaj]               = useState<any>(null)
  const [sifreYukleniyor, setSifreYukleniyor]     = useState(false)
  const [sakinDuzenleForm, setSakinDuzenleForm]   = useState({ ad_soyad: '', telefon: '', durum: 'aktif' })
  const [sakinDuzenleMesaj, setSakinDuzenleMesaj] = useState<any>(null)

  const [tahsilatModal, setTahsilatModal]         = useState<any>(null)
  const [tahsilatForm, setTahsilatForm]           = useState({ tahakkuk_id: '', tutar: '', odeme_tarihi: new Date().toISOString().split('T')[0], odeme_yontemi: 'nakit', aciklama: '' })
  const [sakinTahakkuklar, setSakinTahakkuklar]   = useState<any[]>([])

  const [duyuruForm, setDuyuruForm]             = useState({ baslik: '', icerik: '' })
  const [duyuruMesaj, setDuyuruMesaj]           = useState<any>(null)
  const [duyuruYukleniyor, setDuyuruYukleniyor] = useState(false)

  const [giderForm, setGiderForm]               = useState({ kategori: '', aciklama: '', tutar: '', gider_tarihi: new Date().toISOString().split('T')[0], belge_no: '' })
  const [giderMesaj, setGiderMesaj]             = useState<any>(null)
  const [giderYukleniyor, setGiderYukleniyor]   = useState(false)

  const [butceYil, setButceYil]                 = useState(new Date().getFullYear())
  const [butceMesaj, setButceMesaj]             = useState<any>(null)
  const [butceYukleniyor, setButceYukleniyor]   = useState(false)
  const [butceForm, setButceForm]               = useState({ kategori: '', butce_tutar: '', aciklama: '' })

  const [yilsonuYil, setYilsonuYil]             = useState(new Date().getFullYear())
  const [yilsonuVeri, setYilsonuVeri]           = useState<any>(null)
  const [yilsonuYukleniyor, setYilsonuYukleniyor] = useState(false)

  const [odemeFiltre, setOdemeFiltre]           = useState({ yil: new Date().getFullYear(), ay: 0 })

  const [artisForm, setArtisForm]               = useState({ kapsam: 'tumu', tur_id: '', yontem: 'yuzde', deger: '' })
  const [artisMesaj, setArtisMesaj]             = useState<any>(null)
  const [artisYukleniyor, setArtisYukleniyor]   = useState(false)
  const [artisOnizleme, setArtisOnizleme]       = useState<any[]>([])

  const [eslestirmeForm, setEslestirmeForm]     = useState({ sakin_id: '', daire_id: '' })
  const [eslestirmeMesaj, setEslestirmeMesaj]   = useState<any>(null)
  const [eslestirmeYukleniyor, setEslestirmeYukleniyor] = useState(false)

  const [daireDetay, setDaireDetay]             = useState<any>(null)
  const [daireDetayVeri, setDaireDetayVeri]     = useState<any>(null)
  const [daireDetayYukleniyor, setDaireDetayYukleniyor] = useState(false)
  const [daireNot, setDaireNot]                 = useState('')
  const [daireNotMesaj, setDaireNotMesaj]       = useState<any>(null)

  const router = useRouter()
  const kategoriler = ['Temizlik','Elektrik','Su','Doğalgaz','Asansör Bakım','Güvenlik','Bahçe','Tadilat','Sigorta','Yönetim','Diğer']

  useEffect(() => {
    const yukle = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/giris'); return }
      const { data: profil } = await supabase.from('profiller').select('*').eq('id', session.user.id).single()
      if (profil?.rol !== 'yonetici') { router.push('/giris'); return }
      setKullanici(profil)

      const [
        { count: toplamSakin }, { count: toplamDaire }, { count: dolDaire },
        { count: bekleyenBildirim }, { count: acikAriza }, { data: tahakkukData },
      ] = await Promise.all([
        supabase.from('profiller').select('*', { count: 'exact', head: true }).eq('rol', 'sakin'),
        supabase.from('daireler').select('*', { count: 'exact', head: true }),
        supabase.from('daireler').select('*', { count: 'exact', head: true }).eq('durum', 'dolu'),
        supabase.from('odeme_bildirimleri').select('*', { count: 'exact', head: true }).eq('durum', 'bekliyor'),
        supabase.from('ariza_talepler').select('*', { count: 'exact', head: true }).eq('durum', 'acik'),
        supabase.from('tahakkuklar').select('tutar, durum'),
      ])

      const toplamTahakkuk   = tahakkukData?.reduce((a, t) => a + Number(t.tutar), 0) || 0
      const gecikmisTahakkuk = tahakkukData?.filter(t => t.durum === 'gecikti').reduce((a, t) => a + Number(t.tutar), 0) || 0
      setIstatistik({ toplamSakin, toplamDaire, dolDaire, bekleyenBildirim, acikAriza, toplamTahakkuk, gecikmisTahakkuk })

      const { data: s }  = await supabase.from('profiller').select('*').eq('rol', 'sakin').order('ad_soyad')
      setSakinler(s || [])
      const { data: b }  = await supabase.from('odeme_bildirimleri').select('*, profiller(ad_soyad, email), tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))').eq('durum', 'bekliyor').order('olusturma', { ascending: false })
      setBildirimler(b || [])
      const { data: a }  = await supabase.from('ariza_talepler').select('*, profiller(ad_soyad, email)').eq('durum', 'acik').order('olusturma', { ascending: false })
      setArizalar(a || [])
      const { data: d }  = await supabase.from('daireler').select('*, bloklar(blok_adi), profiller(ad_soyad)').order('blok_id').order('daire_no')
      setDaireler(d || [])
      const { data: t }  = await supabase.from('aidat_turleri').select('*').eq('durum', 'aktif')
      setAidatTurleri(t || [])
      const { data: du } = await supabase.from('duyurular').select('*').order('olusturma', { ascending: false })
      setDuyurular(du || [])
      const { data: g }  = await supabase.from('giderler').select('*').order('gider_tarihi', { ascending: false }).limit(50)
      setGiderler(g || [])
      const { data: bu } = await supabase.from('butce').select('*').eq('yil', new Date().getFullYear()).order('kategori')
      setButce(bu || [])

      const { data: od } = await supabase.from('odemeler').select('*, tahakkuklar(donem_yil, donem_ay, tur_id, daire_id)').order('odeme_tarihi', { ascending: false }).limit(100)
      if (od && od.length > 0) {
        const dIds = [...new Set(od.map((o: any) => o.tahakkuklar?.daire_id).filter(Boolean))]
        const tIds = [...new Set(od.map((o: any) => o.tahakkuklar?.tur_id).filter(Boolean))]
        const [{ data: dMap }, { data: tMap }] = await Promise.all([
          supabase.from('daireler').select('id, daire_no, bloklar(blok_adi)').in('id', dIds),
          supabase.from('aidat_turleri').select('id, tur_adi').in('id', tIds),
        ])
        const dm: any = {}; dMap?.forEach((x: any) => { dm[x.id] = x })
        const tm: any = {}; tMap?.forEach((x: any) => { tm[x.id] = x })
        setOdemeler(od.map((o: any) => ({ ...o, daire: dm[o.tahakkuklar?.daire_id], tur: tm[o.tahakkuklar?.tur_id] })))
      }
      setYukleniyor(false)
    }
    yukle()
  }, [])

  useEffect(() => {
    if (aktifSayfa === 'yilsonu') yilsonuHesapla(yilsonuYil)
  }, [aktifSayfa, yilsonuYil])

  const cikisYap = async () => { await supabase.auth.signOut(); router.push('/giris') }

  const bildirimOnayla = async (id: number, tahakkukId: number, tutar: number) => {
    const bl = bildirimler.find(b => b.id === id)
    await supabase.from('odemeler').insert({ tahakkuk_id: tahakkukId, odeme_tarihi: new Date().toISOString().split('T')[0], tutar, odeme_yontemi: 'havale', aciklama: 'Sakin bildirimi onaylandı' })
    const { data: th } = await supabase.from('tahakkuklar').select('tutar').eq('id', tahakkukId).single()
    const { data: ot } = await supabase.from('odemeler').select('tutar').eq('tahakkuk_id', tahakkukId)
    const top = ot?.reduce((acc, o) => acc + Number(o.tutar), 0) || 0
    if (th && top >= Number(th.tutar)) await supabase.from('tahakkuklar').update({ durum: 'odendi' }).eq('id', tahakkukId)
    await supabase.from('odeme_bildirimleri').update({ durum: 'onaylandi' }).eq('id', id)
    if (bl?.profiller?.email) {
      await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tip: 'odeme_onaylandi', alici: bl.profiller.email, aliciAd: bl.profiller.ad_soyad, veri: { tur_adi: bl.tahakkuklar?.aidat_turleri?.tur_adi, donem: `${ayAdi(bl.tahakkuklar?.donem_ay)} ${bl.tahakkuklar?.donem_yil}`, tutar: Number(tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 }), tarih: new Date().toLocaleDateString('tr-TR') } }) })
    }
    const { data } = await supabase.from('odeme_bildirimleri').select('*, profiller(ad_soyad, email), tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))').eq('durum', 'bekliyor').order('olusturma', { ascending: false })
    setBildirimler(data || [])
    setIstatistik((s: any) => ({ ...s, bekleyenBildirim: Math.max(0, (s.bekleyenBildirim || 1) - 1) }))
  }

  const bildirimReddet = async (id: number) => {
    const bl = bildirimler.find(b => b.id === id)
    await supabase.from('odeme_bildirimleri').update({ durum: 'reddedildi' }).eq('id', id)
    if (bl?.profiller?.email) {
      await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tip: 'odeme_reddedildi', alici: bl.profiller.email, aliciAd: bl.profiller.ad_soyad, veri: { tur_adi: bl.tahakkuklar?.aidat_turleri?.tur_adi, donem: `${ayAdi(bl.tahakkuklar?.donem_ay)} ${bl.tahakkuklar?.donem_yil}`, tutar: Number(bl.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 }), red_neden: '' } }) })
    }
    const { data } = await supabase.from('odeme_bildirimleri').select('*, profiller(ad_soyad, email), tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))').eq('durum', 'bekliyor').order('olusturma', { ascending: false })
    setBildirimler(data || [])
    setIstatistik((s: any) => ({ ...s, bekleyenBildirim: Math.max(0, (s.bekleyenBildirim || 1) - 1) }))
  }

  const arizaDurumGuncelle = async (id: number, durum: string) => {
    const ar = arizalar.find(a => a.id === id)
    await supabase.from('ariza_talepler').update({ durum }).eq('id', id)
    if (ar?.profiller?.email) {
      await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tip: 'ariza_guncelleme', alici: ar.profiller.email, aliciAd: ar.profiller.ad_soyad, veri: { kategori: ar.kategori, baslik: ar.baslik, durum, yonetici_notu: ar.yonetici_notu || '' } }) })
    }
    const { data } = await supabase.from('ariza_talepler').select('*, profiller(ad_soyad, email)').eq('durum', 'acik').order('olusturma', { ascending: false })
    setArizalar(data || [])
  }

  const turSecildi = (turId: string) => {
    const tur = aidatTurleri.find(t => t.id === parseInt(turId))
    setTahakkukForm(f => ({ ...f, tur_id: turId, tutar: tur ? String(tur.varsayilan_tutar) : '' }))
  }

  const faizHesapla = async () => {
    setFaizYukleniyor(true); setFaizMesaj(null); setFaizListesi([])
    const bugun = new Date()

    // Gecikmiş tahakkukları getir (Gecikme Faizi türü hariç)
    const { data: gecikmisTh } = await supabase
      .from('tahakkuklar')
      .select('*, daireler(id, daire_no, bloklar(blok_adi), profiller(ad_soyad)), aidat_turleri(tur_adi)')
      .eq('durum', 'gecikti')
      .not('aidat_turleri.tur_adi', 'eq', 'Gecikme Faizi')

    if (!gecikmisTh || gecikmisTh.length === 0) {
      setFaizMesaj({ tip: 'basari', metin: 'Gecikmiş tahakkuk bulunamadı.' })
      setFaizYukleniyor(false); return
    }

    // Her tahakkuk için ödeme toplamını al
    const ids = gecikmisTh.map((t: any) => t.id)
    const { data: odemeData } = await supabase.from('odemeler').select('tahakkuk_id, tutar').in('tahakkuk_id', ids)
    const odemeMap: any = {}
    odemeData?.forEach((o: any) => { if (!odemeMap[o.tahakkuk_id]) odemeMap[o.tahakkuk_id] = 0; odemeMap[o.tahakkuk_id] += Number(o.tutar) })

    const liste = gecikmisTh.map((t: any) => {
      const kalan = Math.max(0, Number(t.tutar) - (odemeMap[t.id] || 0))
      if (kalan <= 0 || !t.son_odeme_tarihi) return null
      const sonOdeme = new Date(t.son_odeme_tarihi)
      if (bugun <= sonOdeme) return null
      const gun = Math.floor((bugun.getTime() - sonOdeme.getTime()) / (1000 * 60 * 60 * 24))
      const faiz = Math.round(kalan * (faizOran / 100) / 30 * gun * 100) / 100
      if (faiz <= 0) return null
      return { tahakkuk: t, kalan, gun, faiz, daire: t.daireler, sakin: (t.daireler as any)?.profiller?.ad_soyad }
    }).filter(Boolean)

    setFaizListesi(liste)
    setFaizYukleniyor(false)
    if (liste.length === 0) setFaizMesaj({ tip: 'basari', metin: 'Faiz hesaplanacak tahakkuk bulunamadı.' })
  }

  const faizTahakkukOlustur = async (item: any) => {
    if (!confirm(`${item.sakin} için ${paraFormat(item.faiz)} faiz tahakkuku oluşturulsun mu?`)) return

    // Gecikme Faizi türünün ID'sini bul
    const { data: turData } = await supabase.from('aidat_turleri').select('id').eq('tur_adi', 'Gecikme Faizi').single()
    if (!turData) { alert('Gecikme Faizi türü bulunamadı!'); return }

    const bugun = new Date()
    const { error } = await supabase.from('tahakkuklar').insert({
      daire_id: item.daire.id,
      tur_id: turData.id,
      donem_yil: item.tahakkuk.donem_yil,
      donem_ay: item.tahakkuk.donem_ay,
      tutar: item.faiz,
      son_odeme_tarihi: new Date(bugun.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durum: 'bekliyor'
    })

    if (error) { alert('Hata: ' + error.message); return }
    setFaizListesi(prev => prev.filter((f: any) => f.tahakkuk.id !== item.tahakkuk.id))
    setFaizMesaj({ tip: 'basari', metin: `${item.sakin} için faiz tahakkuku oluşturuldu!` })
  }

  const tumFaizTahakkukOlustur = async () => {
    if (!confirm(`${faizListesi.length} sakin için toplam ${paraFormat(faizListesi.reduce((a: number, f: any) => a + f.faiz, 0))} faiz tahakkuku oluşturulsun mu?`)) return
    for (const item of faizListesi) await faizTahakkukOlustur(item)
  }

  const tahakkukListeYukle = async (daireId?: string, yil?: number) => {
    const fDaireId = daireId || tahakkukFiltre.daire_id
    const fYil     = yil || tahakkukFiltre.yil
    let query = supabase.from('tahakkuklar').select('*, aidat_turleri(tur_adi), daireler(daire_no, bloklar(blok_adi))').eq('donem_yil', fYil).order('donem_yil', { ascending: false }).order('donem_ay', { ascending: false })
    if (fDaireId) query = query.eq('daire_id', parseInt(fDaireId))
    const { data } = await query
    setTahakkukListesi(data || [])
  }

  const tahakkukSil = async (id: number) => {
    if (!confirm('Bu tahakkuk silinecek. Ödemeleri de silinecek. Emin misiniz?')) return
    await supabase.from('odemeler').delete().eq('tahakkuk_id', id)
    await supabase.from('odeme_bildirimleri').delete().eq('tahakkuk_id', id)
    await supabase.from('tahakkuklar').delete().eq('id', id)
    setTahakkukListesi(prev => prev.filter(t => t.id !== id))
  }

  const tahakkukKaydet = async (e: React.FormEvent) => {
    e.preventDefault(); setTahakkukYukleniyor(true); setTahakkukMesaj(null)
    const hd = tahakkukForm.toplu ? daireler.filter(d => d.durum === 'dolu') : daireler.filter(d => d.id === parseInt(tahakkukForm.daire_id))
    if (hd.length === 0) { setTahakkukMesaj({ tip: 'hata', metin: 'Daire bulunamadı.' }); setTahakkukYukleniyor(false); return }
    let basarili = 0, atlailan = 0
    for (const d of hd) {
      const { error } = await supabase.from('tahakkuklar').insert({ daire_id: d.id, tur_id: parseInt(tahakkukForm.tur_id), donem_yil: tahakkukForm.donem_yil, donem_ay: tahakkukForm.donem_ay, tutar: parseFloat(tahakkukForm.tutar), son_odeme_tarihi: tahakkukForm.son_odeme_tarihi || null, durum: 'bekliyor' })
      if (error?.code === '23505') atlailan++; else if (!error) basarili++
    }
    setTahakkukMesaj({ tip: basarili > 0 ? 'basari' : 'hata', metin: `${basarili} tahakkuk oluşturuldu${atlailan > 0 ? `, ${atlailan} zaten mevcut` : ''}.` })
    setTahakkukYukleniyor(false)
  }

  const sakinEkle = async (e: React.FormEvent) => {
    e.preventDefault(); setSakinEkleYukleniyor(true); setSakinEkleMesaj(null)
    const res = await fetch('/api/sakin-ekle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: sakinEkleForm.email, sifre: sakinEkleForm.sifre, ad_soyad: sakinEkleForm.ad_soyad, telefon: sakinEkleForm.telefon }) })
    const sonuc = await res.json()
    if (sonuc.error) { setSakinEkleMesaj({ tip: 'hata', metin: sonuc.error }); setSakinEkleYukleniyor(false); return }
    if (sakinEkleForm.daire_id) await supabase.from('daireler').update({ kullanici_id: sonuc.userId, durum: 'dolu' }).eq('id', parseInt(sakinEkleForm.daire_id))
    const { data } = await supabase.from('profiller').select('*').eq('rol', 'sakin').order('ad_soyad')
    setSakinler(data || [])
    // Daire listesini de yenile
    const { data: daireData } = await supabase.from('daireler').select('*, bloklar(blok_adi), profiller(ad_soyad)').order('blok_id').order('daire_no')
    setDaireler(daireData || [])
    setSakinEkleMesaj({ tip: 'basari', metin: `${sakinEkleForm.ad_soyad} başarıyla eklendi!` })
    setSakinEkleForm({ email: '', sifre: '', ad_soyad: '', telefon: '', daire_id: '' })
    setSakinEkleYukleniyor(false)
  }

  const sakinDuzenleAc = (s: any) => { setDuzenlenecekSakin(s); setSakinDuzenleForm({ ad_soyad: s.ad_soyad, telefon: s.telefon || '', durum: s.durum }); setSakinDuzenleMesaj(null) }

  const sakinSifreSifirla = async (e: React.FormEvent) => {
    e.preventDefault(); setSifreYukleniyor(true); setSifreMesaj(null)
    if (yeniSifre.length < 6) { setSifreMesaj({ tip: 'hata', metin: 'Şifre en az 6 karakter olmalı.' }); setSifreYukleniyor(false); return }
    const res = await fetch('/api/sakin-sifre', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: sifreSakin.id, sifre: yeniSifre }) })
    const sonuc = await res.json()
    if (sonuc.error) { setSifreMesaj({ tip: 'hata', metin: sonuc.error }) }
    else { setSifreMesaj({ tip: 'basari', metin: 'Şifre başarıyla güncellendi!' }); setYeniSifre(''); setTimeout(() => setSifreSakin(null), 1500) }
    setSifreYukleniyor(false)
  }

  const sakinGuncelle = async (e: React.FormEvent) => {
    e.preventDefault(); setSakinDuzenleMesaj(null)
    const { error } = await supabase.from('profiller').update({ ad_soyad: sakinDuzenleForm.ad_soyad, telefon: sakinDuzenleForm.telefon, durum: sakinDuzenleForm.durum }).eq('id', duzenlenecekSakin.id)
    if (error) { setSakinDuzenleMesaj({ tip: 'hata', metin: error.message }); return }
    setSakinDuzenleMesaj({ tip: 'basari', metin: 'Sakin güncellendi!' })
    const { data } = await supabase.from('profiller').select('*').eq('rol', 'sakin').order('ad_soyad')
    setSakinler(data || [])
    setTimeout(() => setDuzenlenecekSakin(null), 1000)
  }

  const tahsilatAc = async (sakin: any) => {
    const { data: dr } = await supabase.from('daireler').select('id, daire_no, bloklar(blok_adi)').eq('kullanici_id', sakin.id).single()
    if (!dr) { alert('Bu sakine ait daire bulunamadı.'); return }
    const { data: th } = await supabase.from('tahakkuklar').select('*, aidat_turleri(tur_adi)').eq('daire_id', dr.id).neq('durum', 'odendi').order('donem_yil').order('donem_ay')
    setSakinTahakkuklar(th || [])
    setTahsilatModal({ sakin, daire: dr })
    setTahsilatForm({ tahakkuk_id: '', tutar: '', odeme_tarihi: new Date().toISOString().split('T')[0], odeme_yontemi: 'nakit', aciklama: '' })
  }

  const tahsilatKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tahsilatForm.tahakkuk_id) { alert('Tahakkuk seçin.'); return }
    const { error } = await supabase.from('odemeler').insert({ tahakkuk_id: parseInt(tahsilatForm.tahakkuk_id), odeme_tarihi: tahsilatForm.odeme_tarihi, tutar: parseFloat(tahsilatForm.tutar), odeme_yontemi: tahsilatForm.odeme_yontemi, aciklama: tahsilatForm.aciklama })
    if (error) { alert('Hata: ' + error.message); return }
    const th = sakinTahakkuklar.find(t => t.id === parseInt(tahsilatForm.tahakkuk_id))
    if (th) {
      const { data: ot } = await supabase.from('odemeler').select('tutar').eq('tahakkuk_id', th.id)
      const top = ot?.reduce((acc, o) => acc + Number(o.tutar), 0) || 0
      if (top >= Number(th.tutar)) await supabase.from('tahakkuklar').update({ durum: 'odendi' }).eq('id', th.id)
    }
    alert('Tahsilat kaydedildi!'); setTahsilatModal(null)
  }

  const duyuruEkle = async (e: React.FormEvent) => {
    e.preventDefault(); setDuyuruYukleniyor(true); setDuyuruMesaj(null)
    const { error } = await supabase.from('duyurular').insert({ baslik: duyuruForm.baslik, icerik: duyuruForm.icerik, yayinlayan_id: kullanici?.id })
    if (error) { setDuyuruMesaj({ tip: 'hata', metin: error.message }) }
    else {
      const { data: sm } = await supabase.from('profiller').select('ad_soyad, email').eq('rol', 'sakin').eq('durum', 'aktif').not('email', 'is', null)
      let ms = 0
      for (const s of sm || []) { if (!s.email) continue; await fetch('/api/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tip: 'duyuru', alici: s.email, aliciAd: s.ad_soyad, veri: { baslik: duyuruForm.baslik, icerik: duyuruForm.icerik } }) }); ms++ }
      // Push bildirim gönder
      const pushRes = await fetch('/api/push-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ herkese: true, title: `📢 ${duyuruForm.baslik}`, body: duyuruForm.icerik.substring(0, 100) + (duyuruForm.icerik.length > 100 ? '...' : ''), url: '/sakin' }) })
      const pushData = await pushRes.json()
      setDuyuruMesaj({ tip: 'basari', metin: `Duyuru yayınlandı! ${ms} sakine mail, ${pushData.gonderilen || 0} cihaza push gönderildi.` })
      setDuyuruForm({ baslik: '', icerik: '' })
      const { data } = await supabase.from('duyurular').select('*').order('olusturma', { ascending: false })
      setDuyurular(data || [])
    }
    setDuyuruYukleniyor(false)
  }

  const duyuruSil = async (id: number) => { await supabase.from('duyurular').delete().eq('id', id); setDuyurular(prev => prev.filter(d => d.id !== id)) }

  const giderEkle = async (e: React.FormEvent) => {
    e.preventDefault(); setGiderYukleniyor(true); setGiderMesaj(null)
    const { error } = await supabase.from('giderler').insert({ kategori: giderForm.kategori, aciklama: giderForm.aciklama, tutar: parseFloat(giderForm.tutar), gider_tarihi: giderForm.gider_tarihi, belge_no: giderForm.belge_no || null, kaydeden_id: kullanici?.id })
    if (error) { setGiderMesaj({ tip: 'hata', metin: error.message }) }
    else {
      setGiderMesaj({ tip: 'basari', metin: 'Gider kaydedildi!' })
      setGiderForm({ kategori: '', aciklama: '', tutar: '', gider_tarihi: new Date().toISOString().split('T')[0], belge_no: '' })
      const { data } = await supabase.from('giderler').select('*').order('gider_tarihi', { ascending: false }).limit(50)
      setGiderler(data || [])
    }
    setGiderYukleniyor(false)
  }

  const giderSil = async (id: number) => { await supabase.from('giderler').delete().eq('id', id); setGiderler(prev => prev.filter(g => g.id !== id)) }

  const butceYukle = async (yil: number) => { const { data } = await supabase.from('butce').select('*').eq('yil', yil).order('kategori'); setButce(data || []) }

  const butceKaydet = async (e: React.FormEvent) => {
    e.preventDefault(); setButceYukleniyor(true); setButceMesaj(null)
    const { error } = await supabase.from('butce').upsert({ yil: butceYil, kategori: butceForm.kategori, butce_tutar: parseFloat(butceForm.butce_tutar), aciklama: butceForm.aciklama }, { onConflict: 'yil,kategori' })
    if (error) { setButceMesaj({ tip: 'hata', metin: error.message }) }
    else { setButceMesaj({ tip: 'basari', metin: 'Bütçe kaydedildi!' }); setButceForm({ kategori: '', butce_tutar: '', aciklama: '' }); butceYukle(butceYil) }
    setButceYukleniyor(false)
  }

  const yilsonuHesapla = async (yil: number) => {
    setYilsonuYukleniyor(true)
    const { data: th } = await supabase.from('tahakkuklar').select('tutar, durum, donem_ay').eq('donem_yil', yil)
    const toplamTahakkuk   = th?.reduce((a, t) => a + Number(t.tutar), 0) || 0
    const gecikmisTahakkuk = th?.filter(t => t.durum === 'gecikti').reduce((a, t) => a + Number(t.tutar), 0) || 0
    const { data: od } = await supabase.from('odemeler').select('tutar, odeme_tarihi').gte('odeme_tarihi', `${yil}-01-01`).lte('odeme_tarihi', `${yil}-12-31`)
    const toplamOdeme = od?.reduce((a, o) => a + Number(o.tutar), 0) || 0
    const aylikOdeme = Array(12).fill(0); od?.forEach((o: any) => { aylikOdeme[new Date(o.odeme_tarihi).getMonth()] += Number(o.tutar) })
    const { data: gd } = await supabase.from('giderler').select('tutar, kategori, gider_tarihi').gte('gider_tarihi', `${yil}-01-01`).lte('gider_tarihi', `${yil}-12-31`)
    const toplamGider = gd?.reduce((a, g) => a + Number(g.tutar), 0) || 0
    const aylikGider  = Array(12).fill(0); gd?.forEach((g: any) => { aylikGider[new Date(g.gider_tarihi).getMonth()] += Number(g.tutar) })
    const kategoriGider: any = {}; gd?.forEach((g: any) => { if (!kategoriGider[g.kategori]) kategoriGider[g.kategori] = 0; kategoriGider[g.kategori] += Number(g.tutar) })
    const { data: bd } = await supabase.from('butce').select('*').eq('yil', yil)
    const toplamButce = bd?.reduce((a, b) => a + Number(b.butce_tutar), 0) || 0
    setYilsonuVeri({ toplamTahakkuk, gecikmisTahakkuk, toplamOdeme, toplamGider, toplamButce, tahsilatOrani: toplamTahakkuk > 0 ? Math.round(toplamOdeme / toplamTahakkuk * 100) : 0, butceKullanim: toplamButce > 0 ? Math.round(toplamGider / toplamButce * 100) : 0, netDurum: toplamOdeme - toplamGider, aylikOdeme, aylikGider, kategoriGider })
    setYilsonuYukleniyor(false)
  }

  const odemeYenile = async () => {
    const { data: od } = await supabase.from('odemeler').select('*, tahakkuklar(donem_yil, donem_ay, tur_id, daire_id)').order('odeme_tarihi', { ascending: false }).limit(100)
    if (od && od.length > 0) {
      const dIds = [...new Set(od.map((o: any) => o.tahakkuklar?.daire_id).filter(Boolean))]
      const tIds = [...new Set(od.map((o: any) => o.tahakkuklar?.tur_id).filter(Boolean))]
      const [{ data: dm }, { data: tm }] = await Promise.all([supabase.from('daireler').select('id, daire_no, bloklar(blok_adi)').in('id', dIds), supabase.from('aidat_turleri').select('id, tur_adi').in('id', tIds)])
      const dMap: any = {}; dm?.forEach((x: any) => { dMap[x.id] = x })
      const tMap: any = {}; tm?.forEach((x: any) => { tMap[x.id] = x })
      setOdemeler(od.map((o: any) => ({ ...o, daire: dMap[o.tahakkuklar?.daire_id], tur: tMap[o.tahakkuklar?.tur_id] })))
    }
  }

  const daireEslestir = async (e: React.FormEvent) => {
    e.preventDefault(); setEslestirmeYukleniyor(true); setEslestirmeMesaj(null)
    await supabase.from('daireler').update({ kullanici_id: null, durum: 'bos' }).eq('kullanici_id', eslestirmeForm.sakin_id)
    const { error } = await supabase.from('daireler').update({ kullanici_id: eslestirmeForm.sakin_id, durum: 'dolu' }).eq('id', parseInt(eslestirmeForm.daire_id))
    if (error) { setEslestirmeMesaj({ tip: 'hata', metin: error.message }) }
    else {
      setEslestirmeMesaj({ tip: 'basari', metin: 'Daire eşleştirmesi güncellendi!' })
      setEslestirmeForm({ sakin_id: '', daire_id: '' })
      const { data } = await supabase.from('daireler').select('*, bloklar(blok_adi), profiller(ad_soyad)').order('blok_id').order('daire_no')
      setDaireler(data || [])
    }
    setEslestirmeYukleniyor(false)
  }

  const artisOnizlemeHesapla = () => {
    if (!artisForm.deger) return
    const deger = parseFloat(artisForm.deger)
    const ht = artisForm.kapsam === 'tur' ? aidatTurleri.filter(t => t.id === parseInt(artisForm.tur_id)) : aidatTurleri
    setArtisOnizleme(ht.map(t => { const e = Number(t.varsayilan_tutar); const y = artisForm.yontem === 'yuzde' ? Math.round(e * (1 + deger / 100) * 100) / 100 : e + deger; return { ...t, eskiTutar: e, yeniTutar: y, fark: y - e } }))
  }

  const daireDetayAc = async (daire: any) => {
    setDaireDetay(daire)
    setDaireDetayYukleniyor(true)
    setDaireDetayVeri(null)
    setDaireNot('')
    setDaireNotMesaj(null)

    // Tahakkuklar
    const { data: thData } = await supabase
      .from('tahakkuklar').select('*, aidat_turleri(tur_adi)')
      .eq('daire_id', daire.id).order('donem_yil', { ascending: false }).order('donem_ay', { ascending: false })

    // Ödemeler
    const ids = thData?.map((t: any) => t.id) || []
    let odemeData: any[] = []
    if (ids.length > 0) {
      const { data: od } = await supabase.from('odemeler').select('*, tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))').in('tahakkuk_id', ids).order('odeme_tarihi', { ascending: false })
      odemeData = od || []
    }

    // İstatistik
    const toplamTahakkuk = thData?.reduce((a: number, t: any) => a + Number(t.tutar), 0) || 0
    const toplamOdenen   = odemeData.reduce((a: number, o: any) => a + Number(o.tutar), 0)
    const toplamKalan    = toplamTahakkuk - toplamOdenen
    const tahsilatOrani  = toplamTahakkuk > 0 ? Math.round(toplamOdenen / toplamTahakkuk * 100) : 100
    const acikBorclar    = thData?.filter((t: any) => t.durum !== 'odendi') || []

    // Not
    const { data: notData } = await supabase.from('daireler').select('sabit_not').eq('id', daire.id).single()
    setDaireNot(notData?.sabit_not || '')

    setDaireDetayVeri({ tahakkuklar: thData || [], odemeler: odemeData, toplamTahakkuk, toplamOdenen, toplamKalan, tahsilatOrani, acikBorclar })
    setDaireDetayYukleniyor(false)
  }

  const daireNotKaydet = async () => {
    const { error } = await supabase.from('daireler').update({ sabit_not: daireNot }).eq('id', daireDetay.id)
    if (error) { setDaireNotMesaj({ tip: 'hata', metin: error.message }) }
    else { setDaireNotMesaj({ tip: 'basari', metin: 'Not kaydedildi!' }) }
    setTimeout(() => setDaireNotMesaj(null), 2000)
  }

  const artisUygula = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirm('Aidat artışı uygulanacak. Emin misiniz?')) return
    setArtisYukleniyor(true); setArtisMesaj(null)
    let basarili = 0
    for (const t of artisOnizleme) { const { error } = await supabase.from('aidat_turleri').update({ varsayilan_tutar: t.yeniTutar }).eq('id', t.id); if (!error) basarili++ }
    const { data } = await supabase.from('aidat_turleri').select('*').eq('durum', 'aktif')
    setAidatTurleri(data || [])
    setArtisOnizleme([]); setArtisForm({ kapsam: 'tumu', tur_id: '', yontem: 'yuzde', deger: '' })
    setArtisMesaj({ tip: 'basari', metin: `${basarili} aidat türü güncellendi!` })
    setArtisYukleniyor(false)
  }

  if (yukleniyor) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#1a3c5e' }}>Yükleniyor...</div>

  const menuler = [
    { id: 'dashboard',   ikon: '📊', etiket: 'Dashboard' },
    { id: 'sakinler',    ikon: '👥', etiket: 'Sakinler' },
    { id: 'tahakkuklar', ikon: '📋', etiket: 'Tahakkuklar' },
    { id: 'odemeler',    ikon: '💰', etiket: 'Ödemeler' },
    { id: 'bildirimler', ikon: '✉️', etiket: `Ödeme Bildirimleri${(istatistik.bekleyenBildirim || 0) > 0 ? ` (${istatistik.bekleyenBildirim})` : ''}` },
    { id: 'arizalar',    ikon: '🔧', etiket: `Arıza Talepler${(istatistik.acikAriza || 0) > 0 ? ` (${istatistik.acikAriza})` : ''}` },
    { id: 'duyurular',   ikon: '📢', etiket: 'Duyurular' },
    { id: 'daireler',    ikon: '🏠', etiket: 'Daire Eşleştirme' },
    { id: 'giderler',    ikon: '💸', etiket: 'Giderler' },
    { id: 'butce',       ikon: '📊', etiket: 'Bütçe Takibi' },
    { id: 'yilsonu',     ikon: '📈', etiket: 'Yıl Sonu Raporu' },
    { id: 'aidat_artis',   ikon: '📈', etiket: 'Aidat Artış' },
  { id: 'daire_yonetim', ikon: '🏢', etiket: 'Daire Yönetimi' },
  { id: 'borc_raporu',   ikon: '📊', etiket: 'Borç Raporu' },
  { id: 'banka_import',  ikon: '🏦', etiket: 'Banka Excel Import' },
  { id: 'yedekleme',     ikon: '💾', etiket: 'Yedekleme' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>
      {/* Topbar */}
      <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setMenuAcik(!menuAcik)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>☰</button>
          <span style={{ fontWeight: '700', fontSize: '1rem' }}>🏢 Aidat Sistemi — Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '.82rem', opacity: .8 }}>👤 {kullanici?.ad_soyad}</span>
          <button onClick={cikisYap} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '.78rem' }}>Çıkış</button>
        </div>
      </div>

      {menuAcik && <div onClick={() => setMenuAcik(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 98 }} />}

      <div style={{ width: '240px', background: '#1a3c5e', padding: '16px 0', position: 'fixed', top: '49px', left: 0, bottom: 0, transform: menuAcik ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .25s ease', zIndex: 99, overflowY: 'auto' }}>
        {menuler.map(m => (
          <button key={m.id} onClick={() => { setAktifSayfa(m.id); setMenuAcik(false) }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '11px 20px', border: 'none', cursor: 'pointer', background: aktifSayfa === m.id ? 'rgba(255,255,255,.15)' : 'transparent', color: aktifSayfa === m.id ? '#fff' : 'rgba(255,255,255,.7)', fontSize: '.85rem', fontWeight: aktifSayfa === m.id ? '700' : '400', borderLeft: aktifSayfa === m.id ? '3px solid #f0a500' : '3px solid transparent' }}>
            {m.ikon} {m.etiket}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <DashboardIcerik
          aktifSayfa={aktifSayfa} kullanici={kullanici} istatistik={istatistik}
          sakinler={sakinler} setSakinler={setSakinler} daireler={daireler} setDaireler={setDaireler}
          bildirimler={bildirimler} setBildirimler={setBildirimler} arizalar={arizalar} setArizalar={setArizalar}
          aidatTurleri={aidatTurleri} setAidatTurleri={setAidatTurleri} duyurular={duyurular} setDuyurular={setDuyurular}
          giderler={giderler} setGiderler={setGiderler} butce={butce} odemeler={odemeler}
          tahakkukForm={tahakkukForm} setTahakkukForm={setTahakkukForm} tahakkukMesaj={tahakkukMesaj} tahakkukYukleniyor={tahakkukYukleniyor} tahakkukKaydet={tahakkukKaydet} turSecildi={turSecildi}
          tahakkukListesi={tahakkukListesi} tahakkukFiltre={tahakkukFiltre} setTahakkukFiltre={setTahakkukFiltre} tahakkukListeYukle={tahakkukListeYukle} tahakkukSil={tahakkukSil}
          faizListesi={faizListesi} faizYukleniyor={faizYukleniyor} faizMesaj={faizMesaj} faizOran={faizOran} setFaizOran={setFaizOran} faizHesapla={faizHesapla} faizTahakkukOlustur={faizTahakkukOlustur} tumFaizTahakkukOlustur={tumFaizTahakkukOlustur}
          sakinEkleForm={sakinEkleForm} setSakinEkleForm={setSakinEkleForm} sakinEkleMesaj={sakinEkleMesaj} sakinEkleYukleniyor={sakinEkleYukleniyor} sakinEkle={sakinEkle}
          duzenlenecekSakin={duzenlenecekSakin} setDuzenlenecekSakin={setDuzenlenecekSakin} sakinDuzenleForm={sakinDuzenleForm} setSakinDuzenleForm={setSakinDuzenleForm} sakinDuzenleMesaj={sakinDuzenleMesaj} sakinDuzenleAc={sakinDuzenleAc} sakinGuncelle={sakinGuncelle}
          sifreSakin={sifreSakin} setSifreSakin={setSifreSakin} yeniSifre={yeniSifre} setYeniSifre={setYeniSifre} sifreMesaj={sifreMesaj} sifreYukleniyor={sifreYukleniyor} sakinSifreSifirla={sakinSifreSifirla}
          tahsilatModal={tahsilatModal} setTahsilatModal={setTahsilatModal} tahsilatForm={tahsilatForm} setTahsilatForm={setTahsilatForm} sakinTahakkuklar={sakinTahakkuklar} tahsilatAc={tahsilatAc} tahsilatKaydet={tahsilatKaydet}
          bildirimOnayla={bildirimOnayla} bildirimReddet={bildirimReddet} arizaDurumGuncelle={arizaDurumGuncelle}
          duyuruForm={duyuruForm} setDuyuruForm={setDuyuruForm} duyuruMesaj={duyuruMesaj} duyuruYukleniyor={duyuruYukleniyor} duyuruEkle={duyuruEkle} duyuruSil={duyuruSil}
          giderForm={giderForm} setGiderForm={setGiderForm} giderMesaj={giderMesaj} giderYukleniyor={giderYukleniyor} giderEkle={giderEkle} giderSil={giderSil}
          butceYil={butceYil} setButceYil={setButceYil} butceForm={butceForm} setButceForm={setButceForm} butceMesaj={butceMesaj} butceYukleniyor={butceYukleniyor} butceKaydet={butceKaydet} butceYukle={butceYukle}
          yilsonuYil={yilsonuYil} setYilsonuYil={setYilsonuYil} yilsonuVeri={yilsonuVeri} yilsonuYukleniyor={yilsonuYukleniyor}
          odemeFiltre={odemeFiltre} setOdemeFiltre={setOdemeFiltre} odemeYenile={odemeYenile}
          artisForm={artisForm} setArtisForm={setArtisForm} artisMesaj={artisMesaj} artisYukleniyor={artisYukleniyor} artisOnizleme={artisOnizleme} artisOnizlemeHesapla={artisOnizlemeHesapla} artisUygula={artisUygula}
          eslestirmeForm={eslestirmeForm} setEslestirmeForm={setEslestirmeForm} eslestirmeMesaj={eslestirmeMesaj} eslestirmeYukleniyor={eslestirmeYukleniyor} daireEslestir={daireEslestir}
          kategoriler={kategoriler}
          setIstatistik={setIstatistik}
          setAktifSayfa={setAktifSayfa}
          daireDetay={daireDetay} setDaireDetay={setDaireDetay}
          daireDetayVeri={daireDetayVeri} daireDetayYukleniyor={daireDetayYukleniyor}
          daireDetayAc={daireDetayAc}
          daireNot={daireNot} setDaireNot={setDaireNot}
          daireNotMesaj={daireNotMesaj} daireNotKaydet={daireNotKaydet}
        />
      </div>
    </div>
  )
}

function DashboardIcerik(p: any) {
  const { aktifSayfa } = p

  const msj = (m: any) => m ? <div style={{ background: m.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: m.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '.85rem', fontWeight: '600' }}>{m.metin}</div> : null

  const inputStyle: any = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }
  const labelStyle: any = { display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }
  const cardStyle: any  = { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }
  const hdrStyle = (bg: string): any => ({ background: bg, color: '#fff', padding: '12px 20px', fontWeight: '700' })
  const btnStyle = (bg: string, dis?: boolean): any => ({ width: '100%', padding: '11px', background: dis ? '#9ca3af' : bg, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '.9rem', fontWeight: '700', cursor: 'pointer' })

  if (aktifSayfa === 'dashboard') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>Hoş geldiniz, {p.kullanici?.ad_soyad} 👋</h2>

      {/* Uyarılar */}
      {((p.istatistik.bekleyenBildirim || 0) > 0 || (p.istatistik.acikAriza || 0) > 0) && (
        <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>⚠️ Dikkat Gerektiren Durumlar</div>
          {(p.istatistik.bekleyenBildirim || 0) > 0 && (
            <div style={{ color: '#92400e', fontSize: '.9rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              • {p.istatistik.bekleyenBildirim} bekleyen ödeme bildirimi
              <button onClick={() => p.setAktifSayfa('bildirimler')} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '.78rem', fontWeight: '700' }}>İncele →</button>
            </div>
          )}
          {(p.istatistik.acikAriza || 0) > 0 && (
            <div style={{ color: '#92400e', fontSize: '.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              • {p.istatistik.acikAriza} açık arıza talebi
              <button onClick={() => p.setAktifSayfa('arizalar')} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '.78rem', fontWeight: '700' }}>İncele →</button>
            </div>
          )}
        </div>
      )}

      {/* İstatistik Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { etiket: 'Toplam Sakin', deger: p.istatistik.toplamSakin || 0, renk: '#1a3c5e', ikon: '👥' },
          { etiket: 'Dolu Daire', deger: `${p.istatistik.dolDaire || 0}/${p.istatistik.toplamDaire || 0}`, renk: '#16a34a', ikon: '🏠' },
          { etiket: 'Toplam Tahakkuk', deger: paraFormat(p.istatistik.toplamTahakkuk || 0), renk: '#2e7d9f', ikon: '📋' },
          { etiket: 'Gecikmiş Borç', deger: paraFormat(p.istatistik.gecikmisTahakkuk || 0), renk: '#dc2626', ikon: '⚠️' },
          { etiket: 'Bekl. Bildirim', deger: p.istatistik.bekleyenBildirim || 0, renk: '#d97706', ikon: '✉️' },
          { etiket: 'Açık Arıza', deger: p.istatistik.acikAriza || 0, renk: '#7c3aed', ikon: '🔧' },
        ].map(k => (
          <div key={k.etiket} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{k.ikon}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: k.renk, marginBottom: '4px' }}>{k.deger}</div>
            <div style={{ color: '#6b7280', fontSize: '.72rem', fontWeight: '600' }}>{k.etiket}</div>
          </div>
        ))}
      </div>

      {/* Finansal Özet */}
      {(() => {
        const tahsilat = p.istatistik.toplamTahakkuk || 0
        const gecikme  = p.istatistik.gecikmisTahakkuk || 0
        const odenen   = tahsilat - gecikme
        const oran     = tahsilat > 0 ? Math.round(odenen / tahsilat * 100) : 0
        const oranRenk = oran >= 90 ? '#16a34a' : oran >= 70 ? '#d97706' : '#dc2626'
        return (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
            <div style={{ fontWeight: '700', color: '#1a3c5e', marginBottom: '16px', fontSize: '1rem' }}>💰 Finansal Özet</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Toplam Tahakkuk', deger: paraFormat(tahsilat), renk: '#1a3c5e' },
                { label: 'Tahsil Edilen', deger: paraFormat(odenen), renk: '#16a34a' },
                { label: 'Gecikmiş', deger: paraFormat(gecikme), renk: '#dc2626' },
              ].map(k => (
                <div key={k.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                  <div style={{ color: '#6b7280', fontSize: '.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontWeight: '800', color: k.renk, fontSize: '1rem' }}>{k.deger}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
              <span style={{ fontWeight: '700', color: '#374151' }}>Genel Tahsilat Oranı</span>
              <span style={{ fontWeight: '800', color: oranRenk }}>%{oran}</span>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: '6px', height: '10px' }}>
              <div style={{ background: oranRenk, width: `${Math.min(oran, 100)}%`, height: '100%', borderRadius: '6px', transition: 'width .5s ease' }} />
            </div>
          </div>
        )
      })()}

      {/* Bloklar — tıklanabilir */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: '700', color: '#374151', marginBottom: '12px', fontSize: '1rem' }}>🏢 Blok Durumu</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {['A','B','C','D'].map(b => {
            const blokDaireler = p.daireler.filter((d: any) => d.bloklar?.blok_adi === b)
            const dolu = blokDaireler.filter((d: any) => d.durum === 'dolu').length
            const bos  = blokDaireler.filter((d: any) => d.durum === 'bos').length
            const dolulukOrani = blokDaireler.length > 0 ? Math.round(dolu / blokDaireler.length * 100) : 0
            return (
              <div key={b} onClick={() => p.setAktifSayfa('daire_yonetim')}
                style={{ background: '#fff', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'box-shadow .2s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a3c5e' }}>{b} Blok</div>
                  <span style={{ background: '#eff6ff', color: '#1a3c5e', padding: '3px 10px', borderRadius: '20px', fontSize: '.75rem', fontWeight: '700' }}>{blokDaireler.length} Daire</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ flex: 1, textAlign: 'center', background: '#dcfce7', borderRadius: '8px', padding: '8px' }}>
                    <div style={{ fontWeight: '800', color: '#166534', fontSize: '1.2rem' }}>{dolu}</div>
                    <div style={{ color: '#166534', fontSize: '.72rem', fontWeight: '600' }}>Dolu</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', background: '#f3f4f6', borderRadius: '8px', padding: '8px' }}>
                    <div style={{ fontWeight: '800', color: '#6b7280', fontSize: '1.2rem' }}>{bos}</div>
                    <div style={{ color: '#6b7280', fontSize: '.72rem', fontWeight: '600' }}>Boş</div>
                  </div>
                </div>
                <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '.78rem' }}>
                  <span style={{ color: '#6b7280' }}>Doluluk</span>
                  <span style={{ fontWeight: '700', color: dolulukOrani >= 80 ? '#16a34a' : '#d97706' }}>%{dolulukOrani}</span>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px' }}>
                  <div style={{ background: dolulukOrani >= 80 ? '#16a34a' : '#d97706', width: `${dolulukOrani}%`, height: '100%', borderRadius: '4px' }} />
                </div>
                <div style={{ marginTop: '10px', color: '#9ca3af', fontSize: '.72rem', textAlign: 'right' }}>Detay için tıklayın →</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Son Ödemeler + Son Arızalar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Son Ödemeler */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#16a34a', color: '#fff', padding: '12px 20px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>💰 Son Ödemeler</span>
            <button onClick={() => p.setAktifSayfa('odemeler')} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '.75rem', fontWeight: '700' }}>Tümü →</button>
          </div>
          {p.odemeler.slice(0, 5).length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '.85rem' }}>Henüz ödeme yok.</div>
          ) : p.odemeler.slice(0, 5).map((o: any, i: number) => (
            <div key={o.id} style={{ padding: '10px 20px', borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '.85rem', color: '#374151' }}>{o.daire?.bloklar?.blok_adi} Blok - {o.daire?.daire_no}</div>
                <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{new Date(o.odeme_tarihi).toLocaleDateString('tr-TR')} · {o.tur?.tur_adi}</div>
              </div>
              <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '.95rem' }}>{paraFormat(Number(o.tutar))}</span>
            </div>
          ))}
        </div>

        {/* Son Arızalar */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#7c3aed', color: '#fff', padding: '12px 20px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🔧 Açık Arızalar</span>
            <button onClick={() => p.setAktifSayfa('arizalar')} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '.75rem', fontWeight: '700' }}>Tümü →</button>
          </div>
          {p.arizalar.slice(0, 5).length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '.85rem' }}>Açık arıza yok. ✅</div>
          ) : p.arizalar.slice(0, 5).map((a: any, i: number) => (
            <div key={a.id} style={{ padding: '10px 20px', borderBottom: i < Math.min(p.arizalar.length, 5) - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '.85rem', color: '#374151' }}>{a.baslik}</div>
                  <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{a.profiller?.ad_soyad} · {a.kategori}</div>
                </div>
                <span style={{ background: a.oncelik === 'yuksek' ? '#fee2e2' : '#f3f4f6', color: a.oncelik === 'yuksek' ? '#dc2626' : '#6b7280', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700', flexShrink: 0 }}>
                  {a.oncelik === 'yuksek' ? '🔴' : '🔵'} {a.oncelik}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (aktifSayfa === 'sakinler') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>👥 Sakin Yönetimi</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'flex-start' }}>
        <div style={cardStyle}>
          <div style={hdrStyle('#1a3c5e')}>➕ Yeni Sakin Ekle</div>
          <div style={{ padding: '20px' }}>
            {msj(p.sakinEkleMesaj)}
            <form onSubmit={p.sakinEkle}>
              {[{ label: 'Ad Soyad', key: 'ad_soyad', type: 'text', ph: 'Ahmet Yılmaz' }, { label: 'E-posta', key: 'email', type: 'email', ph: 'ahmet@example.com' }, { label: 'Şifre', key: 'sifre', type: 'password', ph: 'En az 6 karakter' }, { label: 'Telefon', key: 'telefon', type: 'text', ph: '0500...' }].map(f => (
                <div key={f.key} style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type} required={f.key !== 'telefon'} placeholder={f.ph} value={p.sakinEkleForm[f.key]} onChange={(e: any) => p.setSakinEkleForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Daire <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span></label>
                <select value={p.sakinEkleForm.daire_id} onChange={(e: any) => p.setSakinEkleForm((prev: any) => ({ ...prev, daire_id: e.target.value }))} style={inputStyle}>
                  <option value="">-- Sonra Ata --</option>
                  {p.daireler.filter((d: any) => d.durum === 'bos').map((d: any) => <option key={d.id} value={d.id}>{d.bloklar?.blok_adi} Blok - Daire {d.daire_no}</option>)}
                </select>
              </div>
              <button type="submit" disabled={p.sakinEkleYukleniyor} style={btnStyle('#1a3c5e', p.sakinEkleYukleniyor)}>{p.sakinEkleYukleniyor ? 'Ekleniyor...' : '➕ Sakin Ekle'}</button>
            </form>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={hdrStyle('#374151')}>👥 Sakin Listesi ({p.sakinler.length})</div>
          {p.sakinler.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Henüz sakin yok.</div>
            : p.sakinler.map((s: any, i: number) => {
              const md = p.daireler.find((d: any) => d.kullanici_id === s.id)
              return (
                <div key={s.id} style={{ padding: '14px 20px', borderBottom: i < p.sakinler.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: '700', color: '#374151' }}>{s.ad_soyad}</span>
                        <span style={{ background: s.durum === 'aktif' ? '#dcfce7' : '#f3f4f6', color: s.durum === 'aktif' ? '#166534' : '#6b7280', padding: '1px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>{s.durum === 'aktif' ? '✓ Aktif' : 'Pasif'}</span>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '.78rem' }}>{s.email}</div>
                      {md && <div style={{ color: '#1a3c5e', fontSize: '.75rem', fontWeight: '600', marginTop: '2px' }}>🏠 {md.bloklar?.blok_adi} Blok - Daire {md.daire_no}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => p.sakinDuzenleAc(s)} style={{ background: '#eff6ff', color: '#1a3c5e', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '.78rem', fontWeight: '700' }}>✏️</button>
                      <button onClick={() => { p.setSifreSakin(s); p.setYeniSifre(''); p.setSifreMesaj(null) }} style={{ background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '.78rem', fontWeight: '700' }}>🔑</button>
                      <button onClick={() => p.tahsilatAc(s)} style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '.78rem', fontWeight: '700' }}>💰</button>
                      <button onClick={async () => {
                        if (!confirm(`${s.ad_soyad} ${s.durum === 'aktif' ? 'pasife' : 'aktife'} alınsın mı?`)) return
                        await supabase.from('profiller').update({ durum: s.durum === 'aktif' ? 'pasif' : 'aktif' }).eq('id', s.id)
                        const { data } = await supabase.from('profiller').select('*').eq('rol', 'sakin').order('ad_soyad')
                        p.setSakinler(data || [])
                      }} style={{ background: s.durum === 'aktif' ? '#fee2e2' : '#dcfce7', color: s.durum === 'aktif' ? '#dc2626' : '#16a34a', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '.78rem' }}>
                        {s.durum === 'aktif' ? '🚫' : '✅'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Sakin Düzenle Modal */}
      {p.duzenlenecekSakin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', overflow: 'hidden' }}>
            <div style={{ background: '#1a3c5e', color: '#fff', padding: '16px 20px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
              <span>✏️ Sakin Düzenle</span>
              <button onClick={() => p.setDuzenlenecekSakin(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              {msj(p.sakinDuzenleMesaj)}
              <form onSubmit={p.sakinGuncelle}>
                <div style={{ marginBottom: '14px' }}><label style={labelStyle}>Ad Soyad</label><input type="text" required value={p.sakinDuzenleForm.ad_soyad} onChange={(e: any) => p.setSakinDuzenleForm((f: any) => ({ ...f, ad_soyad: e.target.value }))} style={inputStyle} /></div>
                <div style={{ marginBottom: '14px' }}><label style={labelStyle}>Telefon</label><input type="text" value={p.sakinDuzenleForm.telefon} onChange={(e: any) => p.setSakinDuzenleForm((f: any) => ({ ...f, telefon: e.target.value }))} style={inputStyle} /></div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Durum</label>
                  <select value={p.sakinDuzenleForm.durum} onChange={(e: any) => p.setSakinDuzenleForm((f: any) => ({ ...f, durum: e.target.value }))} style={inputStyle}>
                    <option value="aktif">Aktif</option><option value="pasif">Pasif</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => p.setDuzenlenecekSakin(null)} style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>İptal</button>
                  <button type="submit" style={{ flex: 1, padding: '10px', background: '#1a3c5e', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>💾 Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Şifre Sıfırlama Modal */}
      {p.sifreSakin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '380px', overflow: 'hidden' }}>
            <div style={{ background: '#d97706', color: '#fff', padding: '16px 20px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
              <span>🔑 Şifre Sıfırla — {p.sifreSakin.ad_soyad}</span>
              <button onClick={() => p.setSifreSakin(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              {p.sifreMesaj && <div style={{ background: p.sifreMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: p.sifreMesaj.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '.85rem', fontWeight: '600' }}>{p.sifreMesaj.metin}</div>}
              <form onSubmit={p.sakinSifreSifirla}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Yeni Şifre</label>
                  <input type="password" required minLength={6} value={p.yeniSifre} onChange={(e: any) => p.setYeniSifre(e.target.value)} placeholder="En az 6 karakter" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
                  <div style={{ color: '#9ca3af', fontSize: '.75rem', marginTop: '4px' }}>Sakin bir sonraki girişte bu şifreyi kullanacak.</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => p.setSifreSakin(null)} style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>İptal</button>
                  <button type="submit" disabled={p.sifreYukleniyor} style={{ flex: 1, padding: '10px', background: p.sifreYukleniyor ? '#9ca3af' : '#d97706', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
                    {p.sifreYukleniyor ? 'Güncelleniyor...' : '🔑 Şifreyi Güncelle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tahsilat Modal */}
      {p.tahsilatModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', overflow: 'hidden' }}>
            <div style={{ background: '#16a34a', color: '#fff', padding: '16px 20px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
              <span>💰 Tahsilat — {p.tahsilatModal.sakin.ad_soyad}</span>
              <button onClick={() => p.setTahsilatModal(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '.85rem', color: '#166534' }}>
                🏠 {p.tahsilatModal.daire.bloklar?.blok_adi} Blok - Daire {p.tahsilatModal.daire.daire_no}
              </div>
              {p.sakinTahakkuklar.length === 0 ? <div style={{ textAlign: 'center', color: '#16a34a', padding: '24px', fontWeight: '700' }}>✅ Açık borç yok!</div> : (
                <form onSubmit={p.tahsilatKaydet}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Tahakkuk</label>
                    <select value={p.tahsilatForm.tahakkuk_id} onChange={(e: any) => { const th = p.sakinTahakkuklar.find((t: any) => t.id === parseInt(e.target.value)); p.setTahsilatForm((f: any) => ({ ...f, tahakkuk_id: e.target.value, tutar: th ? String(th.tutar) : '' })) }} required style={inputStyle}>
                      <option value="">-- Seçin --</option>
                      {p.sakinTahakkuklar.map((t: any) => <option key={t.id} value={t.id}>{t.aidat_turleri?.tur_adi} — {ayAdi(t.donem_ay)} {t.donem_yil} — {paraFormat(Number(t.tutar))}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '14px' }}><label style={labelStyle}>Tutar (₺)</label><input type="number" step="0.01" required value={p.tahsilatForm.tutar} onChange={(e: any) => p.setTahsilatForm((f: any) => ({ ...f, tutar: e.target.value }))} style={inputStyle} /></div>
                  <div style={{ marginBottom: '14px' }}><label style={labelStyle}>Tarih</label><input type="date" required value={p.tahsilatForm.odeme_tarihi} onChange={(e: any) => p.setTahsilatForm((f: any) => ({ ...f, odeme_tarihi: e.target.value }))} style={inputStyle} /></div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Yöntem</label>
                    <select value={p.tahsilatForm.odeme_yontemi} onChange={(e: any) => p.setTahsilatForm((f: any) => ({ ...f, odeme_yontemi: e.target.value }))} style={inputStyle}>
                      <option value="nakit">Nakit</option><option value="havale">Havale</option><option value="eft">EFT</option><option value="kredi_karti">Kredi Kartı</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '20px' }}><label style={labelStyle}>Açıklama</label><textarea rows={2} value={p.tahsilatForm.aciklama} onChange={(e: any) => p.setTahsilatForm((f: any) => ({ ...f, aciklama: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} /></div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => p.setTahsilatModal(null)} style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>İptal</button>
                    <button type="submit" style={{ flex: 1, padding: '10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>💰 Kaydet</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (aktifSayfa === 'tahakkuklar') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📋 Tahakkuk Oluştur</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}>
          <div style={hdrStyle('#1a3c5e')}>📋 Yeni Tahakkuk</div>
          <div style={{ padding: '20px' }}>
            {msj(p.tahakkukMesaj)}
            <form onSubmit={p.tahakkukKaydet}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Kapsam</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ value: false, label: '🏠 Tek Daire' }, { value: true, label: '🏢 Tüm Dolu' }].map((o: any) => (
                    <button key={String(o.value)} type="button" onClick={() => p.setTahakkukForm((f: any) => ({ ...f, toplu: o.value }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700', border: p.tahakkukForm.toplu === o.value ? '2px solid #1a3c5e' : '1px solid #d1d5db', background: p.tahakkukForm.toplu === o.value ? '#eff6ff' : '#fff', color: p.tahakkukForm.toplu === o.value ? '#1a3c5e' : '#6b7280' }}>{o.label}</button>
                  ))}
                </div>
              </div>
              {!p.tahakkukForm.toplu && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Daire</label>
                  <select value={p.tahakkukForm.daire_id} onChange={(e: any) => p.setTahakkukForm((f: any) => ({ ...f, daire_id: e.target.value }))} required={!p.tahakkukForm.toplu} style={inputStyle}>
                    <option value="">-- Daire Seçin --</option>
                    {p.daireler.map((d: any) => <option key={d.id} value={d.id}>{d.bloklar?.blok_adi} Blok - Daire {d.daire_no}{d.profiller?.ad_soyad ? ` (${d.profiller.ad_soyad})` : ' (Boş)'}</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Aidat Türü</label>
                <select value={p.tahakkukForm.tur_id} onChange={(e: any) => p.turSecildi(e.target.value)} required style={inputStyle}>
                  <option value="">-- Tür Seçin --</option>
                  {p.aidatTurleri.map((t: any) => <option key={t.id} value={t.id}>{t.tur_adi} ({paraFormat(Number(t.varsayilan_tutar))})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}><label style={labelStyle}>Tutar (₺)</label><input type="number" step="0.01" required value={p.tahakkukForm.tutar} onChange={(e: any) => p.setTahakkukForm((f: any) => ({ ...f, tutar: e.target.value }))} style={inputStyle} /></div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Dönem</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={p.tahakkukForm.donem_yil} onChange={(e: any) => p.setTahakkukForm((f: any) => ({ ...f, donem_yil: parseInt(e.target.value) }))} style={{ ...inputStyle, flex: 1 }}>
                    {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select value={p.tahakkukForm.donem_ay} onChange={(e: any) => p.setTahakkukForm((f: any) => ({ ...f, donem_ay: parseInt(e.target.value) }))} style={{ ...inputStyle, flex: 1 }}>
                    {Array.from({length:12},(_,i) => i+1).map(m => <option key={m} value={m}>{ayAdi(m)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}><label style={labelStyle}>Son Ödeme <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span></label><input type="date" value={p.tahakkukForm.son_odeme_tarihi} onChange={(e: any) => p.setTahakkukForm((f: any) => ({ ...f, son_odeme_tarihi: e.target.value }))} style={inputStyle} /></div>
              <button type="submit" disabled={p.tahakkukYukleniyor} style={btnStyle('#1a3c5e', p.tahakkukYukleniyor)}>{p.tahakkukYukleniyor ? 'Kaydediliyor...' : p.tahakkukForm.toplu ? '🏢 Toplu Ekle' : '📋 Tahakkuk Ekle'}</button>
            </form>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: '700', color: '#1a3c5e', marginBottom: '12px' }}>📊 Dolu Daireler ({p.daireler.filter((d: any) => d.durum === 'dolu').length})</div>
          {p.daireler.filter((d: any) => d.durum === 'dolu').map((d: any) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '.85rem' }}>
              <span style={{ fontWeight: '600' }}>{d.bloklar?.blok_adi} Blok - {d.daire_no}</span>
              <span style={{ color: '#6b7280' }}>{d.profiller?.ad_soyad}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Faiz Tahakkuku Oluştur */}
      <div style={{ marginTop: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#d97706', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>⚠️ Gecikme Faizi Tahakkuku</div>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '.78rem', color: '#6b7280', marginBottom: '4px' }}>Aylık Faiz Oranı (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={p.faizOran} onChange={(e: any) => p.setFaizOran(parseFloat(e.target.value))} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', width: '100px' }} />
          </div>
          <button onClick={p.faizHesapla} disabled={p.faizYukleniyor} style={{ padding: '7px 16px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>
            {p.faizYukleniyor ? 'Hesaplanıyor...' : '🔍 Faizleri Hesapla'}
          </button>
          {p.faizListesi.length > 0 && (
            <button onClick={p.tumFaizTahakkukOlustur} style={{ padding: '7px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>
              ⚡ Tümüne Tahakkuk Oluştur ({p.faizListesi.length})
            </button>
          )}
        </div>
        {p.faizMesaj && (
          <div style={{ padding: '12px 20px', background: p.faizMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: p.faizMesaj.tip === 'basari' ? '#166534' : '#991b1b', fontWeight: '600', fontSize: '.85rem' }}>
            {p.faizMesaj.metin}
          </div>
        )}
        {p.faizListesi.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Sakin','Daire','Aidat Türü','Dönem','Ana Borç','Gecikme (Gün)','Faiz Tutarı','İşlem'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: '700', fontSize: '.75rem', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.faizListesi.map((item: any, i: number) => (
                  <tr key={item.tahakkuk.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '9px 14px', fontWeight: '700' }}>{item.sakin || '—'}</td>
                    <td style={{ padding: '9px 14px', color: '#6b7280' }}>{item.daire?.bloklar?.blok_adi} Blok - {item.daire?.daire_no}</td>
                    <td style={{ padding: '9px 14px' }}>{item.tahakkuk.aidat_turleri?.tur_adi}</td>
                    <td style={{ padding: '9px 14px' }}>{ayAdi(item.tahakkuk.donem_ay)} {item.tahakkuk.donem_yil}</td>
                    <td style={{ padding: '9px 14px', color: '#dc2626', fontWeight: '600' }}>{paraFormat(item.kalan)}</td>
                    <td style={{ padding: '9px 14px', color: '#d97706', fontWeight: '600' }}>{item.gun} gün</td>
                    <td style={{ padding: '9px 14px', color: '#dc2626', fontWeight: '800' }}>{paraFormat(item.faiz)}</td>
                    <td style={{ padding: '9px 14px' }}>
                      <button onClick={() => p.faizTahakkukOlustur(item)} style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '.75rem', fontWeight: '700' }}>
                        ➕ Tahakkuk Oluştur
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#fffbeb', fontWeight: '800' }}>
                  <td colSpan={6} style={{ padding: '10px 14px', color: '#d97706' }}>TOPLAM FAİZ</td>
                  <td style={{ padding: '10px 14px', color: '#dc2626' }}>{paraFormat(p.faizListesi.reduce((a: number, f: any) => a + f.faiz, 0))}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Tahakkuk Listesi ve Silme */}
      <div style={{ marginTop: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#dc2626', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>🗑️ Tahakkuk Listesi / Sil</div>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '.78rem', color: '#6b7280', marginBottom: '4px' }}>Daire</label>
            <select value={p.tahakkukFiltre.daire_id} onChange={(e: any) => p.setTahakkukFiltre((f: any) => ({ ...f, daire_id: e.target.value }))} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
              <option value="">Tümü</option>
              {p.daireler.map((d: any) => <option key={d.id} value={d.id}>{d.bloklar?.blok_adi} Blok - {d.daire_no}{d.profiller?.ad_soyad ? ` (${d.profiller.ad_soyad})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '.78rem', color: '#6b7280', marginBottom: '4px' }}>Yıl</label>
            <select value={p.tahakkukFiltre.yil} onChange={(e: any) => p.setTahakkukFiltre((f: any) => ({ ...f, yil: parseInt(e.target.value) }))} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={() => p.tahakkukListeYukle(p.tahakkukFiltre.daire_id, p.tahakkukFiltre.yil)} style={{ padding: '7px 16px', background: '#1a3c5e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>🔍 Listele</button>
        </div>
        {p.tahakkukListesi.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Listele butonuna basın.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Daire','Tür','Dönem','Tutar','Durum','Sil'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: '700', fontSize: '.75rem', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.tahakkukListesi.map((t: any, i: number) => (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '9px 14px', fontWeight: '600' }}>{(t.daireler as any)?.bloklar?.blok_adi} Blok - {(t.daireler as any)?.daire_no}</td>
                    <td style={{ padding: '9px 14px' }}>{t.aidat_turleri?.tur_adi}</td>
                    <td style={{ padding: '9px 14px' }}>{ayAdi(t.donem_ay)} {t.donem_yil}</td>
                    <td style={{ padding: '9px 14px', fontWeight: '700' }}>{paraFormat(Number(t.tutar))}</td>
                    <td style={{ padding: '9px 14px' }}>
                      <span style={{ background: t.durum === 'odendi' ? '#dcfce7' : t.durum === 'gecikti' ? '#fee2e2' : '#fef3c7', color: t.durum === 'odendi' ? '#166534' : t.durum === 'gecikti' ? '#991b1b' : '#92400e', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>
                        {t.durum === 'odendi' ? '✓ Ödendi' : t.durum === 'gecikti' ? '⚠ Gecikti' : '○ Bekliyor'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      {t.durum !== 'odendi' && (
                        <button onClick={() => p.tahakkukSil(t.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '.75rem', fontWeight: '700' }}>🗑️ Sil</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  if (aktifSayfa === 'odemeler') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>💰 Ödeme Listesi</h2>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: '700', fontSize: '.85rem' }}>Yıl:</label>
          <select value={p.odemeFiltre.yil} onChange={(e: any) => p.setOdemeFiltre((f: any) => ({ ...f, yil: parseInt(e.target.value) }))} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: '700', fontSize: '.85rem' }}>Ay:</label>
          <select value={p.odemeFiltre.ay} onChange={(e: any) => p.setOdemeFiltre((f: any) => ({ ...f, ay: parseInt(e.target.value) }))} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
            <option value={0}>Tümü</option>
            {Array.from({length:12},(_,i) => i+1).map(m => <option key={m} value={m}>{ayAdi(m)}</option>)}
          </select>
        </div>
        <button onClick={p.odemeYenile} style={{ padding: '7px 16px', background: '#1a3c5e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '.85rem', fontWeight: '700' }}>🔄 Yenile</button>
        <button onClick={() => {
          const fl = p.odemeler.filter((o: any) => { const t = new Date(o.odeme_tarihi); return t.getFullYear() === p.odemeFiltre.yil && (p.odemeFiltre.ay === 0 || t.getMonth() + 1 === p.odemeFiltre.ay) })
          const ws = XLSX.utils.json_to_sheet(fl.map((o: any) => ({
            'Blok': o.daire?.bloklar?.blok_adi,
            'Daire No': o.daire?.daire_no,
            'Aidat Türü': o.tur?.tur_adi,
            'Dönem': `${ayAdi(o.tahakkuklar?.donem_ay)} ${o.tahakkuklar?.donem_yil}`,
            'Ödeme Tarihi': new Date(o.odeme_tarihi).toLocaleDateString('tr-TR'),
            'Yöntem': o.odeme_yontemi,
            'Tutar (₺)': Number(o.tutar).toFixed(2),
          })))
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, 'Ödemeler')
          XLSX.writeFile(wb, `odemeler_${p.odemeFiltre.yil}${p.odemeFiltre.ay > 0 ? '_' + p.odemeFiltre.ay : ''}.xlsx`)
        }} style={{ padding: '7px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '.85rem', fontWeight: '700' }}>📥 Excel İndir</button>
      </div>
      {(() => {
        const fl = p.odemeler.filter((o: any) => { const t = new Date(o.odeme_tarihi); return t.getFullYear() === p.odemeFiltre.yil && (p.odemeFiltre.ay === 0 || t.getMonth() + 1 === p.odemeFiltre.ay) })
        const top = fl.reduce((acc: number, o: any) => acc + Number(o.tutar), 0)
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
              {[{ label: 'Toplam Ödeme', deger: `${fl.length} adet`, renk: '#1a3c5e' }, { label: 'Toplam Tutar', deger: paraFormat(top), renk: '#16a34a' }, { label: 'Ortalama', deger: fl.length > 0 ? paraFormat(top / fl.length) : '-', renk: '#2e7d9f' }].map((k: any) => (
                <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: '.75rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: k.renk }}>{k.deger}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={hdrStyle('#16a34a')}>💰 Ödemeler ({fl.length})</div>
              {fl.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Bu dönemde ödeme bulunamadı.</div>
                : fl.map((o: any, i: number) => (
                  <div key={o.id} style={{ padding: '12px 20px', borderBottom: i < fl.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#374151' }}>{o.daire?.bloklar?.blok_adi} Blok - Daire {o.daire?.daire_no}</div>
                      <div style={{ color: '#6b7280', fontSize: '.8rem' }}>{o.tur?.tur_adi} — {ayAdi(o.tahakkuklar?.donem_ay)} {o.tahakkuklar?.donem_yil}</div>
                      <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{new Date(o.odeme_tarihi).toLocaleDateString('tr-TR')} · {o.odeme_yontemi}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', color: '#16a34a' }}>{paraFormat(Number(o.tutar))}</div>
                      <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>✓ Ödendi</span>
                    </div>
                  </div>
                ))}
              {fl.length > 0 && <div style={{ padding: '12px 20px', background: '#f0fdf4', display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#16a34a' }}><span>Toplam</span><span>{paraFormat(top)}</span></div>}
            </div>
          </>
        )
      })()}
    </div>
  )

  if (aktifSayfa === 'bildirimler') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>✉️ Bekleyen Ödeme Bildirimleri</h2>
      {p.bildirimler.length === 0 ? (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#166534', fontWeight: '700' }}>✅ Bekleyen bildirim yok!</div>
      ) : (() => {
        // Sakin bazlı grupla
        const gruplar: any = {}
        p.bildirimler.forEach((b: any) => {
          const key = b.kullanici_id
          if (!gruplar[key]) gruplar[key] = { sakin: b.profiller, bildirimler: [] }
          gruplar[key].bildirimler.push(b)
        })
        return Object.values(gruplar).map((grup: any) => {
          const toplam = grup.bildirimler.reduce((acc: number, b: any) => acc + Number(b.tutar), 0)
          return (
            <div key={grup.sakin?.id} style={{ background: '#fff', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              {/* Sakin Başlık */}
              <div style={{ background: '#f8fafc', padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: '800', color: '#1a3c5e', fontSize: '1rem' }}>👤 {grup.sakin?.ad_soyad}</div>
                  <div style={{ color: '#6b7280', fontSize: '.78rem' }}>{grup.bildirimler.length} bildirim · Toplam: <strong style={{ color: '#16a34a' }}>{paraFormat(toplam)}</strong></div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={async () => {
                    if (!confirm(`${grup.sakin?.ad_soyad} için tüm ${grup.bildirimler.length} bildirim onaylansın mı?`)) return
                    for (const b of grup.bildirimler) {
                      await p.bildirimOnayla(b.id, b.tahakkuk_id, b.tutar)
                    }
                  }} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 16px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700' }}>
                    ✓ Tümünü Onayla ({grup.bildirimler.length})
                  </button>
                  <button onClick={async () => {
                    if (!confirm(`${grup.sakin?.ad_soyad} için tüm ${grup.bildirimler.length} bildirim reddedilsin mi?`)) return
                    for (const b of grup.bildirimler) {
                      await p.bildirimReddet(b.id)
                    }
                  }} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', padding: '7px 16px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700' }}>
                    ✗ Tümünü Reddet
                  </button>
                </div>
              </div>
              {/* Bildirim Listesi */}
              {grup.bildirimler.map((b: any, i: number) => (
                <div key={b.id} style={{ padding: '12px 20px', borderBottom: i < grup.bildirimler.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#374151', fontSize: '.9rem' }}>{b.tahakkuklar?.aidat_turleri?.tur_adi} — {ayAdi(b.tahakkuklar?.donem_ay)} {b.tahakkuklar?.donem_yil}</div>
                    <div style={{ color: '#6b7280', fontSize: '.78rem' }}>Yöntem: {b.odeme_yontemi} · {new Date(b.odeme_tarihi).toLocaleDateString('tr-TR')}</div>
                    {b.aciklama && <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{b.aciklama}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: '800', color: '#16a34a', fontSize: '1rem' }}>{paraFormat(Number(b.tutar))}</span>
                    <button onClick={() => p.bildirimOnayla(b.id, b.tahakkuk_id, b.tutar)} style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '.78rem', fontWeight: '700' }}>✓</button>
                    <button onClick={() => p.bildirimReddet(b.id)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '.78rem', fontWeight: '700' }}>✗</button>
                  </div>
                </div>
              ))}
            </div>
          )
        })
      })()}
    </div>
  )

  if (aktifSayfa === 'arizalar') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>🔧 Açık Arıza Talepler</h2>
      {p.arizalar.length === 0 ? <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#166534', fontWeight: '700' }}>✅ Açık arıza talebi yok!</div>
        : p.arizalar.map((a: any) => (
          <div key={a.id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: `1px solid ${a.oncelik === 'yuksek' ? '#fca5a5' : '#e5e7eb'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>{a.kategori}</span>
                  <span style={{ background: a.oncelik === 'yuksek' ? '#fee2e2' : '#dbeafe', color: a.oncelik === 'yuksek' ? '#991b1b' : '#1e40af', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>{a.oncelik}</span>
                </div>
                <div style={{ fontWeight: '700', color: '#374151' }}>{a.baslik}</div>
                <div style={{ color: '#6b7280', fontSize: '.82rem', marginTop: '4px' }}>{a.aciklama}</div>
                <div style={{ color: '#9ca3af', fontSize: '.75rem', marginTop: '4px' }}>{a.profiller?.ad_soyad} | {new Date(a.olusturma).toLocaleDateString('tr-TR')}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => p.arizaDurumGuncelle(a.id, 'islemde')} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700' }}>⚙️ İşleme Al</button>
                <button onClick={() => p.arizaDurumGuncelle(a.id, 'tamamlandi')} style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700' }}>✅ Tamamlandı</button>
              </div>
            </div>
          </div>
        ))}
    </div>
  )

  if (aktifSayfa === 'duyurular') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📢 Duyuru Yönetimi</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}>
          <div style={hdrStyle('#1a3c5e')}>📢 Yeni Duyuru</div>
          <div style={{ padding: '20px' }}>
            {msj(p.duyuruMesaj)}
            <form onSubmit={p.duyuruEkle}>
              <div style={{ marginBottom: '14px' }}><label style={labelStyle}>Başlık</label><input type="text" required value={p.duyuruForm.baslik} onChange={(e: any) => p.setDuyuruForm((f: any) => ({ ...f, baslik: e.target.value }))} style={inputStyle} /></div>
              <div style={{ marginBottom: '20px' }}><label style={labelStyle}>İçerik</label><textarea rows={4} required value={p.duyuruForm.icerik} onChange={(e: any) => p.setDuyuruForm((f: any) => ({ ...f, icerik: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} /></div>
              <button type="submit" disabled={p.duyuruYukleniyor} style={btnStyle('#1a3c5e', p.duyuruYukleniyor)}>{p.duyuruYukleniyor ? 'Yayınlanıyor...' : '📢 Duyuru Yayınla'}</button>
            </form>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ background: '#374151', color: '#fff', padding: '12px 20px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 Yayınlanan ({p.duyurular.length})</span>

        </div>
          {p.duyurular.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Henüz duyuru yok.</div>
            : p.duyurular.map((d: any, i: number) => (
              <div key={d.id} style={{ padding: '14px 20px', borderBottom: i < p.duyurular.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: '#1a3c5e', marginBottom: '4px' }}>{d.baslik}</div>
                    <div style={{ color: '#374151', fontSize: '.82rem' }}>{d.icerik}</div>
                    <div style={{ color: '#9ca3af', fontSize: '.72rem', marginTop: '4px' }}>{new Date(d.olusturma).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                  <button onClick={() => { if (confirm('Silinsin mi?')) p.duyuruSil(d.id) }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '.8rem', flexShrink: 0 }}>🗑️</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )

  if (aktifSayfa === 'daireler') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>🏠 Daire Eşleştirme</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}>
          <div style={hdrStyle('#1a3c5e')}>🔄 Sakin — Daire Eşleştir</div>
          <div style={{ padding: '20px' }}>
            {msj(p.eslestirmeMesaj)}
            <form onSubmit={p.daireEslestir}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Sakin</label>
                <select value={p.eslestirmeForm.sakin_id} onChange={(e: any) => p.setEslestirmeForm((f: any) => ({ ...f, sakin_id: e.target.value }))} required style={inputStyle}>
                  <option value="">-- Sakin Seçin --</option>
                  {p.sakinler.filter((s: any) => s.durum === 'aktif').map((s: any) => { const md = p.daireler.find((d: any) => d.kullanici_id === s.id); return <option key={s.id} value={s.id}>{s.ad_soyad}{md ? ` (${md.bloklar?.blok_adi} - ${md.daire_no})` : ' (Atanmamış)'}</option> })}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Yeni Daire</label>
                <select value={p.eslestirmeForm.daire_id} onChange={(e: any) => p.setEslestirmeForm((f: any) => ({ ...f, daire_id: e.target.value }))} required style={inputStyle}>
                  <option value="">-- Daire Seçin --</option>
                  <optgroup label="Boş Daireler">{p.daireler.filter((d: any) => d.durum === 'bos').map((d: any) => <option key={d.id} value={d.id}>{d.bloklar?.blok_adi} Blok - {d.daire_no}</option>)}</optgroup>
                  <optgroup label="Dolu Daireler">{p.daireler.filter((d: any) => d.durum === 'dolu').map((d: any) => <option key={d.id} value={d.id}>{d.bloklar?.blok_adi} Blok - {d.daire_no} ({d.profiller?.ad_soyad})</option>)}</optgroup>
                </select>
              </div>
              <button type="submit" disabled={p.eslestirmeYukleniyor} style={btnStyle('#1a3c5e', p.eslestirmeYukleniyor)}>{p.eslestirmeYukleniyor ? 'Kaydediliyor...' : '🔄 Eşleştirmeyi Güncelle'}</button>
            </form>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={hdrStyle('#374151')}>📊 Dolu Daireler ({p.daireler.filter((d: any) => d.durum === 'dolu').length})</div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {p.daireler.filter((d: any) => d.durum === 'dolu').map((d: any) => (
              <div key={d.id} style={{ padding: '10px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '.85rem' }}>{d.bloklar?.blok_adi} Blok - {d.daire_no}</span>
                <span style={{ color: '#6b7280', fontSize: '.8rem' }}>{d.profiller?.ad_soyad}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if (aktifSayfa === 'giderler') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>💸 Gider Yönetimi</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}>
          <div style={hdrStyle('#dc2626')}>💸 Yeni Gider</div>
          <div style={{ padding: '20px' }}>
            {msj(p.giderMesaj)}
            <form onSubmit={p.giderEkle}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Kategori</label>
                <select value={p.giderForm.kategori} onChange={(e: any) => p.setGiderForm((f: any) => ({ ...f, kategori: e.target.value }))} required style={inputStyle}>
                  <option value="">-- Seçin --</option>
                  {p.kategoriler.map((k: string) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}><label style={labelStyle}>Açıklama</label><input type="text" value={p.giderForm.aciklama} onChange={(e: any) => p.setGiderForm((f: any) => ({ ...f, aciklama: e.target.value }))} style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div><label style={labelStyle}>Tutar (₺)</label><input type="number" step="0.01" required value={p.giderForm.tutar} onChange={(e: any) => p.setGiderForm((f: any) => ({ ...f, tutar: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Tarih</label><input type="date" required value={p.giderForm.gider_tarihi} onChange={(e: any) => p.setGiderForm((f: any) => ({ ...f, gider_tarihi: e.target.value }))} style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: '20px' }}><label style={labelStyle}>Belge No <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span></label><input type="text" value={p.giderForm.belge_no} onChange={(e: any) => p.setGiderForm((f: any) => ({ ...f, belge_no: e.target.value }))} style={inputStyle} /></div>
              <button type="submit" disabled={p.giderYukleniyor} style={btnStyle('#dc2626', p.giderYukleniyor)}>{p.giderYukleniyor ? 'Kaydediliyor...' : '💸 Gider Ekle'}</button>
            </form>
          </div>
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[{ label: 'Bu Ay', fn: (g: any) => new Date(g.gider_tarihi).getMonth() === new Date().getMonth() && new Date(g.gider_tarihi).getFullYear() === new Date().getFullYear(), renk: '#dc2626' }, { label: 'Bu Yıl', fn: (g: any) => new Date(g.gider_tarihi).getFullYear() === new Date().getFullYear(), renk: '#1a3c5e' }].map(k => (
              <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ color: '#6b7280', fontSize: '.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: k.renk }}>{paraFormat(p.giderler.filter(k.fn).reduce((a: number, g: any) => a + Number(g.tutar), 0))}</div>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={{ background: '#374151', color: '#fff', padding: '12px 20px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 Son Giderler ({p.giderler.length})</span>
              <button onClick={() => {
                const ws = XLSX.utils.json_to_sheet(p.giderler.map((g: any) => ({
                  'Tarih': new Date(g.gider_tarihi).toLocaleDateString('tr-TR'),
                  'Kategori': g.kategori,
                  'Açıklama': g.aciklama || '—',
                  'Belge No': g.belge_no || '—',
                  'Tutar (₺)': Number(g.tutar).toFixed(2),
                })))
                const wb = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(wb, ws, 'Giderler')
                XLSX.writeFile(wb, `giderler_${new Date().toISOString().split('T')[0]}.xlsx`)
              }} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '.78rem', fontWeight: '700' }}>
                📥 Excel
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {p.giderler.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Henüz gider yok.</div>
                : p.giderler.map((g: any, i: number) => (
                  <div key={g.id} style={{ padding: '12px 20px', borderBottom: i < p.giderler.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ background: '#f3f4f6', color: '#374151', padding: '1px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>{g.kategori}</span>
                      <div style={{ color: '#374151', fontSize: '.85rem', marginTop: '4px' }}>{g.aciklama || '—'}</div>
                      <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{new Date(g.gider_tarihi).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: '800', color: '#dc2626' }}>{paraFormat(Number(g.tutar))}</div>
                      <button onClick={() => { if (confirm('Silinsin mi?')) p.giderSil(g.id) }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '.72rem', marginTop: '4px' }}>🗑️</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (aktifSayfa === 'butce') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📊 Bütçe Takibi</h2>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', display: 'flex', gap: '12px' }}>
        <label style={{ fontWeight: '700', fontSize: '.85rem' }}>Yıl:</label>
        <select value={p.butceYil} onChange={(e: any) => { p.setButceYil(parseInt(e.target.value)); p.butceYukle(parseInt(e.target.value)) }} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}>
          <div style={hdrStyle('#1a3c5e')}>➕ Bütçe Ekle / Güncelle</div>
          <div style={{ padding: '20px' }}>
            {msj(p.butceMesaj)}
            <form onSubmit={p.butceKaydet}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Kategori</label>
                <select value={p.butceForm.kategori} onChange={(e: any) => p.setButceForm((f: any) => ({ ...f, kategori: e.target.value }))} required style={inputStyle}>
                  <option value="">-- Seçin --</option>
                  {p.kategoriler.map((k: string) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}><label style={labelStyle}>Yıllık Bütçe (₺)</label><input type="number" step="0.01" required value={p.butceForm.butce_tutar} onChange={(e: any) => p.setButceForm((f: any) => ({ ...f, butce_tutar: e.target.value }))} style={inputStyle} /></div>
              <div style={{ marginBottom: '20px' }}><label style={labelStyle}>Açıklama <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span></label><input type="text" value={p.butceForm.aciklama} onChange={(e: any) => p.setButceForm((f: any) => ({ ...f, aciklama: e.target.value }))} style={inputStyle} /></div>
              <button type="submit" disabled={p.butceYukleniyor} style={btnStyle('#1a3c5e', p.butceYukleniyor)}>{p.butceYukleniyor ? 'Kaydediliyor...' : '💾 Kaydet'}</button>
            </form>
          </div>
        </div>
        <div>
          {(() => {
            const tb = p.butce.reduce((a: number, b: any) => a + Number(b.butce_tutar), 0)
            const th = p.giderler.filter((g: any) => new Date(g.gider_tarihi).getFullYear() === p.butceYil).reduce((a: number, g: any) => a + Number(g.tutar), 0)
            const ku = tb > 0 ? Math.round(th / tb * 100) : 0
            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
                  {[{ label: 'Bütçe', d: tb, r: '#1a3c5e' }, { label: 'Harcama', d: th, r: '#dc2626' }, { label: 'Kalan', d: tb-th, r: (tb-th)>=0?'#16a34a':'#dc2626' }].map((k: any) => (
                    <div key={k.label} style={{ background: '#fff', borderRadius: '10px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <div style={{ color: '#6b7280', fontSize: '.7rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
                      <div style={{ fontSize: '.9rem', fontWeight: '800', color: k.r }}>{paraFormat(k.d)}</div>
                    </div>
                  ))}
                </div>
                <div style={cardStyle}>
                  <div style={hdrStyle('#374151')}>📊 Kategoriler — {p.butceYil}</div>
                  {p.butce.length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Bu yıl bütçe tanımlanmamış.</div>
                    : p.butce.map((b: any) => {
                      const h = p.giderler.filter((g: any) => g.kategori === b.kategori && new Date(g.gider_tarihi).getFullYear() === p.butceYil).reduce((a: number, g: any) => a + Number(g.tutar), 0)
                      const o = Number(b.butce_tutar) > 0 ? Math.round(h / Number(b.butce_tutar) * 100) : 0
                      const r = o > 90 ? '#dc2626' : o > 70 ? '#d97706' : '#16a34a'
                      return (
                        <div key={b.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', fontSize: '.85rem' }}>{b.kategori}</span>
                            <span style={{ fontSize: '.8rem' }}><span style={{ color: '#dc2626', fontWeight: '700' }}>{h.toLocaleString('tr-TR')} ₺</span> / {Number(b.butce_tutar).toLocaleString('tr-TR')} ₺ <span style={{ color: r, fontWeight: '700' }}>%{o}</span></span>
                          </div>
                          <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px' }}>
                            <div style={{ background: r, width: `${Math.min(o, 100)}%`, height: '100%', borderRadius: '4px' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>Kalan: {(Number(b.butce_tutar)-h).toLocaleString('tr-TR')} ₺</span>
                            <button onClick={() => p.setButceForm({ kategori: b.kategori, butce_tutar: String(b.butce_tutar), aciklama: b.aciklama || '' })} style={{ fontSize: '.72rem', color: '#1a3c5e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>✏️ Düzenle</button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )

  if (aktifSayfa === 'yilsonu') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📈 Yıl Sonu Raporu</h2>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: '700', fontSize: '.85rem' }}>Yıl:</label>
        <select value={p.yilsonuYil} onChange={(e: any) => p.setYilsonuYil(parseInt(e.target.value))} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {p.yilsonuVeri && (
          <>
            <button onClick={() => {
              const aylar = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
              const pf = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'

              // Aylık tablo
              const aylikRows = Array.from({length:12},(_,i) => i).filter(i => p.yilsonuVeri.aylikOdeme[i] > 0 || p.yilsonuVeri.aylikGider[i] > 0).map(i => ({
                'Ay': aylar[i+1],
                'Tahsilat (₺)': p.yilsonuVeri.aylikOdeme[i].toFixed(2),
                'Gider (₺)': p.yilsonuVeri.aylikGider[i].toFixed(2),
                'Net (₺)': (p.yilsonuVeri.aylikOdeme[i] - p.yilsonuVeri.aylikGider[i]).toFixed(2),
              }))

              // Gider kategorileri
              const kategoriRows = Object.entries(p.yilsonuVeri.kategoriGider).sort(([,a]: any,[,b]: any) => b-a).map(([kat, tutar]: any) => ({
                'Kategori': kat,
                'Tutar (₺)': Number(tutar).toFixed(2),
                'Oran (%)': p.yilsonuVeri.toplamGider > 0 ? Math.round(tutar / p.yilsonuVeri.toplamGider * 100) : 0,
              }))

              // Özet
              const ozetRows = [
                { 'Kalem': 'Toplam Tahakkuk', 'Tutar (₺)': p.yilsonuVeri.toplamTahakkuk.toFixed(2) },
                { 'Kalem': 'Toplam Tahsilat', 'Tutar (₺)': p.yilsonuVeri.toplamOdeme.toFixed(2) },
                { 'Kalem': 'Toplam Gider', 'Tutar (₺)': p.yilsonuVeri.toplamGider.toFixed(2) },
                { 'Kalem': 'Net Durum', 'Tutar (₺)': p.yilsonuVeri.netDurum.toFixed(2) },
                { 'Kalem': 'Tahsilat Oranı (%)', 'Tutar (₺)': p.yilsonuVeri.tahsilatOrani },
                { 'Kalem': 'Bütçe Kullanımı (%)', 'Tutar (₺)': p.yilsonuVeri.butceKullanim },
              ]

              const wb = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ozetRows), 'Özet')
              XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aylikRows), 'Aylık Detay')
              XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kategoriRows), 'Gider Kategorileri')
              XLSX.writeFile(wb, `yilsonu_raporu_${p.yilsonuYil}.xlsx`)
            }} style={{ padding: '7px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>
              📥 Excel İndir
            </button>
            <button onClick={() => {
              const aylar = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
              const pf = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺'
              const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<title>Yıl Sonu Raporu ${p.yilsonuYil}</title>
<style>
  body{font-family:'Segoe UI',sans-serif;margin:0;padding:20px;color:#1f2937}
  .wrap{max-width:900px;margin:0 auto}
  .header{background:linear-gradient(135deg,#1a3c5e,#2e7d9f);color:#fff;padding:28px 32px;border-radius:12px;margin-bottom:24px}
  .header h1{margin:0 0 4px;font-size:1.4rem}
  .header p{margin:0;opacity:.8;font-size:.9rem}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
  .card{background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;text-align:center}
  .card .label{color:#6b7280;font-size:.75rem;font-weight:700;text-transform:uppercase;margin-bottom:6px}
  .card .value{font-size:1.1rem;font-weight:800}
  h2{color:#1a3c5e;font-size:1rem;margin:24px 0 12px;border-bottom:2px solid #e5e7eb;padding-bottom:8px}
  table{width:100%;border-collapse:collapse;font-size:.85rem;margin-bottom:24px}
  th{background:#1a3c5e;color:#fff;padding:10px 14px;text-align:left;font-size:.78rem}
  td{padding:9px 14px;border-bottom:1px solid #f3f4f6}
  tr:nth-child(even){background:#f9fafb}
  .footer{text-align:center;color:#9ca3af;font-size:.78rem;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px}
  .no-print{position:fixed;top:12px;right:16px;display:flex;gap:8px}
  @media print{.no-print{display:none}@page{size:A4;margin:15mm}}
</style></head><body>
<div class="no-print">
  <button onclick="window.close()" style="padding:7px 16px;background:#e5e7eb;border:none;border-radius:7px;cursor:pointer;font-weight:700">← Geri</button>
  <button onclick="window.print()" style="padding:7px 16px;background:#1a3c5e;color:#fff;border:none;border-radius:7px;cursor:pointer;font-weight:700">🖨️ Yazdır / PDF</button>
</div>
<div class="wrap">
  <div class="header">
    <h1>🏢 ${p.yilsonuYil} Yılı — Yıl Sonu Raporu</h1>
    <p>Oluşturulma: ${new Date().toLocaleDateString('tr-TR', {day:'numeric',month:'long',year:'numeric'})}</p>
  </div>
  <div class="grid">
    <div class="card"><div class="label">Toplam Tahakkuk</div><div class="value" style="color:#1a3c5e">${pf(p.yilsonuVeri.toplamTahakkuk)}</div></div>
    <div class="card"><div class="label">Toplam Tahsilat</div><div class="value" style="color:#16a34a">${pf(p.yilsonuVeri.toplamOdeme)}</div></div>
    <div class="card"><div class="label">Toplam Gider</div><div class="value" style="color:#dc2626">${pf(p.yilsonuVeri.toplamGider)}</div></div>
    <div class="card"><div class="label">Net Durum</div><div class="value" style="color:${p.yilsonuVeri.netDurum>=0?'#16a34a':'#dc2626'}">${pf(p.yilsonuVeri.netDurum)}</div></div>
    <div class="card"><div class="label">Tahsilat Oranı</div><div class="value" style="color:${p.yilsonuVeri.tahsilatOrani>=90?'#16a34a':'#d97706'}">%${p.yilsonuVeri.tahsilatOrani}</div></div>
    <div class="card"><div class="label">Bütçe Kullanımı</div><div class="value" style="color:${p.yilsonuVeri.butceKullanim>90?'#dc2626':'#16a34a'}">%${p.yilsonuVeri.butceKullanim}</div></div>
  </div>
  <h2>📅 Aylık Tahsilat / Gider</h2>
  <table>
    <thead><tr><th>Ay</th><th>Tahsilat</th><th>Gider</th><th>Net</th></tr></thead>
    <tbody>
      ${Array.from({length:12},(_,i)=>i).filter(i=>p.yilsonuVeri.aylikOdeme[i]>0||p.yilsonuVeri.aylikGider[i]>0).map(i=>{
        const t=p.yilsonuVeri.aylikOdeme[i],g=p.yilsonuVeri.aylikGider[i],n=t-g
        return `<tr><td>${aylar[i+1]}</td><td style="color:#16a34a;font-weight:600">${t>0?pf(t):'—'}</td><td style="color:#dc2626;font-weight:600">${g>0?pf(g):'—'}</td><td style="font-weight:700;color:${n>=0?'#16a34a':'#dc2626'}">${pf(n)}</td></tr>`
      }).join('')}
      <tr style="background:#f0f9ff;font-weight:800"><td>TOPLAM</td><td style="color:#16a34a">${pf(p.yilsonuVeri.toplamOdeme)}</td><td style="color:#dc2626">${pf(p.yilsonuVeri.toplamGider)}</td><td style="color:${p.yilsonuVeri.netDurum>=0?'#16a34a':'#dc2626'}">${pf(p.yilsonuVeri.netDurum)}</td></tr>
    </tbody>
  </table>
  <h2>💸 Gider Kategorileri</h2>
  <table>
    <thead><tr><th>Kategori</th><th>Tutar</th><th>Oran</th></tr></thead>
    <tbody>
      ${Object.entries(p.yilsonuVeri.kategoriGider).sort(([,a]:any,[,b]:any)=>b-a).map(([kat,tutar]:any)=>{
        const oran=p.yilsonuVeri.toplamGider>0?Math.round(tutar/p.yilsonuVeri.toplamGider*100):0
        return `<tr><td>${kat}</td><td style="font-weight:700;color:#dc2626">${pf(Number(tutar))}</td><td>%${oran}</td></tr>`
      }).join('')}
    </tbody>
  </table>
  <div class="footer">Bu rapor otomatik olarak oluşturulmuştur. © ${p.yilsonuYil} Aidat Yönetim Sistemi</div>
</div>
</body></html>`
              const w = window.open('', '_blank')
              if (w) { w.document.write(html); w.document.close() }
            }} style={{ padding: '7px 16px', background: '#1a3c5e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>
              🖨️ PDF / Yazdır
            </button>
          </>
        )}
      </div>
      {p.yilsonuYukleniyor ? <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Hesaplanıyor...</div>
        : p.yilsonuVeri && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Toplam Tahakkuk', d: p.yilsonuVeri.toplamTahakkuk, r: '#1a3c5e', ikon: '📋' },
                { label: 'Toplam Tahsilat', d: p.yilsonuVeri.toplamOdeme, r: '#16a34a', ikon: '💰' },
                { label: 'Toplam Gider', d: p.yilsonuVeri.toplamGider, r: '#dc2626', ikon: '💸' },
                { label: 'Net Durum', d: p.yilsonuVeri.netDurum, r: p.yilsonuVeri.netDurum >= 0 ? '#16a34a' : '#dc2626', ikon: '📊' },
                { label: 'Tahsilat Oranı', d: null, r: p.yilsonuVeri.tahsilatOrani >= 90 ? '#16a34a' : '#d97706', ikon: '📈', y: p.yilsonuVeri.tahsilatOrani },
                { label: 'Bütçe Kullanımı', d: null, r: p.yilsonuVeri.butceKullanim > 90 ? '#dc2626' : '#16a34a', ikon: '🎯', y: p.yilsonuVeri.butceKullanim },
              ].map((k: any) => (
                <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{k.ikon}</div>
                  <div style={{ color: '#6b7280', fontSize: '.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: k.r }}>{k.d !== null ? paraFormat(Number(k.d)) : `%${k.y}`}</div>
                </div>
              ))}
            </div>
            <div style={{ ...cardStyle, marginBottom: '20px' }}>
              <div style={hdrStyle('#1a3c5e')}>📅 Aylık — {p.yilsonuYil}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                  <thead><tr style={{ background: '#f8fafc' }}>{['Ay','Tahsilat','Gider','Net'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Ay' ? 'left' : 'right', color: '#6b7280', fontWeight: '700', fontSize: '.75rem', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {Array.from({length:12},(_,i) => i).map(i => {
                      const t = p.yilsonuVeri.aylikOdeme[i], g = p.yilsonuVeri.aylikGider[i], n = t - g
                      if (t === 0 && g === 0) return null
                      return <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '10px 14px', fontWeight: '600' }}>{ayAdi(i+1)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16a34a', fontWeight: '600' }}>{t > 0 ? paraFormat(t) : '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#dc2626', fontWeight: '600' }}>{g > 0 ? paraFormat(g) : '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: n >= 0 ? '#16a34a' : '#dc2626' }}>{paraFormat(n)}</td>
                      </tr>
                    })}
                    <tr style={{ background: '#f0f9ff', fontWeight: '800' }}>
                      <td style={{ padding: '10px 14px', color: '#1a3c5e' }}>TOPLAM</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16a34a' }}>{paraFormat(p.yilsonuVeri.toplamOdeme)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#dc2626' }}>{paraFormat(p.yilsonuVeri.toplamGider)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: p.yilsonuVeri.netDurum >= 0 ? '#16a34a' : '#dc2626' }}>{paraFormat(p.yilsonuVeri.netDurum)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={cardStyle}>
              <div style={hdrStyle('#dc2626')}>💸 Gider Kategorileri — {p.yilsonuYil}</div>
              {Object.keys(p.yilsonuVeri.kategoriGider).length === 0 ? <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Bu yıl gider yok.</div>
                : Object.entries(p.yilsonuVeri.kategoriGider).sort(([,a]: any, [,b]: any) => b - a).map(([kat, tutar]: any) => {
                  const o = p.yilsonuVeri.toplamGider > 0 ? Math.round(tutar / p.yilsonuVeri.toplamGider * 100) : 0
                  return <div key={kat} style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#374151' }}>{kat}</span>
                      <span style={{ fontWeight: '700', color: '#dc2626' }}>{paraFormat(Number(tutar))} <span style={{ color: '#9ca3af', fontWeight: '400' }}>%{o}</span></span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px' }}><div style={{ background: '#dc2626', width: `${o}%`, height: '100%', borderRadius: '4px' }} /></div>
                  </div>
                })}
            </div>
          </>
        )}
    </div>
  )

  if (aktifSayfa === 'aidat_artis') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📈 Aidat Artış Yönetimi</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}>
          <div style={hdrStyle('#1a3c5e')}>📈 Artış Uygula</div>
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '10px 14px', margin: '12px 20px 0', fontSize: '.8rem', color: '#92400e' }}>
          ⚠️ Bu işlem aidat türlerinin <strong>varsayılan tutarını</strong> günceller. Mevcut tahakkukları etkilemez — yalnızca bundan sonra oluşturulacak tahakkuklara uygulanır.
        </div>
          <div style={{ padding: '20px' }}>
            {msj(p.artisMesaj)}
            <form onSubmit={p.artisUygula}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Kapsam</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ value: 'tumu', label: '🏢 Tüm Türler' }, { value: 'tur', label: '📋 Belirli Tür' }].map((o: any) => (
                    <button key={o.value} type="button" onClick={() => p.setArtisForm((f: any) => ({ ...f, kapsam: o.value, tur_id: '' }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700', border: p.artisForm.kapsam === o.value ? '2px solid #1a3c5e' : '1px solid #d1d5db', background: p.artisForm.kapsam === o.value ? '#eff6ff' : '#fff', color: p.artisForm.kapsam === o.value ? '#1a3c5e' : '#6b7280' }}>{o.label}</button>
                  ))}
                </div>
              </div>
              {p.artisForm.kapsam === 'tur' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Aidat Türü</label>
                  <select value={p.artisForm.tur_id} onChange={(e: any) => p.setArtisForm((f: any) => ({ ...f, tur_id: e.target.value }))} required style={inputStyle}>
                    <option value="">-- Seçin --</option>
                    {p.aidatTurleri.map((t: any) => <option key={t.id} value={t.id}>{t.tur_adi} ({paraFormat(Number(t.varsayilan_tutar))})</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Yöntem</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ value: 'yuzde', label: '% Yüzde' }, { value: 'sabit', label: '₺ Sabit' }].map((o: any) => (
                    <button key={o.value} type="button" onClick={() => p.setArtisForm((f: any) => ({ ...f, yontem: o.value, deger: '' }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700', border: p.artisForm.yontem === o.value ? '2px solid #1a3c5e' : '1px solid #d1d5db', background: p.artisForm.yontem === o.value ? '#eff6ff' : '#fff', color: p.artisForm.yontem === o.value ? '#1a3c5e' : '#6b7280' }}>{o.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}><label style={labelStyle}>{p.artisForm.yontem === 'yuzde' ? 'Artış Oranı (%)' : 'Artış Tutarı (₺)'}</label><input type="number" step="0.01" min="0" required value={p.artisForm.deger} onChange={(e: any) => p.setArtisForm((f: any) => ({ ...f, deger: e.target.value }))} style={inputStyle} /></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={p.artisOnizlemeHesapla} disabled={!p.artisForm.deger} style={{ flex: 1, padding: '10px', background: '#f0f9ff', color: '#1a3c5e', border: '2px solid #1a3c5e', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>👁️ Önizle</button>
                <button type="submit" disabled={p.artisYukleniyor || p.artisOnizleme.length === 0} style={{ flex: 1, padding: '10px', background: p.artisOnizleme.length === 0 ? '#9ca3af' : '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>{p.artisYukleniyor ? 'Uygulanıyor...' : '✅ Uygula'}</button>
              </div>
            </form>
          </div>
        </div>
        <div>
          {p.artisOnizleme.length > 0 && (
            <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '12px' }}>👁️ Önizleme</div>
              {p.artisOnizleme.map((t: any) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #fde68a', fontSize: '.85rem' }}>
                  <span style={{ fontWeight: '600' }}>{t.tur_adi}</span>
                  <span><span style={{ color: '#6b7280', textDecoration: 'line-through', marginRight: '8px' }}>{paraFormat(t.eskiTutar)}</span><span style={{ color: '#16a34a', fontWeight: '700' }}>{paraFormat(t.yeniTutar)}</span><span style={{ color: '#d97706', fontSize: '.78rem', marginLeft: '6px' }}>(+{paraFormat(t.fark)})</span></span>
                </div>
              ))}
            </div>
          )}
          <div style={cardStyle}>
            <div style={hdrStyle('#374151')}>📋 Mevcut Türler</div>
            {p.aidatTurleri.map((t: any, i: number) => (
              <div key={t.id} style={{ padding: '12px 20px', borderBottom: i < p.aidatTurleri.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>{t.tur_adi}</span>
                <span style={{ fontWeight: '800', color: '#1a3c5e' }}>{paraFormat(Number(t.varsayilan_tutar))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  if (aktifSayfa === 'daire_yonetim') return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>🏢 Daire Yönetimi</h2>
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🏢 Tüm Daireler ({p.daireler.length})</span>
          <div style={{ display: 'flex', gap: '12px', fontSize: '.82rem', opacity: .8 }}>
            <span>🔴 Dolu: {p.daireler.filter((d: any) => d.durum === 'dolu').length}</span>
            <span>🟢 Boş: {p.daireler.filter((d: any) => d.durum === 'bos').length}</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Blok','Daire No','Kat','Durum','Sakin','İşlemler'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '700', fontSize: '.78rem', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.daireler.map((d: any, i: number) => (
                <tr key={d.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: '800', color: '#1a3c5e', fontSize: '1rem' }}>{d.bloklar?.blok_adi}</td>
                  <td style={{ padding: '10px 16px', fontWeight: '600' }}>{d.daire_no}</td>
                  <td style={{ padding: '10px 16px', color: '#6b7280' }}>{d.kat || '—'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ background: d.durum === 'dolu' ? '#dcfce7' : '#f3f4f6', color: d.durum === 'dolu' ? '#166534' : '#6b7280', padding: '2px 10px', borderRadius: '20px', fontSize: '.75rem', fontWeight: '700' }}>
                      {d.durum === 'dolu' ? '🔴 Dolu' : '🟢 Boş'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>
                    {d.profiller?.ad_soyad || <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => p.daireDetayAc(d)}
                        style={{ background: '#eff6ff', color: '#1a3c5e', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '.78rem', fontWeight: '700' }}>
                        🔍 Detay
                      </button>
                      {d.durum === 'dolu' && (
                        <button onClick={async () => {
                          if (!confirm(`${d.bloklar?.blok_adi} Blok Daire ${d.daire_no} boşaltılsın mı?`)) return
                          await supabase.from('daireler').update({ kullanici_id: null, durum: 'bos' }).eq('id', d.id)
                          const { data } = await supabase.from('daireler').select('*, bloklar(blok_adi), profiller(ad_soyad)').order('blok_id').order('daire_no')
                          p.setDaireler(data || [])
                        }} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '.78rem', fontWeight: '700' }}>
                          🚪 Boşalt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daire Detay Modal */}
      {p.daireDetay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ background: '#1a3c5e', color: '#fff', padding: '16px 20px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span>🏢 {p.daireDetay.bloklar?.blok_adi} Blok — Daire {p.daireDetay.daire_no}</span>
              <button onClick={() => p.setDaireDetay(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', padding: '20px' }}>
              {p.daireDetayYukleniyor ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Yükleniyor...</div>
              ) : p.daireDetayVeri && (
                <>
                  {/* Sakin Bilgisi */}
                  <div style={{ background: p.daireDetay.durum === 'dolu' ? '#f0fdf4' : '#f8fafc', border: `1px solid ${p.daireDetay.durum === 'dolu' ? '#86efac' : '#e5e7eb'}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#374151' }}>{p.daireDetay.profiller?.ad_soyad || 'Boş Daire'}</div>
                      <div style={{ color: '#6b7280', fontSize: '.82rem' }}>{p.daireDetay.durum === 'dolu' ? 'Aktif Sakin' : 'Sakin Yok'}</div>
                    </div>
                    <span style={{ background: p.daireDetay.durum === 'dolu' ? '#dcfce7' : '#f3f4f6', color: p.daireDetay.durum === 'dolu' ? '#166534' : '#6b7280', padding: '3px 12px', borderRadius: '20px', fontSize: '.78rem', fontWeight: '700' }}>
                      {p.daireDetay.durum === 'dolu' ? '🔴 Dolu' : '🟢 Boş'}
                    </span>
                  </div>

                  {/* İstatistik Kartları */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                    {[
                      { label: 'Toplam Tahakkuk', deger: paraFormat(p.daireDetayVeri.toplamTahakkuk), renk: '#1a3c5e' },
                      { label: 'Toplam Ödenen',   deger: paraFormat(p.daireDetayVeri.toplamOdenen), renk: '#16a34a' },
                      { label: 'Kalan Borç',      deger: paraFormat(p.daireDetayVeri.toplamKalan), renk: p.daireDetayVeri.toplamKalan > 0 ? '#dc2626' : '#16a34a' },
                      { label: 'Tahsilat Oranı',  deger: `%${p.daireDetayVeri.tahsilatOrani}`, renk: p.daireDetayVeri.tahsilatOrani >= 90 ? '#16a34a' : '#d97706' },
                    ].map(k => (
                      <div key={k.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <div style={{ color: '#6b7280', fontSize: '.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
                        <div style={{ fontSize: '1rem', fontWeight: '800', color: k.renk }}>{k.deger}</div>
                      </div>
                    ))}
                  </div>

                  {/* Açık Borçlar */}
                  {p.daireDetayVeri.acikBorclar.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: '700', color: '#dc2626', marginBottom: '8px', fontSize: '.9rem' }}>⚠️ Açık Borçlar ({p.daireDetayVeri.acikBorclar.length})</div>
                      {p.daireDetayVeri.acikBorclar.map((t: any) => (
                        <div key={t.id} style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '.85rem' }}>
                          <span>{t.aidat_turleri?.tur_adi} — {ayAdi(t.donem_ay)} {t.donem_yil}</span>
                          <span style={{ fontWeight: '700', color: '#dc2626' }}>{paraFormat(Number(t.tutar))}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ödeme Geçmişi */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontWeight: '700', color: '#374151', marginBottom: '8px', fontSize: '.9rem' }}>💰 Ödeme Geçmişi ({p.daireDetayVeri.odemeler.length})</div>
                    {p.daireDetayVeri.odemeler.length === 0 ? (
                      <div style={{ color: '#9ca3af', fontSize: '.85rem', padding: '12px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>Henüz ödeme kaydı yok.</div>
                    ) : (
                      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        {p.daireDetayVeri.odemeler.map((o: any, i: number) => (
                          <div key={o.id} style={{ padding: '8px 14px', borderBottom: i < p.daireDetayVeri.odemeler.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', fontSize: '.82rem' }}>
                            <div>
                              <span style={{ fontWeight: '600' }}>{o.tahakkuklar?.aidat_turleri?.tur_adi}</span>
                              <span style={{ color: '#6b7280', marginLeft: '8px' }}>{ayAdi(o.tahakkuklar?.donem_ay)} {o.tahakkuklar?.donem_yil}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: '700', color: '#16a34a' }}>{paraFormat(Number(o.tutar))}</span>
                              <span style={{ color: '#9ca3af', marginLeft: '8px', fontSize: '.75rem' }}>{new Date(o.odeme_tarihi).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Daire Notu */}
                  <div>
                    <div style={{ fontWeight: '700', color: '#374151', marginBottom: '8px', fontSize: '.9rem' }}>📝 Daire Notu</div>
                    {p.daireNotMesaj && (
                      <div style={{ background: p.daireNotMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: p.daireNotMesaj.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', fontSize: '.82rem', fontWeight: '600' }}>
                        {p.daireNotMesaj.metin}
                      </div>
                    )}
                    <textarea rows={3} value={p.daireNot} onChange={(e: any) => p.setDaireNot(e.target.value)}
                      placeholder="Bu daireye özel not ekleyin..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box', resize: 'vertical' }} />
                    <button onClick={p.daireNotKaydet}
                      style={{ marginTop: '8px', padding: '8px 20px', background: '#1a3c5e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>
                      💾 Notu Kaydet
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (aktifSayfa === 'borc_raporu') return (
    <BorcRaporu daireler={p.daireler} />
  )

  if (aktifSayfa === 'banka_import') return (
    <BankaImport daireler={p.daireler} sakinler={p.sakinler} />
  )

  if (aktifSayfa === 'yedekleme') return (
    <Yedekleme />
  )

  return null
}

function Yedekleme() {
  const [yukleniyor, setYukleniyor] = useState<string | null>(null)
  const [sonuc, setSonuc]           = useState<any>(null)

  const bugun = new Date().toISOString().split('T')[0]

  const tumVeriYedekle = async () => {
    setYukleniyor('full'); setSonuc(null)
    try {
      const [
        { data: profiller },
        { data: daireler },
        { data: bloklar },
        { data: tahakkuklar },
        { data: odemeler },
        { data: odeme_bildirimleri },
        { data: ariza_talepler },
        { data: duyurular },
        { data: giderler },
        { data: butce },
        { data: aidat_turleri },
      ] = await Promise.all([
        supabase.from('profiller').select('*'),
        supabase.from('daireler').select('*'),
        supabase.from('bloklar').select('*'),
        supabase.from('tahakkuklar').select('*'),
        supabase.from('odemeler').select('*'),
        supabase.from('odeme_bildirimleri').select('*'),
        supabase.from('ariza_talepler').select('*'),
        supabase.from('duyurular').select('*'),
        supabase.from('giderler').select('*'),
        supabase.from('butce').select('*'),
        supabase.from('aidat_turleri').select('*'),
      ])

      const yedek = {
        meta: { tarih: new Date().toISOString(), versiyon: '1.0', aciklama: 'Aidat Yönetim Sistemi Tam Yedek' },
        profiller, daireler, bloklar, tahakkuklar, odemeler,
        odeme_bildirimleri, ariza_talepler, duyurular, giderler, butce, aidat_turleri
      }

      const blob = new Blob([JSON.stringify(yedek, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `aidat_yedek_${bugun}.json`; a.click()
      URL.revokeObjectURL(url)

      const sayilar = { profiller: profiller?.length || 0, tahakkuklar: tahakkuklar?.length || 0, odemeler: odemeler?.length || 0, giderler: giderler?.length || 0 }
      setSonuc({ tip: 'basari', metin: `Tam yedek alındı!`, sayilar })
    } catch (err: any) {
      setSonuc({ tip: 'hata', metin: 'Yedekleme hatası: ' + err.message })
    }
    setYukleniyor(null)
  }

  const excelYedekle = async () => {
    setYukleniyor('excel'); setSonuc(null)
    try {
      const [
        { data: profiller },
        { data: tahakkuklar },
        { data: odemeler },
        { data: giderler },
        { data: daireler },
        { data: aidat_turleri },
      ] = await Promise.all([
        supabase.from('profiller').select('*, daireler(daire_no, bloklar(blok_adi))'),
        supabase.from('tahakkuklar').select('*, aidat_turleri(tur_adi), daireler(daire_no, bloklar(blok_adi))'),
        supabase.from('odemeler').select('*, tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi), daireler(daire_no, bloklar(blok_adi)))'),
        supabase.from('giderler').select('*'),
        supabase.from('daireler').select('*, bloklar(blok_adi), profiller(ad_soyad)'),
        supabase.from('aidat_turleri').select('*'),
      ])

      const aylar = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

      const sakinlerWs = XLSX.utils.json_to_sheet((profiller || []).filter((p: any) => p.rol === 'sakin').map((p: any) => ({
        'Ad Soyad': p.ad_soyad, 'E-posta': p.email, 'Telefon': p.telefon || '',
        'Durum': p.durum, 'Rol': p.rol,
      })))

      const daireWs = XLSX.utils.json_to_sheet((daireler || []).map((d: any) => ({
        'Blok': (d.bloklar as any)?.blok_adi, 'Daire No': d.daire_no, 'Kat': d.kat || '',
        'Durum': d.durum, 'Sakin': (d.profiller as any)?.ad_soyad || '', 'Not': d.sabit_not || '',
      })))

      const tahakkukWs = XLSX.utils.json_to_sheet((tahakkuklar || []).map((t: any) => ({
        'Blok': (t.daireler as any)?.bloklar?.blok_adi, 'Daire': (t.daireler as any)?.daire_no,
        'Aidat Türü': t.aidat_turleri?.tur_adi,
        'Dönem': `${aylar[t.donem_ay]} ${t.donem_yil}`,
        'Tutar (₺)': Number(t.tutar).toFixed(2),
        'Son Ödeme': t.son_odeme_tarihi || '', 'Durum': t.durum,
      })))

      const odemeWs = XLSX.utils.json_to_sheet((odemeler || []).map((o: any) => ({
        'Blok': (o.tahakkuklar as any)?.daireler?.bloklar?.blok_adi,
        'Daire': (o.tahakkuklar as any)?.daireler?.daire_no,
        'Aidat Türü': (o.tahakkuklar as any)?.aidat_turleri?.tur_adi,
        'Dönem': `${aylar[(o.tahakkuklar as any)?.donem_ay]} ${(o.tahakkuklar as any)?.donem_yil}`,
        'Ödeme Tarihi': o.odeme_tarihi, 'Tutar (₺)': Number(o.tutar).toFixed(2),
        'Yöntem': o.odeme_yontemi, 'Açıklama': o.aciklama || '',
      })))

      const giderWs = XLSX.utils.json_to_sheet((giderler || []).map((g: any) => ({
        'Tarih': g.gider_tarihi, 'Kategori': g.kategori, 'Açıklama': g.aciklama || '',
        'Tutar (₺)': Number(g.tutar).toFixed(2), 'Belge No': g.belge_no || '',
      })))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, sakinlerWs, 'Sakinler')
      XLSX.utils.book_append_sheet(wb, daireWs, 'Daireler')
      XLSX.utils.book_append_sheet(wb, tahakkukWs, 'Tahakkuklar')
      XLSX.utils.book_append_sheet(wb, odemeWs, 'Ödemeler')
      XLSX.utils.book_append_sheet(wb, giderWs, 'Giderler')
      XLSX.writeFile(wb, `aidat_yedek_${bugun}.xlsx`)

      setSonuc({ tip: 'basari', metin: 'Excel yedeği alındı! 5 sayfa: Sakinler, Daireler, Tahakkuklar, Ödemeler, Giderler.' })
    } catch (err: any) {
      setSonuc({ tip: 'hata', metin: 'Excel hatası: ' + err.message })
    }
    setYukleniyor(null)
  }

  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>💾 Yedekleme</h2>

      {sonuc && (
        <div style={{ background: sonuc.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: sonuc.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', fontWeight: '600' }}>
          {sonuc.metin}
          {sonuc.sayilar && (
            <div style={{ marginTop: '8px', fontSize: '.82rem', fontWeight: '400' }}>
              👥 {sonuc.sayilar.profiller} sakin · 📋 {sonuc.sayilar.tahakkuklar} tahakkuk · 💰 {sonuc.sayilar.odemeler} ödeme · 💸 {sonuc.sayilar.giderler} gider
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* JSON Yedek */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#1a3c5e', color: '#fff', padding: '14px 20px', fontWeight: '700' }}>📦 Tam Veri Yedeği (JSON)</div>
          <div style={{ padding: '20px' }}>
            <p style={{ color: '#6b7280', fontSize: '.85rem', marginTop: 0 }}>Tüm tabloların ham verisi JSON formatında indirilir. Geri yükleme için kullanılabilir.</p>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '.8rem', color: '#374151' }}>
              <div>✅ Profiller, Daireler, Bloklar</div>
              <div>✅ Tahakkuklar, Ödemeler</div>
              <div>✅ Giderler, Bütçe, Duyurular</div>
              <div>✅ Arıza Talepler, Bildirimler</div>
            </div>
            <button onClick={tumVeriYedekle} disabled={yukleniyor !== null}
              style={{ width: '100%', padding: '11px', background: yukleniyor === 'full' ? '#9ca3af' : '#1a3c5e', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '.9rem' }}>
              {yukleniyor === 'full' ? '⏳ Hazırlanıyor...' : '📥 JSON Yedek Al'}
            </button>
          </div>
        </div>

        {/* Excel Yedek */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#16a34a', color: '#fff', padding: '14px 20px', fontWeight: '700' }}>📊 Excel Yedeği</div>
          <div style={{ padding: '20px' }}>
            <p style={{ color: '#6b7280', fontSize: '.85rem', marginTop: 0 }}>Tüm veriler okunabilir Excel formatında, ayrı sayfalarda indirilir.</p>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '.8rem', color: '#374151' }}>
              <div>✅ Sakinler listesi</div>
              <div>✅ Daireler ve doluluk</div>
              <div>✅ Tüm tahakkuklar</div>
              <div>✅ Tüm ödemeler</div>
              <div>✅ Tüm giderler</div>
            </div>
            <button onClick={excelYedekle} disabled={yukleniyor !== null}
              style={{ width: '100%', padding: '11px', background: yukleniyor === 'excel' ? '#9ca3af' : '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '.9rem' }}>
              {yukleniyor === 'excel' ? '⏳ Hazırlanıyor...' : '📥 Excel Yedek Al'}
            </button>
          </div>
        </div>
      </div>

      {/* Bilgi Notu */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ fontWeight: '700', color: '#1e40af', marginBottom: '8px' }}>ℹ️ Yedekleme Hakkında</div>
        <div style={{ color: '#1e3a8a', fontSize: '.85rem', lineHeight: 1.7 }}>
          <div>• <strong>JSON yedeği</strong> — tüm ham veriyi içerir, teknik geri yükleme için idealdir.</div>
          <div>• <strong>Excel yedeği</strong> — okunabilir format, arşiv veya muhasebe için uygundur.</div>
          <div>• Supabase Dashboard → Settings → Database → Backups üzerinden de otomatik yedek alınmaktadır.</div>
          <div>• Düzenli yedek almanız önerilir — özellikle tahakkuk ve ödeme işlemlerinden önce.</div>
        </div>
      </div>
    </div>
  )
}

function BankaImport({ daireler, sakinler }: { daireler: any[], sakinler: any[] }) {
  const [satirlar, setSatirlar]       = useState<any[]>([])
  const [eslesmeler, setEslesmeler]   = useState<any>({})
  const [yukleniyor, setYukleniyor]   = useState(false)
  const [mesaj, setMesaj]             = useState<any>(null)
  const [sonuc, setSonuc]             = useState<any>(null)

  const dosyaOku = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0]
    if (!dosya) return
    setYukleniyor(true); setMesaj(null); setSonuc(null); setSatirlar([]); setEslesmeler({})

    const buffer = await dosya.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]

    if (data.length < 2) { setMesaj({ tip: 'hata', metin: 'Excel dosyası boş veya hatalı.' }); setYukleniyor(false); return }

    // İlk satır header, kalanlar data
    const headers = data[0].map((h: any) => String(h).toLowerCase().trim())
    const satirVeriler = data.slice(1).filter((r: any[]) => r.some(c => c !== null && c !== '')).map((row: any[], i: number) => {
      const obj: any = { _index: i }
      headers.forEach((h: string, j: number) => { obj[h] = row[j] })
      return obj
    })

    // Ad soyad kolonunu bul
    const adKolon = headers.find((h: string) => h.includes('ad') || h.includes('isim') || h.includes('soyad') || h.includes('müşteri') || h.includes('gönderen'))
    const tutarKolon = headers.find((h: string) => h.includes('tutar') || h.includes('miktar') || h.includes('amount'))
    const tarihKolon = headers.find((h: string) => h.includes('tarih') || h.includes('date'))
    const aciklamaKolon = headers.find((h: string) => h.includes('açıklama') || h.includes('aciklama') || h.includes('description') || h.includes('not'))

    const islenmis = satirVeriler.map((r: any) => ({
      _index: r._index,
      ad_soyad: adKolon ? String(r[adKolon] || '').trim() : '',
      tutar: tutarKolon ? parseFloat(String(r[tutarKolon]).replace(',', '.').replace(/[^0-9.]/g, '')) || 0 : 0,
      tarih: tarihKolon ? r[tarihKolon] : '',
      aciklama: aciklamaKolon ? String(r[aciklamaKolon] || '').trim() : '',
      ham: r
    }))

    setSatirlar(islenmis)

    // Otomatik eşleştirme — ad soyad benzerliğine göre
    const eslesme: any = {}
    islenmis.forEach((satir: any) => {
      const aranan = satir.ad_soyad.toLowerCase()
      let enIyi: any = null, enIyiSkor = 0
      sakinler.forEach((s: any) => {
        const sakinAd = s.ad_soyad.toLowerCase()
        // Basit benzerlik: kelimelerin kaçı eşleşiyor
        const kelimeler = aranan.split(' ').filter(Boolean)
        const eslesenKelime = kelimeler.filter((k: string) => sakinAd.includes(k)).length
        const skor = kelimeler.length > 0 ? eslesenKelime / kelimeler.length : 0
        if (skor > enIyiSkor) { enIyiSkor = skor; enIyi = s }
      })
      if (enIyi && enIyiSkor >= 0.5) eslesme[satir._index] = enIyi.id
    })
    setEslesmeler(eslesme)
    setYukleniyor(false)
  }

  const kaydet = async () => {
    setYukleniyor(true); setMesaj(null)
    let basarili = 0, atlailan = 0, hata = 0

    for (const satir of satirlar) {
      const sakinId = eslesmeler[satir._index]
      if (!sakinId || !satir.tutar) { atlailan++; continue }

      // Sakinin dairesin bul
      const daire = daireler.find((d: any) => d.kullanici_id === sakinId)
      if (!daire) { atlailan++; continue }

      // Açık tahakkukları bul
      const { data: thData } = await supabase
        .from('tahakkuklar').select('id, tutar, durum')
        .eq('daire_id', daire.id).neq('durum', 'odendi')
        .order('donem_yil').order('donem_ay').limit(1)

      if (!thData || thData.length === 0) { atlailan++; continue }

      const th = thData[0]
      const tarihStr = satir.tarih ? new Date(satir.tarih).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]

      const { error } = await supabase.from('odemeler').insert({
        tahakkuk_id: th.id,
        odeme_tarihi: tarihStr,
        tutar: satir.tutar,
        odeme_yontemi: 'havale',
        aciklama: `Banka import: ${satir.aciklama || satir.ad_soyad}`
      })

      if (error) { hata++; continue }

      // Tahakkuk durumunu güncelle
      const { data: odTop } = await supabase.from('odemeler').select('tutar').eq('tahakkuk_id', th.id)
      const top = odTop?.reduce((a: number, o: any) => a + Number(o.tutar), 0) || 0
      if (top >= Number(th.tutar)) await supabase.from('tahakkuklar').update({ durum: 'odendi' }).eq('id', th.id)

      basarili++
    }

    setSonuc({ basarili, atlailan, hata })
    setMesaj({ tip: basarili > 0 ? 'basari' : 'hata', metin: `${basarili} ödeme kaydedildi, ${atlailan} atlandı${hata > 0 ? `, ${hata} hata` : ''}.` })
    setYukleniyor(false)
  }

  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>🏦 Banka Excel Import</h2>

      {/* Dosya Yükle */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
        <div style={{ fontWeight: '700', color: '#374151', marginBottom: '8px' }}>📂 Garanti Bankası Excel Dosyası</div>
        <div style={{ color: '#6b7280', fontSize: '.85rem', marginBottom: '16px' }}>Beklenen kolonlar: Ad Soyad, Tutar, Tarih, Açıklama</div>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={dosyaOku} disabled={yukleniyor}
          style={{ padding: '8px', border: '2px dashed #d1d5db', borderRadius: '8px', width: '100%', boxSizing: 'border-box', cursor: 'pointer', fontSize: '.85rem' }} />
        {yukleniyor && <div style={{ marginTop: '12px', color: '#6b7280', fontSize: '.85rem' }}>⏳ İşleniyor...</div>}
      </div>

      {mesaj && (
        <div style={{ background: mesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: mesaj.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', fontWeight: '600' }}>
          {mesaj.metin}
          {sonuc && <div style={{ marginTop: '8px', fontSize: '.82rem', fontWeight: '400' }}>✅ {sonuc.basarili} kayıt · ⏭️ {sonuc.atlailan} atlandı{sonuc.hata > 0 ? ` · ❌ ${sonuc.hata} hata` : ''}</div>}
        </div>
      )}

      {/* Önizleme Tablosu */}
      {satirlar.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📋 Önizleme — {satirlar.length} satır</span>
            <button onClick={kaydet} disabled={yukleniyor} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>
              {yukleniyor ? '⏳ Kaydediliyor...' : '💾 Ödemeleri Kaydet'}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {["Gönderen","Tutar","Tarih","Açıklama","Eşleştirilen Sakin"].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: '700', fontSize: '.75rem', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {satirlar.map((satir: any, i: number) => {
                  const eslesenSakinId = eslesmeler[satir._index]
                  const eslesenSakin = sakinler.find((s: any) => s.id === eslesenSakinId)
                  return (
                    <tr key={satir._index} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '9px 14px', fontWeight: '600' }}>{satir.ad_soyad || '—'}</td>
                      <td style={{ padding: '9px 14px', color: '#16a34a', fontWeight: '700' }}>{satir.tutar > 0 ? paraFormat(satir.tutar) : '—'}</td>
                      <td style={{ padding: '9px 14px', color: '#6b7280' }}>{satir.tarih ? new Date(satir.tarih).toLocaleDateString('tr-TR') : '—'}</td>
                      <td style={{ padding: '9px 14px', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{satir.aciklama || '—'}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <select value={eslesenSakinId || ''} onChange={(e: any) => setEslesmeler((prev: any) => ({ ...prev, [satir._index]: e.target.value || null }))}
                          style={{ padding: '5px 8px', borderRadius: '6px', border: `1px solid ${eslesenSakin ? '#86efac' : '#fca5a5'}`, fontSize: '.8rem', background: eslesenSakin ? '#f0fdf4' : '#fff5f5' }}>
                          <option value="">-- Eşleştir --</option>
                          {sakinler.map((s: any) => <option key={s.id} value={s.id}>{s.ad_soyad}</option>)}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', background: '#f0f9ff', fontSize: '.82rem', color: '#6b7280' }}>
            💡 Otomatik eşleştirme yapıldı. Hatalı eşleşmeleri dropdown'dan düzeltin, sonra Kaydet'e basın.
          </div>
        </div>
      )}
    </div>
  )
}

function BorcRaporu({ daireler }: { daireler: any[] }) {
  const [rapor, setRapor]         = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filtre, setFiltre]       = useState('tumu')

  useEffect(() => {
    const yukle = async () => {
      setYukleniyor(true)
      const dolular = daireler.filter(d => d.durum === 'dolu')
      const sonuclar = []

      for (const daire of dolular) {
        const { data: thData } = await supabase
          .from('tahakkuklar').select('id, tutar, durum, donem_yil, donem_ay, aidat_turleri(tur_adi)')
          .eq('daire_id', daire.id).order('donem_yil', { ascending: false }).order('donem_ay', { ascending: false })

        if (!thData || thData.length === 0) continue

        const ids = thData.map((t: any) => t.id)
        const { data: odemeData } = await supabase.from('odemeler').select('tutar, tahakkuk_id').in('tahakkuk_id', ids)

        const odemeMap: any = {}
        odemeData?.forEach((o: any) => { if (!odemeMap[o.tahakkuk_id]) odemeMap[o.tahakkuk_id] = 0; odemeMap[o.tahakkuk_id] += Number(o.tutar) })

        const tahakkuklar = thData.map((t: any) => ({
          ...t,
          odenen: odemeMap[t.id] || 0,
          kalan: Math.max(0, Number(t.tutar) - (odemeMap[t.id] || 0))
        }))

        const toplamTahakkuk = tahakkuklar.reduce((a: number, t: any) => a + Number(t.tutar), 0)
        const toplamOdenen   = tahakkuklar.reduce((a: number, t: any) => a + (odemeMap[t.id] || 0), 0)
        const toplamKalan    = tahakkuklar.reduce((a: number, t: any) => a + t.kalan, 0)
        const gecikmisToplam = tahakkuklar.filter((t: any) => t.durum === 'gecikti').reduce((a: number, t: any) => a + t.kalan, 0)
        const tahsilatOrani  = toplamTahakkuk > 0 ? Math.round(toplamOdenen / toplamTahakkuk * 100) : 100

        sonuclar.push({
          daire,
          tahakkuklar,
          toplamTahakkuk,
          toplamOdenen: tahakkuklar.reduce((a: number, t: any) => a + (odemeMap[t.id] || 0), 0),
          toplamKalan,
          gecikmisToplam,
          tahsilatOrani,
          acikSayisi: tahakkuklar.filter((t: any) => t.durum !== 'odendi').length
        })
      }

      setRapor(sonuclar)
      setYukleniyor(false)
    }
    yukle()
  }, [daireler])

  const filtreli = filtre === 'tumu' ? rapor
    : filtre === 'borclu' ? rapor.filter(r => r.toplamKalan > 0)
    : rapor.filter(r => r.gecikmisToplam > 0)

  const genelToplam = filtreli.reduce((a, r) => a + r.toplamKalan, 0)
  const genelGecikme = filtreli.reduce((a, r) => a + r.gecikmisToplam, 0)

  if (yukleniyor) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Yükleniyor...</div>

  return (
    <div>
      <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📊 Borç Raporu</h2>

      {/* Özet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Toplam Sakin', deger: `${rapor.length} kişi`, renk: '#1a3c5e' },
          { label: 'Borçlu Sakin', deger: `${rapor.filter(r => r.toplamKalan > 0).length} kişi`, renk: '#d97706' },
          { label: 'Toplam Kalan Borç', deger: rapor.reduce((a, r) => a + r.toplamKalan, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺', renk: '#dc2626' },
          { label: 'Gecikmiş Borç', deger: rapor.reduce((a, r) => a + r.gecikmisToplam, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺', renk: '#991b1b' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: '.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: k.renk }}>{k.deger}</div>
          </div>
        ))}
      </div>

      {/* Filtre + Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
        {[{ value: 'tumu', label: '👥 Tümü' }, { value: 'borclu', label: '⚠️ Borçlular' }, { value: 'gecikti', label: '🔴 Gecikmiş' }].map(f => (
          <button key={f.value} onClick={() => setFiltre(f.value)}
            style={{ padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem', border: filtre === f.value ? '2px solid #1a3c5e' : '1px solid #d1d5db', background: filtre === f.value ? '#eff6ff' : '#fff', color: filtre === f.value ? '#1a3c5e' : '#6b7280' }}>
            {f.label}
          </button>
        ))}
        </div>
        <button onClick={() => {
          const ws = XLSX.utils.json_to_sheet(filtreli.map((r: any) => ({
            'Sakin': r.daire.profiller?.ad_soyad,
            'Blok': r.daire.bloklar?.blok_adi,
            'Daire No': r.daire.daire_no,
            'Toplam Tahakkuk (₺)': r.toplamTahakkuk.toFixed(2),
            'Ödenen (₺)': r.toplamOdenen.toFixed(2),
            'Kalan Borç (₺)': r.toplamKalan.toFixed(2),
            'Gecikmiş (₺)': r.gecikmisToplam.toFixed(2),
            'Tahsilat Oranı (%)': r.tahsilatOrani,
            'Durum': r.gecikmisToplam > 0 ? 'Gecikmiş' : r.toplamKalan > 0 ? 'Borçlu' : 'Temiz'
          })))
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, 'Borç Raporu')
          XLSX.writeFile(wb, `borc_raporu_${new Date().toISOString().split('T')[0]}.xlsx`)
        }} style={{ padding: '7px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>
          📥 Excel İndir
        </button>
      </div>

      {/* Tablo */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
          📊 Sakin Bazlı Borç Durumu ({filtreli.length} sakin)
        </div>
        {filtreli.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Borçlu sakin bulunamadı.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Sakin','Daire','Toplam Tahakkuk','Ödenen','Kalan Borç','Gecikmiş','Oran','Durum'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: '700', fontSize: '.75rem', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtreli.map((r, i) => (
                  <tr key={r.daire.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: '#374151' }}>{r.daire.profiller?.ad_soyad}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{r.daire.bloklar?.blok_adi} Blok - {r.daire.daire_no}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600' }}>{r.toplamTahakkuk.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a', fontWeight: '600' }}>{r.toplamOdenen.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: r.toplamKalan > 0 ? '#dc2626' : '#16a34a' }}>{r.toplamKalan.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', color: r.gecikmisToplam > 0 ? '#991b1b' : '#6b7280' }}>{r.gecikmisToplam > 0 ? r.gecikmisToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px', width: '60px' }}>
                          <div style={{ background: r.tahsilatOrani >= 90 ? '#16a34a' : r.tahsilatOrani >= 50 ? '#d97706' : '#dc2626', width: `${Math.min(r.tahsilatOrani, 100)}%`, height: '100%', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '.78rem', fontWeight: '700', color: '#374151' }}>%{r.tahsilatOrani}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {r.gecikmisToplam > 0 ? (
                        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>🔴 Gecikmiş</span>
                      ) : r.toplamKalan > 0 ? (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>⚠️ Borçlu</span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>✅ Temiz</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f0f9ff', fontWeight: '800' }}>
                  <td colSpan={4} style={{ padding: '10px 14px', color: '#1a3c5e' }}>GENEL TOPLAM</td>
                  <td style={{ padding: '10px 14px', color: '#dc2626', fontWeight: '800' }}>{genelToplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                  <td style={{ padding: '10px 14px', color: '#991b1b', fontWeight: '800' }}>{genelGecikme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
