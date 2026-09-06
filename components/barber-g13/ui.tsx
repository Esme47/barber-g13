export const Icon = { Grid: () => <span>▦</span>, Calendar: () => <span>◫</span>, Users: () => <span>♙</span>, Scissors: () => <span>✂</span>, Wallet: () => <span>◈</span>, Settings: () => <span>⚙</span>, Menu: () => <span>☰</span>, Plus: () => <span>＋</span>, ArrowLeft: () => <span>‹</span>, ArrowRight: () => <span>›</span>, Close: () => <span>×</span>, Phone: () => <span>☎</span>, Search: () => <span>⌕</span>, Edit: () => <span>✎</span> };

export const hours = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];

export const getInitials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

export const formatCurrency = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export const formatDate = (date: Date) => date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
