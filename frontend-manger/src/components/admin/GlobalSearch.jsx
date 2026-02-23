'use client';

import apiClient from '@/lib/axios';
import { Building, GraduationCap, Loader2, Search, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const typeConfig = {
    student: { icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
    teacher: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-100' },
    classroom: { icon: Building, color: 'text-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-100' },
};

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const debounceRef = useRef(null);
    const router = useRouter();

    // Flatten results for keyboard nav
    const flatItems = results
        ? [...(results.students || []), ...(results.teachers || []), ...(results.classrooms || [])]
        : [];

    // Debounced search
    const performSearch = useCallback(async (q) => {
        if (!q || q.trim().length < 2) {
            setResults(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await apiClient.get('/api/admin/search', { params: { q: q.trim() } });
            setResults(res.data);
            setActiveIndex(-1);
        } catch {
            setResults(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (query.trim().length >= 2) {
            setIsLoading(true);
            debounceRef.current = setTimeout(() => performSearch(query), 300);
        } else {
            setResults(null);
            setIsLoading(false);
        }
        return () => clearTimeout(debounceRef.current);
    }, [query, performSearch]);

    // Ctrl+K / Cmd+K shortcut
    useEffect(() => {
        const handleKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    // Click outside
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const navigateTo = (path) => {
        setIsOpen(false);
        setQuery('');
        setResults(null);
        router.push(path);
    };

    // Keyboard nav
    const handleKeyDown = (e) => {
        if (!isOpen || flatItems.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => (i < flatItems.length - 1 ? i + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => (i > 0 ? i - 1 : flatItems.length - 1));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            navigateTo(flatItems[activeIndex].path);
        }
    };

    const hasResults = results && (results.students?.length || results.teachers?.length || results.classrooms?.length);
    const noResults = results && !hasResults && query.trim().length >= 2;

    const renderGroup = (items, label, startIndex) => {
        if (!items || items.length === 0) return null;
        return (
            <div>
                <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                {items.map((item, i) => {
                    const globalIndex = startIndex + i;
                    const cfg = typeConfig[item.type] || typeConfig.student;
                    const Icon = cfg.icon;
                    return (
                        <button
                            key={`${item.type}-${item.id}`}
                            onClick={() => navigateTo(item.path)}
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors rounded-lg mx-1 ${activeIndex === globalIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                                }`}
                            style={{ width: 'calc(100% - 8px)' }}
                        >
                            <div className={`p-2 rounded-lg ${cfg.bg} ring-1 ${cfg.ring}`}>
                                <Icon size={16} className={cfg.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                                {item.subtitle && (
                                    <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                                )}
                            </div>
                            <span className="text-[10px] font-medium text-slate-300 uppercase shrink-0">{item.type}</span>
                        </button>
                    );
                })}
            </div>
        );
    };

    const studentsStartIndex = 0;
    const teachersStartIndex = (results?.students?.length || 0);
    const classroomsStartIndex = teachersStartIndex + (results?.teachers?.length || 0);

    return (
        <div ref={containerRef} className="relative flex-1 max-w-md mx-4">
            {/* Search Input */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search students, teachers..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-10 pl-9 pr-16 text-sm bg-slate-100 border border-slate-200/80 rounded-xl placeholder:text-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 focus:bg-white transition-all"
                />
                {query ? (
                    <button
                        onClick={() => { setQuery(''); setResults(null); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        <X size={14} />
                    </button>
                ) : (
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-200/70 text-[10px] font-medium text-slate-400 border border-slate-300/50">
                        Ctrl K
                    </kbd>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (query.trim().length >= 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 size={20} className="animate-spin text-blue-500" />
                            <span className="ml-2 text-sm text-slate-400">Searching...</span>
                        </div>
                    )}

                    {!isLoading && hasResults && (
                        <div className="py-1.5 max-h-[350px] overflow-y-auto">
                            {renderGroup(results.students, 'Students', studentsStartIndex)}
                            {renderGroup(results.teachers, 'Teachers', teachersStartIndex)}
                            {renderGroup(results.classrooms, 'Classrooms', classroomsStartIndex)}
                        </div>
                    )}

                    {!isLoading && noResults && (
                        <div className="flex flex-col items-center py-8 px-4">
                            <Search size={28} className="text-slate-300 mb-2" />
                            <p className="text-sm font-medium text-slate-500">No results found</p>
                            <p className="text-xs text-slate-400 mt-0.5">Try a different search term</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
