'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { itemsApi } from '@/lib/api/items';
import { ApiClientError } from '@/lib/api/client';
import type { Item } from '@/lib/types/item';
import { cn } from '@/lib/utils/cn';

interface ItemSelectorProps {
  value: string;
  label?: string;
  disabled?: boolean;
  onSelect: (item: Item) => void;
}

interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

const DROPDOWN_MAX_HEIGHT = 224; // ~max-h-56
const DROPDOWN_GAP = 4;
const DROPDOWN_MIN_WIDTH = 280;

export const ItemSelector = ({
  value,
  label,
  disabled = false,
  onSelect,
}: ItemSelectorProps) => {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = (): void => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_GAP - 8;
    const spaceAbove = rect.top - DROPDOWN_GAP - 8;
    const openUpward = spaceBelow < 160 && spaceAbove > spaceBelow;
    const available = openUpward ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(120, Math.min(DROPDOWN_MAX_HEIGHT, available));
    const width = Math.max(rect.width, Math.min(DROPDOWN_MIN_WIDTH, window.innerWidth - 16));

    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }

    if (openUpward) {
      setPosition({
        bottom: window.innerHeight - rect.top + DROPDOWN_GAP,
        left,
        width,
        maxHeight,
      });
    } else {
      setPosition({
        top: rect.bottom + DROPDOWN_GAP,
        left,
        width,
        maxHeight,
      });
    }
  };

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    updatePosition();

    const handleReposition = (): void => {
      updatePosition();
    };

    window.addEventListener('resize', handleReposition);
    // Capture scroll from any scrollable ancestor (table overflow-x, page, etc.).
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
          const response = await itemsApi.list({
            page: 1,
            limit: 20,
            search: search.trim(),
            type: 'all',
            status: 'active',
            stockStatus: 'all',
            category: '',
            sortBy: 'name',
            sortOrder: 'asc',
          });

          if (!cancelled) {
            setOptions(response.items);
            setHighlightIndex(0);
          }
        } catch (err) {
          if (!cancelled) {
            setOptions([]);
            setLoadError(err instanceof ApiClientError ? err.message : 'Unable to load items.');
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, search]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;
      const inInput = containerRef.current?.contains(target);
      const inList = listRef.current?.contains(target);

      if (!inInput && !inList) {
        setOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const displayValue = open ? search : (label ?? '');

  const selectItem = (item: Item): void => {
    onSelect(item);
    setOpen(false);
    setSearch(item.name);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      setSearch(label ?? '');
      return;
    }

    if (!open) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, Math.max(options.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = options[highlightIndex];
      if (option) {
        selectItem(option);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const dropdown =
    mounted && open && position
      ? createPortal(
          <div
            ref={listRef}
            id={`${listId}-list`}
            role="listbox"
            className="fixed z-[80] overflow-y-auto rounded-md border border-[#E5E7EB] bg-white shadow-lg"
            style={{
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            {isLoading ? (
              <p className="px-3 py-2 text-sm text-[#6B7280]">Searching...</p>
            ) : loadError ? (
              <p className="px-3 py-2 text-sm text-[#DC2626]">{loadError}</p>
            ) : options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[#6B7280]">No items found.</p>
            ) : (
              options.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={highlightIndex === index || value === item.id}
                  className={cn(
                    'flex w-full flex-col items-start px-3 py-2 text-left text-sm',
                    highlightIndex === index ? 'bg-[#FEF2F2]' : 'hover:bg-[#FAFAFA]',
                  )}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => selectItem(item)}
                >
                  <span className="font-medium text-[#111827]">{item.name}</span>
                  <span className="text-xs text-[#6B7280]">
                    {item.itemCode} · {item.type} · ₹{item.price.toFixed(2)}
                  </span>
                </button>
              ))
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative min-w-[180px]" ref={containerRef}>
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${listId}-list`}
        aria-autocomplete="list"
        disabled={disabled}
        value={displayValue}
        placeholder="Search item"
        onFocus={() => {
          setOpen(true);
          setSearch(label ?? '');
        }}
        onChange={(event) => {
          setSearch(event.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className="h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-2 text-sm text-[#111827] outline-none focus:border-[#D32F2F] focus:ring-2 focus:ring-[#D32F2F]/20 disabled:bg-[#FAFAFA]"
      />
      {dropdown}
    </div>
  );
};
