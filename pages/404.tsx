import { Center, Stack, Text } from '@mantine/core'
import { Link } from '../components/link'
import { Navbar } from '../components/navbar'

const NotFound = () => {
  return (
    <Navbar>
      <Center style={{ height: '100%' }}>
        <Stack align="center" spacing="xs">
          <Text size="sm">404 - Page Not Found</Text>
          <Link href="/">Go Home</Link>
        </Stack>
      </Center>
    </Navbar>
  )
}

export default NotFound
