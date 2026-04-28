'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const LOAI_OPTIONS = ['VSTEP', 'TOEIC', 'APTIS', 'CHU_DE', 'TU_TAO']
const CAP_DO_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'MIXED']
const LOAI_TU_OPTIONS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom']

export default function VocabAdminClient({ sets }: { sets: Record<string, unknown>[] }) {
  const [list, setList] = useState(sets)
  const [selectedSet, setSelectedSet] = useState<Record<string, unknown> | null>(null)
  const [words, setWords] = useState<Record<string, unknown>[]>([])
  const [showNewSet, setShowNewSet] = useState(false)
  const [showAddWord, setShowAddWord] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [loadingWords, setLoadingWords] = useState(false)
  const [newSet, setNewSet] = useState({ ten_bo: '', mo_ta: '', loai_bo: 'TOEIC', cap_do: 'B1', chu_de: '' })
  const [newWord, setNewWord] = useState({ tu_tieng_anh: '', loai_tu: 'noun', cap_do: 'B1' })
  const supabase = createClient()

  async function loadWords(set: Record<string, unknown>) {
    setSelectedSet(set)
    setLoadingWords(true)
    const { data } = await supabase.from('TuVung').select('*, TuVungCache(nghia_tieng_viet, phat_am_ipa)')
      .eq('bo_du_vung_id', set.id).order('thu_tu_hien_thi')
    setWords(data || [])
    setLoadingWords(false)
  }

  async function createSet() {
    if (!newSet.ten_bo.trim()) { toast.error('Nhập tên bộ từ'); return }
    const { data, error } = await supabase.from('BoDuVung').insert({ ...newSet, tong_so_tu: 0, la_cong_khai: true }).select().single()
    if (error) { toast.error(error.message); return }
    setList(prev => [...prev, data])
    setShowNewSet(false)
    setNewSet({ ten_bo: '', mo_ta: '', loai_bo: 'TOEIC', cap_do: 'B1', chu_de: '' })
    toast.success('Đã tạo bộ từ mới!')
  }

  async function deleteSet(id: string) {
    if (!confirm('Xóa bộ từ này? Tất cả từ trong bộ cũng sẽ bị xóa!')) return
    const { error } = await supabase.from('BoDuVung').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setList(prev => prev.filter(s => s.id !== id))
    if (selectedSet?.id === id) setSelectedSet(null)
    toast.success('Đã xóa bộ từ')
  }

  async function addWord() {
    if (!newWord.tu_tieng_anh.trim() || !selectedSet) return
    const { data, error } = await supabase.from('TuVung').insert({
      ...newWord, tu_tieng_anh: newWord.tu_tieng_anh.toLowerCase().trim(),
      bo_du_vung_id: selectedSet.id, thu_tu_hien_thi: words.length + 1,
    }).select().single()
    if (error) { toast.error(error.message); return }
    setWords(prev => [...prev, data])
    await supabase.from('BoDuVung').update({ tong_so_tu: words.length + 1 }).eq('id', selectedSet.id)
    setList(prev => prev.map(s => s.id === selectedSet.id ? { ...s, tong_so_tu: (s.tong_so_tu as number) + 1 } : s))
    setNewWord({ tu_tieng_anh: '', loai_tu: 'noun', cap_do: 'B1' })
    setShowAddWord(false)
    fetch(`/api/vocabulary?word=${data.tu_tieng_anh}`) // pre-cache
    toast.success(`Đã thêm "${data.tu_tieng_anh}"`)
  }

  async function importCSV() {
    if (!selectedSet || !csvText.trim()) return
    const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean)
    let count = 0
    for (const line of lines) {
      const [word, loaiTu, capDo] = line.split(',').map(s => s.trim())
      if (!word) continue
      const { error } = await supabase.from('TuVung').upsert({
        tu_tieng_anh: word.toLowerCase(), bo_du_vung_id: selectedSet.id,
        loai_tu: loaiTu || 'noun', cap_do: capDo || 'B1', thu_tu_hien_thi: words.length + count + 1,
      })
      if (!error) count++
    }
    await supabase.from('BoDuVung').update({ tong_so_tu: words.length + count }).eq('id', selectedSet.id)
    await loadWords(selectedSet)
    setCsvText('')
    toast.success(`Đã import ${count} từ!`)
  }

  async function deleteWord(id: string) {
    await supabase.from('TuVung').delete().eq('id', id)
    setWords(prev => prev.filter(w => w.id !== id))
    toast.success('Đã xóa từ')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0D0D0D]">Quản lý bộ từ vựng</h1>
          <p className="text-[#6B6B60] mt-1">{list.length} bộ từ · AI tự động sinh nội dung khi cần</p>
        </div>
        <button onClick={() => setShowNewSet(true)}
          className="px-5 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">
          + Tạo bộ từ mới
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Set list */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[#A0A090] uppercase tracking-wide mb-2">Danh sách bộ từ</div>
          {list.map(set => (
            <div key={set.id as string}
              onClick={() => loadWords(set)}
              className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${selectedSet?.id === set.id ? 'border-[#00A878]' : 'border-[#E8E8E0]'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-[#0D0D0D]">{set.ten_bo as string}</span>
                <button onClick={e => { e.stopPropagation(); deleteSet(set.id as string) }}
                  className="text-[#FF6B6B] text-xs hover:bg-[#FFF0F0] px-2 py-0.5 rounded-lg transition-colors">✕</button>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 bg-[#E8FFF8] text-[#00A878] rounded-full">{set.loai_bo as string}</span>
                <span className="px-2 py-0.5 bg-[#F8F7F2] text-[#6B6B60] rounded-full">{set.cap_do as string}</span>
                <span className="text-[#A0A090]">{set.tong_so_tu as number} từ</span>
              </div>
            </div>
          ))}
        </div>

        {/* Word list */}
        <div className="lg:col-span-2">
          {selectedSet ? (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#0D0D0D]">{selectedSet.ten_bo as string} — {words.length} từ</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddWord(true)}
                    className="px-3 py-1.5 bg-[#00A878] text-white text-xs font-medium rounded-lg hover:bg-[#007A58] transition-colors">
                    + Thêm từ
                  </button>
                </div>
              </div>

              {/* CSV Import */}
              <div className="mb-4 p-4 bg-[#F8F7F2] rounded-xl">
                <div className="text-xs font-semibold text-[#6B6B60] mb-2">Import hàng loạt (CSV): word, loai_tu, cap_do</div>
                <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
                  placeholder={"meticulous, adjective, C1\npersistent, adjective, B2\nrevenue, noun, B2"}
                  rows={3} className="w-full text-xs font-mono p-3 border border-[#E8E8E0] rounded-lg focus:outline-none focus:border-[#00A878] resize-none" />
                <button onClick={importCSV} disabled={!csvText.trim()}
                  className="mt-2 px-4 py-1.5 bg-[#0D0D0D] text-white text-xs rounded-lg hover:bg-[#2C2C28] transition-colors disabled:opacity-40">
                  Import CSV
                </button>
              </div>

              {loadingWords ? (
                <div className="text-center py-8 text-[#A0A090]">Đang tải...</div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-1">
                  {words.map((w, i) => (
                    <div key={w.id as string} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F8F7F2] transition-colors group">
                      <span className="text-xs text-[#A0A090] w-5">{i + 1}</span>
                      <div className="flex-1">
                        <span className="font-medium text-[#0D0D0D] text-sm">{w.tu_tieng_anh as string}</span>
                        {(w.TuVungCache as Record<string,string>)?.nghia_tieng_viet && (
                          <span className="text-xs text-[#6B6B60] ml-2">— {(w.TuVungCache as Record<string,string>).nghia_tieng_viet}</span>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-[#F0F0FF] text-[#7C7CFF] rounded-full">{w.loai_tu as string}</span>
                      <span className="text-xs text-[#A0A090]">{w.cap_do as string}</span>
                      <button onClick={() => deleteWord(w.id as string)}
                        className="opacity-0 group-hover:opacity-100 text-[#FF6B6B] text-xs hover:bg-[#FFF0F0] px-2 py-0.5 rounded transition-all">✕</button>
                    </div>
                  ))}
                  {words.length === 0 && <div className="text-center py-8 text-[#A0A090]">Chưa có từ nào. Thêm từ hoặc import CSV!</div>}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E8E0] p-12 text-center text-[#A0A090]">
              <div className="text-4xl mb-3">📚</div>
              <div>Chọn bộ từ bên trái để quản lý</div>
            </div>
          )}
        </div>
      </div>

      {/* New Set Modal */}
      {showNewSet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewSet(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-[#0D0D0D] mb-4">Tạo bộ từ mới</h3>
            <div className="space-y-3">
              {[
                { label: 'Tên bộ từ *', key: 'ten_bo', type: 'text', placeholder: 'TOEIC Essential 600' },
                { label: 'Mô tả', key: 'mo_ta', type: 'text', placeholder: 'Từ vựng thiết yếu cho TOEIC...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-[#0D0D0D] mb-1">{f.label}</label>
                  <input type="text" value={(newSet as Record<string,string>)[f.key]}
                    onChange={e => setNewSet(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] transition-colors" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0D0D0D] mb-1">Loại</label>
                  <select value={newSet.loai_bo} onChange={e => setNewSet(prev => ({ ...prev, loai_bo: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
                    {LOAI_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0D0D0D] mb-1">Cấp độ</label>
                  <select value={newSet.cap_do} onChange={e => setNewSet(prev => ({ ...prev, cap_do: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
                    {CAP_DO_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNewSet(false)} className="flex-1 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-[#0D0D0D] font-medium hover:border-[#0D0D0D] transition-colors">Hủy</button>
              <button onClick={createSet} className="flex-1 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors">Tạo bộ từ</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Word Modal */}
      {showAddWord && selectedSet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddWord(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-[#0D0D0D] mb-4">Thêm từ vào "{selectedSet.ten_bo as string}"</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0D0D0D] mb-1">Từ tiếng Anh *</label>
                <input type="text" value={newWord.tu_tieng_anh}
                  onChange={e => setNewWord(prev => ({ ...prev, tu_tieng_anh: e.target.value }))}
                  placeholder="meticulous" className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm font-mono focus:outline-none focus:border-[#00A878] transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#0D0D0D] mb-1">Loại từ</label>
                  <select value={newWord.loai_tu} onChange={e => setNewWord(prev => ({ ...prev, loai_tu: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
                    {LOAI_TU_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0D0D0D] mb-1">Cấp độ</label>
                  <select value={newWord.cap_do} onChange={e => setNewWord(prev => ({ ...prev, cap_do: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-sm focus:outline-none focus:border-[#00A878] bg-white">
                    {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-[#A0A090]">AI Gemini sẽ tự động sinh nghĩa, ví dụ và cách nhớ khi sinh viên học từ này.</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddWord(false)} className="flex-1 py-2.5 border-2 border-[#E8E8E0] rounded-xl text-[#0D0D0D] font-medium hover:border-[#0D0D0D] transition-colors">Hủy</button>
              <button onClick={addWord} disabled={!newWord.tu_tieng_anh.trim()} className="flex-1 py-2.5 bg-[#00A878] text-white font-semibold rounded-xl hover:bg-[#007A58] transition-colors disabled:opacity-50">Thêm từ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
