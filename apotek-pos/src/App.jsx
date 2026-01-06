import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useReactToPrint } from 'react-to-print';
import { 
  Search, ShoppingCart, Trash2, Printer, 
  Maximize, LayoutDashboard, Package, Plus, AlertTriangle 
} from 'lucide-react';

// --- KOMPONEN STRUK ---
const StrukBelanja = React.forwardRef(({ data, total }, ref) => (
  <div ref={ref} className="p-5 text-xs font-mono w-64 bg-white text-black">
    <div className="text-center mb-2">
      <h2 className="font-bold text-sm uppercase">Apotek Tandra Mantap</h2>
      <p className="text-[10px]">Melayani dengan Sepenuh Hati dan cinta </p>
      <div className="border-b border-dashed my-2"></div>
    </div>
    <p className="text-[10px] mb-2">{new Date().toLocaleString()}</p>
    {data.map((item, idx) => (
      <div key={idx} className="flex justify-between mb-1">
        <span className="flex-1">{item.nama_obat} x{item.qty}</span>
        <span>{(item.harga * item.qty).toLocaleString()}</span>
      </div>
    ))}
    <div className="border-t border-dashed mt-2 pt-2 text-sm font-bold flex justify-between">
      <span>TOTAL:</span>
      <span>Rp {total.toLocaleString()}</span>
    </div>
    <div className="text-center mt-4 text-[10px]">
      <p>Semoga Lekas Sembuh Ya! </p>
    </div>
  </div>
));

