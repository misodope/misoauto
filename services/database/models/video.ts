import {
  Sequelize,
  Model,
  DataTypes,
  ModelAttributes,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import { getUserModel } from "./user";

class Video extends Model<
  InferAttributes<Video>,
  InferCreationAttributes<Video>
> {
  id: string;
  bucket: string;
  key: string;
  file_size: number;
  file_type: string;
  tiktok_video_id: string | null;
  youtube_video_id: string | null;
  instagram_video_id: string | null;
  user_id: string;
}

const schema: ModelAttributes = {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  bucket: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  file_type: {
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

export const getVideoModel = async (sequelize?: Sequelize): Promise<IVideo> => {
  if (sequelize) {
    Video.init(schema, { sequelize, modelName: "videos", timestamps: true });

    const User = await getUserModel(sequelize);

    User.hasMany(Video, { foreignKey: "user_id" });
    Video.belongsTo(User, { foreignKey: "user_id" });

    await Video.sync();
  }

  return Video;
};
