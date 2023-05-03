import { MantineTheme } from '@mantine/core';
import { NAVBAR_COLOR_MODE } from './constants';

export const bg = ({ colors, colorScheme, white, fn, primaryColor }: MantineTheme, isFilled = false) => {
    if (isFilled && NAVBAR_COLOR_MODE === 'filled') {
        return fn.variant({
            variant: 'filled',
            color: primaryColor,
        }).background!
    }
    return colorScheme === 'dark'
        ? colors.dark[7]
        : white
}

export const hover = (color: string, { colorScheme, fn }: MantineTheme) => {
    return colorScheme === 'dark' ? fn.lighten(color, .05) : fn.darken(color, .05)
}

export const secondary = (color: string, { colorScheme, fn }: MantineTheme) => {
    return colorScheme === 'dark' ? fn.lighten(color, .1) : fn.darken(color, .1)
}

export const text = ({ colorScheme, colors, black, white }: MantineTheme, isFilled = false) => {
    if (isFilled && NAVBAR_COLOR_MODE === "filled") return white;
    return colorScheme === 'dark' ? colors.gray[2] : black
}