import { Config } from '../models/config'

export default function log(message: string, config: Config): void {
    if (config.debug || config.verbose) {
        console.log(message)
    }
}
