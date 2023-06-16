import { useOs } from '@mantine/hooks';
import { showAlert } from './alert';

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
    if (isNaN(seconds)) return time.toString();
    if (seconds > 60) return (seconds / 60).toFixed(2) + 'm'
    if (seconds > (1 / 100)) return seconds.toFixed(2) + 's'
    return (seconds * 1000).toPrecision(2) + 'ms'
}

export const bound = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value))
}

export const normalize = (value: number, min: number = 0, max: number = 1) => {
    return bound((value - min) / (max - min), 0, 1)
}

export const useIsMobile = () => {
    const os = useOs()
    if (os === 'android' || os === 'ios') return true
    return false
}

export const getFileJson = async (file: File) => {
    if (!file.size) {
        showAlert('Error', { body: 'File is empty, please try again.' })
        return
    }
    const text = await file.text()
    let data = parseJSON(text)
    if (!text) {
        showAlert("Error", {
            body: "Invalid json file, please try again."
        })
        return
    }
    return data
}