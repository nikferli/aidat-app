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
  const [kullanici, setKullanici]               = useState<any>(null)
  const [istatistik, setIstatistik]             = useState<any>({})
  const [sakinler, setSakinler]                 = useState<any[]>([])
  const [bildirimler, setBildirimler]           = useState<any[]>([])
  const [arizalar, setArizalar]                 = useState<any[]>([])
  const [daireler, setDaireler]                 = useState<any[]>([])
  const [aidatTurleri, setAidatTurleri]         = useState<any[]>([])
  const [duyurular, setDuyurular]               = useState<any[]>([])
  const [yilsonuYil, setYilsonuYil]     = useState(new Date().getFullYear())
  const [artisForm, setArtisForm] = useState({
  kapsam: 'tumu',
  tur_id: '',
  yontem: 'yuzde',
  deger: '',
  aciklama: ''
})
const [artisMesaj, setArtisMesaj]     = useState<any>(null)
const [artisYukleniyor, setArtisYukleniyor] = useState(false)
const [artisOnizleme, setArtisOnizleme] = useState<any[]>([])
const [yilsonuVeri, setYilsonuVeri]   = useState<any>(null)
const [yilsonuYukleniyor, setYilsonuYukleniyor] = useState(false)

  const [butce, setButce]               = useState<any[]>([])
const [butceYil, setButceYil]         = useState(new Date().getFullYear())
const [butceMesaj, setButceMesaj]     = useState<any>(null)
const [butceYukleniyor, setButceYukleniyor] = useState(false)
const [butceForm, setButceForm]       = useState({ kategori: '', butce_tutar: '', aciklama: '' })
  const [giderler, setGiderler]         = useState<any[]>([])
const [giderForm, setGiderForm]       = useState({
  kategori: '', aciklama: '', tutar: '', gider_tarihi: new Date().toISOString().split('T')[0], belge_no: ''
})
const [giderMesaj, setGiderMesaj]     = useState<any>(null)
const [giderYukleniyor, setGiderYukleniyor] = useState(false)
  const [odemeler, setOdemeler]   = useState<any[]>([])
const [odemeFiltre, setOdemeFiltre] = useState({ yil: new Date().getFullYear(), ay: 0 })
  const [yukleniyor, setYukleniyor]             = useState(true)
  const [aktifSayfa, setAktifSayfa]             = useState('dashboard')
  const [tahakkukMesaj, setTahakkukMesaj]       = useState<any>(null)
  const [tahakkukYukleniyor, setTahakkukYukleniyor] = useState(false)
  const [eslestirmeForm, setEslestirmeForm] = useState({ sakin_id: '', daire_id: '' })
const [eslestirmeMesaj, setEslestirmeMesaj] = useState<any>(null)
const [eslestirmeYukleniyor, setEslestirmeYukleniyor] = useState(false)
  const [tahakkukForm, setTahakkukForm]         = useState({
    daire_id: '', tur_id: '', tutar: '',
    donem_yil: new Date().getFullYear(),
    donem_ay: new Date().getMonth() + 1,
    son_odeme_tarihi: '', toplu: false
  })
  const [sakinEkleForm, setSakinEkleForm]       = useState({
    email: '', sifre: '', ad_soyad: '', telefon: '', daire_id: ''
  })
  const [sakinEkleMesaj, setSakinEkleMesaj]     = useState<any>(null)
  const [sakinEkleYukleniyor, setSakinEkleYukleniyor] = useState(false)
  const [duyuruForm, setDuyuruForm]             = useState({ baslik: '', icerik: '' })
  const [duyuruMesaj, setDuyuruMesaj]           = useState<any>(null)
  const [duyuruYukleniyor, setDuyuruYukleniyor] = useState(false)
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
      const gecikmisTahakkuk = tahakkukData?.filter(t => t.durum === 'gecikti').reduce((a, t) => a + Number(t.tutar), 0) || 0
      setIstatistik({ toplamSakin, toplamDaire, dolDaire, bekleyenBildirim, acikAriza, toplamTahakkuk, gecikmisTahakkuk })

      const { data: sakinData } = await supabase.from('profiller').select('*').eq('rol', 'sakin').order('ad_soyad')
      setSakinler(sakinData || [])

      const { data: bildirimData } = await supabase
        .from('odeme_bildirimleri')
        .select('*, profiller(ad_soyad), tahakkuklar(donem_yil, donem_ay, aidat_turleri(tur_adi))')
        .eq('durum', 'bekliyor').order('olusturma', { ascending: false })
      setBildirimler(bildirimData || [])

      const { data: arizaData } = await supabase
        .from('ariza_talepler').select('*, profiller(ad_soyad)')
        .eq('durum', 'acik').order('olusturma', { ascending: false })
      setArizalar(arizaData || [])

      const { data: daireData } = await supabase
        .from('daireler').select('*, bloklar(blok_adi), profiller(ad_soyad)')
        .order('blok_id').order('daire_no')
      setDaireler(daireData || [])

      const { data: turData } = await supabase.from('aidat_turleri').select('*').eq('durum', 'aktif')
      setAidatTurleri(turData || [])

      const { data: duyuruData } = await supabase.from('duyurular').select('*').order('olusturma', { ascending: false })
      setDuyurular(duyuruData || [])
// Ödemeler — ayrı sorgularla
const { data: odemeData } = await supabase
  .from('odemeler')
  .select('*, tahakkuklar(donem_yil, donem_ay, tur_id, daire_id)')
  .order('odeme_tarihi', { ascending: false })
  .limit(100)

if (odemeData && odemeData.length > 0) {
  // Tahakkuk ID'lerinden daire ve tür bilgilerini al
  const daireIds = [...new Set(odemeData.map((o: any) => o.tahakkuklar?.daire_id).filter(Boolean))]
  const turIds   = [...new Set(odemeData.map((o: any) => o.tahakkuklar?.tur_id).filter(Boolean))]

  const [{ data: daireMap }, { data: turMap }] = await Promise.all([
    supabase.from('daireler').select('id, daire_no, bloklar(blok_adi)').in('id', daireIds),
    supabase.from('aidat_turleri').select('id, tur_adi').in('id', turIds),
  ])

  const dMap: any = {}
  daireMap?.forEach((d: any) => { dMap[d.id] = d })
  const tMap: any = {}
  turMap?.forEach((t: any) => { tMap[t.id] = t })

  const zenginOdemeler = odemeData.map((o: any) => ({
    ...o,
    daire: dMap[o.tahakkuklar?.daire_id],
    tur:   tMap[o.tahakkuklar?.tur_id],
  }))
  setOdemeler(zenginOdemeler)
} else {
  setOdemeler([])
}
	const { data: giderData } = await supabase
  .from('giderler').select('*')
  .order('gider_tarihi', { ascending: false })
  .limit(50)
setGiderler(giderData || [])

const { data: butceData } = await supabase
  .from('butce').select('*')
  .eq('yil', new Date().getFullYear())
  .order('kategori')
console.log('Bütçe:', butceData)
setButce(butceData || [])

      setYukleniyor(false)
    }
    yukle()
  }, [])

  const cikisYap = async () => {
    await supabase.auth.signOut()
    router.push('/giris')
  }

