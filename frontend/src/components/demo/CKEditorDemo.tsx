import React, { useState } from 'react'
import CKEditorComponent from '../ui/CKEditor'

const CKEditorDemo: React.FC = () => {
  const [content, setContent] = useState('<h1>Welcome to AgentVoice!</h1><p>This is a <strong>demo</strong> of CKEditor integration.</p>')
  const [isHtml, setIsHtml] = useState(true)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">CKEditor Demo</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isHtml}
              onChange={(e) => setIsHtml(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">HTML Editor</span>
          </label>
        </div>

        {isHtml ? (
          <CKEditorComponent
            value={content}
            onChange={setContent}
            placeholder="Enter your content here..."
            height={400}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your content here..."
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
          />
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Preview:</h3>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">HTML Source:</h3>
          <pre className="text-sm text-gray-600 overflow-x-auto">
            {content}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default CKEditorDemo
