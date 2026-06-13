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
  Search,
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

  // Edit State
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCatalog = catalog.filter(item => 
    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const toggleCatalogActive = async (id: string) => {
    const item = catalog.find(c => c.id === id);
    if (!item) return;

    const newStatus = !item.aktif;

    // Optimistic UI update
    setCatalog(prev =>
      prev.map(c => (c.id === id ? { ...c, aktif: newStatus } : c))
    );

    try {
      const response = await fetch('/api/catalog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aktif: newStatus })
      });
      
      if (!response.ok) throw new Error("Gagal update");
      
      setToastType("success");
      setToastMessage(`Status SKU ${id} berhasil diupdate!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      // Revert if failed
      setCatalog(prev =>
        prev.map(c => (c.id === id ? { ...c, aktif: !newStatus } : c))
      );
      setToastType("error");
      setToastMessage("Gagal menyinkronkan status dengan server.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm(`Yakin ingin menghapus secara permanen SKU: ${id}? Ini tidak dapat dibatalkan.`)) return;

    try {
      const response = await fetch(`/api/catalog?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Gagal menghapus produk");

      setCatalog(prev => prev.filter(c => c.id !== id));
      
      setToastType("success");
      setToastMessage(`SKU ${id} berhasil dihapus permanen!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastType("error");
      setToastMessage("Gagal menghapus data dari server.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/catalog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingItem, isFullEdit: true })
      });
      
      if (!response.ok) throw new Error("Gagal update produk");

      setCatalog(prev => prev.map(c => c.id === editingItem.id ? editingItem : c));
      setEditingItem(null);
      
      setToastType("success");
      setToastMessage(`SKU ${editingItem.id} berhasil diperbarui!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastType("error");
      setToastMessage("Gagal memperbarui data di server.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatRp = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
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
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-300" />
          )}
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      </div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
            <div className="h-6 w-px bg-secondary/80"></div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-primary" />
              <h1 className="text-2xl font-serif font-bold">Catalog Manager</h1>
            </div>
          </div>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
            <Package className="w-4 h-4" />
            {catalog.length} SKU Terdaftar
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar bg-muted p-1 rounded-xl w-full sm:w-max mb-6 sm:mb-8">
          <button
            onClick={() => setActiveTab("database")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "database" ? "bg-card text-card-foreground text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Package className="w-4 h-4" />
            Database Katalog
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "scanner" ? "bg-card text-card-foreground text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ScanLine className="w-4 h-4" />
            AI Scanner
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "manual" ? "bg-card text-card-foreground text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Edit className="w-4 h-4" />
            Input Manual
          </button>
        </div>

        {/* ========== DATABASE TAB ========== */}
        {activeTab === "database" && (
          <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden w-full">
            <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-bold flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  Master Katalog Produk
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Seluruh SKU yang tersinkronisasi dengan dropdown order picker.
                </p>
              </div>
              
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari SKU atau Nama Produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all bg-background"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">SKU ID</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap min-w-[150px]">Nama Produk</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Kategori</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-right whitespace-nowrap">Harga Default</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-center whitespace-nowrap">Satuan</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-center whitespace-nowrap">Status</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-center whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 sm:px-6 py-8 text-center text-muted-foreground text-sm">
                        Produk tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-background transition-colors group"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-mono text-muted-foreground whitespace-nowrap">{item.id}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-bold text-foreground min-w-[150px]">{item.nama}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-foreground text-right whitespace-nowrap">
                        {formatRp(item.harga)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-foreground text-center whitespace-nowrap">
                        {item.satuan}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleCatalogActive(item.id)}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${item.aktif ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-muted text-muted-foreground hover:bg-secondary/80"}`}
                        >
                          {item.aktif ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Produk"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== AI SCANNER TAB ========== */}
        {activeTab === "scanner" && (
          <div className="space-y-6 sm:space-y-8 w-full">
            {/* Upload Zone */}
            <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-4 sm:p-8">
              <h2 className="text-lg font-serif font-bold flex items-center gap-2 mb-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Auto-Scanner (Catalog Screening)
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Unggah file katalog (PDF/Gambar) dan biarkan AI mendeteksi menu, harga, dan kategori secara otomatis.
              </p>

              <div
                onDragOver={(e) => { e.preventDefault(); if (!isScanning) setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { if (!isScanning) handleDrop(e); else { e.preventDefault(); } }}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center transition-all ${isScanning ? 'cursor-wait border-[#D4A847] bg-primary/5' : 'cursor-pointer'} ${!isScanning && dragOver ? "border-[#D4A847] bg-primary/5 scale-[1.01]" : ""} ${!isScanning && !dragOver ? "border-border hover:border-primary/50 hover:bg-secondary" : ""}`}
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
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <div>
                      <p className="font-bold text-foreground">Memindai &ldquo;{fileName}&rdquo;...</p>
                      <p className="text-sm text-muted-foreground mt-1">{scanStatus}</p>
                    </div>
                    <div className="w-64 bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl">
                      <Upload className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Drag & drop file katalog di sini</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        atau <span className="text-primary font-semibold">klik untuk browse</span> — mendukung PDF, PNG, JPG
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scan Results */}
            {scanComplete && scannedItems.length > 0 && (
              <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                      <ScanLine className="w-5 h-5 text-primary" />
                      Hasil Pemindaian AI
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {scannedItems.length} item terdeteksi dari &ldquo;{fileName}&rdquo;. Verifikasi dan centang item yang ingin disimpan.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const allConfirmed = scannedItems.every(i => i.confirmed);
                        setScannedItems(prev => prev.map(item => ({ ...item, confirmed: !allConfirmed })));
                      }}
                      className="bg-muted hover:bg-secondary/80 text-foreground px-4 py-2.5 rounded-lg font-semibold text-xs transition-all"
                    >
                      {scannedItems.every(i => i.confirmed) ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                    <button
                      onClick={saveScannedItems}
                      className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
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
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-6 py-4 transition-all ${item.confirmed ? "bg-green-50/50" : "hover:bg-secondary"}`}
                    >
                      <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                        <button
                          onClick={() => toggleConfirm(item.id)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${item.confirmed ? "bg-green-500 border-green-500 text-white" : "border-border hover:border-primary"}`}
                        >
                          {item.confirmed && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <span className="sm:hidden font-bold text-sm text-foreground">Konfirmasi Item</span>
                        <button
                          onClick={() => removeScannedItem(item.id)}
                          className="sm:hidden text-gray-300 hover:text-red-500 transition-colors p-2"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
                        <input
                          value={item.nama}
                          onChange={(e) => updateScannedItem(item.id, "nama", e.target.value)}
                          className="w-full p-2.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none font-semibold"
                          placeholder="Nama Produk"
                        />
                        <input
                          value={item.kategori}
                          onChange={(e) => updateScannedItem(item.id, "kategori", e.target.value)}
                          className="w-full p-2.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          placeholder="Kategori"
                        />
                        <div className="relative w-full">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                          <input
                            type="number"
                            value={item.harga}
                            onChange={(e) => updateScannedItem(item.id, "harga", Number(e.target.value))}
                            className="w-full p-2.5 pl-8 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Harga"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => removeScannedItem(item.id)}
                        className="hidden sm:block text-gray-300 hover:text-red-500 transition-colors p-2 flex-shrink-0"
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
          <div className="max-w-2xl w-full">
            <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-4 sm:p-8">
              <h2 className="text-lg font-serif font-bold flex items-center gap-2 mb-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                Input Manual Produk Baru
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Tambahkan produk satu per satu ke dalam Master Katalog.
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Nama Produk</label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Contoh: Chocolate Chip Cookie"
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Kategori</label>
                    <select
                      required
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-card text-card-foreground cursor-pointer"
                    >
                      <option value="">Pilih kategori...</option>
                      <option value="Croissant">Croissant</option>
                      <option value="Artisan Bread">Artisan Bread</option>
                      <option value="Cake">Cake</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Satuan</label>
                    <select
                      required
                      value={manualSatuan}
                      onChange={(e) => setManualSatuan(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-card text-card-foreground cursor-pointer"
                    >
                      <option value="pcs">pcs</option>
                      <option value="loyang">loyang</option>
                      <option value="jar">jar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Harga Default</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                      <input
                        type="number"
                        required
                        min="0"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        placeholder="0"
                        className="w-full p-3 pl-8 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  <Plus className="w-5 h-5" />
                  Tambah ke Katalog
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* --- EDIT MODAL --- */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingItem(null)}></div>
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-serif font-bold text-lg">Edit SKU: {editingItem.id}</h3>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Nama Produk</label>
                <input
                  type="text" required
                  value={editingItem.nama}
                  onChange={e => setEditingItem({ ...editingItem, nama: e.target.value })}
                  className="w-full p-2.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Kategori</label>
                  <select
                    required
                    value={editingItem.kategori}
                    onChange={e => setEditingItem({ ...editingItem, kategori: e.target.value })}
                    className="w-full p-2.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-card"
                  >
                    <option value="Croissant">Croissant</option>
                    <option value="Artisan Bread">Artisan Bread</option>
                    <option value="Cake">Cake</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Satuan</label>
                  <select
                    required
                    value={editingItem.satuan}
                    onChange={e => setEditingItem({ ...editingItem, satuan: e.target.value })}
                    className="w-full p-2.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-card"
                  >
                    <option value="pcs">pcs</option>
                    <option value="loyang">loyang</option>
                    <option value="jar">jar</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Harga Default</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                  <input
                    type="number" required min="0"
                    value={editingItem.harga}
                    onChange={e => setEditingItem({ ...editingItem, harga: Number(e.target.value) })}
                    className="w-full p-2.5 pl-8 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-2.5 rounded-lg font-bold text-sm bg-muted text-foreground hover:bg-secondary transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-lg font-bold text-sm bg-primary text-white hover:bg-primary/90 flex items-center gap-2 transition-colors disabled:opacity-70"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
