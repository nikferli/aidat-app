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

  // Gecikmiş tahakkukları güncelle
  await supabase.rpc('gecikme_guncelle')

  // Gecikmiş tahakkuku olan sakinlere mail gönder
  const { data: gecikmisSakinler } = await supabase
    .from('daireler')
    .select(`
      kullanici_id,
      profiller(ad_soyad, email),
      tahakkuklar(id, tutar, durum, donem_yil, donem_ay, aidat_turleri(tur_adi))
    `)
    .eq('durum', 'dolu')
    .not('kullanici_id', 'is', null)

  const aylar = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                 'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

  let mailSayisi = 0

  for (const daire of gecikmisSakinler || []) {
    const profil = daire.profiller as any
    if (!profil?.email) continue

    const gecikmisTahakkuklar = (daire.tahakkuklar as any[])
      ?.filter(t => t.durum === 'gecikti') || []

    if (gecikmisTahakkuklar.length === 0) continue

    const toplam = gecikmisTahakkuklar.reduce((acc: number, t: any) => acc + Number(t.tutar), 0)

    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tip: 'gecikme_hatirlatma',
        alici: profil.email,
        aliciAd: profil.ad_soyad,
        veri: {
          donem: `${new Date().getFullYear()}`,
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
    tarih: new Date().toISOString(),
    gonderilen: mailSayisi
  })
}