const bildirimOnayla = async (id: number, tahakkukId: number, tutar: number) => {
  // Ödemeyi kaydet
  await supabase.from('odemeler').insert({
    tahakkuk_id: tahakkukId,
    odeme_tarihi: new Date().toISOString().split('T')[0],
    tutar, odeme_yontemi: 'havale',
    aciklama: 'Sakin bildirimi onaylandı'
  })

  // Tahakkuk toplam ödemeyi kontrol et
  const { data: tahakkuk } = await supabase
    .from('tahakkuklar').select('tutar').eq('id', tahakkukId).single()

  const { data: odemeToplamData } = await supabase
    .from('odemeler').select('tutar').eq('tahakkuk_id', tahakkukId)

  const odenenToplam = odemeToplamData?.reduce((acc, o) => acc + Number(o.tutar), 0) || 0

  // Tam ödendiyse tahakkuku kapat
  if (tahakkuk && odenenToplam >= Number(tahakkuk.tutar)) {
    await supabase.from('tahakkuklar')
      .update({ durum: 'odendi' }).eq('id', tahakkukId)
  }

  // Bildirimi güncelle
  await supabase.from('odeme_bildirimleri').update({ durum: 'onaylandi' }).eq('id', id)

  // Listeyi yenile
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
    setTahakkukForm(f => ({ ...f, tur_id: turId, tutar: tur ? String(tur.varsayilan_tutar) : '' }))
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
        daire_id: daire.id, tur_id: parseInt(tahakkukForm.tur_id),
        donem_yil: tahakkukForm.donem_yil, donem_ay: tahakkukForm.donem_ay,
        tutar: parseFloat(tahakkukForm.tutar),
        son_odeme_tarihi: tahakkukForm.son_odeme_tarihi || null, durum: 'bekliyor'
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

  const sakinEkle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSakinEkleYukleniyor(true)
    setSakinEkleMesaj(null)

    const res = await fetch('/api/sakin-ekle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sakinEkleForm.email, sifre: sakinEkleForm.sifre,
        ad_soyad: sakinEkleForm.ad_soyad, telefon: sakinEkleForm.telefon,
      })
    })

    const sonuc = await res.json()
    if (sonuc.error) {
      setSakinEkleMesaj({ tip: 'hata', metin: sonuc.error })
      setSakinEkleYukleniyor(false)
      return
    }

    if (sakinEkleForm.daire_id) {
      await supabase.from('daireler')
        .update({ kullanici_id: sonuc.userId, durum: 'dolu' })
        .eq('id', parseInt(sakinEkleForm.daire_id))
    }

    const { data: sakinData } = await supabase.from('profiller').select('*').eq('rol', 'sakin').order('ad_soyad')
    setSakinler(sakinData || [])
    setSakinEkleMesaj({ tip: 'basari', metin: `${sakinEkleForm.ad_soyad} başarıyla eklendi!` })
    setSakinEkleForm({ email: '', sifre: '', ad_soyad: '', telefon: '', daire_id: '' })
    setSakinEkleYukleniyor(false)
  }

  const duyuruEkle = async (e: React.FormEvent) => {
    e.preventDefault()
    setDuyuruYukleniyor(true)
    setDuyuruMesaj(null)

    const { error } = await supabase.from('duyurular').insert({
      baslik: duyuruForm.baslik,
      icerik: duyuruForm.icerik,
      yayinlayan_id: kullanici?.id
    })

    if (error) {
      setDuyuruMesaj({ tip: 'hata', metin: error.message })
    } else {
      setDuyuruMesaj({ tip: 'basari', metin: 'Duyuru yayınlandı!' })
      setDuyuruForm({ baslik: '', icerik: '' })
      const { data } = await supabase.from('duyurular').select('*').order('olusturma', { ascending: false })
      setDuyurular(data || [])
    }
    setDuyuruYukleniyor(false)
  }

  const duyuruSil = async (id: number) => {
    await supabase.from('duyurular').delete().eq('id', id)
    setDuyurular(prev => prev.filter(d => d.id !== id))
  }
  
  const giderEkle = async (e: React.FormEvent) => {
  e.preventDefault()
  setGiderYukleniyor(true)
  setGiderMesaj(null)

  const { error } = await supabase.from('giderler').insert({
    kategori:     giderForm.kategori,
    aciklama:     giderForm.aciklama,
    tutar:        parseFloat(giderForm.tutar),
    gider_tarihi: giderForm.gider_tarihi,
    belge_no:     giderForm.belge_no || null,
    kaydeden_id:  kullanici?.id
  })

  if (error) {
    setGiderMesaj({ tip: 'hata', metin: error.message })
  } else {
    setGiderMesaj({ tip: 'basari', metin: 'Gider kaydedildi!' })
    setGiderForm({ kategori: '', aciklama: '', tutar: '', gider_tarihi: new Date().toISOString().split('T')[0], belge_no: '' })
    const { data } = await supabase
      .from('giderler').select('*')
      .order('gider_tarihi', { ascending: false }).limit(50)
    setGiderler(data || [])
  }
  setGiderYukleniyor(false)
}

const giderSil = async (id: number) => {
  await supabase.from('giderler').delete().eq('id', id)
  setGiderler(prev => prev.filter(g => g.id !== id))
}

const butceYukle = async (yil: number) => {
  const { data } = await supabase
    .from('butce').select('*')
    .eq('yil', yil).order('kategori')
  setButce(data || [])
}

const butceKaydet = async (e: React.FormEvent) => {
  e.preventDefault()
  setButceYukleniyor(true)
  setButceMesaj(null)

  const { error } = await supabase.from('butce').upsert({
    yil: butceYil,
    kategori: butceForm.kategori,
    butce_tutar: parseFloat(butceForm.butce_tutar),
    aciklama: butceForm.aciklama
  }, { onConflict: 'yil,kategori' })

  if (error) {
    setButceMesaj({ tip: 'hata', metin: error.message })
  } else {
    setButceMesaj({ tip: 'basari', metin: 'Bütçe kaydedildi!' })
    setButceForm({ kategori: '', butce_tutar: '', aciklama: '' })
    butceYukle(butceYil)
  }
  setButceYukleniyor(false)
}
const yilsonuHesapla = async (yil: number) => {
  setYilsonuYukleniyor(true)

  // Tahakkuklar
  const { data: thData } = await supabase
    .from('tahakkuklar')
    .select('tutar, durum, donem_ay')
    .eq('donem_yil', yil)

  const toplamTahakkuk = thData?.reduce((acc, t) => acc + Number(t.tutar), 0) || 0
  const odenenTahakkuk = thData?.filter(t => t.durum === 'odendi').reduce((acc, t) => acc + Number(t.tutar), 0) || 0
  const gecikmisTahakkuk = thData?.filter(t => t.durum === 'gecikti').reduce((acc, t) => acc + Number(t.tutar), 0) || 0

  // Ödemeler
  const { data: odemeData } = await supabase
    .from('odemeler')
    .select('tutar, odeme_tarihi')
    .gte('odeme_tarihi', `${yil}-01-01`)
    .lte('odeme_tarihi', `${yil}-12-31`)

  const toplamOdeme = odemeData?.reduce((acc, o) => acc + Number(o.tutar), 0) || 0

  // Aylık ödeme dağılımı
  const aylikOdeme = Array(12).fill(0)
  odemeData?.forEach((o: any) => {
    const ay = new Date(o.odeme_tarihi).getMonth()
    aylikOdeme[ay] += Number(o.tutar)
  })

  // Giderler
  const { data: giderData } = await supabase
    .from('giderler')
    .select('tutar, kategori, gider_tarihi')
    .gte('gider_tarihi', `${yil}-01-01`)
    .lte('gider_tarihi', `${yil}-12-31`)

  const toplamGider = giderData?.reduce((acc, g) => acc + Number(g.tutar), 0) || 0

  // Aylık gider dağılımı
  const aylikGider = Array(12).fill(0)
  giderData?.forEach((g: any) => {
    const ay = new Date(g.gider_tarihi).getMonth()
    aylikGider[ay] += Number(g.tutar)
  })

  // Kategori bazlı gider
  const kategoriGider: any = {}
  giderData?.forEach((g: any) => {
    if (!kategoriGider[g.kategori]) kategoriGider[g.kategori] = 0
    kategoriGider[g.kategori] += Number(g.tutar)
  })

  // Bütçe
  const { data: butceData } = await supabase
    .from('butce').select('*').eq('yil', yil)
  const toplamButce = butceData?.reduce((acc, b) => acc + Number(b.butce_tutar), 0) || 0

  // Sakin istatistikleri
  const { count: toplamSakin } = await supabase
    .from('profiller').select('*', { count: 'exact', head: true }).eq('rol', 'sakin')
  const { count: aktifDaire } = await supabase
    .from('daireler').select('*', { count: 'exact', head: true }).eq('durum', 'dolu')

  setYilsonuVeri({
    toplamTahakkuk, odenenTahakkuk, gecikmisTahakkuk,
    toplamOdeme, toplamGider, toplamButce,
    tahsilatOrani: toplamTahakkuk > 0 ? Math.round(toplamOdeme / toplamTahakkuk * 100) : 0,
    butceKullanim: toplamButce > 0 ? Math.round(toplamGider / toplamButce * 100) : 0,
    netDurum: toplamOdeme - toplamGider,
    aylikOdeme, aylikGider, kategoriGider,
    toplamSakin, aktifDaire,
    giderSayisi: giderData?.length || 0,
    odemeSayisi: odemeData?.length || 0,
  })

  setYilsonuYukleniyor(false)
}

