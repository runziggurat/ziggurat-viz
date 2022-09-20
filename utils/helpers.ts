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