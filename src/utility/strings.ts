import stringSimilarity from 'string-similarity'

export function toTitleCase(str: string): string {
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

export function bestMatch(
    original: string,
    matches: string[]
): string | undefined {
    if (matches.length === 0) {
        return undefined
    }

    return stringSimilarity.findBestMatch(original, matches).bestMatch.target
}
