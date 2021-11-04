export async function asyncLoop(
    asyncCallback: () => Promise<boolean>,
    milliseconds: number,
    immediateFirstCall = false
): Promise<void> {
    let keepLooping = true

    if (immediateFirstCall) {
        keepLooping = await asyncCallback()
    }

    while (keepLooping) {
        await wait(milliseconds).then(async () => {
            keepLooping = await asyncCallback()
        })
    }
}

export function wait(milliseconds: number): Promise<void> {
    const promise: Promise<void> = new Promise((resolve) => {
        setTimeout(resolve, milliseconds)
    })
    return promise
}
