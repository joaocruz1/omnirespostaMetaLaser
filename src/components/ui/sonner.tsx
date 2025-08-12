"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      richColors
      closeButton
      duration={4000}
      expand={true}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "hsl(142 76% 36%)",
          "--success-text": "hsl(355 7% 97%)",
          "--success-border": "hsl(142 76% 36%)",
          "--error-bg": "hsl(0 84% 60%)",
          "--error-text": "hsl(355 7% 97%)",
          "--error-border": "hsl(0 84% 60%)",
          "--warning-bg": "hsl(38 92% 50%)",
          "--warning-text": "hsl(355 7% 97%)",
          "--warning-border": "hsl(38 92% 50%)",
          "--info-bg": "hsl(221 83% 53%)",
          "--info-text": "hsl(355 7% 97%)",
          "--info-border": "hsl(221 83% 53%)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:min-w-[320px] group-[.toaster]:max-w-[420px]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:rounded-md group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-colors",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:rounded-md group-[.toast]:hover:bg-muted/80 group-[.toast]:transition-colors",
          closeButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:opacity-70 group-[.toast]:transition-opacity group-[.toast]:hover:opacity-100 group-[.toast]:focus:opacity-100 group-[.toast]:focus:outline-none group-[.toast]:focus:ring-2 group-[.toast]:focus:ring-ring group-[.toast]:focus:ring-offset-2 group-[.toast]:focus:ring-offset-background",
        },
        style: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          fontSize: '14px',
          fontWeight: '500',
          padding: '16px',
          minWidth: '320px',
          maxWidth: '420px',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
