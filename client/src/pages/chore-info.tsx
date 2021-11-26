import React, { useState, useEffect } from 'react'
import { useParams, generatePath } from 'react-router-dom'
import * as routes from '../../../src/routes'

export default function ChoreInfo(): JSX.Element {
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState<Error | undefined>(undefined)
    const [choreInfo, setChoreInfo] = useState('')
    const { choreName } = useParams()

    useEffect(() => {
        const request = new Request(
            generatePath(routes.choreInfoAPI, { choreName })
        )
        fetch(request)
            .then((result) => result.text())
            .then(setChoreInfo)
            .catch(setError)
            .finally(() => setLoaded(true))
    }, []) // `[]` means "do once"

    if (!loaded) {
        return <p>loading...</p>
    }

    if (error !== undefined) {
        return <p>Error loading chore: {error.message}</p>
    }

    return (
        <div>
            <h4 className="header">{choreName}</h4>
            <pre>{choreInfo}</pre>
        </div>
    )
}
