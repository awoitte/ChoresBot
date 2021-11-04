import { isDebugFlagSet } from '../utility/debug'
import { verbose } from '../config.json'

export default function log(message: string): void {
    if (verbose || isDebugFlagSet()) {
        console.log(message)
    }
}
