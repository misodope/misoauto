# MisoAuto

MisoAuto is a cutting-edge tool designed to automate the content creation and upload workflow, enabling users to streamline their content creation process and focus on the creative aspects of their work.

## Development

### Docker Installation Instructions

To get started with MisoAuto, follow these instructions if you have Docker installed on your machine:

1. Ensure that you have Docker installed on your machine.
2. Open a terminal and run `docker-compose build` to build the Docker images for the application.
3. Run `docker-compose up` to start the application in development mode.

### Normal Setup Instructions

If you prefer not to use Docker, follow these steps to set up the application:

1. Install the PNPM package manager globally by running `npm i -g pnpm`.
2. Install the application dependencies by running `pnpm i`.
3. Start the application by running `pnpm start`.

That's it! You can now access the application at http://localhost:8000 for the backend and http://localhost:5173 for the frontend.

### Vercel Deployment

To deploy to dev enviornments run `vercel deploy`

Deploy to prod run `vercel --prod`

Notes:

- Importing code from other files for `Vercel Serverless Functions` you must specify `.js` to resolve correctly.

### Working with Prisma ORM

#### Migrations

After modifying any schemas or models in `prisma` you must run a migration: `pnpm prisa-migrate --name title_of_migration`

When successfully migrated run `pnpm prisma-generate` to re-generate the types for `PrismaClient`
