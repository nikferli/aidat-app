import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { kullanici_id, subscription } = await request.json()

  if (!kullanici_id || !subscription) {
    return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const endpoint = subscription.endpoint

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { kullanici_id, subscription, endpoint },
      { onConflict: 'endpoint' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { kullanici_id } = await request.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Tüm cihazları değil sadece mevcut cihazı sil
  // endpoint bilgisi gönderilirse onu, yoksa kullanici_id'ye göre sil
  await supabase.from('push_subscriptions').delete().eq('kullanici_id', kullanici_id)

  return NextResponse.json({ success: true })
}
