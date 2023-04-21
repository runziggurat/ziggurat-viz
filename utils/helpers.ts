import { useOs } from '@mantine/hooks';

type Maybe<T> = T | undefined | null

export const parseJSON = (text: Maybe<string>) => {
    if (!text) return
    try {
        return JSON.parse(text);
    } catch (err) {
        return
    }
}

export const isInt = (str: Maybe<string>): boolean => str ? Number.isInteger(+str) : false

export const capitalize = (str: Maybe<string>) => {
    if (!str) return ""
    return str[0].toLocaleUpperCase() + str.slice(1)
}

export const duration = (time: string) => {
    const seconds = Number(time)
    if (isNaN(seconds)) return time
    if (seconds > (1 / 100)) return seconds.toFixed(2) + 's'
    const ms = seconds * 1000
    return ms.toPrecision(2) + 'ms'
}

export const useIsMobile = () => {
    const os = useOs()
    if (os === 'android' || os === 'ios') return true
    return false
}
