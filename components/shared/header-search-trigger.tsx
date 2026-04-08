"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type HeaderSearchTriggerProps = {
  placeholder: string;
  defaultValue?: string;
};

type SearchSuggestion = {
  code: string;
  name: string;
  sku: string;
  upc: string;
  imageUrl?: string;
  imageLabel: string;
  productPath?: string;
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="header-icon-svg" viewBox="0 0 24 24">
      <path
        d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l3.93 3.92a.75.75 0 1 0 1.06-1.06l-3.92-3.93A6.5 6.5 0 0 0 10.5 4Zm0 1.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HeaderSearchTrigger({
  placeholder,
  defaultValue = "",
}: HeaderSearchTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const quickLinks = ["Pokemon", "Bandai", "Kayou"] as const;

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingSuggestions(true);

      try {
        const query = new URLSearchParams({
          smart: trimmedValue,
        });
        const response = await fetch(`/api/catalog/search-suggestions?${query.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch search suggestions");
        }

        const payload = (await response.json()) as {
          items?: SearchSuggestion[];
        };

        setSuggestions(Array.isArray(payload.items) ? payload.items : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isOpen, value]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function submitSearch(term: string) {
    const trimmedTerm = term.trim();

    if (!trimmedTerm) {
      router.push("/catalog");
      setIsOpen(false);
      return;
    }

    const query = new URLSearchParams({
      smart: trimmedTerm,
    });

    router.push(`/catalog?${query.toString()}`);
    setIsOpen(false);
  }

  return (
    <div className="header-search-shell">
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Open search"
        className="header-search-trigger"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <SearchIcon />
      </button>

      {isOpen ? (
        <div
          className="header-search-overlay"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            className="header-search-dialog"
            onClick={(event) => event.stopPropagation()}
            ref={dialogRef}
            role="dialog"
          >
            <form
              className="header-search-panel"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch(value);
              }}
              role="search"
            >
              <div className="header-search-input-row">
                <span className="header-search-leading">
                  <SearchIcon />
                </span>
                <input
                  aria-label="Search catalog"
                  autoFocus
                  placeholder={placeholder}
                  onChange={(event) => setValue(event.target.value)}
                  suppressHydrationWarning
                  type="text"
                  value={value}
                />
                <button
                  className="header-search-submit"
                  type="submit"
                >
                  Search
                </button>
                <button
                  aria-label="Close search"
                  className="header-search-close"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  ESC
                </button>
              </div>

              <div className="header-search-body">
                {value.trim() ? (
                  <div className="header-search-results">
                    <div className="header-search-results-heading">
                      <p>Suggested results</p>
                      <button
                        className="header-search-view-all"
                        onClick={() => submitSearch(value)}
                        type="button"
                      >
                        View all results
                      </button>
                    </div>

                    {isLoadingSuggestions ? (
                      <div className="header-search-state">Searching...</div>
                    ) : suggestions.length > 0 ? (
                      <div className="header-search-results-list">
                        {suggestions.map((item) =>
                          item.productPath ? (
                            <Link
                              className="header-search-result"
                              href={item.productPath}
                              key={item.code}
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="header-search-result-media">
                                {item.imageUrl ? (
                                  <img
                                    alt={item.name}
                                    className="header-search-result-image"
                                    src={item.imageUrl}
                                  />
                                ) : (
                                  <span className="header-search-result-fallback">{item.imageLabel}</span>
                                )}
                              </div>
                              <div className="header-search-result-copy">
                                <strong>{item.name}</strong>
                                <span>SKU: {item.sku}</span>
                                <span>Barcode: {item.upc}</span>
                              </div>
                            </Link>
                          ) : (
                            <button
                              className="header-search-result"
                              key={item.code}
                              onClick={() => submitSearch(item.sku || item.name)}
                              type="button"
                            >
                              <div className="header-search-result-media">
                                {item.imageUrl ? (
                                  <img
                                    alt={item.name}
                                    className="header-search-result-image"
                                    src={item.imageUrl}
                                  />
                                ) : (
                                  <span className="header-search-result-fallback">{item.imageLabel}</span>
                                )}
                              </div>
                              <div className="header-search-result-copy">
                                <strong>{item.name}</strong>
                                <span>SKU: {item.sku}</span>
                                <span>Barcode: {item.upc}</span>
                              </div>
                            </button>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="header-search-state">
                        No matching products yet. Press Search to see the full result list.
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <p>Explore the collection</p>
                    <div className="header-search-tags">
                      {quickLinks.map((link) => (
                        <button
                          className="header-search-tag"
                          key={link}
                          onClick={() => submitSearch(link)}
                          type="button"
                        >
                          {link}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
