import { isDebugFlagSet } from "../utility/debug"

export default function log(message: string): void {

    if (isDebugFlagSet()) {
        console.log(message)
    }
}