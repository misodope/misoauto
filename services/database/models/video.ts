import { Sequelize, Model, DataTypes, ModelAttributes } from "sequelize";

class Video extends Model {}

const schema: ModelAttributes = {
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bucket: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tiktok_video_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  youtube_video_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  instagram_video_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.STRING,
    references: {
      model: "users",
      key: "open_id",
    },
  },
};

export type IVideo = typeof Video;

export const getUserModel = async (sequelize?: Sequelize): Promise<IVideo> => {
  if (sequelize) {
    Video.init(schema, { sequelize, modelName: "videos", timestamps: true });
    await Video.sync();
  }

  return Video;
};
