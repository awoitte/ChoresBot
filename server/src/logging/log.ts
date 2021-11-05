import { isDebugFlagSet } from '../utility/debug'

export default function log(message: string): void {
    if (isDebugFlagSet() || process.env.VERBOSE === 'TRUE') {
        console.log(message)
    }
}
