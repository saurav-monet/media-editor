# Media Editor - Copilot Instructions

This document provides guidance for working with the Media Editor project using GitHub Copilot.

## Project Overview

Media Editor is a Next.js web application for editing and converting:
- **Videos**: Adjust bitrate, audio quality, orientation
- **Images**: Resize, compress, rotate, convert formats
- **GIFs**: Create from videos, optimize existing GIFs

## Project Structure Rules

### File Organization
- `src/app/` - Next.js App Router pages
- `src/components/` - Reusable React components
- `src/app/[feature]/page.tsx` - Feature pages that import components
- Components are client-side with `'use client'` directive

### Component Patterns

**Page Components**:
```typescript
import Header from '@/components/Header';
import FeatureEditor from '@/components/FeatureEditor';

export default function FeaturePage() {
  return (
    <>
      <Header />
      <FeatureEditor />
    </>
  );
}
```

**Editor Components**:
- Use `'use client'` for interactivity
- State management with `useState`
- File input handling with `React.ChangeEvent<HTMLInputElement>`
- Settings controls with dropdowns, inputs, and sliders
- Processing logic with async/await

### Styling Guidelines

- Use Tailwind CSS classes exclusively
- Custom colors defined in `tailwind.config.js`
- Responsive design with `md:` breakpoints
- Color scheme:
  - Primary (Blue): `bg-blue-500`, `text-blue-500`
  - Secondary (Green): `bg-green-500`, `text-green-500`
  - Accent (Purple): `bg-purple-500`, `text-purple-500`

## Development Patterns

### Adding a New Editor Feature

1. Create editor component in `src/components/[Feature]Editor.tsx`
2. Create page at `src/app/[feature]-editor/page.tsx`
3. Add route link in home page (`src/app/page.tsx`)
4. Follow the established component structure with:
   - File upload section
   - Settings controls
   - Processing summary
   - Help tips section

### State Management

Use React hooks for all state:
```typescript
const [file, setFile] = useState<File | null>(null);
const [setting, setSetting] = useState<string>('default');
```

### File Processing

All editors follow this pattern:
```typescript
const handleProcess = async () => {
  if (!file) return alert('No file selected');
  setIsProcessing(true);
  try {
    // Process logic here
    console.log('Settings:', { /* settings */ });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, delay));
    alert('Processing complete!');
  } catch (error) {
    alert('Error: ' + error);
  } finally {
    setIsProcessing(false);
  }
};
```

## Common Tasks

### Add a New Setting to an Editor

1. Add state: `const [setting, setSetting] = useState('value')`
2. Add to grid in settings section:
   ```typescript
   <div>
     <label className="block text-sm font-semibold text-gray-900 mb-2">
       Setting Name
     </label>
     <select
       value={setting}
       onChange={(e) => setSetting(e.target.value)}
       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
     >
       <option value="option1">Option 1</option>
       <option value="option2">Option 2</option>
     </select>
   </div>
   ```
3. Add to summary section
4. Include in console.log during processing

### Modify Colors

1. Update `tailwind.config.js` `theme.extend.colors`
2. Use new color names in components with Tailwind syntax
3. Example: `bg-custom-color-500`

### Add Help Content

In the Help section at bottom of each editor:
```typescript
<div>
  <strong>Setting Name:</strong> Description of what this does.
</div>
```

## Testing

### Manual Testing

1. Run `npm run dev`
2. Navigate to http://localhost:3000
3. Test each editor:
   - File upload functionality
   - Settings controls
   - Processing trigger
   - Summary display

### Browser Testing

Test in:
- Chrome
- Firefox
- Safari
- Edge

## Build & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Dependencies

Core dependencies already installed:
- `next@16.1.0`
- `react@19.0.0`
- `react-dom@19.0.0`
- `tailwindcss@3`
- TypeScript

To add new dependencies:
```bash
npm install package-name
```

## Important Notes

1. **No Backend Integration Yet**: All processing is simulated with timeouts
2. **Local File Processing**: When backend is added, files won't be uploaded
3. **Component Reusability**: Always create reusable components
4. **TypeScript**: Maintain strict type checking
5. **Accessibility**: Use semantic HTML and ARIA labels

## Common Issues & Solutions

### Port Already in Use
```bash
npm run dev -- -p 3001
```

### Module Not Found
1. Check import paths use `@/` alias
2. Verify file exists at specified location
3. Check file extensions (.tsx for React components)

### Styling Not Applied
1. Verify Tailwind classes are used correctly
2. Check `tailwind.config.js` includes the file
3. Restart dev server if adding new files

## Future Development Areas

1. Backend API for actual media processing
2. User authentication
3. Processing history
4. Batch operations
5. Advanced filters
6. Real-time preview

## Code Quality Standards

- Use TypeScript for type safety
- Follow component naming: PascalCase
- Use meaningful variable names
- Keep components focused and single-purpose
- Add comments for complex logic
- Test responsive behavior

## Resources

- Read `README.md` for project overview
- Check `package.json` for available scripts
- Review Next.js docs: https://nextjs.org/docs
- Tailwind reference: https://tailwindcss.com/docs

---

For questions about the Media Editor project, refer to the README.md and project comments.
