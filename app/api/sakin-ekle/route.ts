import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, sifre, ad_soyad, telefon } = await request.json()

  // Admin client — service role key ile
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
	  email,        // ← bunu ekleyin
      rol: 'sakin',
      durum: 'aktif'
    })

  if (profilError) {
    return NextResponse.json({ error: profilError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, userId: authData.user.id })
}