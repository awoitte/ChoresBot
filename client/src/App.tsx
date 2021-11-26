import React, { Component } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import * as routes from '../../src/routes'
import ChoresList from './pages/chores-list'
import ChoreInfo from './pages/chore-info'

class App extends Component {
    render(): JSX.Element {
        return (
            <div className="App">
                <h1 className="header">ChoresBot</h1>
                <nav>
                    <Link to={routes.choresListPage}>Chores List</Link>
                </nav>
                <Routes>
                    <Route
                        path={routes.choresListPage}
                        element={<ChoresList />}
                    />
                    <Route
                        path={routes.choreInfoPage}
                        element={<ChoreInfo />}
                    />
                </Routes>
            </div>
        )
    }
}

export default App