const artisOnizlemeHesapla = () => {
  if (!artisForm.deger) return
  const deger = parseFloat(artisForm.deger)

  const hedefTurler = artisForm.kapsam === 'tur'
    ? aidatTurleri.filter(t => t.id === parseInt(artisForm.tur_id))
    : aidatTurleri

  const onizleme = hedefTurler.map(t => {
    const eskiTutar = Number(t.varsayilan_tutar)
    const yeniTutar = artisForm.yontem === 'yuzde'
      ? Math.round(eskiTutar * (1 + deger / 100) * 100) / 100
      : eskiTutar + deger
    return { ...t, eskiTutar, yeniTutar, fark: yeniTutar - eskiTutar }
  })
  setArtisOnizleme(onizleme)
}

const artisUygula = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!confirm('Aidat artışı uygulanacak. Emin misiniz?')) return
  setArtisYukleniyor(true)
  setArtisMesaj(null)

  let basarili = 0
  for (const tur of artisOnizleme) {
    const { error } = await supabase
      .from('aidat_turleri')
      .update({ varsayilan_tutar: tur.yeniTutar })
      .eq('id', tur.id)
    if (!error) basarili++
  }

  // Aidat türlerini yenile
  const { data } = await supabase.from('aidat_turleri').select('*').eq('durum', 'aktif')
  setAidatTurleri(data || [])
  setArtisOnizleme([])
  setArtisForm({ kapsam: 'tumu', tur_id: '', yontem: 'yuzde', deger: '', aciklama: '' })
  setArtisMesaj({ tip: 'basari', metin: `${basarili} aidat türü güncellendi!` })
  setArtisYukleniyor(false)
}

useEffect(() => {
  if (aktifSayfa === 'yilsonu') yilsonuHesapla(yilsonuYil)
}, [aktifSayfa, yilsonuYil])

  const daireEslestir = async (e: React.FormEvent) => {
  e.preventDefault()
  setEslestirmeYukleniyor(true)
  setEslestirmeMesaj(null)

  const sakinId = eslestirmeForm.sakin_id
  const daireId = parseInt(eslestirmeForm.daire_id)

  // Sakinin eski dairesini boşalt
  await supabase
    .from('daireler')
    .update({ kullanici_id: null, durum: 'bos' })
    .eq('kullanici_id', sakinId)

  // Yeni daireye ata
  const { error } = await supabase
    .from('daireler')
    .update({ kullanici_id: sakinId, durum: 'dolu' })
    .eq('id', daireId)

  if (error) {
    setEslestirmeMesaj({ tip: 'hata', metin: error.message })
  } else {
    setEslestirmeMesaj({ tip: 'basari', metin: 'Daire eşleştirmesi güncellendi!' })
    setEslestirmeForm({ sakin_id: '', daire_id: '' })
    // Daireleri yenile
    const { data } = await supabase
      .from('daireler')
      .select('*, bloklar(blok_adi), profiller(ad_soyad)')
      .order('blok_id').order('daire_no')
    setDaireler(data || [])
  }
  setEslestirmeYukleniyor(false)
}

