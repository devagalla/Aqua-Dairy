import * as React from 'react'

export function Card({
  className = '',
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={`rounded-lg border bg-white text-gray-950 shadow-sm ${className}`}
      {...props}
    />
  )
}

export function CardHeader({
  className = '',
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
}

export function CardTitle({
  className = '',
  ...props
}: React.ComponentPropsWithoutRef<'h2'>) {
  return <h2 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
}

export function CardContent({
  className = '',
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />
}