export default function App() {
  const [activeTab, setActiveTab] = useState('kasir');
  const [obat, setObat] = useState([]);
  const [keranjang, setKeranjang] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ barcode: '', nama_obat: '', harga: '', stok: '' });
  
  const componentRef = useRef();
  const handlePrint = useReactToPrint({ contentRef: componentRef });

  useEffect(() => { fetchObat(); }, []);

  const fetchObat = async () => {
    const { data } = await supabase.from('obat').select('*').order('nama_obat');
    setObat(data || []);
  };

  const tambahKeKeranjang = (p) => {
    setKeranjang(prev => {
      const ada = prev.find(i => i.id === p.id);
      if (ada) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const prosesBayar = async () => {
    if (!window.confirm("Proses transaksi dan cetak?")) return;
    try {
      await supabase.from('transaksi').insert([{ total_bayar: totalHarga, item_list: keranjang }]);
      for (const item of keranjang) {
        await supabase.from('obat').update({ stok: item.stok - item.qty }).eq('id', item.id);
      }
      handlePrint();
      setKeranjang([]);
      fetchObat();
    } catch (e) { alert("Error: " + e.message); }
  };

  useEffect(() => {
    if (activeTab === 'kasir') {
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 200 });
      scanner.render((txt) => {
        const found = obat.find(o => o.barcode === txt);
        if (found) tambahKeKeranjang(found);
      }, () => {});
      return () => scanner.clear();
    }
  }, [activeTab, obat]);

  const totalHarga = keranjang.reduce((s, i) => s + (i.harga * i.qty), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER NAV */}
      <nav className="bg-emerald-700 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex gap-8 items-center">
          <h1 className="text-xl font-bold tracking-tight">TANDRA<span className="font-light text-blue-600">KASIR</span></h1>
          <div className="flex bg-emerald-800 rounded-lg p-1 gap-1">
            <button onClick={() => setActiveTab('kasir')} className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-2 ${activeTab === 'kasir' ? 'bg-blue-600' : 'hover:bg-emerald-700'}`}>
              <LayoutDashboard size={16}/> Kasir
            </button>
            <button onClick={() => setActiveTab('stok')} className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-2 ${activeTab === 'stok' ? 'bg-blue-600' : 'hover:bg-emerald-700'}`}>
              <Package size={16}/> Inventaris
            </button>
          </div>
        </div>
        <button onClick={() => document.documentElement.requestFullscreen()} className="p-2 hover:bg-blue-600 rounded-full transition"><Maximize size={20}/></button>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 overflow-hidden">
        {activeTab === 'kasir' ? (
          <div className="flex h-full gap-6">
            <div className="flex-1 bg-white rounded-3xl border shadow-sm p-6 flex flex-col">
              <div id="reader" className="w-full h-52 bg-slate-100 rounded-2xl mb-6 overflow-hidden border-2 border-dashed border-emerald-200"></div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-4 text-slate-400" size={20}/>
                <input className="w-full pl-12 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Cari obat atau scan barcode..." onChange={e => setKeyword(e.target.value)}/>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {obat.filter(o => o.nama_obat.toLowerCase().includes(keyword.toLowerCase())).map(o => (
                  <div key={o.id} onClick={() => tambahKeKeranjang(o)} className="flex justify-between items-center p-4 bg-white border rounded-2xl hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all">
                    <div>
                      <p className="font-bold text-slate-800">{o.nama_obat}</p>
                      <p className="text-xs text-slate-400">Barcode: {o.barcode} | Stok: {o.stok}</p>
                    </div>
                    <p className="font-bold text-emerald-600 text-lg">Rp {o.harga.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-[400px] bg-white rounded-3xl shadow-2xl border flex flex-col border-emerald-100">
              <div className="p-6 bg-emerald-50 rounded-t-3xl">
                <h2 className="font-bold text-emerald-900 flex items-center gap-2 text-lg"><ShoppingCart/> Pesanan Baru</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {keranjang.map(item => (
                  <div key={item.id} className="flex justify-between items-center animate-in fade-in slide-in-from-right-4">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700">{item.nama_obat}</p>
                      <p className="text-xs text-emerald-600 font-medium">{item.qty} x Rp {item.harga.toLocaleString()}</p>
                    </div>
                    <button onClick={() => setKeranjang(keranjang.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50 rounded-b-3xl">
                <div className="flex justify-between text-2xl font-black text-slate-800 mb-6">
                  <span>TOTAL</span>
                  <span className="text-emerald-700 font-mono">Rp {totalHarga.toLocaleString()}</span>
                </div>
                <button onClick={prosesBayar} disabled={keranjang.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 transition-all active:scale-95">
                  <Printer size={22}/> BAYAR SEKARANG
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MANAJEMEN STOK */
          <div className="bg-white rounded-3xl border shadow-sm p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Inventaris Obat</h2>
              <button onClick={() => {setForm({id:null, barcode:'', nama_obat:'', harga:'', stok:''}); setIsModalOpen(true)}} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"><Plus size={20}/> Tambah Produk</button>
            </div>
            <div className="flex-1 overflow-auto rounded-xl border">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="p-5">Barcode</th>
                    <th className="p-5">Nama Obat</th>
                    <th className="p-5 text-right">Harga</th>
                    <th className="p-5 text-center">Stok</th>
                    <th className="p-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {obat.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="p-5 font-mono text-sm">{o.barcode}</td>
                      <td className="p-5 font-bold text-slate-700">{o.nama_obat}</td>
                      <td className="p-5 text-right font-mono text-emerald-600 font-bold">Rp {o.harga.toLocaleString()}</td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${o.stok <= 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {o.stok} unit
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <button onClick={() => {setForm(o); setIsModalOpen(true)}} className="text-emerald-500 font-bold hover:underline">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL INPUT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-5" onSubmit={async (e) => {
            e.preventDefault();
            await supabase.from('obat').upsert([form]);
            setIsModalOpen(false);
            fetchObat();
          }}>
            <h2 className="text-xl font-bold text-slate-800 border-b pb-4">Data Obat</h2>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase">Barcode</label>
              <input className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 border-none" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} required />
              
              <label className="block text-xs font-bold text-slate-400 uppercase">Nama Obat</label>
              <input className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 border-none" value={form.nama_obat} onChange={e => setForm({...form, nama_obat: e.target.value})} required />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Harga</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 border-none" value={form.harga} onChange={e => setForm({...form, harga: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stok</label>
                  <input type="number" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 border-none" value={form.stok} onChange={e => setForm({...form, stok: e.target.value})} required />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Batal</button>
              <button className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100">SIMPAN DATA</button>
            </div>
          </form>
        </div>
      )}

      {/* ELEMEN STRUK HIDDEN */}
      <div className="hidden">
        <StrukBelanja ref={componentRef} data={keranjang} total={totalHarga} />
      </div>
    </div>
  );
}