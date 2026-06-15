"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings, Save, Plus, Trash2, Wheat, Beaker, Clock, Info } from 'lucide-react';

export type RecipeIngredient = {
  name: string;
  amount: number;
  unit: string;
};

export type Recipe = {
  sku: string;
  baseDough: string;
  doughWeight: number; // weight per pcs in grams
  bakeTime?: number;
  ovenCapacity?: number;
  ingredients: RecipeIngredient[];
};

export function BomCalculator({ 
  scheduleData, 
  progress 
}: { 
  scheduleData: { dateKey: string; items: [string, { qty: number; notes: string[] }][] }[];
  progress: Record<string, number>;
}) {
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({});
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [tempRecipe, setTempRecipe] = useState<Recipe | null>(null);
  
  // Extract all unique SKUs from schedule data
  const allSkus = useMemo(() => {
    const skus = new Set<string>();
    scheduleData.forEach(day => {
      day.items.forEach(([sku]) => skus.add(sku));
    });
    return Array.from(skus).sort();
  }, [scheduleData]);

  useEffect(() => {
    const saved = localStorage.getItem('bolobake_production_recipes');
    if (saved) {
      try {
        setRecipes(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveRecipes = (newRecipes: Record<string, Recipe>) => {
    setRecipes(newRecipes);
    localStorage.setItem('bolobake_production_recipes', JSON.stringify(newRecipes));
  };

  const handleEditRecipe = (sku: string) => {
    setEditingSku(sku);
    setTempRecipe(recipes[sku] || {
      sku,
      baseDough: '',
      doughWeight: 0,
      bakeTime: 15,
      ovenCapacity: 20,
      ingredients: []
    });
  };

  const handleSaveRecipe = () => {
    if (tempRecipe && editingSku) {
      saveRecipes({ ...recipes, [editingSku]: tempRecipe });
      setEditingSku(null);
      setTempRecipe(null);
    }
  };

  // Calculations for Bom
  const bomData = useMemo(() => {
    return scheduleData.map(({ dateKey, items }) => {
      const doughTotals: Record<string, number> = {}; // Dough name -> total weight (g)
      const ingredientTotals: Record<string, { amount: number; unit: string }> = {}; // Ingredient name -> {amount, unit}
      let totalBakeTime = 0;
      
      let missingRecipes = false;

      items.forEach(([sku, data]) => {
        const key = `${dateKey}|${sku}`;
        const doneQty = progress[key] || 0;
        const remainingQty = Math.max(0, data.qty - doneQty);

        if (remainingQty === 0) return; // Only calculate for what needs to be made

        const recipe = recipes[sku];
        if (!recipe || !recipe.baseDough) {
          missingRecipes = true;
          return;
        }

        // Add to Dough Totals
        const totalDoughWeight = remainingQty * recipe.doughWeight;
        if (!doughTotals[recipe.baseDough]) {
          doughTotals[recipe.baseDough] = 0;
        }
        doughTotals[recipe.baseDough] += totalDoughWeight;

        // Add to Ingredients Totals
        recipe.ingredients.forEach(ing => {
          const ingKey = `${ing.name}|${ing.unit}`;
          if (!ingredientTotals[ingKey]) {
            ingredientTotals[ingKey] = { amount: 0, unit: ing.unit };
          }
          ingredientTotals[ingKey].amount += (ing.amount * remainingQty);
        });

        // Add to Bake Time
        if (recipe.bakeTime && recipe.ovenCapacity && recipe.ovenCapacity > 0) {
          const batches = Math.ceil(remainingQty / recipe.ovenCapacity);
          totalBakeTime += (batches * recipe.bakeTime);
        }
      });

      return { dateKey, doughTotals, ingredientTotals, missingRecipes, totalBakeTime };
    });
  }, [scheduleData, progress, recipes]);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Kalkulasi didasarkan pada sisa target produksi (Target - Progres).
        </p>
        <Button onClick={() => setIsRecipeModalOpen(true)} variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Pengaturan Resep (BOM)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-2">
        {bomData.map(({ dateKey, doughTotals, ingredientTotals, missingRecipes, totalBakeTime }) => {
          let displayDate = dateKey;
          try {
            const [y, m, d] = dateKey.split('-');
            displayDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
          } catch(e) {}

          const doughEntries = Object.entries(doughTotals);
          const ingredientEntries = Object.entries(ingredientTotals).map(([key, data]) => {
            const [name] = key.split('|');
            return { name, amount: data.amount, unit: data.unit };
          });

          return (
            <Card key={`bom-${dateKey}`} className="flex flex-col h-full border-orange-200/50 shadow-sm bg-white dark:bg-slate-950">
              <div className="bg-orange-50 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-900/30 p-3 rounded-t-xl text-center">
                <span className="font-bold text-orange-700 dark:text-orange-400 text-sm">{displayDate}</span>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col gap-4">
                {missingRecipes && (
                  <div className="bg-amber-50 text-amber-600 border border-amber-200 p-2 rounded text-xs">
                    Beberapa produk di hari ini belum memiliki resep. Kalkulasi mungkin tidak akurat.
                  </div>
                )}
                
                {doughEntries.length === 0 && ingredientEntries.length === 0 && !missingRecipes && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    Semua target selesai atau tidak ada jadwal.
                  </div>
                )}

                {doughEntries.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 border-b pb-1">
                      <Wheat className="w-4 h-4 text-orange-500" />
                      <span className="flex items-center gap-1 cursor-help" title="Jenis adonan dasar yang digunakan. Produk dengan Base Dough yang sama akan diakumulasikan.">
                        Kebutuhan Adonan (Base Dough) <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                      </span>
                    </h4>
                    <div className="space-y-1">
                      {doughEntries.map(([dough, weight]) => (
                        <div key={dough} className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 last:border-0 pb-1 last:pb-0">
                          <span className="font-medium text-slate-700">{dough}</span>
                          <span className="font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                            {weight >= 1000 ? `${(weight/1000).toFixed(2)} Kg` : `${weight} gr`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ingredientEntries.length > 0 && (
                  <div className="mt-2">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 border-b pb-1">
                      <Beaker className="w-4 h-4 text-blue-500" />
                      Kebutuhan Bahan Baku Total
                    </h4>
                    <div className="space-y-1">
                      {ingredientEntries.map(({ name, amount, unit }, i) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 last:border-0 pb-1 last:pb-0">
                          <span className="text-slate-600">{name}</span>
                          <span className="font-semibold text-blue-700">
                            {amount.toLocaleString('id-ID')} {unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {totalBakeTime > 0 && (
                  <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase cursor-help" title="Total waktu yang dibutuhkan jika menggunakan 1 oven, berdasarkan kapasitas dan lama panggang per batch.">
                        <Clock className="w-4 h-4 text-purple-500" /> Estimasi Waktu Oven
                        <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 inline" />
                      </span>
                      <span className="font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded text-xs">
                        {Math.floor(totalBakeTime / 60)}j {totalBakeTime % 60}m
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recipe Management Modal */}
      <Dialog open={isRecipeModalOpen} onOpenChange={setIsRecipeModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Pengaturan Resep & Base Dough</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* List SKU */}
            <div className="md:col-span-1 border-r pr-4 space-y-2 max-h-full overflow-y-auto">
              <h4 className="font-bold text-sm mb-3">Daftar Produk</h4>
              {allSkus.map(sku => {
                const hasRecipe = recipes[sku] && recipes[sku].baseDough;
                return (
                  <div 
                    key={sku} 
                    onClick={() => handleEditRecipe(sku)}
                    className={`p-2 rounded-md text-sm cursor-pointer transition-colors border ${editingSku === sku ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-slate-100'} ${hasRecipe ? 'text-slate-800' : 'text-slate-500'}`}
                  >
                    {sku}
                    {!hasRecipe && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-400" title="Resep belum diatur" />}
                  </div>
                );
              })}
            </div>
            
            {/* Editor */}
            <div className="md:col-span-2">
              {tempRecipe && editingSku ? (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <h3 className="font-bold text-lg text-primary">{editingSku}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Base Dough (Nama Adonan)</label>
                      <input 
                        type="text" 
                        value={tempRecipe.baseDough} 
                        onChange={e => setTempRecipe({...tempRecipe, baseDough: e.target.value})}
                        placeholder="Cth: Adonan Croissant"
                        className="w-full h-9 px-3 rounded-md border dark:border-slate-700 bg-white dark:bg-slate-950 text-sm dark:text-slate-100 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Berat per Pcs (gram)</label>
                      <input 
                        type="number" 
                        value={tempRecipe.doughWeight || ''} 
                        onChange={e => setTempRecipe({...tempRecipe, doughWeight: parseFloat(e.target.value) || 0})}
                        placeholder="Cth: 75"
                        className="w-full h-9 px-3 rounded-md border dark:border-slate-700 bg-white dark:bg-slate-950 text-sm dark:text-slate-100 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Lama Panggang (Menit)</label>
                      <input 
                        type="number" 
                        value={tempRecipe.bakeTime || ''} 
                        onChange={e => setTempRecipe({...tempRecipe, bakeTime: parseFloat(e.target.value) || 0})}
                        placeholder="Cth: 15"
                        className="w-full h-9 px-3 rounded-md border dark:border-slate-700 bg-white dark:bg-slate-950 text-sm dark:text-slate-100 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Kapasitas Oven (Pcs per Batch)</label>
                      <input 
                        type="number" 
                        value={tempRecipe.ovenCapacity || ''} 
                        onChange={e => setTempRecipe({...tempRecipe, ovenCapacity: parseFloat(e.target.value) || 0})}
                        placeholder="Cth: 20"
                        className="w-full h-9 px-3 rounded-md border dark:border-slate-700 bg-white dark:bg-slate-950 text-sm dark:text-slate-100 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Kebutuhan Bahan Tambahan per Pcs (Opsional)</h4>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setTempRecipe({
                            ...tempRecipe, 
                            ingredients: [...tempRecipe.ingredients, { name: '', amount: 0, unit: 'gram' }]
                          });
                        }}
                      >
                        <Plus className="w-3 h-3" /> Tambah Bahan
                      </Button>
                    </div>
                    
                    {tempRecipe.ingredients.length === 0 ? (
                      <div className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded border dark:border-slate-800 border-dashed text-center">
                        Tidak ada bahan tambahan. (Hanya pakai base dough)
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tempRecipe.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={ing.name}
                              onChange={e => {
                                const newIng = [...tempRecipe.ingredients];
                                newIng[idx].name = e.target.value;
                                setTempRecipe({...tempRecipe, ingredients: newIng});
                              }}
                              placeholder="Nama bahan"
                              className="flex-1 h-8 px-2 rounded border dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-slate-100 text-sm"
                            />
                            <input 
                              type="number" 
                              value={ing.amount || ''}
                              onChange={e => {
                                const newIng = [...tempRecipe.ingredients];
                                newIng[idx].amount = parseFloat(e.target.value) || 0;
                                setTempRecipe({...tempRecipe, ingredients: newIng});
                              }}
                              placeholder="Jumlah"
                              className="w-20 h-8 px-2 rounded border dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-slate-100 text-sm"
                            />
                            <input 
                              type="text" 
                              value={ing.unit}
                              onChange={e => {
                                const newIng = [...tempRecipe.ingredients];
                                newIng[idx].unit = e.target.value;
                                setTempRecipe({...tempRecipe, ingredients: newIng});
                              }}
                              placeholder="Satuan"
                              className="w-20 h-8 px-2 rounded border dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-slate-100 text-sm"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => {
                                const newIng = [...tempRecipe.ingredients];
                                newIng.splice(idx, 1);
                                setTempRecipe({...tempRecipe, ingredients: newIng});
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveRecipe} className="gap-2">
                      <Save className="w-4 h-4" />
                      Simpan Resep
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Pilih produk di sebelah kiri untuk mengatur resep.
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <Button variant="outline" onClick={() => setIsRecipeModalOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
