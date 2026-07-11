import React, { useState, useEffect } from 'react';
import { FiPlus, FiMoreHorizontal, FiCalendar, FiMessageSquare, FiPaperclip, FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { DndContext, closestCorners, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { recruiterAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PriorityBadge = ({ priority }) => {
  const colors = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-orange-100 text-orange-700',
    Low: 'bg-emerald-100 text-emerald-700'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const TaskCard = ({ task, isOverlay }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id || task.id,
    data: task
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.5 : 1
  } : undefined;

  // Extract initials if not provided
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`bg-white p-4 rounded-xl border ${isOverlay ? 'border-indigo-500 shadow-xl scale-105' : 'border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1'} transition-all cursor-grab active:cursor-grabbing group flex flex-col gap-3`}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-2 items-center flex-wrap">
          <PriorityBadge priority={task.priority} />
          {task.aiSuggested && (
            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              <HiSparkles className="w-3 h-3" /> AI Pick
            </span>
          )}
        </div>
      </div>

      <h4 className="text-sm font-bold text-gray-900 leading-snug">{task.title}</h4>

      {(task.candidateName || task.candidateRole) && (
        <div className="flex items-center gap-2 mt-1">
          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black shrink-0">
            {getInitials(task.candidateName)}
          </div>
          <div className="text-xs font-medium text-gray-600 truncate">
            {task.candidateName || 'Unknown'} <span className="text-gray-400 font-normal">for</span> {task.candidateRole || 'Role'}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 text-gray-500">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <FiCalendar className="w-3.5 h-3.5" />
          <span className={task.dueDate === 'Today' ? 'text-orange-600 font-bold' : ''}>{task.dueDate}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          {task.comments > 0 && (
            <div className="flex items-center gap-1">
              <FiMessageSquare className="w-3.5 h-3.5" /> {task.comments}
            </div>
          )}
          {task.attachments > 0 && (
            <div className="flex items-center gap-1">
              <FiPaperclip className="w-3.5 h-3.5" /> {task.attachments}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Column = ({ title, count, colorClass, status, tasks }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`${status === 'todo' ? 'bg-gray-50/50 border-gray-100' : status === 'in-progress' ? 'bg-indigo-50/30 border-indigo-100/50' : 'bg-emerald-50/30 border-emerald-100/50'} rounded-2xl border p-4 flex flex-col h-full overflow-hidden transition-colors ${isOver ? 'ring-2 ring-indigo-400 bg-indigo-50/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10">
        {tasks.map(task => (
          <TaskCard key={task._id || task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm font-medium">
            {status === 'todo' ? 'No tasks to do' : status === 'in-progress' ? 'Drop tasks here' : 'Completed tasks'}
          </div>
        )}
      </div>
    </div>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    candidateName: '',
    candidateRole: '',
    priority: 'Medium',
    dueDate: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await recruiterAPI.getTasks();
      setTasks(res.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;
    const task = tasks.find(t => (t._id || t.id) === taskId);

    if (task && task.status !== newStatus) {
      // Optimistic update
      setTasks(tasks.map(t => (t._id || t.id) === taskId ? { ...t, status: newStatus } : t));
      
      try {
        await recruiterAPI.updateTask(taskId, { status: newStatus });
        toast.success(`Task moved to ${newStatus}`);
      } catch (err) {
        toast.error('Failed to move task');
        fetchTasks(); // Revert on failure
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title) return toast.error('Title is required');

    try {
      const res = await recruiterAPI.createTask({
        ...formData,
        status: 'todo'
      });
      setTasks([...tasks, res.data]);
      setIsModalOpen(false);
      setFormData({ title: '', candidateName: '', candidateRole: '', priority: 'Medium', dueDate: '' });
      toast.success('Task created successfully!');
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Task Workspace</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your hiring workflow with drag and drop.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition w-full md:w-64"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition flex items-center gap-2 whitespace-nowrap"
          >
            <FiPlus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-140px)]">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              <Column title="To Do" count={todoTasks.length} colorClass="bg-gray-400" status="todo" tasks={todoTasks} />
              <Column title="In Progress" count={inProgressTasks.length} colorClass="bg-indigo-500" status="in-progress" tasks={inProgressTasks} />
              <Column title="Done" count={doneTasks.length} colorClass="bg-emerald-500" status="done" tasks={doneTasks} />
            </div>
          </DndContext>
        </div>
      )}

      {/* NEW TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-fade-in-up">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Task Title *</label>
                <input 
                  type="text" required
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                  placeholder="e.g. Schedule follow-up call"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Candidate Name</label>
                  <input 
                    type="text" 
                    value={formData.candidateName} onChange={e => setFormData({...formData, candidateName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                  <input 
                    type="text" 
                    value={formData.candidateRole} onChange={e => setFormData({...formData, candidateRole: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                    placeholder="React Dev"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                  <select 
                    value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                  <input 
                    type="text" 
                    value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                    placeholder="e.g. Tomorrow or Nov 12"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
