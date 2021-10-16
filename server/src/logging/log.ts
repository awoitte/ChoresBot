export default function log(message: string): void {
    const debugFlag = process.env.DEBUG

    if (debugFlag !== undefined && debugFlag !== '' && debugFlag.toLowerCase() != 'false') {
        console.log(message)
    }
}