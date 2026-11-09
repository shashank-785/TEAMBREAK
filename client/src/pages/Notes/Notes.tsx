import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Sparkles, Search, Download, 
  Upload, Tag, Edit3, Eye, Loader2, CheckCircle, FolderPlus, FolderOpen
} from 'lucide-react';
import { api } from '../../services/api';
import { Note } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const Notes: React.FC = () => {
  const defaultFolders = ['General', 'Exam Prep', 'Interview Prep'];
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedFolder, setSelectedFolder] = useState('All folders');
  const [folders, setFolders] = useState<string[]>(() => {
    const savedFolders: unknown = JSON.parse(localStorage.getItem('learnos_note_folders') || '[]');
    const customFolders = Array.isArray(savedFolders) ? savedFolders.filter((folder): folder is string => typeof folder === 'string') : [];
    return [...new Set([...defaultFolders, ...customFolders])];
  });
  const [isEditorMode, setIsEditorMode] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState('');
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);

  // New Note Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Operating Systems');
  const [newFolder, setNewFolder] = useState('Exam Prep');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('OS, Midterm');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Document Upload Simulator
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    api.getNotes().then((fetched) => {
      setNotes(fetched);
      if (fetched.length > 0) setSelectedNote(fetched[0]);
    });
  }, []);

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSub = selectedSubject === 'All' || n.subject === selectedSubject;
    const matchesFolder = selectedFolder === 'All folders' || (n.folder || 'General') === selectedFolder;
    return matchesSearch && matchesSub && matchesFolder;
  });

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    const updated = await api.updateNote(selectedNote.id, {
      title: selectedNote.title,
      content: selectedNote.content,
      tags: selectedNote.tags,
      folder: selectedNote.folder || 'General'
    });
    if (updated) {
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      setSelectedNote(updated);
      setIsEditorMode(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    await api.deleteNote(id);
    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    setSelectedNote(remaining.length > 0 ? remaining[0] : null);
  };

  const handleSummarize = async () => {
    if (!selectedNote || isAiLoading) return;
    setIsAiLoading(true);
    setAiError('');
    try {
      const summary = await api.summarizeNote(selectedNote.id);
      setSelectedNote({ ...selectedNote, summary });
      setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, summary } : n));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI summarization failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedNote || isAiLoading) return;
    setIsAiLoading(true);
    setAiError('');
    try {
      const questions = await api.generateNoteQuestions(selectedNote.id);
      setGeneratedQuestions(questions);
      setIsQuestionsModalOpen(true);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Question generation failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tagsArr = newTags.split(',').map(t => t.trim()).filter(Boolean);
    const created = await api.createNote({
      title: newTitle,
      subject: newSubject,
      folder: newFolder,
      content: newContent || '# ' + newTitle + '\n\nStart typing notes here...',
      tags: tagsArr
    });

    setNotes(prev => [created, ...prev]);
    setSelectedNote(created);
    setIsNewModalOpen(false);
    setNewTitle('');
    setNewContent('');
  };

  const handleCreateFolder = (event: React.FormEvent) => {
    event.preventDefault();
    const folderName = newFolderName.trim();
    if (!folderName || folders.some(folder => folder.toLowerCase() === folderName.toLowerCase())) return;
    const updatedFolders = [...folders, folderName];
    setFolders(updatedFolders);
    localStorage.setItem('learnos_note_folders', JSON.stringify(updatedFolders.filter(folder => !defaultFolders.includes(folder))));
    setSelectedFolder(folderName);
    setNewFolder(folderName);
    setNewFolderName('');
    setIsFolderModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadedFileName('');
    setUploadContent('');
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Choose a text document smaller than 2 MB.');
      return;
    }
    if (!/\.(txt|md|json)$/i.test(file.name)) {
      setUploadError('Only text, Markdown, and JSON files are supported. PDF extraction is not available yet.');
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result;
      if (typeof text !== 'string' || !text.trim()) {
        setUploadError('No readable text was found in this file.');
        setUploadContent('');
        return;
      }
      setUploadContent(text);
    };
    reader.onerror = () => setUploadError('The selected file could not be read.');
    reader.readAsText(file);
  };

  const handleImportDocument = async () => {
    if (!uploadedFileName || !uploadContent.trim()) return;
    const created = await api.createNote({
      title: uploadedFileName.replace(/\.[^/.]+$/, ''),
      subject: 'Imported Documents',
      content: uploadContent,
      tags: ['Imported', 'Document']
    });

    setNotes(prev => [created, ...prev]);
    setSelectedNote(created);
    setIsUploadModalOpen(false);
    setUploadedFileName('');
    setUploadContent('');
    setUploadError('');
  };

  const exportNote = () => {
    if (!selectedNote) return;
    const element = document.createElement("a");
    const file = new Blob([selectedNote.content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedNote.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="text-indigo-400" size={24} />
            <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Notes & Documents</h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Markdown document manager, document ingestion, and AI study summarization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#151923] hover:bg-[#1C2230] text-[#F8FAFC] border border-[#232936] rounded-lg text-xs font-semibold transition-all"
          >
            <Upload size={14} className="text-indigo-400" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus size={14} />
            <span>Create Note</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Note List (4 cols) & Editor/Viewer (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Notes List */}
        <div className="lg:col-span-4 bg-[#151923] border border-[#232936] rounded-xl p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F8FAFC]"><FolderOpen size={16} className="text-indigo-400" /> Prep folders</div>
            <button type="button" onClick={() => setIsFolderModalOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#232936] px-2.5 text-xs font-medium text-[#94A3B8] transition hover:border-indigo-500/40 hover:text-white">
              <FolderPlus size={14} /> New folder
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['All folders', ...folders].map(folder => (
              <button
                key={folder}
                type="button"
                onClick={() => setSelectedFolder(folder)}
                aria-pressed={selectedFolder === folder}
                className={`min-h-8 rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${selectedFolder === folder ? 'bg-indigo-600 text-white' : 'bg-[#0B0D12] text-[#94A3B8] hover:text-white'}`}
              >
                {folder}
              </button>
            ))}
          </div>

          {/* Search & Subject Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes content..."
                className="w-full bg-[#0B0D12] border border-[#232936] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'Operating Systems', 'Data Structures & Algorithms', 'Database Systems'].map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    selectedSubject === sub 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-[#0B0D12] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {sub.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes items */}
          <div className="space-y-2">
            {filteredNotes.map(n => {
              const isSelected = selectedNote?.id === n.id;
              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedNote(n)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-[#F8FAFC]'
                      : 'bg-[#0B0D12] border-[#232936] hover:border-slate-700 text-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-[#F8FAFC] line-clamp-1">{n.title}</h4>
                    <span className="text-[10px] text-[#94A3B8] font-mono shrink-0">
                      {n.updatedAt ? n.updatedAt.split('T')[0] : 'Recent'}
                    </span>
                  </div>

                  <div className="text-[10px] font-medium text-indigo-300">{n.folder || 'General'}</div>
                  <p className="text-[11px] text-[#94A3B8] line-clamp-2">
                    {n.summary || n.content.replace(/#|\*|`/g, '').slice(0, 100)}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {n.tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[#151923] text-indigo-300 border border-[#232936]">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Note Viewer & AI Actions */}
        <div className="lg:col-span-8 space-y-6">
          {selectedNote ? (
            <div className="bg-[#151923] border border-[#232936] rounded-xl p-6 space-y-6">
              {/* Note Header & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232936]">
                <div>
                  <Badge variant="purple">{selectedNote.subject}</Badge>
                  <h2 className="text-xl font-bold text-[#F8FAFC] mt-1">{selectedNote.title}</h2>
                  <p className="mt-1 text-xs text-indigo-300">{selectedNote.folder || 'General'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditorMode(!isEditorMode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B0D12] hover:bg-[#1C2230] text-[#F8FAFC] border border-[#232936] rounded-lg text-xs font-semibold"
                  >
                    {isEditorMode ? <Eye size={13} /> : <Edit3 size={13} />}
                    <span>{isEditorMode ? 'Preview' : 'Edit Note'}</span>
                  </button>

                  <button
                    onClick={exportNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B0D12] hover:bg-[#1C2230] text-[#F8FAFC] border border-[#232936] rounded-lg text-xs font-semibold"
                    title="Export Markdown"
                  >
                    <Download size={13} />
                    <span>Export</span>
                  </button>

                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="p-1.5 text-[#94A3B8] hover:text-rose-400 rounded-lg hover:bg-[#232936]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* AI Quick Actions Bar */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-[#0B0D12] border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                  <Sparkles size={15} />
                  <span>AI Study Operations</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSummarize}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30"
                  >
                    {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>AI Summarize</span>
                  </button>

                  <button
                    onClick={handleGenerateQuestions}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2230] hover:bg-[#232936] disabled:opacity-50 text-[#F8FAFC] border border-[#232936] rounded-lg text-xs font-semibold"
                  >
                    <span>Generate 5 MCQs</span>
                  </button>
                </div>
              </div>

              {aiError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{aiError}</p>}

              {/* AI Summary Box */}
              {selectedNote.summary && (
                <div className="p-4 rounded-xl bg-[#0B0D12] border border-indigo-500/30 space-y-2">
                  <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>AI Executive Summary & Takeaways</span>
                  </div>
                  <div className="text-xs text-[#F8FAFC] leading-relaxed whitespace-pre-line font-sans">
                    {selectedNote.summary}
                  </div>
                </div>
              )}

              {/* Editor or Markdown View */}
              {isEditorMode ? (
                <div className="space-y-4">
                  <label className="block text-xs font-medium text-[#94A3B8]">
                    Save in folder
                    <select
                      value={selectedNote.folder || 'General'}
                      onChange={event => setSelectedNote({ ...selectedNote, folder: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2 text-xs text-[#F8FAFC]"
                    >
                      {folders.map(folder => <option key={folder} value={folder}>{folder}</option>)}
                    </select>
                  </label>
                  <textarea
                    rows={16}
                    value={selectedNote.content}
                    onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                    className="w-full bg-[#0B0D12] border border-[#232936] rounded-xl p-4 font-mono text-xs text-[#F8FAFC] leading-relaxed focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditorMode(false)}
                      className="px-4 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#0B0D12] border border-[#232936] min-h-[300px]">
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-line font-sans">
                    {selectedNote.content}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-[#94A3B8] bg-[#151923] border border-[#232936] rounded-xl">
              Select or create a study note to view content.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Note */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Create New Study Note">
        <form onSubmit={handleCreateNote} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#94A3B8]">Note Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="E.g., Virtual Memory Page Replacement Algorithms"
              className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Subject</label>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              >
                <option value="Operating Systems">Operating Systems</option>
                <option value="Data Structures & Algorithms">Data Structures</option>
                <option value="Database Management Systems">Database Systems</option>
                <option value="Computer Networks">Computer Networks</option>
                <option value="AI & Machine Learning">AI & ML</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Folder</label>
              <select
                value={newFolder}
                onChange={event => setNewFolder(event.target.value)}
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              >
                {folders.map(folder => <option key={folder} value={folder}>{folder}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#94A3B8]">Tags (comma separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Paging, LRU, Memory"
                className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#94A3B8]">Initial Content (Markdown supported)</label>
            <textarea
              rows={6}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="# Introduction..."
              className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 font-mono text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              Create Note
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="Create a prep folder" maxWidth="sm">
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <p className="text-xs leading-relaxed text-[#94A3B8]">Create folders for different classes, exams, interviews, or projects. Your folders stay saved in this browser.</p>
          <label className="block text-xs font-medium text-[#94A3B8]">
            Folder name
            <input
              autoFocus
              required
              maxLength={40}
              value={newFolderName}
              onChange={event => setNewFolderName(event.target.value)}
              placeholder="e.g. Data Structures Interview"
              className="mt-1 w-full rounded-lg border border-[#232936] bg-[#0B0D12] px-3 py-2.5 text-sm text-[#F8FAFC] focus:border-indigo-500 focus:outline-none"
            />
          </label>
          {newFolderName.trim() && folders.some(folder => folder.toLowerCase() === newFolderName.trim().toLowerCase()) && (
            <p role="alert" className="text-xs text-amber-300">A folder with this name already exists.</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsFolderModalOpen(false)} className="min-h-10 rounded-lg px-4 text-xs text-[#94A3B8]">Cancel</button>
            <button type="submit" disabled={!newFolderName.trim() || folders.some(folder => folder.toLowerCase() === newFolderName.trim().toLowerCase())} className="min-h-10 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white disabled:opacity-40">Create folder</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Document Upload Simulator */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Document / Syllabus File">
        <div className="space-y-4">
          <p className="text-xs text-[#94A3B8]">
            Import a text, Markdown, or JSON file. Extracted text is saved as a note and can then be used by the AI Tutor. PDF extraction is not supported yet.
          </p>

          <div className="p-6 border-2 border-dashed border-[#232936] hover:border-indigo-500/50 rounded-xl text-center space-y-2 cursor-pointer transition-colors bg-[#0B0D12]">
            <Upload size={24} className="mx-auto text-indigo-400" />
            <div className="text-xs font-semibold text-[#F8FAFC]">Click to select file (.txt, .md, .json)</div>
            <div className="text-[11px] text-[#94A3B8]">Text extraction, up to 2 MB</div>
            <input
              type="file"
              accept=".txt,.md,.json,text/plain,text/markdown,application/json"
              onChange={handleFileUpload}
              className="opacity-0 absolute inset-0 cursor-pointer"
            />
          </div>

          {uploadError && <p role="alert" className="text-xs text-rose-300">{uploadError}</p>}

          {uploadedFileName && (
            <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
              <span className="font-semibold">{uploadedFileName}</span>
              <CheckCircle size={15} className="text-emerald-400" />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#94A3B8]">Document Preview / Extracted Text</label>
            <textarea
              rows={5}
              value={uploadContent}
              onChange={(e) => setUploadContent(e.target.value)}
              placeholder="Extracted file text will appear here..."
              className="mt-1 w-full bg-[#0B0D12] border border-[#232936] rounded-lg px-3 py-2 font-mono text-xs text-[#F8FAFC] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!uploadedFileName || !uploadContent.trim()}
              onClick={handleImportDocument}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              Import as Study Note
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isQuestionsModalOpen} onClose={() => setIsQuestionsModalOpen(false)} title="AI practice questions" maxWidth="3xl">
        <div className="max-h-[70vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[#F8FAFC]">
          {generatedQuestions}
        </div>
      </Modal>
    </div>
  );
};
