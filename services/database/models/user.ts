import { Sequelize, Model, DataTypes, ModelAttributes } from "sequelize";

class User extends Model {}

const schema: ModelAttributes = {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
  },
  open_id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  access_token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  refresh_token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires_in: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  refresh_expires_in: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  token_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scope: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  refresh_expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
};

export type IUser = typeof User;

export const getUserModel = async (sequelize?: Sequelize): Promise<IUser> => {
  if (sequelize) {
    User.init(schema, { sequelize, modelName: "users", timestamps: true });
    await User.sync();
  }

  return User;
};
