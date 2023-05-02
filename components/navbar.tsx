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
import { NextLink } from '@mantine/next'
import { IconChevronDown, IconExternalLink } from '@tabler/icons'
import { FC, ReactNode, useMemo } from 'react'
import Logo from '../public/logo.png'
import { CONTENT_MAX_WIDTH, NAV_MAX_WIDTH } from '../utils/constants'
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
    fontWeight: "bolder",
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
    link: 'https://github.com/runziggurat/zcash',
    label: 'GitHub',
  },
  {
    link: 'https://equilibrium.co/projects/ziggurat',
    label: 'Equilibrium',
  },
]

const Navigation: FC<NavbarProps> = ({ metaData: meta }) => {
  const { classes } = useStyles()
  if (!meta) {
    return null
  }
  const updated = meta.updated_at
    ? new Date(meta.updated_at).toDateString()
    : 'N/A'
  const UpdatedAt = () => {
    return (
      <Group spacing={3} align="center" noWrap position="right">
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
          radius={0}
          classNames={{
            root: classes.tabs,
            tab: classes.tab,
            tabsList: classes.tabsList,
          }}
          value={'home'}
          // onTabChange={value => router.push(`/${repo}/${value}`)}
        >
          <Tabs.List>
            <Tabs.Tab value="home">
              <Text className={classes.tabLabel}>home</Text>
            </Tabs.Tab>
            <Tabs.Tab value="other">
              <Text className={classes.tabLabel}>force</Text>
            </Tabs.Tab>
            <Tabs.Tab value="other">
              <Text className={classes.tabLabel}>geo</Text>
            </Tabs.Tab>
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
          <Container style={{ maxWidth: NAV_MAX_WIDTH }}>
            <div className={classes.inner}>
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
      <Container style={{ maxWidth: CONTENT_MAX_WIDTH }}>
        <Navigation metaData={metaData} />
      </Container>
      {children}
    </AppShell>
  )
}
