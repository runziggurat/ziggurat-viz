import { useOs } from '@mantine/hooks';

export const parseJSON = (text?: string) => {
    if (!text) return
    try {
        return JSON.parse(text);
    } catch (err) {
        return
    }
}

export const isInt = (str?: string): boolean => str ? !isNaN(parseInt(str)) : false


export const capitalize = (str?: string) => {
    if (!str) return ""
    return str[0].toLocaleUpperCase() + str.slice(1)
}

export const useIsMobile = () => {
    const os = useOs()
    if (os === 'android' || os === 'ios') return true
    return false
}