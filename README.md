# MisoAuto

MisoAuto is a cutting-edge tool designed to automate the content creation and upload workflow, enabling users to streamline their content creation process and focus on the creative aspects of their work.

## Development

### Local Development Setup

Follow these steps to set up the application:

1. Install the PNPM package manager globally

- `npm i -g pnpm`

2. Install the application dependencies

- `pnpm i`

3. Start the application in the root folder using `docker`
```
docker compose -f docker-compose.yml -f ./src/server/docker-compose.yml up --build
```

### Deployments

Deployments are automated in CI/CD pipeline defined in github workflows.

### Working with Prisma ORM

#### Migrations

After modifying any schemas or models in `prisma` you must run a migration: `pnpm prisa-migrate --name title_of_migration`

When successfully migrated run `pnpm prisma-generate` to re-generate the types for `PrismaClient`

### Working with Vercel and Vercel Serverless Functions

Serverless function configuration matters.

For free plans:
Max Execution Time: 10 seconds
Max Memory: 1028mb or 1gb

For pro plans:
Max Execution Time: 60 seconds
Max Memory: 1028mb or 1gb

More intensive processes may require more memory, so adjust as necessary.

All functions are located here: `./api`
