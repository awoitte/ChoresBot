export async function asyncLoop(
    asyncCallback: () => Promise<boolean>,
    milliseconds: number,
    immediateFirstCall = false,
    handleSIGINT = false
): Promise<void> {
    let keepLooping = true
    let cancel: () => void

    if (immediateFirstCall) {
        keepLooping = await asyncCallback()
    }

    if (handleSIGINT) {
        process.on('SIGINT', () => {
            if (cancel !== undefined) {
                cancel()
            }
        })
    }

    while (keepLooping) {
        const [loop, cancelWait] = wait(milliseconds)
        cancel = cancelWait
        await loop.then(async () => {
            keepLooping = await asyncCallback()
        })
    }
}

export function wait(milliseconds: number): [Promise<void>, () => void] {
    let timeout: NodeJS.Timeout
    const promise: Promise<void> = new Promise((resolve) => {
        timeout = setTimeout(resolve, milliseconds)
    })
    return [
        promise,
        () => {
            if (timeout !== undefined) clearTimeout(timeout)
        }
    ]
}
