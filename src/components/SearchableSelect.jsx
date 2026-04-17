import { useEffect, useId, useRef, useState } from "react";

/**
 * Accessible searchable dropdown (combobox-style).
 * @param {{ label: string, options: { value: string|number, label: string, disabled?: boolean }[], value: string|number|null, onChange: (v: string|number) => void, placeholder?: string, disabled?: boolean, emptyMessage?: string }} props
 */
export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Search…",
  disabled = false,
  emptyMessage = "No matches",
}) {
  const listId = useId();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const displayValue = open ? query : selected?.label ?? "";

  useEffect(() => {
    if (!open && selected) {
      setQuery(selected.label);
    }
    if (!open && !selected) {
      setQuery("");
    }
  }, [open, selected]);

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = options.filter((o) => o.label.toLowerCase().includes(q));

  function pick(option) {
    if (option.disabled) return;
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  }

  function onInputChange(e) {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter" && open && filtered.length === 1) {
      e.preventDefault();
      pick(filtered[0]);
    }
  }

  return (
    <div className="searchableSelect" ref={wrapRef}>
      <label className="searchableSelectLabel" htmlFor={listId + "-input"}>
        {label}
      </label>
      <input
        id={listId + "-input"}
        className="searchableSelectInput foodSearchInput"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onChange={onInputChange}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {open && !disabled && (
        <ul id={listId} className="searchableSelectList" role="listbox">
          {filtered.length === 0 ? (
            <li className="searchableSelectEmpty" role="presentation">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((opt) => (
              <li key={String(opt.value)}>
                <button
                  type="button"
                  role="option"
                  aria-disabled={opt.disabled || undefined}
                  aria-selected={opt.value === value}
                  disabled={opt.disabled}
                  className={`searchableSelectOption${opt.value === value ? " isSelected" : ""}${opt.disabled ? " isDisabled" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(opt)}
                >
                  {opt.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
