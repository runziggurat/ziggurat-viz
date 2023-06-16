import { FileButton } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { FC, ReactElement, cloneElement, useRef } from 'react'

interface FilePickerProps {
  hotkey?: string
  handleFile: (file: File) => void
  element?: ReactElement
}

export const FilePicker: FC<FilePickerProps> = ({
  handleFile,
  element,
  hotkey = 'mod+shift+o',
}) => {
  const openFileRef = useRef<() => void>(() => {})
  const resetFileRef = useRef<() => void>(null)
  useHotkeys([[hotkey, openFileRef.current]])

  const _handleFile = async (file: File | null) => {
    resetFileRef.current?.()
    if (!file) {
      return
    }
    handleFile(file)
  }
  return (
    <FileButton
      resetRef={resetFileRef}
      onChange={_handleFile}
      accept="application/json"
    >
      {({ onClick }) => {
        openFileRef.current = onClick
        if (!element) return null
        return cloneElement(element, {
          onClick,
        })
      }}
    </FileButton>
  )
}
