# Next.js 15 Pages Router App

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Features

- **Next.js 15** with Pages Router (not App Router)
- **TypeScript** for type safety
- **CSS Modules** for component-scoped styling
- **ESLint** for code quality
- **Google Fonts** (Geist Sans & Geist Mono)
- **Dark mode support** with CSS variables
- **Responsive design** with mobile-first approach

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/pages/index.tsx`. The page auto-updates as you edit the file.

## Project Structure

```
src/
├── pages/          # Pages router pages
│   ├── index.tsx   # Home page
│   ├── _app.tsx    # App wrapper
│   ├── _document.tsx # Document wrapper
│   └── api/        # API routes
├── styles/         # Global styles
│   └── globals.css # Global CSS
└── components/     # Reusable components (create as needed)
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
