"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Paperclip, Reply, Smile, Download, StickyNote } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  division: string;
  text: string;
  timestamp: string;
  attachment?: string;
  replyTo?: { id: string; sender: string; text: string };
  reactions?: Record<string, string[]>;
}

const DIVISIONS = ['Admin / Sales', 'Produksi', 'Packing', 'Logistik'];
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '✅'];

const getDivisionColor = (division: string) => {
  switch(division) {
    case 'Admin / Sales': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200';
    case 'Produksi': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200';
    case 'Packing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200';
    case 'Logistik': return 'bg-E0F2FE text-0369A1 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200';
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
  }
};

const getDivisionAvatar = (division: string) => {
  const name = encodeURIComponent(division);
  switch(division) {
    case 'Admin / Sales': return `https://ui-avatars.com/api/?name=A+S&background=DBEAFE&color=1E40AF&bold=true`;
    case 'Produksi': return `https://ui-avatars.com/api/?name=PR&background=F3E8FF&color=6B21A8&bold=true`;
    case 'Packing': return `https://ui-avatars.com/api/?name=PA&background=FFEDD5&color=9A3412&bold=true`;
    case 'Logistik': return `https://ui-avatars.com/api/?name=LO&background=E0F2FE&color=0369A1&bold=true`;
    default: return `https://ui-avatars.com/api/?name=${name}&background=F1F5F9&color=0F172A&bold=true`;
  }
};

