import {
  Switch,
  Group,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core'
import { IconSun, IconMoonStars } from '@tabler/icons'

export const ThemeSwitch = () => {
  const theme = useMantineTheme()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  return (
    <Group position="center" mx="md">
      <Switch
        size="lg"
        onChange={() => toggleColorScheme()}
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
