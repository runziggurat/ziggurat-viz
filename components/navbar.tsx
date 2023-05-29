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
  Tabs,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import NextLink from 'next/link'
import { IconChevronDown, IconExternalLink } from '@tabler/icons'
import { FC, ReactNode } from 'react'
import Logo from '../public/logo.png'
import {
  CONTENT_MAX_WIDTH,
  NAVBAR_COLOR_MODE,
  NAVBAR_HEIGHT,
  NAV_BREAKPOINT,
  NAV_MAX_WIDTH,
  THEME_SWITCH_BREAKPOINT,
} from '../utils/constants'
import { Link } from './link'
import { NetworkSelector } from './network-selector'
import { ThemeSwitch } from './theme-switch'
import { bg, hover, secondary, text } from '../utils/theme'
import { parseNetwork } from '../utils/network'
import { useRouter } from 'next/router'

const useStyles = createStyles(theme => ({
  header: {
    borderBottom: 0,
    color: text(theme, { isFilled: true }),
    zIndex: 300,
  },

  topbar: {
    backgroundColor: bg(theme, true),
    height: 56,
    display: 'flex',
    flexDirection: 'row',
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
    background: secondary(bg(theme, true), theme),
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
    color: text(theme, { isFilled: true }),
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
      color: text(theme),
      '&:hover': {
        backgroundColor: hover(bg(theme), theme),
      },
    },
  },

  linkLabel: {
    marginRight: 5,
  },

  navbar: {
    backgroundColor:
      theme.colorScheme === 'dark'
        ? theme.fn.darken(bg(theme), 0.25)
        : theme.white,
    zIndex: 400,
    padding: theme.spacing.sm,
    overscrollBehavior: 'contain',
  },
  tabs: {},

  tabLabel: {
    ':hover': {
      textDecoration: 'underline',
    },
  },

  tabsList: {
    borderBottom: '0 !important',
  },

  tab: {
    fontWeight: 'bolder',
    height: 35,
  },
}))

type Link = {
  link: string
  label: string
  external?: boolean
  links?: Link[]
}
export interface NavbarProps {
  links?: Link[]
  children?: ReactNode
  metaData?: any
}

const defaultLinks: Link[] = [
  {
    link: 'https://github.com/runziggurat',
    label: 'GitHub',
  },
  {
    link: 'https://equilibrium.co/projects/ziggurat',
    label: 'Equilibrium',
  },
]

const Navigation: FC<NavbarProps> = ({ metaData: meta }) => {
  const { classes } = useStyles()
  const router = useRouter()
  const network = parseNetwork(router.query)?.value
  if (!network) {
    return null
  }
  const updated = meta?.updated_at
    ? new Date(meta.updated_at).toDateString()
    : 'N/A'
  const UpdatedAt = () => {
    return (
      <Group
        spacing={3}
        align="center"
        noWrap
        position="right"
        sx={theme => ({ color: text(theme) })}
      >
        <Text color="dimmed" size={11}>
          Updated
        </Text>
        <Text italic size={11}>
          {updated}
        </Text>
      </Group>
    )
  }

  const Links = () => {
    return (
      <Group spacing="xs" align="center">
        <Tabs
          radius={NAVBAR_COLOR_MODE === 'filled' ? 0 : 'sm'}
          classNames={{
            root: classes.tabs,
            tab: classes.tab,
            tabsList: classes.tabsList,
          }}
          value={router.pathname.split('/')[2] || 'home'}
          onTabChange={page => {
            router.push(`/${network}/${page}`)
          }}
        >
          <Tabs.List>
            <NextLink legacyBehavior href={`/${network}/home`}>
              <Tabs.Tab value="home">
                <Text className={classes.tabLabel}>home</Text>
              </Tabs.Tab>
            </NextLink>
            <NextLink legacyBehavior href={`/${network}/force`}>
              <Tabs.Tab value="force" title="May the force be with you!">
                <Text className={classes.tabLabel}>force</Text>
              </Tabs.Tab>
            </NextLink>
            <NextLink legacyBehavior href={`/${network}/geo`}>
              <Tabs.Tab value="geo">
                <Text className={classes.tabLabel}>geo</Text>
              </Tabs.Tab>
            </NextLink>
          </Tabs.List>
        </Tabs>
      </Group>
    )
  }
  return (
    <Group position="apart" spacing="xs" mt={3} mb={-4}>
      <Links />
      <UpdatedAt />
    </Group>
  )
}

export const Navbar: FC<NavbarProps> = ({
  links = defaultLinks,
  children,
  metaData,
}) => {
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
      <Link
        key={label}
        external={external}
        href={link}
        className={classes.link}
      >
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
        <Header height={NAVBAR_HEIGHT} className={classes.header}>
          <div className={classes.topbar}>
            <Container style={{ maxWidth: NAV_MAX_WIDTH, width: '100%' }}>
              <Group position="apart">
                <Center>
                  <NextLink href="/" legacyBehavior>
                    <Image
                      title="Ziggurat"
                      alt="Logo"
                      src={Logo.src}
                      width={22}
                      height={22}
                    />
                  </NextLink>
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
                    ml="sm"
                    opened={opened}
                    onClick={toggle}
                    className={classes.burger}
                    size="sm"
                    color="#fff"
                  />
                </Center>
              </Group>
            </Container>
          </div>
          <Container style={{ maxWidth: CONTENT_MAX_WIDTH }}>
            <Navigation metaData={metaData} />
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
