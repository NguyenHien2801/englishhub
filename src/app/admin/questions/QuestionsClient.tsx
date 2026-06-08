'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const NAVY  = '#0F1C35'
const NAVY2 = '#1E2F50'
const GOLD  = '#C9A84C'
const CERTS  = ['TOEIC','VSTEP','APTIS','LEVEL_TEST']
const SKILLS = ['NGU_PHAP','DOC','NGHE','VIET','TU_VUNG']
const LEVELS = ['A1','A2','B1','B2','C1','C2']

const CERT_BADGE: Record<string, { bg: string; color: string }> = {
  VSTEP: { bg: '#d1fae5', color: '#065f46' }, TOEIC: { bg: '#fef3c7', color: '#92400e' },
  APTIS: { bg: '#ede9fe', color: '#5b21b6' }, LEVEL_TEST: { bg: '#e0f2fe', color: '#075985' },
}
const SKILL_BADGE: Record<string, { bg: string; color: string }> = {
  NGU_PHAP: { bg: '#f3e8ff', color: '#6b21a8' }, DOC:     { bg: '#dbeafe', color: '#1d4ed8' },
  NGHE:     { bg: '#d1fae5', color: '#065f46' }, VIET:    { bg: '#fef3c7', color: '#92400e' },
  TU_VUNG:  { bg: '#fce7f3', color: '#9d174d' },
}
const emptyQ = { loai_chung_chi:'TOEIC', ky_nang:'NGU_PHAP', so_phan:5, loai_cau_hoi:'trac_nghiem', noi_dung_cau_hoi:'', cac_lua_chon:[{key:'A',value:''},{key:'B',value:''},{key:'C',value:''},{key:'D',value:''}], dap_an_dung:'A', giai_thich:'', cap_do:'B1' }

const inputCls: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E8E8E0', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif", color: NAVY, background: '#fff' }
const selectStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #E8E8E0', borderRadius: 12, fontSize: 14, outline: 'none', background: '#fff', color: NAVY, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }

