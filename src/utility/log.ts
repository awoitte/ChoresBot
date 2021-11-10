import { isDebugFlagSet } from './debug'

export default function log(message: string): void {
    if (isDebugFlagSet() || process.env.VERBOSE === 'TRUE') {
        console.log(message)
    }
}
