import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Dùng Web Crypto API có sẵn — không cần cài thêm package
async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const data    = encoder.encode(plain.trim())
  const digest  = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return hashHex === storedHash
}

export async function POST(request: Request) {
  try {
    const { matKhauTruong } = await request.json()

    if (!matKhauTruong || typeof matKhauTruong !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Thiếu mật khẩu trường.' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Lấy user hiện tại từ session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Phiên đăng nhập không hợp lệ.' },
        { status: 401 }
      )
    }

    // Lấy tất cả mã còn hiệu lực
    const { data: danhSachMa, error: fetchError } = await supabase
      .from('MaXacThucTruong')
      .select('id, ma_hash, so_luot_dung, gioi_han_dung')
      .eq('con_hieu_luc', true)

    if (fetchError || !danhSachMa?.length) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy mã xác thực. Liên hệ nhà trường.' },
        { status: 500 }
      )
    }

    // So sánh với từng hash
    let maHopLe = null
    for (const ma of danhSachMa) {
      if (ma.gioi_han_dung !== null && ma.so_luot_dung >= ma.gioi_han_dung) continue
      const match = await verifyPassword(matKhauTruong, ma.ma_hash)
      if (match) { maHopLe = ma; break }
    }

    if (!maHopLe) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu trường không đúng. Vui lòng kiểm tra lại.' },
        { status: 403 }
      )
    }

    // Cập nhật flag xác thực
    const { error: updateError } = await supabase
      .from('NguoiDung')
      .update({
        da_xac_thuc_truong: true,
        ngay_xac_thuc:      new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, message: 'Lỗi cập nhật tài khoản: ' + updateError.message },
        { status: 500 }
      )
    }

    // Tăng đếm số lượt dùng
    await supabase
      .from('MaXacThucTruong')
      .update({ so_luot_dung: maHopLe.so_luot_dung + 1 })
      .eq('id', maHopLe.id)

    return NextResponse.json({
      success: true,
      message: '✅ Tài khoản đã được xác thực bởi nhà trường!',
    })

  } catch (err) {
    console.error('[verify-school] Lỗi:', err)
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ nội bộ.' },
      { status: 500 }
    )
  }
}