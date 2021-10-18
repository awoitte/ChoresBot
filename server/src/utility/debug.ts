export function isDebugFlagSet(): boolean {
    const debugFlag = process.env.DEBUG

    return (
        debugFlag !== undefined &&
        debugFlag !== '' &&
        debugFlag.toLowerCase() != 'false'
    )
}
