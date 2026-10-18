'use client'

import Link from 'next/link'
import {
  motion,
  type HTMLMotionProps,
} from 'framer-motion'
import type { ReactNode } from 'react'

const MotionLink = motion.create(Link)

const buttonVariants = {
  primary: 'border border-cyan-300/20 bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/20 hover:border-cyan-200/70 hover:bg-cyan-300',
  secondary: 'border border-slate-700 bg-slate-800/80 text-slate-100 hover:border-slate-500 hover:bg-slate-700',
  outline: 'border border-slate-700 bg-transparent text-slate-100 hover:border-cyan-400/60 hover:bg-cyan-400/10',
}

type AnimatedButtonBaseProps = {
  children: ReactNode
  className?: string
  variant?: keyof typeof buttonVariants
}

type AnimatedButtonProps = AnimatedButtonBaseProps & (
  | { href: string }
  | ({ href?: never } & HTMLMotionProps<'button'>)
)

export function AnimatedButton({
  children,
  className = '',
  variant = 'primary',
  ...props
}: AnimatedButtonProps) {
  const classes = `group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-200 ${buttonVariants[variant]} ${className}`
  const motionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.97 },
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
    className: classes,
  }

  if (typeof props.href === 'string') {
    return (
      <MotionLink href={props.href} {...motionProps}>
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-cyan-200/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="relative">{children}</span>
      </MotionLink>
    )
  }

  return (
    <motion.button type="button" {...props} {...motionProps}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-cyan-200/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative">{children}</span>
    </motion.button>
  )
}

type AnimatedCardProps = HTMLMotionProps<'article'> & {
  children: ReactNode
}

export function AnimatedCard({
  children,
  className = '',
  ...props
}: AnimatedCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-sm backdrop-blur-xl transition-[border-color,box-shadow] duration-200 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10 ${className}`}
      {...props}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/0 blur-3xl transition-colors duration-300 group-hover:bg-cyan-400/10" />
      <div className="relative">{children}</div>
    </motion.article>
  )
}
