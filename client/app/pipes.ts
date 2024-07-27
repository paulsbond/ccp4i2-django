export function shortDate(date: Date | string): string {
    if (typeof date === 'string')
        date = new Date(date);
    const now = new Date();
    if (date.getFullYear() != now.getFullYear())
        return date.toLocaleString([], { year: 'numeric', month: 'short' });
    if (date.getMonth() != now.getMonth() || date.getDate() != now.getDate())
        return date.toLocaleString([], { month: 'short', day: 'numeric' });
    return date.toLocaleString([], { timeStyle: 'short' });
}
