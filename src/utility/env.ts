export function isEnvFlagSet(flagName: string): boolean {
    const flag = process.env[flagName]

    return flag !== undefined && flag !== '' && flag.toLowerCase() != 'false'
}
