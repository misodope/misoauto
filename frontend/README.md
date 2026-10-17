This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

For local development of the full application, start Docker Compose from the
repository root:

```bash
make dev
```

This builds and starts PostgreSQL, the backend, and the frontend together. Open
[http://localhost:4000](http://localhost:4000) to view the app. See the
[root development setup](../README.md#development-with-docker) for environment
configuration, database initialization, logs, and shutdown.

### Running the frontend by itself

The commands below are only for frontend-only development from the `frontend/`
directory. Use the Docker Compose command above when running the complete app.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

The standalone frontend is available at [http://localhost:3000](http://localhost:3000).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
