
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  Gift, Users, Lock, Unlock, Shuffle, Eye, 
  Wand2, CheckCircle2, AlertCircle, Calendar, 
  Palette, Heart, Info, Copy, LogOut, RotateCw,
  Crown, Pencil, X, Coffee, Share2, QrCode, Download, Link as LinkIcon
} from 'lucide-react';
import { Room, User, GameStage } from './types';
import * as db from './services/mockDb';
import * as gemini from './services/geminiService';

// --- Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' }> = ({ 
  className = '', variant = 'primary', children, ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-christmas-red text-white hover:bg-red-700 shadow-md shadow-red-200",
    secondary: "bg-christmas-green text-white hover:bg-green-800 shadow-md shadow-green-200",
    outline: "border-2 border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800 bg-white",
    danger: "bg-rose-100 text-rose-600 hover:bg-rose-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100"
  };
  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-christmas-red focus:border-transparent outline-none transition-all ${props.className}`} />
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
       <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all scale-100 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
          {children}
       </div>
    </div>
  );
};

const Loading: React.FC<{ text?: string }> = ({ text = "載入中..." }) => (
  <div className="flex flex-col items-center justify-center p-8 text-slate-400 animate-pulse">
    <Gift className="w-12 h-12 mb-4 text-christmas-gold" />
    <p>{text}</p>
  </div>
);

// --- Views ---

const Landing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Listen for URL params
  
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [min, setMin] = useState(300);
  const [max, setMax] = useState(500);
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [loading, setLoading] = useState(false);

  // Effect: Check for 'code' in URL to auto-fill
  useEffect(() => {
    const inviteCode = searchParams.get('code');
    if (inviteCode) {
      setMode('join');
      setCode(inviteCode.toUpperCase());
    }
  }, [searchParams]);

  const handleCreate = async () => {
    if (!name) return alert("請輸入你的名字");
    setLoading(true);
    try {
      const { room, user } = await db.createRoom(name, min, max, true);
      localStorage.setItem('santa_uid', user.id);
      navigate(`/room/${room.id}`);
    } catch (e) {
      alert("建立房間時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name || !code) return alert("請填寫所有欄位");
    setLoading(true);
    try {
      const { room, user } = await db.joinRoom(code.toUpperCase(), name);
      localStorage.setItem('santa_uid', user.id);
      navigate(`/room/${room.id}`);
    } catch (e: any) {
      alert(e.message || "加入失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-christmas-red to-christmas-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 text-white">
          <div className="inline-block p-3 bg-white/10 rounded-full mb-4 backdrop-blur-sm">
            <Gift className="w-12 h-12 text-christmas-gold" />
          </div>
          <h1 className="text-4xl font-bold font-serif mb-2">聖誕小天使</h1>
          <p className="text-white/80">與朋友交換禮物的最佳幫手</p>
        </div>

        <Card className="p-6 md:p-8">
          <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setMode('join')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'join' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>加入/重連</button>
            <button onClick={() => setMode('create')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'create' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>建立新房間</button>
          </div>

          <div className="space-y-4">
            
            {mode === 'join' ? (
               <div className="text-center mb-4 text-slate-500 text-sm bg-blue-50 p-2 rounded border border-blue-100">
                  <span className="font-bold text-blue-600">斷線重連教學：</span><br/>
                  輸入<b>相同的姓名</b>與<b>房間代碼</b>，<br/>即可自動取回您的主持人或參加者身分。
               </div>
            ) : null}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                 你的真實姓名/暱稱
              </label>
              <Input placeholder="請輸入姓名" value={name} onChange={e => setName(e.target.value)} />
            </div>

            {mode === 'create' ? (
               <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">預算下限</label>
                    <Input type="number" value={min} onChange={e => setMin(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">預算上限</label>
                    <Input type="number" value={max} onChange={e => setMax(Number(e.target.value))} />
                  </div>
                </div>
                <Button className="w-full mt-6" onClick={handleCreate} disabled={loading}>
                  {loading ? '建立中...' : '建立房間'}
                </Button>
               </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">房間代碼</label>
                <Input 
                  placeholder="6 位數代碼" 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  className="uppercase tracking-widest font-mono" 
                  maxLength={6} 
                  // Visual cue if coming from a link
                  style={searchParams.get('code') ? { backgroundColor: '#f0fdf4', borderColor: '#4ade80' } : {}}
                />
                
                <Button className="w-full mt-6" onClick={handleJoin} disabled={loading}>
                  {loading ? '連線中...' : '進入房間'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const RoomView = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchState = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await db.getRoomState(roomId);
      setRoom(data.room);
      setUsers(data.users);
      const storedUid = localStorage.getItem('santa_uid');
      const me = data.users.find(u => u.id === storedUid);
      if (!me) throw new Error("User not in room");
      setCurrentUser(me);
    } catch (err) {
      console.error(err);
    }
  }, [roomId]);

  useEffect(() => {
    const storedUid = localStorage.getItem('santa_uid');
    if (!storedUid || !roomId) {
      navigate('/');
      return;
    }

    const initFetch = async () => {
      try {
        await fetchState();
      } catch(e) {
        setError("連線中斷或房間不存在");
      } finally {
        setLoading(false);
      }
    };

    initFetch();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [roomId, navigate, fetchState]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loading text="準備中..." /></div>;
  if (error || !room || !currentUser) return <div className="p-8 text-center text-red-500">{error || "找不到房間"}</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-christmas-green text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-serif text-xl font-bold">Room {room.code}</h1>
            <p className="text-xs opacity-80 text-christmas-cream">預算: ${room.budgetMin} - ${room.budgetMax}</p>
          </div>
          <div className="flex items-center gap-2">
             <div className={`px-2 py-1 rounded text-xs font-bold ${currentUser.isReady ? 'bg-green-400/20 text-green-100 border border-green-400/30' : 'bg-red-500 text-white'}`}>
                {currentUser.isReady ? '已完成許願' : '許願中'}
             </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {room.stage === GameStage.LOBBY && (
            <LobbyView room={room} users={users} currentUser={currentUser} onRefresh={fetchState} />
        )}
        {room.stage === GameStage.PAIRED && (
            <GameView room={room} currentUser={currentUser} onRefresh={fetchState} />
        )}
        {room.stage === GameStage.REVEALED && (
            <ResultView room={room} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};

// --- Sub-Views ---

const LobbyView: React.FC<{ room: Room; users: User[]; currentUser: User; onRefresh: () => void }> = ({ room, users, currentUser, onRefresh }) => {
  const [preference, setPreference] = useState({
    color: currentUser.color || '',
    occasion: currentUser.occasion || '',
    feeling: currentUser.feeling || ''
  });
  const [suggestions, setSuggestions] = useState<Array<{name: string, description: string}>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!currentUser.isReady);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Share Modal
  const [showShareModal, setShowShareModal] = useState(false);
  
  const showForm = !currentUser.isReady || isEditing;
  const isHost = currentUser.isHost;
  
  // Build the Share URL safe for HashRouter
  const baseUrl = window.location.href.split('#')[0];
  const shareUrl = `${baseUrl}#/?code=${room.code}`;
  
  // QR Code API URL
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}&color=16-91-51`;

  const handlePreSubmit = () => {
    setFormError('');
    if (!preference.color.trim() || !preference.occasion.trim() || !preference.feeling.trim()) {
      setFormError("請填寫所有欄位才能進行下一步。");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      await db.updateUserProfile(currentUser.id, preference);
      setShowConfirm(false);
      setIsEditing(false);
      onRefresh();
    } catch (e) {
      alert("儲存失敗，請重試");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAskAi = async () => {
    if (!preference.color || !preference.occasion || !preference.feeling) {
      setFormError("請先填寫基本偏好，AI 才能給出建議喔！");
      return;
    }
    setAiLoading(true);
    setFormError('');
    try {
      const results = await gemini.getGiftSuggestions({
        ...preference,
        budgetMin: room.budgetMin,
        budgetMax: room.budgetMax
      });
      setSuggestions(results);
    } catch (e) {
      console.error(e);
      setFormError("AI 正在忙線中，請稍後再試。");
    } finally {
      setAiLoading(false);
    }
  };

  const handleStartGame = async () => {
    const unready = users.filter(u => !u.isReady);
    if (unready.length > 0) {
      if (!confirm(`還有 ${unready.length} 位玩家尚未填寫完畢。確定要開始配對嗎？`)) return;
    }
    try {
       await db.lockRoom(room.id);
       await db.generatePairings(room.id);
       onRefresh();
    } catch(e: any) {
       alert(e.message);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("已複製邀請連結！傳給朋友即可加入。");
    } catch (err) {
      alert("自動複製失敗，請手動複製輸入框中的網址。");
    }
  };
  
  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `santa-invite-${room.code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("下載失敗，請長按圖片儲存");
    }
  };

  return (
    <>
      {/* Confirmation Modal */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
        <div className="text-center">
          <div className="bg-christmas-gold/20 p-4 rounded-full inline-block mb-4">
             <Gift className="w-8 h-8 text-christmas-gold" />
          </div>
          <h3 className="text-xl font-bold mb-2">確認您的許願清單</h3>
          <p className="text-slate-500 text-sm mb-4">送出後可再修改，但建議一次填好喔！</p>
          
          <div className="bg-slate-50 p-4 rounded-lg text-left space-y-3 mb-6 text-sm border border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block">喜歡色系</span>
              <span className="font-medium text-slate-800">{preference.color}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block">使用場合</span>
              <span className="font-medium text-slate-800">{preference.occasion}</span>
            </div>
             <div>
              <span className="text-xs font-bold text-slate-400 uppercase block">風格感覺</span>
              <span className="font-medium text-slate-800">{preference.feeling}</span>
            </div>
          </div>

          <div className="flex gap-3">
             <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">再檢查一下</Button>
             <Button onClick={handleConfirmSave} disabled={isSaving} className="flex-1">
               {isSaving ? '傳送中...' : '確認送出'}
             </Button>
          </div>
        </div>
      </Modal>

      {/* Share / QR Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)}>
         <div className="flex flex-col items-center text-center space-y-4">
            <div>
              <h3 className="text-xl font-bold font-serif text-christmas-dark">邀請朋友</h3>
              <p className="text-sm text-slate-500">分享連結或 QR Code 讓朋友加入</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100">
              <img src={qrApiUrl} alt="Room QR Code" className="w-48 h-48 object-contain" />
            </div>
            
            <div className="w-full pt-2 border-t border-slate-100">
               <Button onClick={handleDownloadQr} className="w-full" variant="outline">
                 <Download size={18} /> 下載 QR Code 圖片
               </Button>
            </div>
         </div>
      </Modal>

      <Card className="p-6 border-t-4 border-t-christmas-red">
         <div className="flex justify-between items-start mb-6">
           <div>
             <h2 className="text-2xl font-bold text-christmas-dark font-serif mb-1">許願清單</h2>
             <p className="text-sm text-slate-500">讓你的小天使知道你想收到什麼禮物。</p>
           </div>
           <div className="text-right">
             <span className="block text-xs font-bold text-slate-400 uppercase">狀態</span>
             {currentUser.isReady ? <span className="text-christmas-green font-bold flex items-center gap-1"><CheckCircle2 size={16}/> 已完成</span> : <span className="text-christmas-red font-bold flex items-center gap-1"><AlertCircle size={16}/> 未完成</span>}
           </div>
         </div>

         {showForm ? (
           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                  <Palette size={16} className="text-christmas-gold"/> 喜歡的色系 (必填)
                </label>
                <Input value={preference.color} onChange={e => setPreference({...preference, color: e.target.value})} placeholder="例如：海軍藍、森林綠、莫蘭迪色系" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                  <Calendar size={16} className="text-christmas-gold"/> 使用場合 (必填)
                </label>
                <Input value={preference.occasion} onChange={e => setPreference({...preference, occasion: e.target.value})} placeholder="例如：辦公室、爬山、居家裝飾" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
                  <Heart size={16} className="text-christmas-gold"/> 感覺 / 風格 (必填)
                </label>
                <Input value={preference.feeling} onChange={e => setPreference({...preference, feeling: e.target.value})} placeholder="例如：溫馨、實用、好笑、奢華" />
              </div>

              {suggestions.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                  <h4 className="font-bold text-xs text-slate-500 uppercase mb-3 flex items-center gap-2">
                     <Wand2 size={14} /> AI 禮物靈感
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-bold text-christmas-dark whitespace-nowrap">• {s.name}:</span>
                        <span className="text-slate-600 italic">{s.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                   <AlertCircle size={16} /> {formError}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={handleAskAi} disabled={aiLoading} className="flex-1">
                  {aiLoading ? '思考中...' : <><Wand2 size={18} /> 給點靈感</>}
                </Button>
                <Button onClick={handlePreSubmit} disabled={isSaving} className="flex-1">
                   下一步：確認預覽
                </Button>
              </div>
           </div>
         ) : (
           <div className="bg-green-50/80 border border-green-100 rounded-xl p-8 text-center space-y-4 animate-in zoom-in-95 duration-500 relative overflow-hidden">
              {/* Decor */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-200/30 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-christmas-green shadow-sm mb-4">
                 <Coffee size={36} className="" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-christmas-dark">許願卡已投遞！</h3>
                <p className="text-slate-600 leading-relaxed max-w-md mx-auto font-medium">
                   目前正在蒐集大家的許願清單，<br/>
                   您已完成許願，請稍後大家。
                </p>
              </div>

              <div className="pt-6 border-t border-green-200/50 mt-6">
                <button onClick={() => setIsEditing(true)} className="text-sm text-slate-500 hover:text-christmas-red transition-colors flex items-center justify-center gap-2 mx-auto py-2 px-4 hover:bg-white/50 rounded-full">
                   <Pencil size={14} /> 我想要修改願望
                </button>
              </div>
           </div>
         )}
      </Card>
      
      {/* Participants & Invite Card */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4 gap-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users size={20} /> 參與名單 ({users.length})
          </h3>
        </div>

        {/* Inline Invite Section for better visibility */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
           <label className="text-xs font-bold text-slate-400 uppercase block mb-2 flex items-center gap-2">
             <Share2 size={12}/> 邀請連結
           </label>
           <div className="flex gap-2">
             <input 
               readOnly 
               value={shareUrl} 
               className="flex-1 bg-white border border-slate-200 text-slate-600 text-xs sm:text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-christmas-green font-mono truncate"
               onClick={(e) => e.currentTarget.select()}
             />
             <button onClick={copyLink} className="bg-white border border-slate-200 text-slate-600 hover:text-christmas-green hover:border-christmas-green px-3 py-2 rounded-lg transition-colors flex-shrink-0" title="複製連結">
               <Copy size={18} />
             </button>
             <button onClick={() => setShowShareModal(true)} className="bg-white border border-slate-200 text-slate-600 hover:text-christmas-green hover:border-christmas-green px-3 py-2 rounded-lg transition-colors flex-shrink-0" title="顯示 QR Code">
               <QrCode size={18} />
             </button>
           </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {users.map(u => (
            <div key={u.id} className={`p-3 rounded-lg border flex flex-col items-center text-center transition-all duration-500 ${u.isReady ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-colors ${u.isReady ? 'bg-green-500 text-white shadow-green-200 shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                 {u.isReady ? <CheckCircle2 size={20} /> : u.name.charAt(0)}
               </div>
               <span className="text-sm font-medium truncate w-full">{u.name}</span>
               {u.isHost && <span className="text-[10px] uppercase tracking-wide text-christmas-gold font-bold mt-1">Host</span>}
            </div>
          ))}
        </div>

        {isHost && (
          <div className="mt-6 pt-6 border-t border-slate-100">
             <div className="flex flex-col gap-2">
               <p className="text-sm text-slate-500 mb-2 font-bold">主持人控制台</p>
               <div className="flex gap-3">
                 <Button variant="secondary" className="w-full" onClick={handleStartGame}>
                   <Shuffle size={18} /> 鎖定並開始配對
                 </Button>
               </div>
             </div>
          </div>
        )}
      </Card>
    </>
  );
};

const GameView: React.FC<{ room: Room; currentUser: User; onRefresh: () => void }> = ({ room, currentUser, onRefresh }) => {
  const [target, setTarget] = useState<User | null>(null);
  const isHost = currentUser.isHost;
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    db.getMyPairing(room.id, currentUser.id).then(res => {
      if (res) setTarget(res.master);
    });
  }, [room.id, currentUser.id]);

  const handleReveal = async () => {
    if (confirm("確定要現在揭曉嗎？所有人都會看到結果喔！")) {
      setRevealing(true);
      try {
        await db.revealGame(room.id);
        // Immediately try to refresh parent state
        await onRefresh(); 
        // Ensure local state doesn't block if parent unmounts or updates slowly
      } catch(e) {
        console.error(e);
        alert("揭曉失敗，請重試");
        setRevealing(false);
      }
    }
  };

  const handleRedraw = async () => {
    if (confirm("確定要重新抽籤嗎？目前的配對將會作廢。")) {
       try {
         setTarget(null); // Clear current view
         await db.generatePairings(room.id);
         // Fetch new pairing
         const res = await db.getMyPairing(room.id, currentUser.id);
         if (res) setTarget(res.master);
         alert("已重新配對完成！");
       } catch (e: any) {
         alert(e.message);
       }
    }
  }

  if (!target) return <Loading text="正在尋找你的小主人..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
       <div className="bg-christmas-dark text-christmas-cream p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden">
          {/* Decorative BG elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          
          <h2 className="text-sm uppercase tracking-[0.3em] mb-4 text-christmas-gold">你的小主人是</h2>
          <div className="text-5xl font-serif font-bold mb-6 text-white drop-shadow-lg">{target.name}</div>
          
          <div className="inline-block bg-white/10 backdrop-blur-md rounded-xl p-6 text-left w-full max-w-md border border-white/20">
             <div className="space-y-4">
                <div>
                  <span className="text-xs uppercase text-christmas-gold font-bold block mb-1">喜歡的色系</span>
                  <p className="text-lg">{target.color}</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-christmas-gold font-bold block mb-1">使用場合</span>
                  <p className="text-lg">{target.occasion}</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-christmas-gold font-bold block mb-1">感覺 / 風格</span>
                  <p className="text-lg italic">"{target.feeling}"</p>
                </div>
             </div>
          </div>

          <p className="mt-8 text-sm opacity-60">噓！先不要告訴別人喔。</p>
       </div>

       {isHost && (
         <Card className="p-6 border-l-4 border-l-christmas-gold">
            <h3 className="font-bold text-lg mb-2">主持人專區</h3>
            <p className="text-sm text-slate-600 mb-4">如果不滿意這次的結果，可以重新抽籤。若大家都準備好了，就點擊大揭曉吧！</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleRedraw}>
                <RotateCw size={18} /> 重新抽籤
              </Button>
              <Button className="flex-1" onClick={handleReveal} disabled={revealing}>
                <Eye size={18} /> {revealing ? '揭曉中...' : '大揭曉'}
              </Button>
            </div>
         </Card>
       )}
    </div>
  );
};

const ResultView: React.FC<{ room: Room; currentUser: User }> = ({ room, currentUser }) => {
  const [allPairs, setAllPairs] = useState<Array<{angel: User, master: User}>>([]);

  useEffect(() => {
    db.getAllPairings(room.id).then(setAllPairs);
  }, [room.id]);

  return (
    <div className="space-y-6">
       <div className="text-center py-8">
         <h2 className="text-3xl font-serif font-bold text-christmas-red mb-2">大揭曉時刻！</h2>
         <p className="text-slate-600">祝大家聖誕快樂！</p>
       </div>

       <div className="grid gap-4">
          {allPairs.map((pair, idx) => (
             <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden">
                <div className="z-10 flex items-center gap-3">
                   <div className="text-right">
                      <span className="block text-xs font-bold text-christmas-green uppercase">小天使 (Angel)</span>
                      <span className="font-bold text-lg">{pair.angel.name}</span>
                   </div>
                </div>

                <div className="z-10 text-christmas-gold px-2">➜</div>

                <div className="z-10 flex items-center gap-3 text-right">
                   <div>
                      <span className="block text-xs font-bold text-christmas-red uppercase">小主人 (Master)</span>
                      <span className="font-bold text-lg">{pair.master.name}</span>
                   </div>
                </div>
                
                {/* Highlight own pairing */}
                {(pair.angel.id === currentUser.id || pair.master.id === currentUser.id) && (
                  <div className="absolute inset-0 bg-yellow-50/50 border-2 border-christmas-gold rounded-xl pointer-events-none" />
                )}
             </div>
          ))}
       </div>
       
       <div className="mt-12 flex justify-center">
          <Button variant="outline" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>
            <LogOut size={16} /> 離開房間
          </Button>
       </div>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:roomId" element={<RoomView />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
