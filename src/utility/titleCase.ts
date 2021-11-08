export default function toTitleCase(str: string): string {
    return str
        .split(' ')
        .map((w) => {
            if (w.length > 1) {
                return w[0].toUpperCase() + w.substr(1).toLowerCase()
            } else {
                return w.toUpperCase()
            }
        })
        .join(' ')
}
