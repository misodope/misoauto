const { Sequelize } = require( "sequelize");

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async params => {
  const { context: sequelize} = params;
  await sequelize.getQueryInterface().createTable('users', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
    },
    open_id: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
    },
    access_token: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    refresh_token: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    expires_in: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    token_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    scope: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
  });
};

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async params => {
  const { context: sequelize} = params;

  await sequelize.getQueryInterface().dropTable('users');
};
