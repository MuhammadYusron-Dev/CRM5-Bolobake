import React, { useState, useMemo } from 'react';
import { visualCatalogData, VisualProduct } from '@/lib/visual-catalog-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Info, Clock, Utensils, Tag } from 'lucide-react';
import Image from 'next/image';

export function VisualCatalog() {
  const [selectedProduct, setSelectedProduct] = useState<VisualProduct | null>(null);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, VisualProduct[]> = {};
    visualCatalogData.forEach(product => {
      if (!groups[product.kategori]) {
        groups[product.kategori] = [];
      }
      groups[product.kategori].push(product);
    });
    return groups;
  }, []);

  const formatRp = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        
        {/* Header Section (Optional, to give context) */}
        <div className="mb-12 text-center md:text-right border-b border-slate-200 pb-6">
          <h2 className="text-xl md:text-2xl font-bold tracking-widest text-slate-800 uppercase">
            Bolobake Catalog <span className="font-normal text-slate-500">- Reference</span>
          </h2>
        </div>

        <div className="flex flex-col space-y-16">
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
                      className="group cursor-pointer flex flex-col items-center text-center"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {/* Image Container */}
                      <div className="w-full aspect-square mb-4 overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 relative group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                        <img 
                          src={product.gambar} 
                          alt={product.nama} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Overlay for hover */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                           <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold text-slate-800 shadow-sm translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                             Lihat Detail
                           </div>
                        </div>
                      </div>
                      
                      {/* Product Name & Price */}
                      <div className="px-2">
                        <h3 className="font-serif italic text-lg text-slate-800 mb-1 leading-tight group-hover:text-primary transition-colors">
                          {product.nama}
                        </h3>
                        {/* <p className="text-sm font-semibold text-slate-500">
                          {formatRp(product.harga)}
                        </p> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
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
    </div>
  );
}
