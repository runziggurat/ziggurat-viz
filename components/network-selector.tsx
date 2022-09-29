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
import { FC, forwardRef, ReactNode, useState } from 'react'

const items: ItemProps[] = [
  {
    label: 'Zcash',
    value: 'zcash',
    default: true,
  },
  {
    label: 'Zebra',
    value: 'zebra',
  },
]

interface ItemProps {
  label: ReactNode
  value: string
  description?: string
  image?: string
  default?: boolean
}

const NetworkButton = forwardRef<
  HTMLButtonElement,
  { selectedItem?: ItemProps }
>(({ selectedItem, ...rest }: { selectedItem?: ItemProps }, ref) => {
  const image = selectedItem?.image
  const label = selectedItem?.label || 'Select network'
  return (
    <UnstyledButton
      px="md"
      my={5}
      py={2}
      mx="sm"
      ref={ref}
      sx={({
        colors,
        spacing,
        fn,
        colorScheme,
        primaryColor,
        radius,
        ...rest
      }) => ({
        display: 'block',
        width: '100%',
        padding: spacing.md,
        color: colors.gray[0],
        borderRadius: radius.sm,

        '&:hover': {
          backgroundColor:
            colorScheme === 'dark'
              ? fn.lighten(colors[primaryColor][8], 0.075)
              : fn.lighten(colors[primaryColor][6], 0.075),
        },
      })}
      {...rest}
    >
      <Group>
        {image && <Avatar src={image} size="sm" radius="xl" />}
        <Title order={2}>{label}</Title>
        <IconChevronDown size={16} />
      </Group>
    </UnstyledButton>
  )
})

NetworkButton.displayName = 'NetworkButton'

export const NetworkSelector: FC = () => {
  const [selectedItem, setSelectedItem] = useState(items.find(i => i.default))

  const item = (item: ItemProps) => (
    <Group noWrap py="xs">
      {item.image && <Avatar src={item.image} radius="xl" />}

      <Stack spacing={0}>
        <Text size="md">{item.label}</Text>
        <Text size="xs" color="dimmed">
          {item.description}
        </Text>
      </Stack>
    </Group>
  )
  console.log({ selectedItem })
  return (
    <Menu
      width={225}
      shadow="md"
      styles={{
        item: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: '1.25rem',
        },
        itemLabel: { flexGrow: 0, whiteSpace: 'nowrap' },
      }}
    >
      <Menu.Target>
        <NetworkButton selectedItem={selectedItem} />
      </Menu.Target>

      <Menu.Dropdown mt="xs">
        {items
          .filter(it => it.value !== selectedItem?.value)
          .map(it => (
            <Menu.Item
              key={it.value}
              onClick={() =>
                alert('You have selected the unbuilt road travellar.')
              }
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
          href={'https://github.com/runziggurat'}
        >
          Add your own network
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
