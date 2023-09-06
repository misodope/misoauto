import { Sequelize, Model, DataTypes, ModelAttributes } from "sequelize";

class User extends Model {}

const schema: ModelAttributes = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
  },
  openId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresIn: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tokenType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scope: {
    type: DataTypes.STRING,
    allowNull: false,
  },
};

export type IUser = typeof User;

export const getUserModel = async (sequelize?: Sequelize): Promise<IUser> => {
  if (sequelize) {
    User.init(schema, { sequelize, modelName: "user", timestamps: true });
    await User.sync({ force: true });
  }

  return User;
};
