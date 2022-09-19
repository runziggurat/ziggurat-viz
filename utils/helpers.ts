export const parseJSON = (text?: string) => {
    if (!text) return
    try {
        return JSON.parse(text);
    } catch (err) {
        return
    }
}