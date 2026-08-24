export async function POST(request: Request) {
  try {
    const { email, sifre, ad_soyad, telefon } = await request.json()
    
    console.log('Sakin ekle başladı:', email)
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'VAR' : 'YOK')
    console.log('KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'VAR' : 'YOK')

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password: sifre, email_confirm: true
    })

    console.log('Auth sonuç:', authError ? authError.message : 'OK')

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: profilError } = await supabaseAdmin
      .from('profiller')
      .insert({ id: authData.user.id, ad_soyad, telefon, email, rol: 'sakin', durum: 'aktif' })

    console.log('Profil sonuç:', profilError ? profilError.message : 'OK')

    if (profilError) {
      return NextResponse.json({ error: profilError.message }, { status: 400 })
    }

    const baseUrl = new URL(request.url).origin
    fetch(`${baseUrl}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tip: 'yeni_sakin', alici: email, aliciAd: ad_soyad, veri: { sifre, site_url: baseUrl } })
    }).catch(e => console.error('Mail hatası:', e))

    return NextResponse.json({ success: true, userId: authData.user.id })

  } catch (err: any) {
    console.error('Genel hata:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}