import {
  Avatar,
  Group,
  Stack,
  Text,
  UnstyledButton,
  Menu,
  Title,
} from '@mantine/core'
import { IconChevronDown, IconPlus } from '@tabler/icons'
import { useRouter } from 'next/router'
import { FC, forwardRef, useState } from 'react'
import { networks, parseNetwork, ZiggNetwork } from '../utils/network'
import { bg, hover, text } from '../utils/theme'

const NetworkButton = forwardRef<
  HTMLButtonElement,
  { selectedItem?: ZiggNetwork }
>(({ selectedItem, ...rest }: { selectedItem?: ZiggNetwork }, ref) => {
  const image = selectedItem?.image
  const label = selectedItem?.label || 'Select Network'
  return (
    <UnstyledButton
      px="md"
      my={5}
      py={2}
      mx="sm"
      ref={ref}
      sx={theme => {
        const { spacing, radius } = theme
        return {
          display: 'block',
          width: '100%',
          padding: spacing.md,
          color: text(theme, true),
          borderRadius: radius.sm,
          userSelect: 'none',

          '&:hover': {
            backgroundColor: hover(bg(theme, true), theme),
          },
        }
      }}
      {...rest}
    >
      <Group noWrap>
        {image && <Avatar src={image} size="sm" radius="xl" />}
        <Title order={2}>{label}</Title>
        <IconChevronDown size={16} />
      </Group>
    </UnstyledButton>
  )
})

NetworkButton.displayName = 'NetworkButton'

export const NetworkSelector: FC = () => {
  const router = useRouter()
  const [selectedNetwork] = useState(parseNetwork(router.query))

  const item = (network: ZiggNetwork) => (
    <Group noWrap py="md">
      {network.image && <Avatar src={network.image} radius="xl" />}

      <Stack spacing={0}>
        <Text size="md">{network.label}</Text>
        <Text size="xs" color="dimmed">
          {network.description}
        </Text>
      </Stack>
    </Group>
  )
  return (
    <Menu
      width={225}
      shadow="md"
      styles={{
        item: {
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: '1.25rem',
          paddingTop: 0,
          paddingBottom: 0,
        },
        itemLabel: { flexGrow: 0, whiteSpace: 'nowrap' },
      }}
    >
      <Menu.Target>
        <NetworkButton selectedItem={selectedNetwork} />
      </Menu.Target>

      <Menu.Dropdown mt="xs">
        {networks
          .filter(it => it.value !== selectedNetwork?.value)
          .map(it => (
            <Menu.Item
              key={it.value}
              onClick={() => {
                window.location.pathname = `/${it.value}/home`
              }}
            >
              {item(it)}
            </Menu.Item>
          ))}

        <Menu.Item
          py="md"
          icon={<IconPlus size={18} />}
          component="a"
          target="_blank"
          rel="noopener noreferrer"
          href={'https://equilibrium.co/contact'}
        >
          Add your own network
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
