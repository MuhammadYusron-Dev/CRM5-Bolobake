import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Info, Clock, Utensils, Tag, Edit3, Settings2, Save, Loader2 } from 'lucide-react';
import Image from 'next/image';

export interface VisualProduct {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  gambar: string;
  spesifikasi: string;
  masaSimpan: string;
  saranPenyajian: string;
}

export function VisualCatalog() {
  const [productsData, setProductsData] = useState<VisualProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View states
  const [selectedProduct, setSelectedProduct] = useState<VisualProduct | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Edit states
  const [editingProduct, setEditingProduct] = useState<VisualProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/visual-catalog');
        const result = await res.json();
        if (result.success) {
          setProductsData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch visual catalog:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, VisualProduct[]> = {};
    productsData.forEach(product => {
      if (!groups[product.kategori]) {
        groups[product.kategori] = [];
      }
      groups[product.kategori].push(product);
    });
    return groups;
  }, [productsData]);

  const formatRp = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    try {
      // Optimistic update
      const newProductsData = productsData.map(p => p.id === editingProduct.id ? editingProduct : p);
      
      const res = await fetch('/api/visual-catalog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductsData)
      });
      
      if (!res.ok) throw new Error("Failed to save changes");
      
      setProductsData(newProductsData);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof VisualProduct, value: string | number) => {
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, [field]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat Katalog Visual...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pb-20 relative">
      
      {/* Edit Mode Toggle - Sticky Header */}
      <div className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm py-3 px-6 flex justify-between items-center">
        <div className="text-sm font-bold text-slate-800 tracking-wider uppercase flex items-center gap-2">
          BOLOBÄKE <span className="text-slate-400 font-normal hidden sm:inline">| Visual Catalog</span>
        </div>
        <button 
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-all duration-300 ${isEditMode ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Settings2 className="w-4 h-4" />
          {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-col space-y-16 mt-8">
          {Object.entries(groupedProducts).map(([category, products], index) => (
            <div key={category} className="flex flex-col md:flex-row border-b border-slate-200 pb-16 last:border-0 relative">
              
              {/* Left Column: Category Label */}
              <div className="md:w-32 flex-shrink-0 flex md:flex-col items-center md:items-start mb-8 md:mb-0 relative">
                <div className="flex items-center md:items-start w-full gap-4 md:gap-0">
                  <span className="text-6xl md:text-8xl font-black text-slate-900 leading-none">
                    {index + 1}
                  </span>
                  
                  {/* Desktop Vertical Text */}
                  <div className="hidden md:flex flex-col items-center absolute left-16 top-0 bottom-0 h-full">
                     <div className="w-px bg-slate-300 h-full absolute left-4"></div>
                     <span 
                       className="uppercase tracking-[0.2em] font-bold text-slate-800 text-lg md:text-xl absolute top-10 left-10 origin-top-left -rotate-90 whitespace-nowrap"
                     >
                       {category}
                     </span>
                  </div>

                  {/* Mobile Horizontal Text */}
                  <div className="md:hidden flex items-center border-l-2 border-slate-300 pl-4 h-12">
                     <span className="uppercase tracking-[0.2em] font-bold text-slate-800 text-xl">
                       {category}
                     </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Product Grid */}
              <div className="flex-1 md:pl-20">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      className="group relative flex flex-col items-center text-center"
                    >
                      {/* Image Container */}
                      <div 
                        className="w-full aspect-square mb-4 overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 relative group-hover:shadow-md transition-all duration-300 cursor-pointer"
                        onClick={() => !isEditMode ? setSelectedProduct(product) : setEditingProduct(product)}
                      >
                        <img 
                          src={product.gambar} 
                          alt={product.nama} 
                          className={`w-full h-full object-cover transition-transform duration-700 ${!isEditMode ? 'group-hover:scale-110' : 'group-hover:brightness-50'}`}
                        />
                        
                        {/* Overlay: View Details */}
                        {!isEditMode && (
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                             <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold text-slate-800 shadow-sm translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                               Lihat Detail
                             </div>
                          </div>
                        )}

                        {/* Overlay: Edit Mode */}
                        {isEditMode && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                             <div className="bg-primary text-white p-3 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200">
                               <Edit3 className="w-6 h-6" />
                             </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Name */}
                      <div className="px-2 w-full">
                        <h3 className={`font-serif italic text-lg mb-1 leading-tight transition-colors ${isEditMode ? 'text-primary' : 'text-slate-800 group-hover:text-primary'}`}>
                          {product.nama}
                        </h3>
                        {isEditMode && (
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Klik untuk Edit
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Product Detail Modal (View Mode) */}
      <Dialog open={!!selectedProduct && !isEditMode} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-2xl rounded-3xl">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row">
              {/* Image Section */}
              <div className="md:w-2/5 relative h-64 md:h-auto bg-slate-100">
                <img 
                  src={selectedProduct.gambar} 
                  alt={selectedProduct.nama} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/20" />
              </div>
              
              {/* Content Section */}
              <div className="md:w-3/5 p-6 md:p-8 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                      {selectedProduct.kategori}
                    </div>
                    <DialogTitle className="text-2xl md:text-3xl font-serif italic text-slate-900 mb-1">
                      {selectedProduct.nama}
                    </DialogTitle>
                    <p className="text-xl font-bold text-slate-800">
                      {formatRp(selectedProduct.harga)}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <DialogDescription className="text-slate-600 text-sm leading-relaxed mb-6 mt-2">
                  {selectedProduct.spesifikasi}
                </DialogDescription>

                <div className="mt-auto space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Clock className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Masa Simpan</p>
                      <p className="text-sm text-slate-700 mt-0.5 font-medium">{selectedProduct.masaSimpan}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                    <Utensils className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Saran Penyajian</p>
                      <p className="text-sm text-amber-900 mt-0.5 font-medium">{selectedProduct.saranPenyajian}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Form Modal */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-xl bg-white border-slate-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Edit Visual Product
            </DialogTitle>
            <button 
              onClick={() => setEditingProduct(null)}
              className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {editingProduct && (
            <form onSubmit={handleSaveEdit} className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nama" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Produk</Label>
                  <Input 
                    id="nama" 
                    value={editingProduct.nama} 
                    onChange={(e) => handleInputChange('nama', e.target.value)} 
                    className="border-slate-200 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kategori" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Kategori</Label>
                  <Input 
                    id="kategori" 
                    value={editingProduct.kategori} 
                    onChange={(e) => handleInputChange('kategori', e.target.value)} 
                    className="border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="harga" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Harga (Rp)</Label>
                  <Input 
                    id="harga" 
                    type="number"
                    value={editingProduct.harga} 
                    onChange={(e) => handleInputChange('harga', Number(e.target.value))} 
                    className="border-slate-200 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gambar" className="text-xs font-bold text-slate-600 uppercase tracking-wider">URL Gambar</Label>
                  <Input 
                    id="gambar" 
                    value={editingProduct.gambar} 
                    onChange={(e) => handleInputChange('gambar', e.target.value)} 
                    className="border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>

              {/* Image Preview Block */}
              {editingProduct.gambar && (
                <div className="w-full h-32 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200">
                   <img src={editingProduct.gambar} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                   <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                     <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full font-medium">Image Preview</span>
                   </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="spesifikasi" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Spesifikasi Produk</Label>
                <Textarea 
                  id="spesifikasi" 
                  value={editingProduct.spesifikasi} 
                  onChange={(e) => handleInputChange('spesifikasi', e.target.value)} 
                  className="border-slate-200 bg-white resize-none h-24"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="masaSimpan" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Masa Simpan</Label>
                <Input 
                  id="masaSimpan" 
                  value={editingProduct.masaSimpan} 
                  onChange={(e) => handleInputChange('masaSimpan', e.target.value)} 
                  className="border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="saranPenyajian" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Saran Penyajian</Label>
                <Textarea 
                  id="saranPenyajian" 
                  value={editingProduct.saranPenyajian} 
                  onChange={(e) => handleInputChange('saranPenyajian', e.target.value)} 
                  className="border-slate-200 bg-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 mt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground min-w-[120px] font-bold">
                  {isSaving ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Simpan Perubahan</span>
                  )}
                </Button>
              </div>

            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
