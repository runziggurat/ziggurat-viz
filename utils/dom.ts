export const element = (id: string) => {
    const el = document.getElementById(id)
    return {
        setStyle<K extends keyof CSSStyleDeclaration>(style: K, value: CSSStyleDeclaration[K]) {
            if (el) {
                el.style[style] = value
            }
            return this
        },
        setText(text: string) {
            if (el) {
                el.textContent = text
            }
            return this
        }
    }
}