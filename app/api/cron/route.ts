import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const bugun = new Date()
  const gun   = bugun.getDate()
  const ay    = bugun.getMonth() + 1
  const yil   = bugun.getFullYear()
  const aylar = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  const baseUrl = new URL(request.url).origin
  let mailSayisi = 0
  let tahakkukSayisi = 0

  // ─── 1. Gecikmiş tahakkukları güncelle ───────────────────────────────────
  await supabase.rpc('gecikme_guncelle')

  // ─── 2. Her ayın 1'i: Otomatik aylık aidat tahakkuku oluştur ─────────────
  if (gun === 1) {
    // Aylık Aidat türünü bul
    const { data: aidatTur } = await supabase
      .from('aidat_turleri')
      .select('id, varsayilan_tutar')
      .eq('tur_adi', 'Aylık Aidat')
      .eq('durum', 'aktif')
      .single()

    if (aidatTur) {
      // Dolu daireleri getir
      const { data: dolunDaireler } = await supabase
        .from('daireler')
        .select('id')
        .eq('durum', 'dolu')

      // Son ödeme tarihi — ayın son günü
      const sonGun = new Date(yil, ay, 0).getDate()
      const sonOdemeTarihi = `${yil}-${String(ay).padStart(2, '0')}-${sonGun}`

      for (const daire of dolunDaireler || []) {
        // Bu ay için zaten tahakkuk var mı kontrol et
        const { data: mevcutTh } = await supabase
          .from('tahakkuklar')
          .select('id')
          .eq('daire_id', daire.id)
          .eq('tur_id', aidatTur.id)
          .eq('donem_yil', yil)
          .eq('donem_ay', ay)
          .single()

        if (!mevcutTh) {
          const { error } = await supabase.from('tahakkuklar').insert({
            daire_id: daire.id,
            tur_id: aidatTur.id,
            donem_yil: yil,
            donem_ay: ay,
            tutar: aidatTur.varsayilan_tutar,
            son_odeme_tarihi: sonOdemeTarihi,
            durum: 'bekliyor'
          })
          if (!error) tahakkukSayisi++
        }
      }
    }
  }

  // ─── 3. Gecikmiş tahakkuku olan sakinlere mail gönder ────────────────────
  const { data: daireler } = await supabase
    .from('daireler')
    .select('kullanici_id, profiller(ad_soyad, email), tahakkuklar(id, tutar, durum, donem_yil, donem_ay, aidat_turleri(tur_adi))')
    .eq('durum', 'dolu')
    .not('kullanici_id', 'is', null)

  for (const daire of daireler || []) {
    const profil = daire.profiller as any
    if (!profil?.email) continue

    const gecikmisTahakkuklar = (daire.tahakkuklar as any[])?.filter(t => t.durum === 'gecikti') || []
    if (gecikmisTahakkuklar.length === 0) continue

    const toplam = gecikmisTahakkuklar.reduce((acc: number, t: any) => acc + Number(t.tutar), 0)

    await fetch(`${baseUrl}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tip: 'gecikme_hatirlatma',
        alici: profil.email,
        aliciAd: profil.ad_soyad,
        veri: {
          tahakkuklar: gecikmisTahakkuklar.map((t: any) => ({
            tur_adi: t.aidat_turleri?.tur_adi,
            donem: `${aylar[t.donem_ay]} ${t.donem_yil}`,
            tutar: Number(t.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })
          })),
          toplam: toplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })
        }
      })
    })
    mailSayisi++
  }

  return NextResponse.json({
    success: true,
    tarih: bugun.toISOString(),
    otomatik_tahakkuk: tahakkukSayisi,
    gecikme_maili: mailSayisi,
    mesaj: gun === 1
      ? `Ayın 1'i: ${tahakkukSayisi} tahakkuk oluşturuldu, ${mailSayisi} gecikme maili gönderildi.`
      : `${mailSayisi} gecikme maili gönderildi.`
  })
}
