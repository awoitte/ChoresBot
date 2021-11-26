import React, { useEffect, useState } from 'react'
import * as routes from '../../../src/routes'
import { Link, generatePath } from 'react-router-dom'

export default function ChoresList(): JSX.Element {
    const [loaded, setLoaded] = useState(false)
    const [chores, setChores] = useState<string[]>([])
    const [error, setError] = useState<Error | undefined>(undefined)

    useEffect(() => {
        const request = new Request(routes.choresListAPI)
        fetch(request)
            .then((result) => result.json())
            .then(setChores)
            .catch(setError)
            .finally(() => setLoaded(true))
    }, []) // `[]` means "do once"

    if (!loaded) {
        return <p>loading...</p>
    }

    if (error !== undefined) {
        return <p>Error loading chores: {error.message}</p>
    }

    let content
    if (chores.length === 0) {
        content = <p>No Chores Found</p>
    } else {
        content = (
            <ul>
                {chores.map((choreName) => (
                    <li key={choreName}>
                        <Link
                            to={generatePath(routes.choreInfoPage, {
                                choreName
                            })}
                        >
                            {choreName}
                        </Link>
                    </li>
                ))}
            </ul>
        )
    }

    return (
        <div>
            <h4 className="header">ChoresList</h4>
            {content}
        </div>
    )
}
