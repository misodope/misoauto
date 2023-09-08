import { Umzug, SequelizeStorage } from "umzug";
import { Sequelize } from "sequelize";
import path from "path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: path.resolve(__dirname, "../../", ".env") });

const URI = process.env.DATABASE_URL;
console.log("URI", URI);
console.log(__dirname);
const sequelize = new Sequelize(URI, {
  dialect: "postgres",
  protocol: "postgres",
  dialectModule: pg,
});

export const migrator = new Umzug({
  migrations: {
    glob: `${__dirname}/migrations/*.js`,
  },
  context: sequelize,
  storage: new SequelizeStorage({
    sequelize,
  }),
  logger: console,
});

export type Migration = typeof migrator._types.migration;
