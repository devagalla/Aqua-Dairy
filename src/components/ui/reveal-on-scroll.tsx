'use client'

import {
  motion,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion'

const ease = [0.22, 1, 0.36, 1] as const

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease },
  },
}

type RevealContainerProps = HTMLMotionProps<'div'>
type RevealItemProps = HTMLMotionProps<'div'>

export function RevealContainer({
  children,
  className,
  ...props
}: RevealContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={containerVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  ...props
}: RevealItemProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={`will-change-[transform,opacity] ${className ?? ''}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
