declare module "@tinymce/tinymce-react" {
  import * as React from "react"

  export interface EditorProps {
    apiKey?: string
    value?: string
    onEditorChange?: (content: string, editor: any) => void
    init?: Record<string, any>
    disabled?: boolean
  }

  export const Editor: React.FC<EditorProps>
}


