import { Sequelize } from "sequelize";
import dotenv from "dotenv";

import { User } from "./models/user";
import { Video } from "./models/video";

import path from "path";
import pg from "pg";
dotenv.config({ path: path.resolve(__dirname, "../../", ".env") });

const timeout = Number(process.env.TIMEOUT) * 1000;
const LOCAL_DATABASE_URL =
  "postgres://misoauto:misoauto_password@localhost:5436/misoauto";
const URI =
  process.env.NODE_ENV === "development"
    ? LOCAL_DATABASE_URL
    : process.env.DATABASE_URL;

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
    dialect: "postgres",
    protocol: "postgres",
    dialectModule: pg,
    dialectOptions: {
      ssl: true,
    },
  });

  await sequelize.authenticate();

  User.hasMany(Video);
  Video.belongsTo(User);

  return sequelize;
};
