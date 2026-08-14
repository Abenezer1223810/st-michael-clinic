import { Search } from 'lucide-react';

export function SearchBar({ value, onChange, placeholder = 'Search…', className = '', autoFocus = false }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="input pl-9"
      />
    </div>
  );
}
