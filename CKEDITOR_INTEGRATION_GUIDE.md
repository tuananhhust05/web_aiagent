# CKEditor Integration Guide - AgentVoice Email Creation

## Tổng quan
CKEditor đã được tích hợp vào trang `/emails/create` để cung cấp rich text editor cho việc soạn email.

## Cài đặt

### 1. Cài đặt Dependencies
```bash
cd frontend
npm install @ckeditor/ckeditor5-react@^6.2.0 @ckeditor/ckeditor5-build-classic@^39.0.0
```

Hoặc chạy script:
```bash
./install_ckeditor.sh
```

### 2. Khởi động Development Server
```bash
npm run dev
```

## Cách sử dụng

### 1. Truy cập Email Creation
- Navigate to `/emails/create`
- Trong phần "Content", bạn sẽ thấy checkbox "HTML Editor"

### 2. Toggle HTML Editor
- **Unchecked**: Sử dụng textarea đơn giản (plain text)
- **Checked**: Sử dụng CKEditor (rich text với HTML)

### 3. CKEditor Features
Khi bật HTML Editor, bạn có thể sử dụng:

#### Text Formatting
- **Bold**, *Italic*, <u>Underline</u>, ~~Strikethrough~~
- Font size và font family
- Text color và background color

#### Lists & Alignment
- Bulleted lists
- Numbered lists
- Text alignment (left, center, right, justify)
- Indent/Outdent

#### Advanced Features
- Headings (H1, H2, H3, etc.)
- Links
- Block quotes
- Tables
- Undo/Redo

#### Preview Mode
- Click "Preview" button để xem email như người nhận sẽ thấy
- Click "Edit" để quay lại chế độ chỉnh sửa

## Cấu trúc Code

### 1. CKEditor Component
File: `frontend/src/components/ui/CKEditor.tsx`
- Reusable component
- Configurable height, placeholder, disabled state
- Console logging cho debugging

### 2. EmailCreate Integration
File: `frontend/src/pages/emails/EmailCreate.tsx`
- Toggle giữa textarea và CKEditor
- Preview mode
- State management cho content

## Configuration

### CKEditor Config
```typescript
config={{
  placeholder,
  toolbar: {
    items: [
      'heading', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
      'bulletedList', 'numberedList', '|',
      'outdent', 'indent', '|',
      'alignment', '|',
      'link', 'blockQuote', 'insertTable', '|',
      'undo', 'redo'
    ]
  },
  language: 'en',
  // ... more config
}}
```

### Styling
- Custom CSS cho CKEditor
- Responsive design
- Dark mode support
- Tailwind CSS integration

## Debugging

### Console Logs
Khi sử dụng CKEditor, bạn sẽ thấy:
```
📝 CKEditor is ready to use!
📝 CKEditor content changed: <p>Hello World</p>
📝 CKEditor focus
📝 CKEditor blur
```

### Common Issues

#### 1. CKEditor không load
**Triệu chứng**: Không thấy editor, chỉ thấy loading
**Giải pháp**: 
- Kiểm tra console errors
- Đảm bảo dependencies đã cài đặt
- Restart development server

#### 2. Styling issues
**Triệu chứng**: Editor trông không đúng
**Giải pháp**:
- Kiểm tra CSS conflicts
- Clear browser cache
- Kiểm tra Tailwind CSS

#### 3. Content không save
**Triệu chứng**: Nội dung mất khi toggle
**Giải pháp**:
- Kiểm tra state management
- Kiểm tra onChange handler
- Kiểm tra console logs

## Best Practices

### 1. Content Management
- Luôn validate HTML content trước khi gửi
- Sanitize user input để tránh XSS
- Backup content khi toggle modes

### 2. Performance
- CKEditor chỉ load khi cần thiết
- Debounce onChange events
- Cleanup editor instance khi unmount

### 3. User Experience
- Provide clear instructions
- Show character count
- Auto-save drafts
- Preview before sending

## Email Templates

### Sample HTML Email
```html
<h1>Welcome to AgentVoice!</h1>
<p>Dear <strong>{{name}}</strong>,</p>
<p>Thank you for joining our platform. Here's what you can do:</p>
<ul>
  <li>Create and manage campaigns</li>
  <li>Send personalized emails</li>
  <li>Track your results</li>
</ul>
<p>Best regards,<br>
<em>AgentVoice Team</em></p>
```

### Responsive Email
```html
<div style="max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; text-align: center;">Newsletter</h2>
  <p style="line-height: 1.6;">Your content here...</p>
</div>
```

## Testing

### Manual Testing
1. Toggle HTML Editor on/off
2. Test all toolbar buttons
3. Test preview mode
4. Test save/send functionality
5. Test responsive design

### Automated Testing
```typescript
// Example test
test('CKEditor toggles correctly', () => {
  render(<EmailCreate />)
  const checkbox = screen.getByLabelText('HTML Editor')
  fireEvent.click(checkbox)
  expect(screen.getByRole('textbox')).toBeInTheDocument()
})
```

## Troubleshooting

### Common Errors

#### 1. "CKEditor is not defined"
```bash
npm install @ckeditor/ckeditor5-react @ckeditor/ckeditor5-build-classic
```

#### 2. "Module not found"
```bash
npm install --save-dev @types/ckeditor__ckeditor5-react
```

#### 3. Styling conflicts
```css
/* Add to your CSS */
.ck-editor__editable {
  border: 1px solid #d1d5db !important;
}
```

## Support

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Kiểm tra network tab
3. Kiểm tra dependencies
4. Restart development server
5. Clear browser cache

## Next Steps

### Planned Features
- [ ] Email templates
- [ ] Image upload
- [ ] Custom toolbar
- [ ] Auto-save
- [ ] Spell check
- [ ] Multi-language support

### Performance Optimizations
- [ ] Lazy loading
- [ ] Code splitting
- [ ] Bundle optimization
- [ ] CDN integration
