export function DateToCron(date: Date): string {
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth();
    const dayOfWeek = date.getDay();
    
    return `${seconds} ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`
}