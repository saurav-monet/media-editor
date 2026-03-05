# Media Editor 🎬

A modern web application for editing and converting videos, images, and GIFs with an intuitive user interface.

## Features

### 🎥 Video Editor
- Adjust video bitrate (1000 kbps - 10000 kbps)
- Control audio bitrate (64 kbps - 320 kbps)
- Change video orientation (portrait, landscape, square, rotate)
- Convert to multiple formats (MP4, WebM, OGG, MOV)

### 🖼️ Image Editor
- Resize images with custom dimensions
- Quick presets for common resolutions (Thumbnail, Web, HD, Instagram, etc.)
- Compression quality control (10-100%)
- Image rotation and flipping
- Multiple format support (JPEG, PNG, WebP, GIF)

### 🎞️ GIF Editor
- Convert videos to animated GIFs
- Optimize existing GIFs
- Control frame rate (1-30 FPS)
- Adjust output dimensions
- Quality and optimization level settings
- Multiple optimization levels (Low, Medium, High, Extreme)

## Technology Stack

- **Frontend Framework**: Next.js 16.1.0 with React 19.0.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3
- **Linting**: ESLint
- **Package Manager**: npm

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Home page with navigation
│   ├── globals.css             # Global styles
│   └── [editors]/
│       ├── video-editor/
│       │   └── page.tsx        # Video editor page
│       ├── image-editor/
│       │   └── page.tsx        # Image editor page
│       └── gif-editor/
│           └── page.tsx        # GIF editor page
└── components/
    ├── Header.tsx              # Reusable header component
    ├── VideoEditor.tsx         # Video editor component
    ├── ImageEditor.tsx         # Image editor component
    └── GIFEditor.tsx           # GIF editor component
```

## Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm 9.0 or later

### Installation

1. Navigate to the project directory:
   ```bash
   cd "f:\Code\Media Editor"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Linting

Check for code quality issues:
```bash
npm run lint
```

## Usage

1. **Home Page**: Navigate through three main sections using the card-based interface
2. **Video Editor**: Upload a video, adjust bitrates and orientation, process the file
3. **Image Editor**: Upload an image, resize, compress, rotate, and convert formats
4. **GIF Editor**: Convert videos to GIFs or optimize existing GIFs with custom settings

## Features in Detail

### Video Editor
- **File Upload**: Drag and drop or click to upload video files
- **Bitrate Control**: Reduce file size by adjusting video and audio bitrates
- **Orientation Options**: Auto-detect, portrait, landscape, square, or manual rotation
- **Format Selection**: Choose from modern video formats
- **Processing Summary**: View all processing settings before execution

### Image Editor
- **Quick Presets**: One-click sizing for popular resolutions
- **Custom Sizing**: Manually enter width and height
- **Quality Slider**: Fine-tune compression level
- **Rotation Controls**: Rotate or flip images
- **Format Selection**: Support for web-friendly formats

### GIF Editor
- **Source Type Selection**: Optimize GIFs or convert from video
- **Frame Rate Control**: Smooth animations with balanced file size
- **Dimension Sizing**: Optimize for web or social media
- **Optimization Levels**: Choose between quality and compression
- **Real-time Settings**: See impact of changes on settings

## Component Architecture

### Header Component
Provides consistent navigation across all editor pages with branding.

### Editor Components
Each editor component includes:
- File upload interface
- Settings controls
- Real-time preview of settings
- Processing summary
- Helpful tips section

## Styling

The project uses Tailwind CSS for styling with custom color palette:
- Primary: Blue (#3B82F6)
- Secondary: Green (#10B981)
- Danger: Red (#EF4444)

All components are responsive and mobile-friendly.

## Future Enhancements

- [ ] Backend API integration for actual media processing
- [ ] User account system with processing history
- [ ] Batch processing capabilities
- [ ] Advanced filters and effects
- [ ] Real-time preview
- [ ] Download management
- [ ] Preset templates
- [ ] Social media integration

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, specify a different port:
```bash
npm run dev -- -p 3001
```

### Dependencies Issues
Clear node_modules and reinstall:
```bash
rm -r node_modules package-lock.json
npm install
```

## Contributing

This project is set up for local development. To contribute:

1. Make changes to components or pages
2. Test in development mode
3. Run linting: `npm run lint`
4. Build and verify: `npm run build`

## Configuration Files

- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS customization
- `postcss.config.js` - PostCSS configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - ESLint rules
- `package.json` - Dependencies and scripts

## Performance Considerations

- Server-side rendering for better SEO
- Image and component optimization
- Responsive design for all devices
- Efficient state management with React hooks

## Security

- No sensitive data storage
- Client-side processing (when backend is implemented)
- Input validation on all file uploads

## License

This project is provided as-is for educational and personal use.

## Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

---

**Last Updated**: February 2024
**Version**: 1.0.0
