import {
  Switch,
  Group,
  useMantineTheme,
  useMantineColorScheme,
  GridProps,
} from '@mantine/core'
import { IconSun, IconMoonStars } from '@tabler/icons'
import { FC } from 'react'

export const ThemeSwitch: FC<Partial<GridProps>> = props => {
  const theme = useMantineTheme()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  return (
    <Group position="center" ml="md" {...props}>
      <Switch
        size="lg"
        onChange={() => toggleColorScheme()}
        checked={colorScheme === 'light'}
        color={colorScheme === 'dark' ? 'gray' : 'dark'}
        onLabel={
          <IconSun size={24} stroke={2.5} color={theme.colors.yellow[4]} />
        }
        offLabel={
          <IconMoonStars size={24} stroke={2.5} color={theme.colors.blue[6]} />
        }
      />
    </Group>
  )
}
