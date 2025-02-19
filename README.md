# Certificate Generator SPA

A Single Page Application for generating personalized certificates from Google Sheets data.

## Features

- Google Sheet Integration
- Certificate Template Upload & Configuration
- Interactive Field Mapping
- Bulk Certificate Generation
- ZIP Download of Generated Certificates

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Build for production:
```bash
npm run build
```

## Usage

1. Enter your Google Sheet URL containing participant data
2. Upload your certificate template (PNG, JPG, or PDF)
3. Map fields from your sheet to positions on the certificate
4. Generate and download certificates for all participants

## Tech Stack

- React with TypeScript
- TailwindCSS for styling
- Fabric.js for template editing
- PDF-lib for PDF modification
- JSZip for ZIP file generation

## Development

The project uses React with TypeScript for type safety. The main components are:

- `SheetInput`: Handles Google Sheet URL input and data fetching
- `TemplateUpload`: Manages certificate template upload
- `FieldMapping`: Interactive interface for mapping fields to template
- `CertificateGeneration`: Generates and packages certificates

## License

MIT
