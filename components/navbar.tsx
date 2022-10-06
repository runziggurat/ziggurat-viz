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
  MediaQuery,
  AppShell,
  Navbar as NavbarPrim,
  ScrollArea,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronDown, IconExternalLink } from '@tabler/icons'
import { FC, ReactNode } from 'react'
import Logo from '../public/logo.png'
import { Link } from './link'
import { NetworkSelector } from './network-selector'
import { ThemeSwitch } from './theme-switch'

const NAV_BREAKPOINT = 'xs' as const
const THEME_SWITCH_BREAKPOINT = 395 as const

const useStyles = createStyles(theme => ({
  header: {
    backgroundColor: theme.fn.variant({
      variant: 'filled',
      color: theme.primaryColor,
    }).background,
    borderBottom: 0,
    color: 'white',
    zIndex: 300,
  },

  inner: {
    height: 56,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  links: {
    [theme.fn.smallerThan(NAV_BREAKPOINT)]: {
      display: 'none',
    },
  },

  burger: {
    [theme.fn.largerThan(NAV_BREAKPOINT)]: {
      display: 'none',
    },
  },

  version: {
    background: theme.fn.darken(theme.colors[theme.primaryColor][5], 0.5),
    borderRadius: theme.spacing.lg,
    fontSize: 11,
    padding: '0 6px',
    fontFamily: theme.fontFamilyMonospace,
    boxShadow: theme.shadows.lg,
  },

  navSwitch: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    fontSize: theme.fontSizes.md,
    fontWeight: 500,
  },
  link: {
    lineHeight: 1,
    padding: '8px 12px',
    borderRadius: theme.radius.sm,
    textDecoration: 'none',
    color: theme.white,
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',

    [theme.fn.smallerThan(NAV_BREAKPOINT)]: {
      padding: `${theme.spacing.md}px`,
      margin: `2px 0`,
      borderRadius: theme.radius.md,
      fontSize: theme.fontSizes.md,
      '&:hover': {
        backgroundColor: theme.fn.lighten(
          theme.colorScheme === 'dark'
            ? theme.colors.dark[8]
            : theme.colors.blue[6],
          0.1
        ),
      },
    },
  },

  linkLabel: {
    marginRight: 5,
  },

  navbar: {
    backgroundColor: theme.fn.variant({
      variant: 'filled',
      color: theme.colorScheme === 'dark' ? 'dark' : 'blue',
    }).background,
    color: theme.white,
    zIndex: 400,
    padding: theme.spacing.sm,
    overscrollBehavior: 'contain',
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
  children?: ReactNode
}

export const Navbar: FC<NavbarProps> = ({ links, children }) => {
  const [opened, { toggle }] = useDisclosure(false)
  const { classes } = useStyles()

  const items = links.map(({ links, link, label, external = true }) => {
    const menuItems = links?.map(item => (
      <Menu.Item key={item.link}>{item.label}</Menu.Item>
    ))

    if (menuItems) {
      return (
        <Menu key={label} trigger="hover" exitTransitionDuration={0}>
          <Menu.Target>
            <Link href={link} className={classes.link} external>
              <span className={classes.linkLabel}>{label}</span>
              <IconChevronDown size={12} stroke={1.5} />
            </Link>
          </Menu.Target>
          <Menu.Dropdown>{menuItems}</Menu.Dropdown>
        </Menu>
      )
    }

    return (
      <Link key={label} external href={link} className={classes.link}>
        <Text mr="xs">{label}</Text>
        <IconExternalLink size={16} stroke={1.5} />
      </Link>
    )
  })

  return (
    <AppShell
      fixed
      padding={0}
      navbarOffsetBreakpoint={NAV_BREAKPOINT}
      asideOffsetBreakpoint={NAV_BREAKPOINT}
      header={
        <Header height={56} className={classes.header}>
          <Container>
            <div className={classes.inner}>
              <Center>
                <Image
                  title="Ziggurat"
                  alt="Logo"
                  src={Logo.src}
                  width={22}
                  height={22}
                />
                <NetworkSelector />
                <div className={classes.version}>
                  <Text>v0.0.0</Text>
                </div>
              </Center>
              <Center>
                <Group noWrap spacing={5} className={classes.links}>
                  {items}
                </Group>
                <MediaQuery
                  smallerThan={THEME_SWITCH_BREAKPOINT}
                  styles={{
                    display: 'none',
                  }}
                >
                  <ThemeSwitch />
                </MediaQuery>
                <Burger
                  opened={opened}
                  onClick={toggle}
                  className={classes.burger}
                  size="sm"
                  color="#fff"
                />
              </Center>
            </div>
          </Container>
        </Header>
      }
      navbar={
        <MediaQuery largerThan={NAV_BREAKPOINT} styles={{ display: 'none' }}>
          <NavbarPrim
            className={classes.navbar}
            width={{ base: '100%', [NAV_BREAKPOINT]: 0 }}
            hidden={!opened}
          >
            <MediaQuery
              largerThan={THEME_SWITCH_BREAKPOINT}
              styles={{
                display: 'none',
              }}
            >
              <div className={classes.navSwitch}>
                <Text>Toggle theme</Text>
                <ThemeSwitch />
              </div>
            </MediaQuery>
            <NavbarPrim.Section>{items}</NavbarPrim.Section>
          </NavbarPrim>
        </MediaQuery>
      }
    >
      {children}
    </AppShell>
  )
}
