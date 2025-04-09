# TeraBox Downloader Pro

![TeraBox Downloader Pro](https://img.shields.io/badge/TeraBox-Downloader-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

A modern, SEO-optimized React application for downloading and streaming content from TeraBox without login requirements. This project implements pre-rendering for search engine optimization, ensuring content is properly crawled and indexed by search engines.

## Features

- 🚀 **No-Login Downloads**: Access TeraBox content without account creation
- 🎬 **Video Streaming**: Built-in video player for direct streaming
- 🔒 **Ad Blocking**: Automatic popup and unwanted tab blocking
- 🔍 **SEO Optimized**: Pre-rendered content for excellent search engine visibility
- 📱 **Fully Responsive**: Works on all devices from mobile to desktop
- ⚡ **Fast Performance**: Optimized loading and resource management

## Technology Stack

- **React** with TypeScript for type safety
- **Vite** for lightning-fast development and builds
- **Tailwind CSS** for styling
- **react-snap** for pre-rendering
- **react-helmet-async** for SEO metadata management
- **Structured Data** for rich search results

## SEO Implementation

This project addresses the critical SEO challenge of client-side rendered React applications by implementing pre-rendering with react-snap. The implementation ensures that:

1. Search engines receive fully rendered HTML content
2. All metadata and structured data are available in the initial page load
3. Content is properly indexed and crawlable

For more details, see the [SEO documentation](./SEO.md).

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Harshil258/terabox-downloader-pro.git
cd terabox-downloader-pro

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Standard build
npm run build

# SEO-optimized build with pre-rendering
npm run build:seo
```

## Project Structure

```
├── src/                  # Source files
│   ├── components/       # Reusable components
│   ├── pages/            # Page components
│   ├── scripts/          # SEO enhancement scripts
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main App component
│   └── main.tsx          # Entry point
├── public/               # Public assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── build.sh              # SEO build script
└── SEO.md                # SEO documentation
```

## Key Features Implementation

### 1. SEO Pre-rendering

The application uses react-snap to generate static HTML for all routes during the build process:

```javascript
// package.json
{
  "scripts": {
    "build": "vite build",
    "postbuild": "react-snap"
  },
  "reactSnap": {
    "include": ["/", "/player", "/about", ...],
    "destination": "dist"
  }
}
```

### 2. SEO Metadata

Each page includes comprehensive SEO metadata using react-helmet-async:

```jsx
<Helmet>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="terabox, downloader, ..." />
  
  {/* Open Graph / Facebook */}
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  
  {/* Structured Data */}
  <script type="application/ld+json">
    {JSON.stringify(structuredData)}
  </script>
</Helmet>
```

### 3. Ad and Popup Blocking

The application includes a sophisticated script injection system to prevent unwanted popups and ads:

```javascript
const getTabInterceptScript = (domains) => `
  // Script logic to block unwanted domains
  window.open = function(url, target, features) {
    if (url && shouldBlockUrl(url)) {
      console.log("Blocking new tab for domain:", url);
      return { closed: false, close: function() {} };
    } else {
      return originalWindowOpen.apply(this, arguments);
    }
  };
`;
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This project is for educational purposes only. Please respect copyright laws and terms of service when downloading content.
