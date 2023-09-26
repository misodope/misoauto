# MisoAuto

MisoAuto is a cutting-edge tool designed to automate the content creation and upload workflow, enabling users to streamline their content creation process and focus on the creative aspects of their work.

## Development

### Local Development Setup

Follow these steps to set up the application:

1. Install the PNPM package manager globally

- `npm i -g pnpm`

2. Install the application dependencies

- `pnpm i`

### Deployments

Deployments are automated in CI/CD pipeline defined in github workflows.

### Working with Prisma ORM

#### Migrations

Run migrations with umzug.

Documentation https://github.com/sequelize/umzug/tree/main/examples/1.sequelize-typescript

Navigate to the migration service: `services/database/migrate.js`
Create a migration: `node migrate create --name new-migration.ts` # create a new migration file
`node migrate up` # apply migrations
`node migrate down` # revert the last migration

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
