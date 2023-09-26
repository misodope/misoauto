const { Sequelize } = require("sequelize");

exports.up = async (params) => {
  const { context: sequelize } = params;
  await sequelize.getQueryInterface().createTable("videos", {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    bucket: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    key: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    tiktok_video_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    youtube_video_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    instagram_video_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    user_id: {
      type: Sequelize.STRING,
      references: {
        model: "users",
        key: "open_id",
      },
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    },
  });
};

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async (params) => {
  const { context: sequelize } = params;

  await sequelize.getQueryInterface().dropTable("videos");
};
