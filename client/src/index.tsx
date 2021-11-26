import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

const containers = document.getElementsByClassName('container')
if (containers.length !== 1) {
    throw new Error('could not find container element')
}
const container = containers[0]

ReactDOM.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>,
    container
)