export default function QuestionsClient({ questions: init }: { questions: Record<string,unknown>[] }) {
  const [questions, setQuestions] = useState(init)
  const [filterCert, setFilterCert] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyQ })
  const supabase = createClient()

  const filtered = questions.filter(q =>
    (!filterCert || q.loai_chung_chi === filterCert) &&
    (!filterSkill || q.ky_nang === filterSkill)
  )

  function updateOption(key: string, val: string) {
    setForm(prev => ({ ...prev, cac_lua_chon: (prev.cac_lua_chon as {key:string;value:string}[]).map(o => o.key === key ? { ...o, value: val } : o) }))
  }

  async function saveQuestion() {
    if (!form.noi_dung_cau_hoi.trim()) { toast.error('Nhập nội dung câu hỏi'); return }
    const { data, error } = await supabase.from('NganHangCauHoi').insert({
      loai_chung_chi: form.loai_chung_chi, ky_nang: form.ky_nang, so_phan: form.so_phan,
      loai_cau_hoi: form.loai_cau_hoi, noi_dung_cau_hoi: form.noi_dung_cau_hoi,
      cac_lua_chon: form.cac_lua_chon, dap_an_dung: form.dap_an_dung,
      giai_thich: form.giai_thich, cap_do: form.cap_do,
    }).select().single()
    if (error) { toast.error(error.message); return }
    setQuestions(prev => [data, ...prev]); setForm({ ...emptyQ }); setShowForm(false)
    toast.success('Đã thêm câu hỏi!')
  }

  async function deleteQ(id: string) {
    if (!confirm('Xóa câu hỏi này?')) return
    await supabase.from('NganHangCauHoi').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
    toast.success('Đã xóa')
  }

  return (
    <div className="max-w-6xl mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Ngân hàng câu hỏi</h1>
          <p style={{ color: '#6B6B60', fontSize: 14 }}>{filtered.length} / {questions.length} câu hỏi</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
          background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})`, color: '#fff',
          fontWeight: 700, fontSize: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 14px rgba(15,28,53,0.2)',
        }}>+ Thêm câu hỏi</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select value={filterCert} onChange={e => setFilterCert(e.target.value)} style={selectStyle}>
          <option value="">Tất cả chứng chỉ</option>
          {CERTS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSkill} onChange={e => setFilterSkill(e.target.value)} style={selectStyle}>
          <option value="">Tất cả kỹ năng</option>
          {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(q => {
          const cb = CERT_BADGE[q.loai_chung_chi as string]
          const sb = SKILL_BADGE[q.ky_nang as string]
          return (
            <div key={q.id as string} style={{ background: '#fff', border: '1px solid #E8E8E0', borderRadius: 14, padding: 16, transition: 'box-shadow 0.15s' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, fontWeight: 600, background: cb?.bg || '#F8F7F2', color: cb?.color || '#6B6B60' }}>{q.loai_chung_chi as string}</span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, fontWeight: 600, background: sb?.bg || '#F8F7F2', color: sb?.color || '#6B6B60' }}>{q.ky_nang as string}</span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: '#F8F7F2', color: '#6B6B60' }}>Part {q.so_phan as number}</span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: '#F8F7F2', color: '#6B6B60' }}>{q.cap_do as string}</span>
                  </div>
                  <div style={{ fontSize: 14, color: NAVY, fontWeight: 500, marginBottom: 8, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {q.noi_dung_cau_hoi as string}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {(q.cac_lua_chon as {key:string;value:string}[])?.slice(0,2).map(o => (
                      <span key={o.key} style={{ fontSize: 12, color: o.key === q.dap_an_dung ? '#10b981' : '#A0A090', fontWeight: o.key === q.dap_an_dung ? 700 : 400 }}>
                        {o.key === q.dap_an_dung ? '✓ ' : ''}{o.key}. {o.value.substring(0,30)}{o.value.length > 30 ? '…' : ''}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => deleteQ(q.id as string)} style={{ color: '#ef4444', fontSize: 12, padding: '4px 10px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff', cursor: 'pointer', flexShrink: 0 }}>Xóa</button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0A090', background: '#fff', borderRadius: 18, border: '1px solid #E8E8E0' }}>Chưa có câu hỏi nào</div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #E8E8E0' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: GOLD, fontSize: 18 }}>❓</span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: NAVY }}>Thêm câu hỏi mới</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Chứng chỉ', k: 'loai_chung_chi', opts: CERTS },
                  { label: 'Kỹ năng',   k: 'ky_nang',        opts: SKILLS },
                  { label: 'Cấp độ',    k: 'cap_do',         opts: LEVELS },
                ].map(({ label, k, opts }) => (
                  <div key={k}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
                    <select value={(form as Record<string,unknown>)[k] as string}
                      onChange={e => setForm(prev => ({ ...prev, [k]: e.target.value }))}
                      style={{ ...inputCls }}>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Nội dung câu hỏi *</label>
                <textarea value={form.noi_dung_cau_hoi} onChange={e => setForm(prev => ({ ...prev, noi_dung_cau_hoi: e.target.value }))}
                  rows={3} placeholder="The manager _____ all employees to submit their reports by Friday."
                  style={{ ...inputCls, resize: 'vertical', lineHeight: 1.6 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Các lựa chọn</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(form.cac_lua_chon as {key:string;value:string}[]).map(o => (
                    <div key={o.key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => setForm(prev => ({ ...prev, dap_an_dung: o.key }))}
                        style={{
                          width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0, cursor: 'pointer', border: 'none',
                          background: form.dap_an_dung === o.key ? NAVY : '#F8F7F2',
                          color: form.dap_an_dung === o.key ? GOLD : '#6B6B60',
                        }}>
                        {o.key}
                      </button>
                      <input type="text" value={o.value} onChange={e => updateOption(o.key, e.target.value)}
                        placeholder={`Lựa chọn ${o.key}...`} style={{ ...inputCls }} />
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: '#A0A090' }}>Click vào chữ cái để chọn đáp án đúng (hiện tại: <strong>{form.dap_an_dung}</strong>)</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B6B60', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Giải thích đáp án</label>
                <textarea value={form.giai_thich} onChange={e => setForm(prev => ({ ...prev, giai_thich: e.target.value }))}
                  rows={2} placeholder="Giải thích tại sao đáp án A đúng..."
                  style={{ ...inputCls, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px 0', border: '1px solid #E8E8E0', borderRadius: 12, color: NAVY, fontWeight: 600, fontSize: 14, cursor: 'pointer', background: '#fff', fontFamily: "'DM Sans', sans-serif" }}>Hủy</button>
              <button onClick={saveQuestion} style={{ flex: 1, padding: '12px 0', background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})`, color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Lưu câu hỏi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
