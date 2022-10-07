import { openConfirmModal } from '@mantine/modals'
import { Text } from '@mantine/core'

interface Opts {
  body?: string
  confirmLabel?: string
}

export const showAlert = (title: string, { body, confirmLabel }: Opts = {}) => {
  return openConfirmModal({
    closeOnEscape: true,
    withCloseButton: true,
    closeOnClickOutside: false,
    zIndex: 1000,
    centered: true,
    shadow: 'lg',
    title,
    children: body && <Text size="sm">{body}</Text>,
    labels: { cancel: undefined, confirm: confirmLabel || 'OK' },
    cancelProps: { hidden: true },
    styles: {
      header: { marginBottom: !body ? 0 : undefined },
      close: { opacity: 0, zIndex: -1 },
    },
  })
}
