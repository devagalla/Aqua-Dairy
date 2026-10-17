import NextLink from 'next/link'
import * as React from 'react'

type LinkProps = React.ComponentPropsWithoutRef<typeof NextLink>

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => <NextLink ref={ref} {...props} />,
)

Link.displayName = 'Link'
