;(async () => {
    const containers = document.getElementsByClassName('container')
    if (containers.length !== 1) {
        throw new Error('could not find container element')
    }
    const container = containers[0]

    const request = new Request('chores')

    const chores = await (await fetch(request)).json()

    for (const chore of chores) {
        const choreElement = document.createElement('div')
        choreElement.textContent = chore
        container.append(choreElement)
    }
})()
