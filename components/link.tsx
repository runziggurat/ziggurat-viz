import { FC, ReactNode } from 'react'
import NextLink, { LinkProps } from 'next/link'
import { Anchor } from '@mantine/core'

interface Props extends LinkProps {
  children: ReactNode
  external?: boolean
  className?: string
}

export const Link: FC<Props> = ({
  children,
  external,
  className,
  ...props
}) => {
  const extProps = external
    ? {
        target: '_blank',
        rel: 'noopener',
      }
    : {}
  return (
    <NextLink {...props} passHref>
      <Anchor {...extProps} className={className}>
        {children}
      </Anchor>
    </NextLink>
  )
}
