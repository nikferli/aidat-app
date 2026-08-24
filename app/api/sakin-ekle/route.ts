import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, sifre, ad_soyad, telefon } = await request.json()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Auth kullanıcısı oluştur
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: sifre,
    email_confirm: true
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Profil ekle
  const { error: profilError } = await supabaseAdmin
    .from('profiller')
    .insert({
      id: authData.user.id,
      ad_soyad,
      telefon,
      email,
      rol: 'sakin',
      durum: 'aktif'
    })

  if (profilError) {
    return NextResponse.json({ error: profilError.message }, { status: 400 })
  }

// Hoş geldin maili gönder — arka planda, await olmadan
const baseUrl = new URL(request.url).origin
fetch(`${baseUrl}/api/email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tip: 'yeni_sakin',
    alici: email,
    aliciAd: ad_soyad,
    veri: {
      sifre,
      site_url: baseUrl
    }
  })
}).catch(e => console.error('Hoş geldin maili gönderilemedi:', e))

// Hemen başarı döndür
return NextResponse.json({ success: true, userId: authData.user.id })