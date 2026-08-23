import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { tip, alici, aliciAd, veri } = await request.json()

  let konu = ''
  let html  = ''

  const template = (baslik: string, icerik: string) => `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="UTF-8"><style>
      body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
      .wrap { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
      .header { background: linear-gradient(135deg, #1a3c5e, #2e7d9f); color: #fff; padding: 28px 32px; }
      .header h1 { margin: 0; font-size: 1.2rem; }
      .header p { margin: 4px 0 0; opacity: .8; font-size: .85rem; }
      .body { padding: 28px 32px; color: #374151; line-height: 1.7; }
      .card { background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px 20px; margin: 16px 0; }
      .card-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: .9rem; }
      .card-row .label { color: #6b7280; }
      .card-row .value { font-weight: 700; color: #1a3c5e; }
      .btn { display: inline-block; background: #1a3c5e; color: #fff !important; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; margin: 16px 0; }
      .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: .78rem; color: #9ca3af; border-top: 1px solid #e5e7eb; }
      .badge-success { background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 20px; font-size: .8rem; font-weight: 700; }
      .badge-danger  { background: #fee2e2; color: #991b1b; padding: 3px 10px; border-radius: 20px; font-size: .8rem; font-weight: 700; }
      .badge-warning { background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 20px; font-size: .8rem; font-weight: 700; }
    </style></head>
    <body>
      <div class="wrap">
        <div class="header">
          <h1>🏢 Aidat Yönetim Sistemi</h1>
          <p>${baslik}</p>
        </div>
        <div class="body">
          ${icerik}
        </div>
        <div class="footer">
          Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.<br>
          © ${new Date().getFullYear()} Aidat Yönetim Sistemi
        </div>
      </div>
    </body>
    </html>
  `

  switch (tip) {

    case 'odeme_onaylandi':
      konu = `✅ Ödemeniz Onaylandı — ${veri.tur_adi} ${veri.donem}`
      html = template('Ödeme Onay Bildirimi', `
        <p>Sayın <strong>${aliciAd}</strong>,</p>
        <p>Ödeme bildiriminiz yönetici tarafından onaylandı.</p>
        <div class="card">
          <div class="card-row"><span class="label">Aidat Türü</span><span class="value">${veri.tur_adi}</span></div>
          <div class="card-row"><span class="label">Dönem</span><span class="value">${veri.donem}</span></div>
          <div class="card-row"><span class="label">Tutar</span><span class="value">${veri.tutar} ₺</span></div>
          <div class="card-row"><span class="label">Ödeme Tarihi</span><span class="value">${veri.tarih}</span></div>
          <div class="card-row"><span class="label">Durum</span><span class="badge-success">✓ Onaylandı</span></div>
        </div>
        <p>Teşekkür ederiz. İyi günler dileriz.</p>
      `)
      break

    case 'odeme_reddedildi':
      konu = `❌ Ödeme Bildirimi Reddedildi — ${veri.tur_adi} ${veri.donem}`
      html = template('Ödeme Red Bildirimi', `
        <p>Sayın <strong>${aliciAd}</strong>,</p>
        <p>Maalesef ödeme bildiriminiz reddedildi.</p>
        <div class="card">
          <div class="card-row"><span class="label">Aidat Türü</span><span class="value">${veri.tur_adi}</span></div>
          <div class="card-row"><span class="label">Dönem</span><span class="value">${veri.donem}</span></div>
          <div class="card-row"><span class="label">Tutar</span><span class="value">${veri.tutar} ₺</span></div>
          <div class="card-row"><span class="label">Durum</span><span class="badge-danger">✗ Reddedildi</span></div>
        </div>
        ${veri.red_neden ? `<p><strong>Red Nedeni:</strong> ${veri.red_neden}</p>` : ''}
        <p>Lütfen yöneticinizle iletişime geçin veya tekrar bildirim gönderin.</p>
      `)
      break

    case 'ariza_guncelleme':
      konu = `🔧 Arıza Talebiniz Güncellendi — ${veri.baslik}`
      html = template('Arıza Talep Güncellemesi', `
        <p>Sayın <strong>${aliciAd}</strong>,</p>
        <p>Arıza talebinizin durumu güncellendi.</p>
        <div class="card">
          <div class="card-row"><span class="label">Kategori</span><span class="value">${veri.kategori}</span></div>
          <div class="card-row"><span class="label">Başlık</span><span class="value">${veri.baslik}</span></div>
          <div class="card-row"><span class="label">Durum</span><span class="badge-${veri.durum === 'tamamlandi' ? 'success' : 'warning'}">${veri.durum === 'tamamlandi' ? '✅ Tamamlandı' : '⚙️ İşlemde'}</span></div>
        </div>
        ${veri.yonetici_notu ? `<p><strong>Yönetici Notu:</strong> ${veri.yonetici_notu}</p>` : ''}
      `)
      break

    case 'gecikme_hatirlatma':
      konu = `⚠️ Aidat Gecikme Hatırlatması — ${veri.donem}`
      html = template('Gecikme Hatırlatması', `
        <p>Sayın <strong>${aliciAd}</strong>,</p>
        <p>Aşağıdaki aidat ödemeleriniz gecikmiştir. Lütfen en kısa sürede ödemenizi gerçekleştirin.</p>
        <div class="card">
          ${veri.tahakkuklar.map((t: any) => `
            <div class="card-row">
              <span class="label">${t.tur_adi} — ${t.donem}</span>
              <span class="value">${t.tutar} ₺ <span class="badge-danger">Gecikti</span></span>
            </div>
          `).join('')}
          <div class="card-row" style="border-top:1px solid #bfdbfe;margin-top:8px;padding-top:8px">
            <span class="label"><strong>Toplam</strong></span>
            <span class="value">${veri.toplam} ₺</span>
          </div>
        </div>
        <p>Ödeme için yöneticinizle iletişime geçin veya sisteme giriş yaparak "Ödeme Bildir" bölümünü kullanın.</p>
      `)
      break

    case 'duyuru':
      konu = `📢 Yeni Duyuru — ${veri.baslik}`
      html = template('Site Duyurusu', `
        <p>Sayın <strong>${aliciAd}</strong>,</p>
        <p>Sitenizle ilgili yeni bir duyuru yayınlandı.</p>
        <div class="card">
          <h3 style="margin:0 0 8px;color:#1a3c5e">${veri.baslik}</h3>
          <p style="margin:0;color:#374151">${veri.icerik}</p>
        </div>
      `)
      break

    case 'yeni_sakin':
      konu = `🏢 Aidat Sistemi — Hesabınız Oluşturuldu`
      html = template('Hoş Geldiniz!', `
        <p>Sayın <strong>${aliciAd}</strong>,</p>
        <p>Site aidat yönetim sistemine kaydınız oluşturuldu. Aşağıdaki bilgilerle giriş yapabilirsiniz.</p>
        <div class="card">
          <div class="card-row"><span class="label">E-posta</span><span class="value">${alici}</span></div>
          <div class="card-row"><span class="label">Şifre</span><span class="value">${veri.sifre}</span></div>
        </div>
        <a href="${veri.site_url}/giris" class="btn">🚀 Sisteme Giriş Yap</a>
        <p style="color:#9ca3af;font-size:.82rem">Güvenliğiniz için ilk girişte şifrenizi değiştirmenizi öneririz.</p>
      `)
      break

    default:
      return NextResponse.json({ error: 'Geçersiz bildirim tipi' }, { status: 400 })
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Aidat Sistemi <onboarding@resend.dev>',
      to: alici,
      subject: konu,
      html,
    })

    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ success: true, id: data?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}