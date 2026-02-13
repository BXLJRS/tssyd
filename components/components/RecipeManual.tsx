
import React, { useState } from 'react';
import { User, Recipe, RecipeTempOption } from '../types';
import { Search, Plus, X, ChevronRight, Edit3, Trash2, BookOpen, Snowflake, Flame, Info } from 'lucide-react';

interface RecipeManualProps {
  currentUser: User;
  data: Recipe[];
  onUpdate: (updated: Recipe[]) => void;
}

const DEFAULT_DETAIL = { content: '' };
const DEFAULT_TEMP: RecipeTempOption = {
  regular: { ...DEFAULT_DETAIL },
  large: { ...DEFAULT_DETAIL },
  max: { ...DEFAULT_DETAIL }
};

export const RecipeManual: React.FC<RecipeManualProps> = ({ currentUser, data, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTemp, setActiveTemp] = useState<'ICE' | 'HOT' | null>(null);
  const [activeSize, setActiveSize] = useState<'regular' | 'large' | 'max' | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Recipe>>({});

  const handleAddClick = () => {
    setEditData({
      name: '',
      category: '커피',
      hasIce: true,
      hasHot: false,
      ice: JSON.parse(JSON.stringify(DEFAULT_TEMP)),
      hot: JSON.parse(JSON.stringify(DEFAULT_TEMP))
    });
    setIsEditing(true);
  };

  const handleEditClick = (recipe: Recipe) => {
    setEditData({ ...recipe });
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!editData.name) {
      alert('메뉴명을 입력해 주세요.');
      return;
    }
    
    let updated: Recipe[];
    if (editData.id) {
      updated = data.map(r => r.id === editData.id ? { ...r, ...editData, lastUpdated: Date.now(), updatedAt: Date.now() } as Recipe : r);
    } else {
      const newRecipe: Recipe = {
        ...editData,
        id: Date.now().toString(),
        lastUpdated: Date.now(),
        updatedAt: Date.now()
      } as Recipe;
      updated = [newRecipe, ...data];
    }
    
    onUpdate(updated);
    setIsEditing(false);
    setEditData({});
  };

  const deleteRecipe = (id: string) => {
    if (confirm('이 레시피를 정말 삭제하시겠습니까?')) {
      onUpdate(data.filter(r => r.id !== id));
      if (selectedRecipe?.id === id) setSelectedRecipe(null);
    }
  };

  const filtered = data.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // 상세 보기 화면
  if (selectedRecipe) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <button onClick={() => { setSelectedRecipe(null); setActiveTemp(null); setActiveSize(null); }} className="flex items-center gap-2 text-gray-400 font-bold mb-4">
          <ChevronRight className="rotate-180" size={20} /> 메뉴 목록으로
        </button>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{selectedRecipe.category}</span>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedRecipe.name}</h2>
            </div>
            {currentUser.role === 'OWNER' && (
              <div className="flex gap-2">
                <button onClick={() => handleEditClick(selectedRecipe)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-black transition-colors"><Edit3 size={20}/></button>
                <button onClick={() => deleteRecipe(selectedRecipe.id)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
              </div>
            )}
          </div>

          {/* 온도 선택 */}
          <div className="grid grid-cols-2 gap-4">
            {selectedRecipe.hasIce && (
              <button 
                onClick={() => { setActiveTemp('ICE'); setActiveSize('regular'); }}
                className={`py-6 rounded-3xl font-black flex flex-col items-center gap-2 transition-all border-2 ${activeTemp === 'ICE' ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-blue-50 border-blue-100 text-blue-400'}`}
              >
                <Snowflake size={32} />
                <span>ICE</span>
              </button>
            )}
            {selectedRecipe.hasHot && (
              <button 
                onClick={() => { setActiveTemp('HOT'); setActiveSize('regular'); }}
                className={`py-6 rounded-3xl font-black flex flex-col items-center gap-2 transition-all border-2 ${activeTemp === 'HOT' ? 'bg-orange-600 border-orange-600 text-white shadow-xl scale-105' : 'bg-orange-50 border-orange-100 text-orange-400'}`}
              >
                <Flame size={32} />
                <span>HOT</span>
              </button>
            )}
          </div>

          {/* 사이즈 선택 (온도가 선택되었을 때만) */}
          {activeTemp && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-[1.5rem]">
                {(['regular', 'large', 'max'] as const).map(size => (
                  <button 
                    key={size}
                    onClick={() => setActiveSize(size)}
                    className={`flex-1 py-3 rounded-xl font-black text-sm uppercase transition-all ${activeSize === size ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* 레시피 출력 */}
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 min-h-[200px]">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Info size={14}/> {activeTemp} {activeSize?.toUpperCase()} 레시피 내용
                </h4>
                <div className="text-xl font-bold text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {activeTemp === 'ICE' 
                    ? selectedRecipe.ice?.[activeSize || 'regular'].content || '등록된 레시피가 없습니다.'
                    : selectedRecipe.hot?.[activeSize || 'regular'].content || '등록된 레시피가 없습니다.'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text" 
            placeholder="메뉴명을 검색하세요..." 
            className="w-full pl-14 pr-4 py-4 bg-gray-50 rounded-2xl font-bold outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        {currentUser.role === 'OWNER' && (
          <button onClick={handleAddClick} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform">
            <Plus size={20} /> 새 메뉴 레시피 등록
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(recipe => (
          <button 
            key={recipe.id} 
            onClick={() => setSelectedRecipe(recipe)}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between hover:border-red-200 transition-all text-left group"
          >
            <div className="flex items-center gap-5">
              <div className="bg-gray-50 p-4 rounded-2xl text-gray-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                <BookOpen size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{recipe.category}</span>
                <h3 className="text-xl font-black text-gray-900">{recipe.name}</h3>
                <div className="flex gap-2 mt-1">
                  {recipe.hasIce && <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">ICE</span>}
                  {recipe.hasHot && <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">HOT</span>}
                </div>
              </div>
            </div>
            <ChevronRight className="text-gray-200 group-hover:text-red-300 transition-colors" />
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="py-24 text-center text-gray-300 font-bold border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center gap-4">
            <BookOpen size={48} className="opacity-20" />
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 편집 모달 */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[80] overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl my-auto animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black tracking-tight">{editData.id ? '레시피 수정' : '새 메뉴 등록'}</h3>
              <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 scrollbar-hide">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">메뉴명</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">카테고리</label>
                  <select className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})}>
                    <option value="커피">커피</option>
                    <option value="티/에이드">티 / 에이드</option>
                    <option value="블렌디드">블렌디드</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setEditData({...editData, hasIce: !editData.hasIce})}
                  className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 transition-all ${editData.hasIce ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                >
                  <Snowflake size={18} /> ICE 제공
                </button>
                <button 
                  onClick={() => setEditData({...editData, hasHot: !editData.hasHot})}
                  className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 transition-all ${editData.hasHot ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                >
                  <Flame size={18} /> HOT 제공
                </button>
              </div>

              {/* ICE 레시피 입력 */}
              {editData.hasIce && (
                <div className="space-y-4 p-6 bg-blue-50/30 rounded-3xl border border-blue-100">
                  <h4 className="text-sm font-black text-blue-600 flex items-center gap-2"><Snowflake size={16}/> ICE 레시피 구성</h4>
                  <div className="space-y-4">
                    {(['regular', 'large', 'max'] as const).map(size => (
                      <div key={size} className="space-y-1">
                        <label className="text-[10px] font-black text-blue-400 uppercase ml-1">ICE {size.toUpperCase()} 내용</label>
                        <textarea 
                          className="w-full p-4 bg-white border border-blue-100 rounded-2xl text-sm font-bold min-h-[80px]"
                          placeholder={`예: 에스프레소 2샷, 시럽 2펌프...`}
                          value={editData.ice?.[size]?.content}
                          onChange={e => {
                            const newIce = { ...editData.ice } as RecipeTempOption;
                            newIce[size].content = e.target.value;
                            setEditData({ ...editData, ice: newIce });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HOT 레시피 입력 */}
              {editData.hasHot && (
                <div className="space-y-4 p-6 bg-orange-50/30 rounded-3xl border border-orange-100">
                  <h4 className="text-sm font-black text-orange-600 flex items-center gap-2"><Flame size={16}/> HOT 레시피 구성</h4>
                  <div className="space-y-4">
                    {(['regular', 'large', 'max'] as const).map(size => (
                      <div key={size} className="space-y-1">
                        <label className="text-[10px] font-black text-orange-400 uppercase ml-1">HOT {size.toUpperCase()} 내용</label>
                        <textarea 
                          className="w-full p-4 bg-white border border-orange-100 rounded-2xl text-sm font-bold min-h-[80px]"
                          placeholder={`예: 스팀우유 250ml, 파우더 3스푼...`}
                          value={editData.hot?.[size]?.content}
                          onChange={e => {
                            const newHot = { ...editData.hot } as RecipeTempOption;
                            newHot[size].content = e.target.value;
                            setEditData({ ...editData, hot: newHot });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6 border-t mt-6">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-5 font-black text-gray-400">취소</button>
              <button onClick={saveEdit} className="flex-1 py-5 bg-black text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all">레시피 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