const odemeYenile = async () => {
  const { data: odemeData } = await supabase
    .from('odemeler')
    .select('*, tahakkuklar(donem_yil, donem_ay, tur_id, daire_id)')
    .order('odeme_tarihi', { ascending: false })
    .limit(100)

  if (odemeData && odemeData.length > 0) {
    const daireIds = [...new Set(odemeData.map((o: any) => o.tahakkuklar?.daire_id).filter(Boolean))]
    const turIds   = [...new Set(odemeData.map((o: any) => o.tahakkuklar?.tur_id).filter(Boolean))]

    const [{ data: daireMap }, { data: turMap }] = await Promise.all([
      supabase.from('daireler').select('id, daire_no, bloklar(blok_adi)').in('id', daireIds),
      supabase.from('aidat_turleri').select('id, tur_adi').in('id', turIds),
    ])

    const dMap: any = {}
    daireMap?.forEach((d: any) => { dMap[d.id] = d })
    const tMap: any = {}
    turMap?.forEach((t: any) => { tMap[t.id] = t })

    setOdemeler(odemeData.map((o: any) => ({
      ...o,
      daire: dMap[o.tahakkuklar?.daire_id],
      tur:   tMap[o.tahakkuklar?.tur_id],
    })))
  } else {
    setOdemeler([])
  }
}
  if (yukleniyor) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#1a3c5e' }}>
      Yükleniyor...
    </div>
  )

  const menuler = [
    { id: 'dashboard',   ikon: '📊', etiket: 'Dashboard' },
    { id: 'sakinler',    ikon: '👥', etiket: 'Sakinler' },
    { id: 'tahakkuklar', ikon: '📋', etiket: 'Tahakkuklar' },
    { id: 'bildirimler', ikon: '✉️', etiket: `Ödeme Bildirimleri${(istatistik.bekleyenBildirim || 0) > 0 ? ` (${istatistik.bekleyenBildirim})` : ''}` },
    { id: 'arizalar',    ikon: '🔧', etiket: `Arıza Talepler${(istatistik.acikAriza || 0) > 0 ? ` (${istatistik.acikAriza})` : ''}` },
    { id: 'duyurular',   ikon: '📢', etiket: 'Duyurular' },
	{ id: 'daireler', ikon: '🏠', etiket: 'Daire Eşleştirme' },
	{ id: 'odemeler', ikon: '💰', etiket: 'Ödemeler' },
	{ id: 'giderler', ikon: '💸', etiket: 'Giderler' },
	{ id: 'butce', ikon: '📊', etiket: 'Bütçe Takibi' },
	{ id: 'yilsonu', ikon: '📈', etiket: 'Yıl Sonu Raporu' },
	{ id: 'aidat_artis', ikon: '📈', etiket: 'Aidat Artış' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🏢</span>
          <span style={{ fontWeight: '700', fontSize: '1rem' }}>Aidat Yönetim Sistemi — Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '.85rem', opacity: .8 }}>👤 {kullanici?.ad_soyad}</span>
          <button onClick={cikisYap} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '.82rem' }}>Çıkış</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: '220px', background: '#1a3c5e', minHeight: 'calc(100vh - 49px)', padding: '16px 0', flexShrink: 0 }}>
          {menuler.map(m => (
            <button key={m.id} onClick={() => setAktifSayfa(m.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 20px', border: 'none', cursor: 'pointer',
                background: aktifSayfa === m.id ? 'rgba(255,255,255,.15)' : 'transparent',
                color: aktifSayfa === m.id ? '#fff' : 'rgba(255,255,255,.7)',
                fontSize: '.85rem', fontWeight: aktifSayfa === m.id ? '700' : '400',
                borderLeft: aktifSayfa === m.id ? '3px solid #f0a500' : '3px solid transparent',
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
              <h2 style={{ color: '#1a3c5e', marginBottom: '24px' }}>Hoş geldiniz, {kullanici?.ad_soyad} 👋</h2>

              {((istatistik.bekleyenBildirim || 0) > 0 || (istatistik.acikAriza || 0) > 0) && (
                <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
                  <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>⚠️ Dikkat Gerektiren Durumlar</div>
                  {(istatistik.bekleyenBildirim || 0) > 0 && (
                    <div style={{ color: '#92400e', fontSize: '.9rem', marginBottom: '4px' }}>
                      • {istatistik.bekleyenBildirim} bekleyen ödeme bildirimi var
                      <button onClick={() => setAktifSayfa('bildirimler')} style={{ marginLeft: '8px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '.78rem' }}>İncele →</button>
                    </div>
                  )}
                  {(istatistik.acikAriza || 0) > 0 && (
                    <div style={{ color: '#92400e', fontSize: '.9rem' }}>
                      • {istatistik.acikAriza} açık arıza talebi var
                      <button onClick={() => setAktifSayfa('arizalar')} style={{ marginLeft: '8px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '.78rem' }}>İncele →</button>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {[
                  { etiket: 'Toplam Sakin',    deger: istatistik.toplamSakin || 0, renk: '#1a3c5e', ikon: '👥' },
                  { etiket: 'Dolu Daire',      deger: `${istatistik.dolDaire || 0}/${istatistik.toplamDaire || 0}`, renk: '#16a34a', ikon: '🏠' },
                  { etiket: 'Toplam Tahakkuk', deger: paraFormat(istatistik.toplamTahakkuk || 0), renk: '#2e7d9f', ikon: '📋' },
                  { etiket: 'Gecikmiş Borç',   deger: paraFormat(istatistik.gecikmisTahakkuk || 0), renk: '#dc2626', ikon: '⚠️' },
                  { etiket: 'Bekl. Bildirim',  deger: istatistik.bekleyenBildirim || 0, renk: '#d97706', ikon: '✉️' },
                  { etiket: 'Açık Arıza',      deger: istatistik.acikAriza || 0, renk: '#7c3aed', ikon: '🔧' },
                ].map(k => (
                  <div key={k.etiket} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{k.ikon}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: k.renk, marginBottom: '4px' }}>{k.deger}</div>
                    <div style={{ color: '#6b7280', fontSize: '.78rem', fontWeight: '600' }}>{k.etiket}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ color: '#374151', marginBottom: '16px' }}>🏢 Bloklar</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {['A','B','C','D'].map(b => (
                  <div key={b} style={{ background: '#fff', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1a3c5e', marginBottom: '4px' }}>{b}</div>
                    <div style={{ color: '#6b7280', fontSize: '.85rem' }}>{b} Blok</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SAKİNLER */}
          {aktifSayfa === 'sakinler' && (
            <div>
              <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>👥 Sakin Yönetimi</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>➕ Yeni Sakin Ekle</div>
                  <div style={{ padding: '20px' }}>
                    {sakinEkleMesaj && (
                      <div style={{ background: sakinEkleMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: sakinEkleMesaj.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '.85rem', fontWeight: '600' }}>
                        {sakinEkleMesaj.metin}
                      </div>
                    )}
                    <form onSubmit={sakinEkle}>
                      {[
                        { label: 'Ad Soyad', key: 'ad_soyad', type: 'text', placeholder: 'Ahmet Yılmaz' },
                        { label: 'E-posta', key: 'email', type: 'email', placeholder: 'ahmet@example.com' },
                        { label: 'Şifre', key: 'sifre', type: 'password', placeholder: 'En az 6 karakter' },
                        { label: 'Telefon', key: 'telefon', type: 'text', placeholder: '0500...' },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>{f.label}</label>
                          <input type={f.type} required={f.key !== 'telefon'} placeholder={f.placeholder}
                            value={(sakinEkleForm as any)[f.key]}
                            onChange={e => setSakinEkleForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
                        </div>
                      ))}
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>
                          Daire <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span>
                        </label>
                        <select value={sakinEkleForm.daire_id}
                          onChange={e => setSakinEkleForm(prev => ({ ...prev, daire_id: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                          <option value="">-- Sonra Ata --</option>
                          {daireler.filter(d => d.durum === 'bos').map(d => (
                            <option key={d.id} value={d.id}>{d.bloklar?.blok_adi} Blok - Daire {d.daire_no}</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" disabled={sakinEkleYukleniyor}
                        style={{ width: '100%', padding: '11px', background: sakinEkleYukleniyor ? '#9ca3af' : '#1a3c5e', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '.9rem', fontWeight: '700', cursor: 'pointer' }}>
                        {sakinEkleYukleniyor ? 'Ekleniyor...' : '➕ Sakin Ekle'}
                      </button>
                    </form>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ background: '#374151', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>👥 Sakin Listesi ({sakinler.length})</div>
                  {sakinler.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Henüz sakin kaydı yok.</div>
                  ) : sakinler.map((s, i) => (
                    <div key={s.id} style={{ padding: '14px 20px', borderBottom: i < sakinler.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#374151' }}>{s.ad_soyad}</div>
                        <div style={{ color: '#6b7280', fontSize: '.8rem' }}>{s.telefon || 'Telefon yok'}</div>
                      </div>
                      <span style={{ background: s.durum === 'aktif' ? '#dcfce7' : '#f3f4f6', color: s.durum === 'aktif' ? '#166534' : '#6b7280', padding: '2px 10px', borderRadius: '20px', fontSize: '.75rem', fontWeight: '700' }}>
                        {s.durum === 'aktif' ? '✓ Aktif' : 'Pasif'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAHAKKUKLAR */}
          {aktifSayfa === 'tahakkuklar' && (
            <div>
              <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📋 Tahakkuk Oluştur</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>📋 Yeni Tahakkuk</div>
                  <div style={{ padding: '20px' }}>
                    {tahakkukMesaj && (
                      <div style={{ background: tahakkukMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: tahakkukMesaj.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '.85rem', fontWeight: '600' }}>
                        {tahakkukMesaj.metin}
                      </div>
                    )}
                    <form onSubmit={tahakkukKaydet}>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Kapsam</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[{ value: false, label: '🏠 Tek Daire' }, { value: true, label: '🏢 Tüm Dolu Daireler' }].map(o => (
                            <button key={String(o.value)} type="button"
                              onClick={() => setTahakkukForm(f => ({ ...f, toplu: o.value }))}
                              style={{ flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700', border: tahakkukForm.toplu === o.value ? '2px solid #1a3c5e' : '1px solid #d1d5db', background: tahakkukForm.toplu === o.value ? '#eff6ff' : '#fff', color: tahakkukForm.toplu === o.value ? '#1a3c5e' : '#6b7280' }}>
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {!tahakkukForm.toplu && (
                        <div style={{ marginBottom: '14px' }}>
                          <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Daire</label>
                          <select value={tahakkukForm.daire_id} onChange={e => setTahakkukForm(f => ({ ...f, daire_id: e.target.value }))} required={!tahakkukForm.toplu}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                            <option value="">-- Daire Seçin --</option>
                            {daireler.map(d => (
                              <option key={d.id} value={d.id}>{d.bloklar?.blok_adi} Blok - Daire {d.daire_no}{d.profiller?.ad_soyad ? ` (${d.profiller.ad_soyad})` : ' (Boş)'}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Aidat Türü</label>
                        <select value={tahakkukForm.tur_id} onChange={e => turSecildi(e.target.value)} required
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                          <option value="">-- Tür Seçin --</option>
                          {aidatTurleri.map(t => (
                            <option key={t.id} value={t.id}>{t.tur_adi} ({paraFormat(Number(t.varsayilan_tutar))})</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Tutar (₺)</label>
                        <input type="number" step="0.01" required value={tahakkukForm.tutar}
                          onChange={e => setTahakkukForm(f => ({ ...f, tutar: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Dönem</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select value={tahakkukForm.donem_yil} onChange={e => setTahakkukForm(f => ({ ...f, donem_yil: parseInt(e.target.value) }))}
                            style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={tahakkukForm.donem_ay} onChange={e => setTahakkukForm(f => ({ ...f, donem_ay: parseInt(e.target.value) }))}
                            style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                            {Array.from({length:12},(_,i) => i+1).map(m => <option key={m} value={m}>{ayAdi(m)}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>
                          Son Ödeme Tarihi <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span>
                        </label>
                        <input type="date" value={tahakkukForm.son_odeme_tarihi}
                          onChange={e => setTahakkukForm(f => ({ ...f, son_odeme_tarihi: e.target.value }))}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
                      </div>
                      <button type="submit" disabled={tahakkukYukleniyor}
                        style={{ width: '100%', padding: '11px', background: tahakkukYukleniyor ? '#9ca3af' : '#1a3c5e', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '.9rem', fontWeight: '700', cursor: 'pointer' }}>
                        {tahakkukYukleniyor ? 'Kaydediliyor...' : tahakkukForm.toplu ? '🏢 Tüm Dolu Dairelere Ekle' : '📋 Tahakkuk Ekle'}
                      </button>
                    </form>
                  </div>
                </div>
                <div>
                  <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                    <div style={{ fontWeight: '700', color: '#1a3c5e', marginBottom: '12px' }}>📊 Dolu Daireler ({daireler.filter(d => d.durum === 'dolu').length})</div>
                    {daireler.filter(d => d.durum === 'dolu').map(d => (
                      <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '.85rem' }}>
                        <span style={{ fontWeight: '600' }}>{d.bloklar?.blok_adi} Blok - Daire {d.daire_no}</span>
                        <span style={{ color: '#6b7280' }}>{d.profiller?.ad_soyad || 'Boş'}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontWeight: '700', color: '#1e40af', marginBottom: '8px' }}>ℹ️ Bilgi</div>
                    <ul style={{ color: '#3730a3', margin: 0, paddingLeft: '20px', fontSize: '.85rem', lineHeight: '2' }}>
                      <li>Aynı daire + tür + dönem kombinasyonu mükerrer oluşturulamaz</li>
                      <li>Toplu modda sadece dolu dairelere eklenir</li>
                      <li>Tür seçilince tutar otomatik gelir</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ÖDEME BİLDİRİMLERİ */}
          {aktifSayfa === 'bildirimler' && (
            <div>
              <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>✉️ Bekleyen Ödeme Bildirimleri</h2>
              {bildirimler.length === 0 ? (
                <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#166534', fontWeight: '700' }}>
                  ✅ Bekleyen bildirim yok!
                </div>
              ) : bildirimler.map(b => (
                <div key={b.id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#374151', marginBottom: '4px' }}>{b.profiller?.ad_soyad}</div>
                      <div style={{ color: '#6b7280', fontSize: '.85rem' }}>{b.tahakkuklar?.aidat_turleri?.tur_adi} — {ayAdi(b.tahakkuklar?.donem_ay)} {b.tahakkuklar?.donem_yil}</div>
                      <div style={{ color: '#6b7280', fontSize: '.8rem' }}>Yöntem: {b.odeme_yontemi} | Tarih: {new Date(b.odeme_tarihi).toLocaleDateString('tr-TR')}</div>
                      {b.aciklama && <div style={{ color: '#9ca3af', fontSize: '.78rem', marginTop: '4px' }}>Not: {b.aciklama}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#16a34a', marginBottom: '8px' }}>{paraFormat(Number(b.tutar))}</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => bildirimOnayla(b.id, b.tahakkuk_id, b.tutar)}
                          style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700' }}>✓ Onayla</button>
                        <button onClick={() => bildirimReddet(b.id)}
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700' }}>✗ Reddet</button>
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
              <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>🔧 Açık Arıza Talepler</h2>
              {arizalar.length === 0 ? (
                <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#166534', fontWeight: '700' }}>
                  ✅ Açık arıza talebi yok!
                </div>
              ) : arizalar.map(a => (
                <div key={a.id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: `1px solid ${a.oncelik === 'yuksek' ? '#fca5a5' : '#e5e7eb'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>{a.kategori}</span>
                        <span style={{ background: a.oncelik === 'yuksek' ? '#fee2e2' : '#dbeafe', color: a.oncelik === 'yuksek' ? '#991b1b' : '#1e40af', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>{a.oncelik}</span>
                      </div>
                      <div style={{ fontWeight: '700', color: '#374151' }}>{a.baslik}</div>
                      <div style={{ color: '#6b7280', fontSize: '.82rem', marginTop: '4px' }}>{a.aciklama}</div>
                      <div style={{ color: '#9ca3af', fontSize: '.75rem', marginTop: '4px' }}>{a.profiller?.ad_soyad} | {new Date(a.olusturma).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button onClick={() => arizaDurumGuncelle(a.id, 'islemde')}
                        style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700' }}>⚙️ İşleme Al</button>
                      <button onClick={() => arizaDurumGuncelle(a.id, 'tamamlandi')}
                        style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '.82rem', fontWeight: '700' }}>✅ Tamamlandı</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DUYURULAR */}
          {aktifSayfa === 'duyurular' && (
            <div>
              <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📢 Duyuru Yönetimi</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>📢 Yeni Duyuru</div>
                  <div style={{ padding: '20px' }}>
                    {duyuruMesaj && (
                      <div style={{ background: duyuruMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2', color: duyuruMesaj.tip === 'basari' ? '#166534' : '#991b1b', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '.85rem', fontWeight: '600' }}>
                        {duyuruMesaj.metin}
                      </div>
                    )}
                    <form onSubmit={duyuruEkle}>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Başlık</label>
                        <input type="text" required value={duyuruForm.baslik}
                          onChange={e => setDuyuruForm(f => ({ ...f, baslik: e.target.value }))}
                          placeholder="Duyuru başlığı..."
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>İçerik</label>
                        <textarea rows={5} required value={duyuruForm.icerik}
                          onChange={e => setDuyuruForm(f => ({ ...f, icerik: e.target.value }))}
                          placeholder="Duyuru içeriği..."
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box', resize: 'vertical' }} />
                      </div>
                      <button type="submit" disabled={duyuruYukleniyor}
                        style={{ width: '100%', padding: '11px', background: duyuruYukleniyor ? '#9ca3af' : '#1a3c5e', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '.9rem', fontWeight: '700', cursor: 'pointer' }}>
                        {duyuruYukleniyor ? 'Yayınlanıyor...' : '📢 Duyuru Yayınla'}
                      </button>
                    </form>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ background: '#374151', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>📋 Yayınlanan Duyurular ({duyurular.length})</div>
                  {duyurular.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Henüz duyuru yok.</div>
                  ) : duyurular.map((d, i) => (
                    <div key={d.id} style={{ padding: '14px 20px', borderBottom: i < duyurular.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', color: '#1a3c5e', marginBottom: '4px' }}>{d.baslik}</div>
                          <div style={{ color: '#374151', fontSize: '.82rem', lineHeight: '1.5' }}>{d.icerik}</div>
                          <div style={{ color: '#9ca3af', fontSize: '.72rem', marginTop: '6px' }}>
                            {new Date(d.olusturma).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                        <button onClick={() => { if (confirm('Bu duyuru silinecek. Emin misiniz?')) duyuruSil(d.id) }}
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '.8rem', flexShrink: 0 }}>
                          🗑️
                        </button>
                      </div>
                    </div>
					
                  ))}
				  
                </div>
              </div>
            </div>
          )}{/* GİDERLER */}
{aktifSayfa === 'giderler' && (
  <div>
    <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>💸 Gider Yönetimi</h2>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start' }}>

      {/* Form */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#dc2626', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
          💸 Yeni Gider Ekle
        </div>
        <div style={{ padding: '20px' }}>
          {giderMesaj && (
            <div style={{
              background: giderMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2',
              color: giderMesaj.tip === 'basari' ? '#166534' : '#991b1b',
              borderRadius: '8px', padding: '12px 16px',
              marginBottom: '16px', fontSize: '.85rem', fontWeight: '600'
            }}>
              {giderMesaj.metin}
            </div>
          )}
          <form onSubmit={giderEkle}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Kategori</label>
              <select value={giderForm.kategori}
                onChange={e => setGiderForm(f => ({ ...f, kategori: e.target.value }))}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                <option value="">-- Seçin --</option>
                {['Temizlik','Elektrik','Su','Doğalgaz','Asansör Bakım','Güvenlik','Bahçe','Tadilat','Sigorta','Yönetim','Diğer'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Açıklama</label>
              <input type="text" value={giderForm.aciklama}
                onChange={e => setGiderForm(f => ({ ...f, aciklama: e.target.value }))}
                placeholder="Gider açıklaması..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Tutar (₺)</label>
                <input type="number" step="0.01" required value={giderForm.tutar}
                  onChange={e => setGiderForm(f => ({ ...f, tutar: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Tarih</label>
                <input type="date" required value={giderForm.gider_tarihi}
                  onChange={e => setGiderForm(f => ({ ...f, gider_tarihi: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>
                Belge No <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span>
              </label>
              <input type="text" value={giderForm.belge_no}
                onChange={e => setGiderForm(f => ({ ...f, belge_no: e.target.value }))}
                placeholder="Fatura no, makbuz no..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={giderYukleniyor}
              style={{ width: '100%', padding: '11px', background: giderYukleniyor ? '#9ca3af' : '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '.9rem', fontWeight: '700', cursor: 'pointer' }}>
              {giderYukleniyor ? 'Kaydediliyor...' : '💸 Gider Ekle'}
            </button>
          </form>
        </div>
      </div>

      {/* Gider Listesi */}
      <div>
        {/* Özet */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Bu Ay Toplam', deger: giderler.filter(g => new Date(g.gider_tarihi).getMonth() === new Date().getMonth() && new Date(g.gider_tarihi).getFullYear() === new Date().getFullYear()).reduce((acc, g) => acc + Number(g.tutar), 0), renk: '#dc2626' },
            { label: 'Bu Yıl Toplam', deger: giderler.filter(g => new Date(g.gider_tarihi).getFullYear() === new Date().getFullYear()).reduce((acc, g) => acc + Number(g.tutar), 0), renk: '#1a3c5e' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ color: '#6b7280', fontSize: '.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: k.renk }}>
                {Number(k.deger).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
            </div>
          ))}
        </div>

        {/* Liste */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#374151', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
            📋 Son Giderler ({giderler.length})
          </div>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {giderler.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Henüz gider kaydı yok.</div>
            ) : giderler.map((g, i) => (
              <div key={g.id} style={{ padding: '12px 20px', borderBottom: i < giderler.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ background: '#f3f4f6', color: '#374151', padding: '1px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>
                      {g.kategori}
                    </span>
                    {g.belge_no && (
                      <span style={{ color: '#9ca3af', fontSize: '.72rem' }}>#{g.belge_no}</span>
                    )}
                  </div>
                  <div style={{ color: '#374151', fontSize: '.85rem' }}>{g.aciklama || '—'}</div>
                  <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>
                    {new Date(g.gider_tarihi).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: '800', color: '#dc2626', fontSize: '1rem' }}>
                    {Number(g.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </div>
                  <button onClick={() => { if (confirm('Bu gider silinecek?')) giderSil(g.id) }}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '.72rem', marginTop: '4px' }}>
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)}
{/* BÜTÇE TAKİBİ */}
{aktifSayfa === 'butce' && (
  <div>
    <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📊 Bütçe Takibi</h2>

    {/* Yıl Seçimi */}
    <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', display: 'flex', gap: '12px', alignItems: 'center' }}>
      <label style={{ fontWeight: '700', fontSize: '.85rem', color: '#374151' }}>Yıl:</label>
      <select value={butceYil}
        onChange={e => { setButceYil(parseInt(e.target.value)); butceYukle(parseInt(e.target.value)) }}
        style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
        {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'flex-start' }}>

      {/* Form */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
          ➕ Bütçe Ekle / Güncelle
        </div>
        <div style={{ padding: '20px' }}>
          {butceMesaj && (
            <div style={{
              background: butceMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2',
              color: butceMesaj.tip === 'basari' ? '#166534' : '#991b1b',
              borderRadius: '8px', padding: '12px 16px',
              marginBottom: '16px', fontSize: '.85rem', fontWeight: '600'
            }}>
              {butceMesaj.metin}
            </div>
          )}
          <form onSubmit={butceKaydet}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Kategori</label>
              <select value={butceForm.kategori}
                onChange={e => setButceForm(f => ({ ...f, kategori: e.target.value }))}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                <option value="">-- Seçin --</option>
                {['Temizlik','Elektrik','Su','Doğalgaz','Asansör Bakım','Güvenlik','Bahçe','Tadilat','Sigorta','Yönetim','Diğer'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Yıllık Bütçe (₺)</label>
              <input type="number" step="0.01" required value={butceForm.butce_tutar}
                onChange={e => setButceForm(f => ({ ...f, butce_tutar: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>
                Açıklama <span style={{ color: '#9ca3af', fontWeight: '400' }}>(opsiyonel)</span>
              </label>
              <input type="text" value={butceForm.aciklama}
                onChange={e => setButceForm(f => ({ ...f, aciklama: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={butceYukleniyor}
              style={{ width: '100%', padding: '11px', background: butceYukleniyor ? '#9ca3af' : '#1a3c5e', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '.9rem', fontWeight: '700', cursor: 'pointer' }}>
              {butceYukleniyor ? 'Kaydediliyor...' : '💾 Kaydet'}
            </button>
          </form>
        </div>
      </div>

      {/* Bütçe Tablosu */}
      <div>
        {/* Genel Özet */}
        {(() => {
          const toplamButce  = butce.reduce((acc, b) => acc + Number(b.butce_tutar), 0)
          const toplamHarcama = giderler
            .filter(g => new Date(g.gider_tarihi).getFullYear() === butceYil)
            .reduce((acc, g) => acc + Number(g.tutar), 0)
          const toplamKalan  = toplamButce - toplamHarcama
          const kullanim     = toplamButce > 0 ? Math.round(toplamHarcama / toplamButce * 100) : 0

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Toplam Bütçe',    deger: toplamButce,   renk: '#1a3c5e' },
                { label: 'Toplam Harcama',  deger: toplamHarcama, renk: '#dc2626' },
                { label: 'Kalan Bütçe',     deger: toplamKalan,   renk: toplamKalan >= 0 ? '#16a34a' : '#dc2626' },
                { label: 'Kullanım Oranı',  deger: null,          renk: kullanim > 90 ? '#dc2626' : kullanim > 70 ? '#d97706' : '#16a34a' },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: '.7rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: k.renk }}>
                    {k.deger !== null ? Number(k.deger).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : `%${kullanim}`}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Kategori Bazlı Tablo */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#374151', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
            📊 Kategori Bazlı Bütçe — {butceYil}
          </div>
          {butce.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
              Bu yıl için bütçe tanımlanmamış.
            </div>
          ) : butce.map((b, i) => {
            const harcama = giderler
              .filter(g => g.kategori === b.kategori && new Date(g.gider_tarihi).getFullYear() === butceYil)
              .reduce((acc, g) => acc + Number(g.tutar), 0)
            const kalan   = Number(b.butce_tutar) - harcama
            const oran    = Number(b.butce_tutar) > 0 ? Math.round(harcama / Number(b.butce_tutar) * 100) : 0
            const barRenk = oran > 90 ? '#dc2626' : oran > 70 ? '#d97706' : '#16a34a'

            return (
              <div key={b.id} style={{ padding: '14px 20px', borderBottom: i < butce.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontWeight: '700', color: '#374151', fontSize: '.9rem' }}>{b.kategori}</div>
                  <div style={{ fontSize: '.8rem', color: '#6b7280' }}>
                    <span style={{ color: '#dc2626', fontWeight: '700' }}>{harcama.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺</span>
                    {' / '}
                    {Number(b.butce_tutar).toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
                    <span style={{ marginLeft: '8px', fontWeight: '700', color: barRenk }}>%{oran}</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ background: barRenk, width: `${Math.min(oran, 100)}%`, height: '100%', borderRadius: '4px', transition: 'width .3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '.72rem', color: '#9ca3af' }}>Kalan: {kalan.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺</span>
                  <button onClick={() => {
                    setButceForm({ kategori: b.kategori, butce_tutar: String(b.butce_tutar), aciklama: b.aciklama || '' })
                  }}
                    style={{ fontSize: '.72rem', color: '#1a3c5e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                    ✏️ Düzenle
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  </div>
)}
{/* YIL SONU RAPORU */}
{aktifSayfa === 'yilsonu' && (
  <div>
    <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📈 Yıl Sonu Raporu</h2>

    {/* Yıl Seçimi */}
    <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', display: 'flex', gap: '12px', alignItems: 'center' }}>
      <label style={{ fontWeight: '700', fontSize: '.85rem', color: '#374151' }}>Yıl:</label>
      <select value={yilsonuYil}
        onChange={e => setYilsonuYil(parseInt(e.target.value))}
        style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
        {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>

    {yilsonuYukleniyor ? (
      <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Hesaplanıyor...</div>
    ) : yilsonuVeri && (
      <>
        {/* Ana Özet */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Toplam Tahakkuk',  deger: yilsonuVeri.toplamTahakkuk,  renk: '#1a3c5e', ikon: '📋' },
            { label: 'Toplam Tahsilat',  deger: yilsonuVeri.toplamOdeme,     renk: '#16a34a', ikon: '💰' },
            { label: 'Toplam Gider',     deger: yilsonuVeri.toplamGider,     renk: '#dc2626', ikon: '💸' },
            { label: 'Net Durum',        deger: yilsonuVeri.netDurum,        renk: yilsonuVeri.netDurum >= 0 ? '#16a34a' : '#dc2626', ikon: '📊' },
            { label: 'Tahsilat Oranı',   deger: null,                        renk: yilsonuVeri.tahsilatOrani >= 90 ? '#16a34a' : '#d97706', ikon: '📈', yuzde: yilsonuVeri.tahsilatOrani },
            { label: 'Bütçe Kullanımı', deger: null,                        renk: yilsonuVeri.butceKullanim > 90 ? '#dc2626' : '#16a34a', ikon: '🎯', yuzde: yilsonuVeri.butceKullanim },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{k.ikon}</div>
              <div style={{ color: '#6b7280', fontSize: '.75rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>{k.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: k.renk }}>
                {k.deger !== null ? Number(k.deger).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : `%${k.yuzde}`}
              </div>
            </div>
          ))}
        </div>

        {/* Aylık Tablo */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
            📅 Aylık Tahsilat / Gider — {yilsonuYil}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Ay', 'Tahsilat', 'Gider', 'Net'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Ay' ? 'left' : 'right', color: '#6b7280', fontWeight: '700', fontSize: '.75rem', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({length:12},(_,i) => i).map(i => {
                  const tahsilat = yilsonuVeri.aylikOdeme[i]
                  const gider    = yilsonuVeri.aylikGider[i]
                  const net      = tahsilat - gider
                  if (tahsilat === 0 && gider === 0) return null
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '600' }}>{ayAdi(i+1)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16a34a', fontWeight: '600' }}>
                        {tahsilat > 0 ? tahsilat.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#dc2626', fontWeight: '600' }}>
                        {gider > 0 ? gider.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: net >= 0 ? '#16a34a' : '#dc2626' }}>
                        {net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ background: '#f0f9ff', fontWeight: '800' }}>
                  <td style={{ padding: '10px 14px', color: '#1a3c5e' }}>TOPLAM</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16a34a' }}>{yilsonuVeri.toplamOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#dc2626' }}>{yilsonuVeri.toplamGider.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: yilsonuVeri.netDurum >= 0 ? '#16a34a' : '#dc2626' }}>{yilsonuVeri.netDurum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Gider Kategorileri */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#dc2626', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
            💸 Gider Kategorileri — {yilsonuYil}
          </div>
          {Object.keys(yilsonuVeri.kategoriGider).length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Bu yıl gider kaydı yok.</div>
          ) : Object.entries(yilsonuVeri.kategoriGider)
            .sort(([,a]: any, [,b]: any) => b - a)
            .map(([kat, tutar]: any, i) => {
              const oran = yilsonuVeri.toplamGider > 0 ? Math.round(tutar / yilsonuVeri.toplamGider * 100) : 0
              return (
                <div key={kat} style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>{kat}</span>
                    <span style={{ fontWeight: '700', color: '#dc2626' }}>
                      {Number(tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      <span style={{ color: '#9ca3af', fontWeight: '400', marginLeft: '8px' }}>%{oran}</span>
                    </span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px' }}>
                    <div style={{ background: '#dc2626', width: `${oran}%`, height: '100%', borderRadius: '4px' }} />
                  </div>
                </div>
              )
            })
          }
        </div>
      </>
    )}
  </div>
)}
{/* AİDAT ARTIŞ YÖNETİMİ */}
{aktifSayfa === 'aidat_artis' && (
  <div>
    <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>📈 Aidat Artış Yönetimi</h2>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start' }}>

      {/* Form */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
          📈 Artış Uygula
        </div>
        <div style={{ padding: '20px' }}>
          {artisMesaj && (
            <div style={{
              background: artisMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2',
              color: artisMesaj.tip === 'basari' ? '#166534' : '#991b1b',
              borderRadius: '8px', padding: '12px 16px',
              marginBottom: '16px', fontSize: '.85rem', fontWeight: '600'
            }}>
              {artisMesaj.metin}
            </div>
          )}

          <form onSubmit={artisUygula}>
            {/* Kapsam */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Kapsam</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'tumu', label: '🏢 Tüm Türler' },
                  { value: 'tur',  label: '📋 Belirli Tür' },
                ].map(o => (
                  <button key={o.value} type="button"
                    onClick={() => setArtisForm(f => ({ ...f, kapsam: o.value, tur_id: '' }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '.82rem', fontWeight: '700',
                      border: artisForm.kapsam === o.value ? '2px solid #1a3c5e' : '1px solid #d1d5db',
                      background: artisForm.kapsam === o.value ? '#eff6ff' : '#fff',
                      color: artisForm.kapsam === o.value ? '#1a3c5e' : '#6b7280'
                    }}>{o.label}</button>
                ))}
              </div>
            </div>

            {/* Tür seçimi */}
            {artisForm.kapsam === 'tur' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Aidat Türü</label>
                <select value={artisForm.tur_id}
                  onChange={e => setArtisForm(f => ({ ...f, tur_id: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                  <option value="">-- Seçin --</option>
                  {aidatTurleri.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tur_adi} ({paraFormat(Number(t.varsayilan_tutar))})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Yöntem */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>Artış Yöntemi</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'yuzde', label: '% Yüzde' },
                  { value: 'sabit', label: '₺ Sabit Tutar' },
                ].map(o => (
                  <button key={o.value} type="button"
                    onClick={() => setArtisForm(f => ({ ...f, yontem: o.value, deger: '' }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '.82rem', fontWeight: '700',
                      border: artisForm.yontem === o.value ? '2px solid #1a3c5e' : '1px solid #d1d5db',
                      background: artisForm.yontem === o.value ? '#eff6ff' : '#fff',
                      color: artisForm.yontem === o.value ? '#1a3c5e' : '#6b7280'
                    }}>{o.label}</button>
                ))}
              </div>
            </div>

            {/* Değer */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>
                {artisForm.yontem === 'yuzde' ? 'Artış Oranı (%)' : 'Artış Tutarı (₺)'}
              </label>
              <input type="number" step="0.01" min="0" required
                value={artisForm.deger}
                onChange={e => setArtisForm(f => ({ ...f, deger: e.target.value }))}
                placeholder={artisForm.yontem === 'yuzde' ? 'Örn: 10 (%10 artış)' : 'Örn: 50 (50₺ artış)'}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={artisOnizlemeHesapla}
                disabled={!artisForm.deger || (artisForm.kapsam === 'tur' && !artisForm.tur_id)}
                style={{ flex: 1, padding: '10px', background: '#f0f9ff', color: '#1a3c5e', border: '2px solid #1a3c5e', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>
                👁️ Önizle
              </button>
              <button type="submit" disabled={artisYukleniyor || artisOnizleme.length === 0}
                style={{ flex: 1, padding: '10px', background: artisOnizleme.length === 0 ? '#9ca3af' : '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '.85rem' }}>
                {artisYukleniyor ? 'Uygulanıyor...' : '✅ Uygula'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mevcut Türler + Önizleme */}
      <div>
        {/* Önizleme */}
        {artisOnizleme.length > 0 && (
          <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ fontWeight: '700', color: '#92400e', marginBottom: '12px' }}>
              👁️ Önizleme — Onaylamadan önce kontrol edin
            </div>
            {artisOnizleme.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #fde68a', fontSize: '.85rem' }}>
                <span style={{ fontWeight: '600' }}>{t.tur_adi}</span>
                <span>
                  <span style={{ color: '#6b7280', textDecoration: 'line-through', marginRight: '8px' }}>
                    {paraFormat(t.eskiTutar)}
                  </span>
                  <span style={{ color: '#16a34a', fontWeight: '700' }}>
                    {paraFormat(t.yeniTutar)}
                  </span>
                  <span style={{ color: '#d97706', fontSize: '.78rem', marginLeft: '6px' }}>
                    (+{paraFormat(t.fark)})
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Mevcut Türler */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: '#374151', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
            📋 Mevcut Aidat Türleri
          </div>
          {aidatTurleri.map((t, i) => (
            <div key={t.id} style={{ padding: '12px 20px', borderBottom: i < aidatTurleri.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: '#374151' }}>{t.tur_adi}</span>
              <span style={{ fontWeight: '800', color: '#1a3c5e', fontSize: '1rem' }}>
                {paraFormat(Number(t.varsayilan_tutar))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

{/* DAİRE EŞLEŞTİRME */}
{aktifSayfa === 'daireler' && (
  <div>
    <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>🏠 Daire Eşleştirme</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start' }}>

      {/* Form */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#1a3c5e', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
          🔄 Sakin — Daire Eşleştir
        </div>
        <div style={{ padding: '20px' }}>
          {eslestirmeMesaj && (
            <div style={{
              background: eslestirmeMesaj.tip === 'basari' ? '#dcfce7' : '#fee2e2',
              color: eslestirmeMesaj.tip === 'basari' ? '#166534' : '#991b1b',
              borderRadius: '8px', padding: '12px 16px',
              marginBottom: '16px', fontSize: '.85rem', fontWeight: '600'
            }}>
              {eslestirmeMesaj.metin}
            </div>
          )}
          <form onSubmit={daireEslestir}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>
                Sakin
              </label>
              <select value={eslestirmeForm.sakin_id}
                onChange={e => setEslestirmeForm(f => ({ ...f, sakin_id: e.target.value }))}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                <option value="">-- Sakin Seçin --</option>
                {sakinler.filter(s => s.durum === 'aktif').map(s => {
                  const mevcutDaire = daireler.find(d => d.kullanici_id === s.id)
                  return (
                    <option key={s.id} value={s.id}>
                      {s.ad_soyad}
                      {mevcutDaire ? ` (${mevcutDaire.bloklar?.blok_adi} Blok - ${mevcutDaire.daire_no})` : ' (Daireye Atanmamış)'}
                    </option>
                  )
                })}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '.82rem', color: '#374151', marginBottom: '6px' }}>
                Yeni Daire
              </label>
              <select value={eslestirmeForm.daire_id}
                onChange={e => setEslestirmeForm(f => ({ ...f, daire_id: e.target.value }))}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
                <option value="">-- Daire Seçin --</option>
                <optgroup label="Boş Daireler">
                  {daireler.filter(d => d.durum === 'bos').map(d => (
                    <option key={d.id} value={d.id}>
                      {d.bloklar?.blok_adi} Blok - Daire {d.daire_no}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Dolu Daireler">
                  {daireler.filter(d => d.durum === 'dolu').map(d => (
                    <option key={d.id} value={d.id}>
                      {d.bloklar?.blok_adi} Blok - Daire {d.daire_no} ({d.profiller?.ad_soyad})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button type="submit" disabled={eslestirmeYukleniyor}
              style={{ width: '100%', padding: '11px', background: eslestirmeYukleniyor ? '#9ca3af' : '#1a3c5e', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '.9rem', fontWeight: '700', cursor: 'pointer' }}>
              {eslestirmeYukleniyor ? 'Kaydediliyor...' : '🔄 Eşleştirmeyi Güncelle'}
            </button>
          </form>
        </div>
      </div>

      {/* Mevcut eşleştirmeler */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ background: '#374151', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
          📊 Mevcut Eşleştirmeler
        </div>
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {daireler.filter(d => d.durum === 'dolu').length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
              Henüz dolu daire yok.
            </div>
          ) : daireler.filter(d => d.durum === 'dolu').map((d, i) => (
            <div key={d.id} style={{
              padding: '12px 20px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: '700', color: '#1a3c5e', fontSize: '.9rem' }}>
                  {d.bloklar?.blok_adi} Blok - Daire {d.daire_no}
                </div>
                <div style={{ color: '#6b7280', fontSize: '.8rem' }}>
                  {d.profiller?.ad_soyad}
                </div>
              </div>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>
                Dolu
              </span>
            </div>
          ))}
        </div>

        {/* Boş daireler */}
        <div style={{ background: '#374151', color: '#fff', padding: '10px 20px', fontWeight: '700', fontSize: '.85rem' }}>
          Boş Daireler ({daireler.filter(d => d.durum === 'bos').length})
        </div>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {daireler.filter(d => d.durum === 'bos').map(d => (
            <div key={d.id} style={{ padding: '10px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '.85rem', color: '#374151' }}>
                {d.bloklar?.blok_adi} Blok - Daire {d.daire_no}
              </span>
              <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>
                Boş
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

{/* ÖDEMELER */}
{aktifSayfa === 'odemeler' && (
  <div>
    <h2 style={{ color: '#1a3c5e', marginBottom: '20px' }}>💰 Ödeme Listesi</h2>

    {/* Filtre */}
    <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontWeight: '700', fontSize: '.85rem', color: '#374151' }}>Yıl:</label>
        <select value={odemeFiltre.yil}
          onChange={e => setOdemeFiltre(f => ({ ...f, yil: parseInt(e.target.value) }))}
          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontWeight: '700', fontSize: '.85rem', color: '#374151' }}>Ay:</label>
        <select value={odemeFiltre.ay}
          onChange={e => setOdemeFiltre(f => ({ ...f, ay: parseInt(e.target.value) }))}
          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '.85rem' }}>
          <option value={0}>Tümü</option>
          {Array.from({length:12},(_,i) => i+1).map(m => (
            <option key={m} value={m}>{ayAdi(m)}</option>
          ))}
        </select>
      </div>
      <button onClick={odemeYenile}
        style={{ padding: '7px 16px', background: '#1a3c5e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '.85rem', fontWeight: '700' }}>
        🔄 Yenile
      </button>
    </div>

    {/* Liste */}
    {(() => {
      const filtreli = odemeler.filter(o => {
        const tarih = new Date(o.odeme_tarihi)
        const yilUygun = tarih.getFullYear() === odemeFiltre.yil
        const ayUygun = odemeFiltre.ay === 0 || tarih.getMonth() + 1 === odemeFiltre.ay
        return yilUygun && ayUygun
      })
      const toplam = filtreli.reduce((acc, o) => acc + Number(o.tutar), 0)
      const yontemler: any = { nakit: 'Nakit', havale: 'Havale', eft: 'EFT', kredi_karti: 'Kredi Kartı', diger: 'Diğer' }

      return (
        <>
          {/* Özet */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { etiket: 'Toplam Ödeme', deger: filtreli.length + ' adet', renk: '#1a3c5e' },
              { etiket: 'Toplam Tutar', deger: paraFormat(toplam), renk: '#16a34a' },
              { etiket: 'Ortalama', deger: filtreli.length > 0 ? paraFormat(toplam / filtreli.length) : '-', renk: '#2e7d9f' },
            ].map(k => (
              <div key={k.etiket} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ color: '#6b7280', fontSize: '.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '4px' }}>{k.etiket}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: k.renk }}>{k.deger}</div>
              </div>
            ))}
          </div>

          {/* Tablo */}
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ background: '#16a34a', color: '#fff', padding: '12px 20px', fontWeight: '700' }}>
              💰 Ödemeler ({filtreli.length})
            </div>
            {filtreli.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                Bu dönemde ödeme bulunamadı.
              </div>
            ) : filtreli.map((o, i) => (
              <div key={o.id} style={{ padding: '12px 20px', borderBottom: i < filtreli.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#374151', fontSize: '.9rem' }}>
                    {o.daire?.bloklar?.blok_adi} Blok - Daire {o.daire?.daire_no}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '.8rem' }}>
                    {o.tur?.tur_adi} — {ayAdi(o.tahakkuklar?.donem_ay)} {o.tahakkuklar?.donem_yil}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>
                    {new Date(o.odeme_tarihi).toLocaleDateString('tr-TR')} · {yontemler[o.odeme_yontemi] || o.odeme_yontemi}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800', color: '#16a34a', fontSize: '1rem' }}>
                    {paraFormat(Number(o.tutar))}
                  </div>
                  <span style={{ background: '#dcfce7', color: '#16a34a', padding: '1px 8px', borderRadius: '20px', fontSize: '.72rem', fontWeight: '700' }}>
                    ✓ Ödendi
                  </span>
                </div>
              </div>
            ))}
            {filtreli.length > 0 && (
              <div style={{ padding: '12px 20px', background: '#f0fdf4', display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#16a34a' }}>
                <span>Toplam</span>
                <span>{paraFormat(toplam)}</span>
              </div>
            )}
          </div>
        </>
      )
    })()}
  </div>
)}
        </div>
      </div>
    </div>
  )
}
