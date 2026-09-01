import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  const { kullanici_id, title, body, url, herkese } = await request.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Subscription'ları getir
  let query = supabase.from('push_subscriptions').select('*')
  if (!herkese && kullanici_id) {
    query = query.eq('kullanici_id', kullanici_id)
  }

  const { data: subscriptions, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, gonderilen: 0, mesaj: 'Kayıtlı subscription yok.' })
  }

  const payload = JSON.stringify({ title, body, url: url || '/sakin', tag: 'aidat-bildirim' })

  let basarili = 0, basarisiz = 0
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub.subscription, payload)
      basarili++
    } catch (err: any) {
      basarisiz++
      // Geçersiz subscription'ı sil
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }

  return NextResponse.json({ success: true, gonderilen: basarili, basarisiz })
}
