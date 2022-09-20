import {
  createStyles,
  Header,
  Menu,
  Group,
  Center,
  Burger,
  Container,
  Image,
  Text,
  Box,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronDown, IconExternalLink } from '@tabler/icons'
import { FC } from 'react'
import Logo from '../public/logo.png'

const useStyles = createStyles(theme => ({
  header: {
    backgroundColor: theme.fn.variant({
      variant: 'filled',
      color: theme.primaryColor,
    }).background,
    borderBottom: 0,
    color: 'white',
  },

  inner: {
    height: 56,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  links: {
    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },

  burger: {
    [theme.fn.largerThan('sm')]: {
      display: 'none',
    },
  },

  link: {
    display: 'block',
    lineHeight: 1,
    padding: '8px 12px',
    borderRadius: theme.radius.sm,
    textDecoration: 'none',
    color: theme.white,
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,

    '&:hover': {
      backgroundColor: theme.fn.lighten(
        theme.fn.variant({ variant: 'filled', color: theme.primaryColor })
          .background!,
        0.1
      ),
    },
  },

  linkLabel: {
    marginRight: 5,
  },
}))

type Link = {
  link: string
  label: string
  external?: boolean
  links?: Link[]
}
export interface NavbarProps {
  links: Link[]
}

export const Navbar: FC<NavbarProps> = ({ links }) => {
  const [opened, { toggle }] = useDisclosure(false)
  const { classes } = useStyles()

  const items = links.map(({ links, link, label, external = true }) => {
    const menuItems = links?.map(item => (
      <Menu.Item key={item.link}>{item.label}</Menu.Item>
    ))

    const extProps = external
      ? {
          target: '_blank',
          rel: 'noopener',
        }
      : {}

    if (menuItems) {
      return (
        <Menu key={label} trigger="hover" exitTransitionDuration={0}>
          <Menu.Target>
            <a href={link} className={classes.link} {...extProps}>
              <Center>
                <span className={classes.linkLabel}>{label}</span>
                <IconChevronDown size={12} stroke={1.5} />
              </Center>
            </a>
          </Menu.Target>
          <Menu.Dropdown>{menuItems}</Menu.Dropdown>
        </Menu>
      )
    }

    return (
      <a key={label} href={link} className={classes.link} {...extProps}>
        <Center>
          <Text mr="xs">{label}</Text>
          <IconExternalLink size={16} stroke={1.5} />
        </Center>
      </a>
    )
  })

  return (
    <Header height={56} className={classes.header}>
      <Container>
        <div className={classes.inner}>
          {/* <MantineLogo size={28} inverted /> */}
          <Center>
            <Image alt="Logo" src={Logo.src} width={22} height={22} />
            <Text ml="sm" size="lg" transform="capitalize">
              Explorer
            </Text>
          </Center>
          <Group spacing={5} className={classes.links}>
            {items}
          </Group>
          <Burger
            opened={opened}
            onClick={toggle}
            className={classes.burger}
            size="sm"
            color="#fff"
          />
        </div>
      </Container>
    </Header>
  )
}