export function InternalChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [myDivision, setMyDivision] = useState(DIVISIONS[0]);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New features state
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [privateNote, setPrivateNote] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'note'>('chat');

  const loadMessages = () => {
    const saved = localStorage.getItem('bolobake_internal_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
      } catch (e) {}
    }
    const savedNote = localStorage.getItem('bolobake_private_note');
    if (savedNote) {
      setPrivateNote(savedNote);
    }
  };

  useEffect(() => {
    loadMessages();
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'bolobake_internal_chat') {
        loadMessages();
        if (!isOpen) setHasUnread(true);
      }
      if (e.key === 'bolobake_private_note') {
        loadMessages();
      }
    };
    
    const interval = setInterval(() => {
        const saved = localStorage.getItem('bolobake_internal_chat');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(prev => {
                    // Cek apakah pesan baru atau reaksi baru (bisa dengan membandingkan stringified)
                    const prevStr = JSON.stringify(prev);
                    const parsedStr = JSON.stringify(parsed);
                    if (prevStr !== parsedStr) {
                        if (!isOpen && parsed.length > prev.length) setHasUnread(true);
                        return parsed;
                    }
                    return prev;
                });
            } catch(e) {}
        }
    }, 1500);

    window.addEventListener('storage', handleStorage);
    return () => {
        window.removeEventListener('storage', handleStorage);
        clearInterval(interval);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, attachmentPreview, replyingTo]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert("Hanya format gambar yang didukung untuk saat ini.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            const MAX_HEIGHT = 600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress
            setAttachmentPreview(dataUrl);
        };
        img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachmentPreview && !replyingTo) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Staf', 
      division: myDivision,
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      attachment: attachmentPreview || undefined,
      replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.division, text: replyingTo.text || '📷 Gambar' } : undefined,
    };

    const updated = [...messages, msg];
    
    try {
        localStorage.setItem('bolobake_internal_chat', JSON.stringify(updated));
        setMessages(updated);
        setNewMessage('');
        setAttachmentPreview(null);
        setReplyingTo(null);
    } catch(e) {
        alert("Gagal mengirim! Memori lokal penuh karena terlalu banyak gambar. Silakan bersihkan history.");
    }
  };

  const toggleReaction = (msgId: string, emoji: string) => {
    setMessages(prev => {
        const updated = prev.map(msg => {
            if (msg.id === msgId) {
                const reactions = { ...msg.reactions };
                if (!reactions[emoji]) reactions[emoji] = [];
                
                const idx = reactions[emoji].indexOf(myDivision);
                if (idx > -1) {
                    reactions[emoji].splice(idx, 1);
                    if (reactions[emoji].length === 0) delete reactions[emoji];
                } else {
                    reactions[emoji].push(myDivision);
                }
                return { ...msg, reactions };
            }
            return msg;
        });
        localStorage.setItem('bolobake_internal_chat', JSON.stringify(updated));
        return updated;
    });
    setShowEmojiPickerFor(null);
  };

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/select-profile';

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      <button 
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all z-50 print:hidden ${isOpen ? 'bg-slate-800 hover:bg-slate-900' : 'bg-primary hover:bg-primary/90 hover:scale-105'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && hasUnread && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div 
          className={`fixed bottom-24 right-6 w-80 md:w-96 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 print:hidden transition-colors ${isDraggingOver ? 'border-primary ring-4 ring-primary/20' : 'border-slate-200 dark:border-slate-800'}`} 
          style={{ height: '600px', maxHeight: 'calc(100vh - 120px)' }}
          onDragOver={(e) => {
              e.preventDefault();
              if (e.dataTransfer.types.includes('application/bolobake-order')) {
                  setIsDraggingOver(true);
              }
          }}
          onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
          }}
          onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              const data = e.dataTransfer.getData('application/bolobake-order');
              if (data) {
                  try {
                      const order = JSON.parse(data);
                      const itemsText = order.items.map((i: any) => `${i.qty}x ${i.sku.replace(' (sample)', '')}`).join(', ');
                      setReplyingTo({
                          id: `order-${order.id}`,
                          sender: `Pesanan: ${order.customer}`,
                          division: `Pesanan: ${order.customer}`,
                          text: itemsText,
                          timestamp: ''
                      });
                  } catch (err) {}
              }
          }}
        >
          {isDraggingOver && (
              <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                  <div className="bg-primary text-white px-4 py-2 rounded-full font-bold shadow-lg animate-bounce">
                      Lepaskan untuk menyalin pesanan
                  </div>
              </div>
          )}
          
          <div className="bg-primary text-primary-foreground p-4 flex flex-col gap-3 shrink-0">
            <div className="flex bg-primary-foreground/10 p-1 rounded-lg">
               <button 
                 onClick={() => setActiveTab('chat')} 
                 className={`flex-1 py-1.5 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-colors ${activeTab === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-primary-foreground hover:bg-white/10'}`}
               >
                  <MessageCircle className="w-4 h-4" /> Diskusi
               </button>
               <button 
                 onClick={() => setActiveTab('note')} 
                 className={`flex-1 py-1.5 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-colors ${activeTab === 'note' ? 'bg-white text-primary shadow-sm' : 'text-primary-foreground hover:bg-white/10'}`}
               >
                  <StickyNote className="w-4 h-4" /> Catatan Pribadi
               </button>
            </div>
            
            {activeTab === 'chat' && (
              <div className="flex items-center gap-2 text-xs bg-primary-foreground/10 p-1.5 rounded-lg border border-primary-foreground/20">
                <span className="opacity-80">Kirim sebagai:</span>
                <select 
                  value={myDivision} 
                  onChange={(e) => setMyDivision(e.target.value)}
                  className="bg-transparent font-bold focus:outline-none flex-1 cursor-pointer"
                >
                  {DIVISIONS.map(d => <option key={d} value={d} className="text-black dark:text-white">{d}</option>)}
                </select>
              </div>
            )}
          </div>

          {activeTab === 'chat' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 relative" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-2">
                <MessageCircle className="w-8 h-8 opacity-20" />
                <p className="text-sm">Belum ada diskusi.<br/>Sapa divisi lain untuk koordinasi!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.division === myDivision;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-2 relative group w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                    onMouseLeave={() => { setHoveredMsgId(null); setShowEmojiPickerFor(null); }}
                  >
                    {/* Avatar Left */}
                    {!isMe && (
                       <img src={getDivisionAvatar(msg.division)} alt={msg.division} className="w-8 h-8 rounded-full flex-shrink-0 object-cover mt-4 border border-slate-200 dark:border-slate-700" />
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                      <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{msg.division}</span>
                        <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                      </div>

                      <div className="relative flex items-center gap-2">
                        {/* Action Menu (Reply & Emoji) */}
                        {hoveredMsgId === msg.id && !isMe && (
                           <div className="flex items-center gap-1 absolute top-1/2 -translate-y-1/2 -right-20 bg-white dark:bg-slate-800 shadow-sm border rounded-full px-1.5 py-1 z-10">
                              <button onClick={() => setShowEmojiPickerFor(msg.id)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-yellow-500">
                                  <Smile className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-blue-500">
                                  <Reply className="w-3.5 h-3.5" />
                              </button>
                           </div>
                        )}
                        
                        {/* Bubble */}
                        <div className={`p-1.5 flex flex-col rounded-2xl border shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm border-primary' : `${getDivisionColor(msg.division)} rounded-tl-sm`}`}>
                          
                          {/* Quoted Reply */}
                          {msg.replyTo && (
                              <div className="bg-black/10 dark:bg-black/20 rounded-xl p-2 mb-1.5 text-xs border-l-2 border-white/50 cursor-pointer">
                                  <span className="font-bold block text-[10px] opacity-80">{msg.replyTo.sender}</span>
                                  <span className="line-clamp-2 opacity-90">{msg.replyTo.text}</span>
                              </div>
                          )}

                          {/* Image Attachment */}
                          {msg.attachment && (
                              <img 
                                src={msg.attachment} 
                                alt="Lampiran" 
                                onClick={() => setZoomedImage(msg.attachment!)}
                                className="rounded-xl w-full max-h-48 object-cover mb-1.5 cursor-pointer hover:opacity-90 transition-opacity" 
                              />
                          )}

                          {/* Text */}
                          {msg.text && (
                              <div className="px-2 pb-1 text-sm">{msg.text}</div>
                          )}

                          {/* Emoji Reactions display */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className="flex flex-wrap gap-1 px-1 mt-1">
                                  {Object.entries(msg.reactions).map(([emoji, users]) => (
                                      <button 
                                        key={emoji}
                                        onClick={() => toggleReaction(msg.id, emoji)}
                                        className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20 hover:bg-white/30 transition-colors border border-white/10 ${users.includes(myDivision) ? 'border-white/50' : ''}`}
                                        title={users.join(', ')}
                                      >
                                          <span>{emoji}</span>
                                          <span className="font-bold">{users.length}</span>
                                      </button>
                                  ))}
                              </div>
                          )}
                        </div>

                        {/* Action Menu for Me (Right aligned) */}
                        {hoveredMsgId === msg.id && isMe && (
                           <div className="flex items-center gap-1 absolute top-1/2 -translate-y-1/2 -left-20 bg-white dark:bg-slate-800 shadow-sm border rounded-full px-1.5 py-1 z-10">
                              <button onClick={() => setShowEmojiPickerFor(msg.id)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-yellow-500">
                                  <Smile className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-blue-500">
                                  <Reply className="w-3.5 h-3.5" />
                              </button>
                           </div>
                        )}
                      </div>

                      {/* Emoji Picker Popover */}
                      {showEmojiPickerFor === msg.id && (
                          <div className={`absolute top-0 ${isMe ? 'right-0' : 'left-0'} -mt-8 bg-white dark:bg-slate-800 border shadow-lg rounded-full px-2 py-1 flex items-center gap-1 z-20`}>
                              {COMMON_EMOJIS.map(em => (
                                  <button key={em} onClick={() => toggleReaction(msg.id, em)} className="hover:scale-125 transition-transform text-lg">{em}</button>
                              ))}
                          </div>
                      )}
                    </div>

                    {/* Avatar Right */}
                    {isMe && (
                       <img src={getDivisionAvatar(msg.division)} alt={msg.division} className="w-8 h-8 rounded-full flex-shrink-0 object-cover mt-4 border border-primary/20 dark:border-primary/50" />
                    )}
                  </div>
                );
              })
            )}
          </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col relative">
              <textarea
                value={privateNote}
                onChange={(e) => {
                  setPrivateNote(e.target.value);
                  localStorage.setItem('bolobake_private_note', e.target.value);
                }}
                placeholder="Tulis atau paste catatan pelanggan di sini. Catatan ini hanya terlihat oleh Anda dan tersimpan secara lokal."
                className="flex-1 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          )}

          {/* Reply Preview */}
          {replyingTo && (
              <div className="bg-slate-100 dark:bg-slate-900 border-t p-2 px-4 flex items-center justify-between">
                  <div className="flex flex-col text-xs border-l-2 border-primary pl-2 overflow-hidden">
                      <span className="font-bold text-primary">{replyingTo.division}</span>
                      <span className="text-muted-foreground truncate">{replyingTo.text || '📷 Gambar'}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 shrink-0">
                      <X className="w-4 h-4" />
                  </button>
              </div>
          )}

          {/* Attachment Preview */}
          {attachmentPreview && (
              <div className="bg-slate-100 dark:bg-slate-900 border-t p-3 relative">
                  <img src={attachmentPreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-300" />
                  <button onClick={() => setAttachmentPreview(null)} className="absolute top-1 left-16 bg-black/50 text-white p-0.5 rounded-full hover:bg-black/70">
                      <X className="w-3 h-3" />
                  </button>
              </div>
          )}

          {/* Input Area (Only for Chat) */}
          {activeTab === 'chat' && (
            <div className="p-3 bg-white dark:bg-slate-950 border-t shrink-0">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  hidden 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full shrink-0"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[36px]"
                />
                
                <button 
                  type="submit"
                  disabled={!newMessage.trim() && !attachmentPreview && !replyingTo}
                  className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-full disabled:opacity-50 hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <button 
                onClick={() => setZoomedImage(null)} 
                className="absolute top-6 right-6 text-white hover:text-slate-300 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm transition-colors"
                title="Tutup"
            >
                <X className="w-6 h-6" />
            </button>
            <a 
                href={zoomedImage} 
                download={`bolobake-attachment-${Date.now()}.jpg`}
                className="absolute top-6 right-20 text-white hover:text-slate-300 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm transition-colors flex items-center gap-2"
                title="Download Gambar"
            >
                <Download className="w-6 h-6" />
            </a>
            <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </>
  );
}
