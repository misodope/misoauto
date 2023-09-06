import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../", ".env") });
console.log(process.env);

const timeout = Number(process.env.TIMEOUT) * 1000;
const URI = process.env.DATABASE_URL;

let sequelize: Sequelize | null = null;

// https://sequelize.org/docs/v6/other-topics/aws-lambda/#tldr
export const connectToDb = async (): Promise<Sequelize> => {
  if (sequelize) {
    sequelize.connectionManager.initPools();

    if (sequelize.connectionManager.hasOwnProperty("getConnection")) {
      delete sequelize.connectionManager.getConnection;
    }
    return sequelize;
  }

  sequelize = new Sequelize(URI, {
    logging: false,
    pool: {
      min: 0,
      max: 2,
      idle: 0,
      acquire: 3000,
      evict: timeout,
    },
  });
  await sequelize.authenticate();

  return sequelize;
};
