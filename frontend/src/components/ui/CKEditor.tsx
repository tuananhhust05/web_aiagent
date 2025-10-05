import React, { useEffect, useRef } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

interface CKEditorComponentProps {
  value: string
  onChange: (data: string) => void
  placeholder?: string
  height?: number
  disabled?: boolean
}

const CKEditorComponent: React.FC<CKEditorComponentProps> = ({
  value,
  onChange,
  placeholder = 'Enter content...',
  height = 300,
  disabled = false
}) => {
  const editorRef = useRef<any>(null)

  const handleEditorReady = (editor: any) => {
    editorRef.current = editor
    console.log('📝 CKEditor is ready to use!', editor)
  }

  const handleEditorChange = (event: any, editor: any) => {
    const data = editor.getData()
    console.log('📝 CKEditor content changed:', data)
    onChange(data)
  }

  const handleEditorBlur = (event: any, editor: any) => {
    console.log('📝 CKEditor blur')
  }

  const handleEditorFocus = (event: any, editor: any) => {
    console.log('📝 CKEditor focus')
  }

  return (
    <div className="ckeditor-wrapper">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        onReady={handleEditorReady}
        onChange={handleEditorChange}
        onBlur={handleEditorBlur}
        onFocus={handleEditorFocus}
        disabled={disabled}
        config={{
          placeholder,
          toolbar: {
            items: [
              'heading',
              '|',
              'bold',
              'italic',
              'underline',
              'strikethrough',
              '|',
              'fontSize',
              'fontFamily',
              'fontColor',
              'fontBackgroundColor',
              '|',
              'bulletedList',
              'numberedList',
              '|',
              'outdent',
              'indent',
              '|',
              'alignment',
              '|',
              'link',
              'blockQuote',
              'insertTable',
              '|',
              'undo',
              'redo'
            ]
          },
          language: 'en',
          image: {
            toolbar: [
              'imageTextAlternative',
              'imageStyle:full',
              'imageStyle:side'
            ]
          },
          table: {
            contentToolbar: [
              'tableColumn',
              'tableRow',
              'mergeTableCells'
            ]
          }
        }}
      />
      
      <style jsx global>{`
        .ckeditor-wrapper .ck-editor__editable {
          min-height: ${height}px;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
        }
        
        .ckeditor-wrapper .ck-editor__editable:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .ckeditor-wrapper .ck-editor__editable.ck-focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .ckeditor-wrapper .ck-editor__top {
          border: 1px solid #d1d5db;
          border-bottom: none;
          border-radius: 0.5rem 0.5rem 0 0;
        }
        
        .ckeditor-wrapper .ck-editor__main {
          border-radius: 0 0 0.5rem 0.5rem;
        }
        
        .ckeditor-wrapper .ck-editor__editable_inline {
          padding: 1rem;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .ckeditor-wrapper .ck-editor__editable {
            background-color: #1f2937;
            color: #f9fafb;
            border-color: #374151;
          }
          
          .ckeditor-wrapper .ck-editor__top {
            background-color: #1f2937;
            border-color: #374151;
          }
        }
      `}</style>
    </div>
  )
}

export default CKEditorComponent
