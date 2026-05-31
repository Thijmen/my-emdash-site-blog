import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from "react";

type Item = {
	group: string;
	ico: string;
	label: string;
	href?: string;
	target?: string | null;
	action?: string;
};

type Props = {
	items: Item[];
	emailAddress?: string;
};

export default function CommandPalette({
	items: paletteItems,
	emailAddress,
}: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [activeIdx, setActiveIdx] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	const items = useMemo<Item[]>(() => {
		const q = query.toLowerCase().trim();
		const filtered = q
			? paletteItems.filter((it) => it.label.toLowerCase().includes(q))
			: paletteItems;
		if (!q) return filtered;
		return [
			{
				group: "Search",
				ico: "#",
				label: `Search posts for "${query}"`,
				href: `/search?q=${encodeURIComponent(query)}`,
			},
			...filtered,
		];
	}, [paletteItems, query]);

	const open = useCallback(() => {
		setIsOpen(true);
		setQuery("");
		setActiveIdx(0);
	}, []);

	const close = useCallback(() => setIsOpen(false), []);

	const select = useCallback(
		(item: Item) => {
			if (item.href) {
				if (item.target === "_blank") {
					window.open(item.href, "_blank", "noopener,noreferrer");
				} else {
					window.location.href = item.href;
				}
			} else if (item.action === "theme") {
				const root = document.documentElement;
				const isDark =
					root.classList.contains("dark") ||
					(!root.classList.contains("light") &&
						window.matchMedia("(prefers-color-scheme: dark)").matches);
				document
					.querySelector<HTMLButtonElement>(
						`.theme-btn[data-theme="${isDark ? "light" : "dark"}"]`,
					)
					?.click();
			} else if (item.action === "copy-email") {
				if (emailAddress) {
					navigator.clipboard.writeText(emailAddress).catch(() => {});
				}
			}
			close();
		},
		[close, emailAddress],
	);

	// Global keyboard handler
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setIsOpen((o) => !o);
				return;
			}
			if (!isOpen) return;
			switch (e.key) {
				case "Escape":
					e.preventDefault();
					close();
					break;
				case "ArrowDown":
					e.preventDefault();
					setActiveIdx((i) => Math.min(i + 1, items.length - 1));
					break;
				case "ArrowUp":
					e.preventDefault();
					setActiveIdx((i) => Math.max(i - 1, 0));
					break;
				case "Enter":
					e.preventDefault();
					if (items[activeIdx]) select(items[activeIdx]);
					break;
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, items, activeIdx, close, select]);

	// Focus input when opened
	useEffect(() => {
		if (isOpen) requestAnimationFrame(() => inputRef.current?.focus());
	}, [isOpen]);

	// Reset active index when items change
	useEffect(() => setActiveIdx(0), [items]);

	// Wire the Astro-rendered trigger button
	useEffect(() => {
		const trigger = document.getElementById("cmdk-trigger");
		if (!trigger) return;
		trigger.addEventListener("click", open);
		return () => trigger.removeEventListener("click", open);
	}, [open]);

	// Build grouped view
	const groups = useMemo(() => {
		const map = new Map<string, Item[]>();
		items.forEach((it) => {
			if (!map.has(it.group)) map.set(it.group, []);
			map.get(it.group)!.push(it);
		});
		return [...map.entries()];
	}, [items]);

	// Track a flat index across groups for activeIdx
	let cursor = 0;

	return (
		<div
			className={`cmdk-overlay${isOpen ? " is-open" : ""}`}
			aria-hidden={!isOpen}
			onClick={(e) => {
				if (e.target === e.currentTarget) close();
			}}
		>
			<div
				className="cmdk"
				role="dialog"
				aria-modal
				aria-label="Command palette"
			>
				<div className="cmdk-search-row">
					<span className="cmdk-prompt">$</span>
					<input
						ref={inputRef}
						type="text"
						className="cmdk-input"
						placeholder="jump anywhere, search posts…"
						autoComplete="off"
						spellCheck={false}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<kbd className="cmdk-esc-hint">esc</kbd>
				</div>

				<div className="cmdk-list" role="listbox">
					{groups.map(([label, groupItems]) => (
						<div key={label}>
							<div className="cmdk-group-label">{label}</div>
							{groupItems.map((item) => {
								const idx = cursor++;
								return (
									<div
										key={`${item.group}:${item.label}:${item.href ?? item.action ?? idx}`}
										className={`cmdk-item${idx === activeIdx ? " is-active" : ""}`}
										role="option"
										aria-selected={idx === activeIdx}
										onMouseEnter={() => setActiveIdx(idx)}
										onClick={() => select(item)}
									>
										<span className="cmdk-ico">{item.ico}</span>
										<span className="cmdk-label">{item.label}</span>
									</div>
								);
							})}
						</div>
					))}
					{items.length === 0 && (
						<div className="cmdk-empty">no results · esc to close</div>
					)}
				</div>

				<div className="cmdk-hint">
					<span>
						<kbd>↑↓</kbd> navigate
					</span>
					<span>
						<kbd>↵</kbd> select
					</span>
					<span>
						<kbd>esc</kbd> close
					</span>
				</div>
			</div>
		</div>
	);
}
