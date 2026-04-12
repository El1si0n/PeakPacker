import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useUI } from "../contexts/UIContext";
import { getBagIcon } from "../lib/bagIcons";
import { CheckSquare, Plus, Trash2, Check, RefreshCw, GripVertical, PackagePlus, ChevronDown, Printer } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Task = {
  id: string;
  text: string;
  category: "Général" | "Équipement" | "Courses";
  completed: boolean;
  order_index: number;
};

const CATEGORIES: { id: Task["category"], color: string, bg: string }[] = [
  { id: "Général", color: "text-[var(--color-primary)]", bg: "bg-[var(--color-primary)]/10" },
  { id: "Courses", color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "Équipement", color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

function SortableTaskItem({ task, toggleTask, removeTask, updateText }: { task: Task, toggleTask: (id: string) => void, removeTask: (id: string) => void, updateText: (id: string, text: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center justify-between p-3 sm:px-4 group transition-colors print:p-2 print:border-b print:border-gray-200 ${!task.text ? 'print:hidden' : ''} ${task.completed ? 'bg-[var(--bg-color)]/30 print:bg-transparent' : 'bg-[var(--surface-color)] hover:bg-[var(--bg-color)] print:bg-transparent'} ${isDragging ? 'shadow-xl opacity-80 border border-[var(--color-primary)] rounded-xl print:shadow-none print:border-none' : ''}`}
    >
      <div className="flex items-start sm:items-center gap-3 flex-grow overflow-hidden w-full">
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 mt-1 sm:mt-0 text-[var(--text-muted)] hover:text-[var(--text-color)] opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 print:hidden"
        >
          <GripVertical size={18} />
        </div>

        {/* Checkbox */}
        <button 
          onClick={() => toggleTask(task.id)}
          className={`flex-shrink-0 w-6 h-6 mt-1 sm:mt-0 rounded-full border-2 flex items-center justify-center transition-all print:rounded-md print:border-gray-400 print:text-black ${task.completed ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-sm shadow-[var(--color-primary)]/30 print:bg-gray-200 print:text-black print:border-gray-400 print:shadow-none' : 'border-[var(--text-muted)] text-transparent group-hover:border-[var(--color-primary)]'}`}
        >
          <Check size={14} strokeWidth={3} className={task.completed ? 'print:block' : 'print:hidden'} />
        </button>

        {/* Inline Input (Textarea for wrap) */}
        <textarea 
          value={task.text}
          onChange={(e) => {
            updateText(task.id, e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          rows={1}
          placeholder="Nouvelle tâche..."
          className={`w-full font-medium text-[15px] bg-transparent border-none outline-none focus:ring-0 px-1 py-1 sm:py-1.5 resize-none overflow-hidden transition-all print:text-black print:p-0 ${task.completed ? 'text-[var(--text-muted)] line-through print:text-gray-500' : 'text-[var(--text-color)]'}`}
          onFocus={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />
      </div>

      <button 
        onClick={() => removeTask(task.id)}
        className="flex-shrink-0 ml-2 p-2 text-[var(--text-muted)] rounded-xl opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all focus:opacity-100 print:hidden"
        title="Supprimer"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

// Progress Ring Component for Header
function CircularProgress({ percent, colorClass }: { percent: number, colorClass: string }) {
  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-[var(--border-color)]" />
        <circle 
          cx="16" cy="16" r="14" 
          stroke="currentColor" 
          strokeWidth="3" 
          fill="transparent" 
          strokeDasharray="87.96" 
          strokeDashoffset={87.96 - (87.96 * percent) / 100}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-500 ease-out`} 
        />
      </svg>
    </div>
  );
}

// Custom Bag Selector Component
function BagSelector({ bags, onSelect }: { bags: any[], onSelect: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBagName, setSelectedBagName] = useState<string | null>(null);

  const handleSelect = (b: any) => {
    setSelectedBagName(b.name);
    onSelect(b.id);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-1.5 bg-[var(--bg-color)] border border-[var(--border-color)] text-xs sm:text-sm font-semibold text-[var(--text-color)] px-3 sm:px-4 h-[36px] rounded-full hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus:outline-none transition-all shadow-sm group max-w-[140px] sm:max-w-[200px]"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <PackagePlus size={16} className={`flex-shrink-0 group-hover:text-[var(--color-primary)] transition-colors ${selectedBagName ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'}`} />
          <span className="truncate">{selectedBagName || "Importer"}</span>
        </div>
        <ChevronDown size={14} className={`flex-shrink-0 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {/* Overlay for clicking outside */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
           <div className="max-h-64 overflow-y-auto">
             {bags.map(b => {
               const BagIcon = getBagIcon(b.icon);
               return (
                 <button 
                   key={b.id}
                   onClick={() => handleSelect(b)}
                   className="w-full text-left px-4 py-3 hover:bg-[var(--bg-color)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-3 text-sm font-medium text-[var(--text-color)] group first:rounded-t-xl last:rounded-b-xl focus:bg-[var(--bg-color)] focus:outline-none"
                 >
                   <BagIcon size={16} className="text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                   <span className="truncate">{b.name}</span>
                 </button>
               );
             })}
             {bags.length === 0 && (
               <div className="px-4 py-4 text-sm text-[var(--text-muted)] text-center italic">
                 Aucun sac trouvé
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
}

export default function CheckPoint() {
  const { user } = useAuth();
  const { confirm, toast } = useUI();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bags, setBags] = useState<any[]>([]);
  const [activeBagName, setActiveBagName] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchBags();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true });
    
    if (data) setTasks(data as Task[]);
  };

  const fetchBags = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bags')
      .select('id, name, icon, bag_items(item:inventory(name))')
      .eq('user_id', user.id);
    
    if (data) setBags(data);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;
    
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    await supabase.from('tasks').update({ completed: newCompleted }).eq('id', id);
  };

  const removeTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const updateTaskText = async (id: string, newText: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, text: newText } : t));
    await supabase.from('tasks').update({ text: newText }).eq('id', id);
  };

  const addTaskToCategory = async (categoryId: Task["category"]) => {
    if (!user) return;
    
    const catTasks = tasks.filter(t => t.category === categoryId);
    const nextOrder = catTasks.length > 0 ? Math.max(...catTasks.map(t => t.order_index)) + 1 : 0;

    const { data } = await supabase.from('tasks').insert({
      user_id: user.id,
      text: "",
      category: categoryId,
      completed: false,
      order_index: nextOrder
    }).select().single();

    if (data) setTasks([...tasks, data as Task]);
  };

  const handleImportBag = async (configId: string) => {
    if (!user) return;

    const selectedBag = bags.find(b => b.id === configId);
    if (!selectedBag) return;

    setActiveBagName(selectedBag.name);

    // Vider la catégorie "Équipement" avant d'importer la nouvelle config
    const eqTasksToDelete = tasks.filter(t => t.category === "Équipement");
    if (eqTasksToDelete.length > 0) {
       await supabase.from('tasks').delete().in('id', eqTasksToDelete.map(t => t.id));
    }
    
    let currentTasks = tasks.filter(t => t.category !== "Équipement");

    const bagItemNames: string[] = selectedBag.bag_items.map((bi: any) => bi.item?.name).filter(Boolean);
    
    if (bagItemNames.length === 0) {
       setTasks(currentTasks);
       return;
    }

    const newTasksToInsert = bagItemNames.map((name, index) => ({
      user_id: user.id,
      text: name,
      category: "Équipement" as Task["category"],
      completed: false,
      order_index: index
    }));

    if (newTasksToInsert.length > 0) {
      const { data } = await supabase.from('tasks').insert(newTasksToInsert).select();
      if (data) setTasks([...currentTasks, ...(data as Task[])]);
    }
  };

  const clearAll = async () => {
    confirm({
      title: "Vider la liste ?",
      message: "Êtes-vous sûr de vouloir supprimer toute la liste ?",
      confirmText: "Vider",
      onConfirm: async () => {
        setTasks([]);
        setActiveBagName(null);
        if (user) await supabase.from('tasks').delete().eq('user_id', user.id);
        toast({ message: "Liste vidée avec succès." });
      }
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      let newTasks: Task[] = [];
      
      setTasks((items) => {
        const oldIndex = items.findIndex(t => t.id === active.id);
        const newIndex = items.findIndex(t => t.id === over.id);
        newTasks = arrayMove(items, oldIndex, newIndex);
        
        // Re-calculate order_index for the modified category
        const category = items[oldIndex].category;
        let orderCounter = 0;
        newTasks = newTasks.map(t => {
          if (t.category === category) {
            return { ...t, order_index: orderCounter++ };
          }
          return t;
        });
        return newTasks;
      });

      // Update in DB (in background)
      const tasksToUpdate = newTasks.filter(t => t.category === tasks.find(ot => ot.id === active.id)?.category);
      if (tasksToUpdate.length > 0) {
        // Batch update is not natively supported without RPC, we'll update them one by one
        for (const t of tasksToUpdate) {
           supabase.from('tasks').update({ order_index: t.order_index }).eq('id', t.id).then();
        }
      }
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const dateStr = new Date().toLocaleDateString('fr-FR');
    document.title = activeBagName ? `PeakPacker - ${activeBagName}` : `PeakPacker - Check-list ${dateStr}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="pt-16 pb-24 md:pt-28 md:pb-16 px-4 max-w-7xl mx-auto min-h-screen flex flex-col print:bg-white print:text-black print:p-0 print:m-0 print:min-h-0">
      
      <style>{`
        @media print {
          @page { margin: 0; }
          body { 
            padding: 1.5cm;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
        }
      `}</style>

      {/* HEADER PRINT UNIQUE */}
      <div className="hidden print:flex items-center gap-4 mb-4 border-b-2 border-slate-200 pb-4">
        <img src="/favicon.svg" alt="PeakPacker Logo" className="w-12 h-12" />
        <div className="flex-grow">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--color-primary)]">PeakPacker</h1>
          <p className="text-gray-500 font-medium text-sm">Check-list de terrain</p>
        </div>
        <div className="text-right flex flex-col gap-1 items-end">
          <div className="text-sm font-bold text-black border-2 border-black rounded-lg px-3 py-1 bg-slate-50 uppercase tracking-widest">
            {activeBagName ? activeBagName : "MODÈLE GÉNÉRAL"}
          </div>
          <span className="text-xs text-gray-500 italic mt-1 text-right w-full">Date : {new Date().toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
      {/* HEADER ECRAN */}
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-10 text-center md:text-left print:hidden">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
            <CheckSquare className="text-[var(--color-primary)] w-10 h-10 flex-shrink-0" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-color)]">
              Check-list
            </h1>
          </div>
          <p className="text-[var(--text-muted)] text-lg">
            La liste de vérification ultime pour partir l'esprit léger.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white h-[52px] md:px-5 rounded-full font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm text-sm shadow-[var(--color-primary)]/20"
          >
            <Printer size={18} />
            <span>PDF</span>
          </button>
          <button 
            onClick={clearAll}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--text-color)] h-[52px] md:px-6 rounded-full font-medium hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] active:scale-95 transition-all shadow-sm text-sm"
          >
            <RefreshCw size={18} />
            <span>Nouvelle</span>
          </button>
        </div>
      </div>

      {/* SINGLE COLUMN LAYOUT FOR TASK LIST */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-6">
          {CATEGORIES.map(category => {
            const categoryTasks = tasks.filter(t => t.category === category.id);
            const completedCount = categoryTasks.filter(t => t.completed).length;
            const percent = categoryTasks.length > 0 ? Math.round((completedCount / categoryTasks.length) * 100) : 0;
            const allCompleted = categoryTasks.length > 0 && completedCount === categoryTasks.length;

            return (
              <div key={category.id} className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-3xl shadow-sm flex flex-col print:bg-white print:border-none print:shadow-none print:rounded-none print:mb-8" style={{ pageBreakInside: 'avoid' }}>
                {/* Category Header */}
                <div className={`px-4 sm:px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between gap-2 transition-colors print:px-0 print:border-black print:border-b-2 print:pb-2 print:mb-2 ${allCompleted ? 'bg-[var(--bg-color)]/50 print:bg-transparent' : ''}`}>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="print:hidden">
                      <CircularProgress percent={percent} colorClass={category.color} />
                    </div>
                    <h3 className="font-bold text-xl text-[var(--text-color)] print:text-black print:text-2xl print:uppercase">{category.id}</h3>
                  </div>
                  
                  {/* Category Actions */}
                  <div className="flex items-center justify-end print:hidden flex-shrink min-w-0">
                    {category.id === "Équipement" && (
                      <BagSelector bags={bags} onSelect={handleImportBag} />
                    )}
                    {category.id !== "Équipement" && (
                      <button 
                        onClick={() => addTaskToCategory(category.id)}
                        className="w-8 h-8 rounded-full bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0 text-[var(--text-color)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm"
                        title={`Ajouter une tâche dans ${category.id}`}
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sortable Items */}
                <div className="flex flex-col divide-y divide-[var(--border-color)] overflow-hidden rounded-b-3xl print:divide-transparent print:gap-1">
                  <SortableContext items={categoryTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {categoryTasks.map(task => (
                      <SortableTaskItem 
                        key={task.id} 
                        task={task} 
                        toggleTask={toggleTask} 
                        removeTask={removeTask}
                        updateText={updateTaskText}
                      />
                    ))}
                  </SortableContext>
                  
                  {categoryTasks.length === 0 && (
                    <div className="px-5 py-6 text-center text-[var(--text-muted)] italic text-sm print:hidden">
                      {category.id === "Équipement" 
                        ? "Sélectionner une configuration de sac."
                        : "Aucune tâche. Cliquez sur le \"+\" pour en ajouter."}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
