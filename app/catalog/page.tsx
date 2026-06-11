"use client";
import React, { useState, useEffect } from "react";
import {
  ChefHat,
  Upload,
  FileText,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Edit,
  Package,
} from "lucide-react";
import Link from "next/link";

// --- MOCK: Existing catalog data ---
// Data sekarang di-fetch dari API (Google Sheets)

interface ScannedItem {
  id: number;
  nama: string;
  kategori: string;
  harga: number;
  satuan: string;
  confirmed: boolean;
}

interface CatalogItem {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  satuan: string;
  aktif: boolean;
}

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<"scanner" | "manual" | "database">("database");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCatalog(data.data);
        }
      })
      .catch(err => console.error("Failed to fetch catalog:", err));
  }, []);

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

  // Manual entry state
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualSatuan, setManualSatuan] = useState("pcs");

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // --- REAL AI SCANNING via Gemini API ---
  const handleFileUpload = async (file: File) => {
    setIsScanning(true);
    setScanComplete(false);
    setScannedItems([]);
    setScanStatus("Mengunggah file...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setScanStatus("AI sedang menganalisis katalog...");

      const response = await fetch("/api/scan-catalog", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Gagal memproses file.");
      }

      setScanStatus(`${result.data.length} produk terdeteksi!`);
      setScannedItems(result.data);
      setScanComplete(true);

      setToastType("success");
      setToastMessage(result.message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (err: any) {
      console.error("Scan error:", err);
      setToastType("error");
      setToastMessage(err.message || "Gagal memindai file. Coba lagi.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      handleFileUpload(file);
    }
  };

  const toggleConfirm = (id: number) => {
    setScannedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, confirmed: !item.confirmed } : item))
    );
  };

  const updateScannedItem = (id: number, field: string, value: string | number) => {
    setScannedItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeScannedItem = (id: number) => {
    setScannedItems(prev => prev.filter(item => item.id !== id));
  };

  const saveScannedItems = async () => {
    const confirmedItems = scannedItems.filter(item => item.confirmed);
    if (confirmedItems.length === 0) {
      setToastType("error");
      setToastMessage("Pilih setidaknya satu item untuk disimpan.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const newCatalogItems: CatalogItem[] = confirmedItems.map((item, idx) => ({
      id: `SKU${String(catalog.length + idx + 1).padStart(3, "0")}`,
      nama: item.nama,
      kategori: item.kategori,
      harga: item.harga,
      satuan: item.satuan || "pcs",
      aktif: true,
    }));

    try {
      const response = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCatalogItems)
      });
      
      if (!response.ok) throw new Error("Failed to save");

      setCatalog(prev => [...prev, ...newCatalogItems]);
      setScannedItems([]);
      setScanComplete(false);
      setFileName("");

      setToastType("success");
      setToastMessage(`${confirmedItems.length} produk baru berhasil disimpan ke Google Sheets!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastType("error");
      setToastMessage("Gagal menyimpan ke server.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // --- Manual Entry ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualCategory.trim() || !manualPrice) return;

    const newItem: CatalogItem = {
      id: `SKU${String(catalog.length + 1).padStart(3, "0")}`,
      nama: manualName.trim(),
      kategori: manualCategory.trim(),
      harga: Number(manualPrice),
      satuan: manualSatuan.trim(),
      aktif: true,
    };

    try {
      const response = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      
      if (!response.ok) throw new Error("Failed to save");

      setCatalog(prev => [...prev, newItem]);
      setManualName("");
      setManualCategory("");
      setManualPrice("");
      setManualSatuan("pcs");

      setToastType("success");
      setToastMessage(`"${newItem.nama}" berhasil ditambahkan ke Google Sheets!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastType("error");
      setToastMessage("Gagal menyimpan ke server.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const toggleCatalogActive = (id: string) => {
    setCatalog(prev =>
      prev.map(item => (item.id === id ? { ...item, aktif: !item.aktif } : item))
    );
  };

  const formatRp = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C1810] font-sans">
      {/* Custom Scrollbar */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #D4A847; }
      `}</style>

      {/* --- TOAST NOTIFICATION --- */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${showToast ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <div
          className={`${toastType === "success" ? "bg-[#2C1810]" : "bg-red-700"} text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3`}
        >
          {toastType === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-[#D4A847]" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-300" />
          )}
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      </div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e5e0d8] shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#D4A847] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-[#D4A847]" />
              <h1 className="text-2xl font-serif font-bold">Catalog Manager</h1>
            </div>
          </div>
          <div className="bg-[#D4A847]/10 text-[#D4A847] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
            <Package className="w-4 h-4" />
            {catalog.length} SKU Terdaftar
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-max mb-8">
          <button
            onClick={() => setActiveTab("database")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "database" ? "bg-white text-[#2C1810] shadow-sm" : "text-gray-500 hover:text-[#2C1810]"}`}
          >
            <Package className="w-4 h-4" />
            Database Katalog
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "scanner" ? "bg-white text-[#2C1810] shadow-sm" : "text-gray-500 hover:text-[#2C1810]"}`}
          >
            <ScanLine className="w-4 h-4" />
            AI Scanner
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "manual" ? "bg-white text-[#2C1810] shadow-sm" : "text-gray-500 hover:text-[#2C1810]"}`}
          >
            <Edit className="w-4 h-4" />
            Input Manual
          </button>
        </div>

        {/* ========== DATABASE TAB ========== */}
        {activeTab === "database" && (
          <div className="bg-white rounded-2xl border border-[#e5e0d8] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-serif font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#D4A847] rounded-full"></span>
                Master Katalog Produk
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Seluruh SKU yang tersinkronisasi dengan dropdown order picker.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="px-6 py-4 font-semibold">SKU ID</th>
                    <th className="px-6 py-4 font-semibold">Nama Produk</th>
                    <th className="px-6 py-4 font-semibold">Kategori</th>
                    <th className="px-6 py-4 font-semibold text-right">Harga Default</th>
                    <th className="px-6 py-4 font-semibold text-center">Satuan</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-[#FAF8F5] transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-gray-400">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#2C1810]">{item.nama}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold bg-[#D4A847]/10 text-[#D4A847] px-2.5 py-1 rounded-full">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#2C1810] text-right">
                        {formatRp(item.harga)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#2C1810] text-center">
                        {item.satuan}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleCatalogActive(item.id)}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${item.aktif ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                        >
                          {item.aktif ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== AI SCANNER TAB ========== */}
        {activeTab === "scanner" && (
          <div className="space-y-8">
            {/* Upload Zone */}
            <div className="bg-white rounded-2xl border border-[#e5e0d8] shadow-sm p-8">
              <h2 className="text-lg font-serif font-bold flex items-center gap-2 mb-2">
                <span className="w-1.5 h-6 bg-[#D4A847] rounded-full"></span>
                Auto-Scanner (Catalog Screening)
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Unggah file katalog (PDF/Gambar) dan biarkan AI mendeteksi menu, harga, dan kategori secara otomatis.
              </p>

              <div
                onDragOver={(e) => { e.preventDefault(); if (!isScanning) setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { if (!isScanning) handleDrop(e); else { e.preventDefault(); } }}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${isScanning ? 'cursor-wait border-[#D4A847] bg-[#D4A847]/5' : 'cursor-pointer'} ${!isScanning && dragOver ? "border-[#D4A847] bg-[#D4A847]/5 scale-[1.01]" : ""} ${!isScanning && !dragOver ? "border-gray-200 hover:border-[#D4A847]/50 hover:bg-gray-50" : ""}`}
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileSelect}
                  disabled={isScanning}
                  className={`absolute inset-0 w-full h-full opacity-0 ${isScanning ? 'cursor-wait pointer-events-none' : 'cursor-pointer'}`}
                />
                {isScanning ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-[#D4A847] animate-spin" />
                    <div>
                      <p className="font-bold text-[#2C1810]">Memindai &ldquo;{fileName}&rdquo;...</p>
                      <p className="text-sm text-gray-400 mt-1">{scanStatus}</p>
                    </div>
                    <div className="w-64 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#D4A847] h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-[#D4A847]/10 rounded-2xl">
                      <Upload className="w-10 h-10 text-[#D4A847]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#2C1810]">Drag & drop file katalog di sini</p>
                      <p className="text-sm text-gray-400 mt-1">
                        atau <span className="text-[#D4A847] font-semibold">klik untuk browse</span> — mendukung PDF, PNG, JPG
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scan Results */}
            {scanComplete && scannedItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#e5e0d8] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                      <ScanLine className="w-5 h-5 text-[#D4A847]" />
                      Hasil Pemindaian AI
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {scannedItems.length} item terdeteksi dari &ldquo;{fileName}&rdquo;. Verifikasi dan centang item yang ingin disimpan.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const allConfirmed = scannedItems.every(i => i.confirmed);
                        setScannedItems(prev => prev.map(item => ({ ...item, confirmed: !allConfirmed })));
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-[#2C1810] px-4 py-2.5 rounded-lg font-semibold text-xs transition-all"
                    >
                      {scannedItems.every(i => i.confirmed) ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                    <button
                      onClick={saveScannedItems}
                      className="bg-[#D4A847] hover:bg-[#b58e37] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#D4A847]/20"
                    >
                      <Save className="w-4 h-4" />
                      Simpan ({scannedItems.filter(i => i.confirmed).length})
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {scannedItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 px-6 py-4 transition-all ${item.confirmed ? "bg-green-50/50" : "hover:bg-gray-50"}`}
                    >
                      <button
                        onClick={() => toggleConfirm(item.id)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${item.confirmed ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-[#D4A847]"}`}
                      >
                        {item.confirmed && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <input
                          value={item.nama}
                          onChange={(e) => updateScannedItem(item.id, "nama", e.target.value)}
                          className="p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none font-semibold"
                        />
                        <input
                          value={item.kategori}
                          onChange={(e) => updateScannedItem(item.id, "kategori", e.target.value)}
                          className="p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                          <input
                            type="number"
                            value={item.harga}
                            onChange={(e) => updateScannedItem(item.id, "harga", Number(e.target.value))}
                            className="w-full p-2.5 pl-8 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => removeScannedItem(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== MANUAL ENTRY TAB ========== */}
        {activeTab === "manual" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border border-[#e5e0d8] shadow-sm p-8">
              <h2 className="text-lg font-serif font-bold flex items-center gap-2 mb-2">
                <span className="w-1.5 h-6 bg-[#D4A847] rounded-full"></span>
                Input Manual Produk Baru
              </h2>
              <p className="text-sm text-gray-500 mb-8">
                Tambahkan produk satu per satu ke dalam Master Katalog.
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#2C1810] mb-2">Nama Produk</label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Contoh: Chocolate Chip Cookie"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#2C1810] mb-2">Kategori</label>
                    <select
                      required
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none appearance-none bg-white cursor-pointer"
                    >
                      <option value="">Pilih kategori...</option>
                      <option value="Viennoiserie">Viennoiserie</option>
                      <option value="Bread">Bread</option>
                      <option value="Bagel">Bagel</option>
                      <option value="Pastry">Pastry</option>
                      <option value="Cake & Cookies">Cake & Cookies</option>
                      <option value="Sweets">Sweets</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#2C1810] mb-2">Satuan</label>
                    <select
                      required
                      value={manualSatuan}
                      onChange={(e) => setManualSatuan(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none appearance-none bg-white cursor-pointer"
                    >
                      <option value="pcs">pcs</option>
                      <option value="loyang">loyang</option>
                      <option value="jar">jar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#2C1810] mb-2">Harga Default</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                      <input
                        type="number"
                        required
                        min="0"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        placeholder="0"
                        className="w-full p-3 pl-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#D4A847] hover:bg-[#b58e37] text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#D4A847]/20"
                >
                  <Plus className="w-5 h-5" />
                  Tambah ke Katalog
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
