const { DataTypes } = require( "sequelize");

/** @type {import('umzug').MigrationFn<any>} */
exports.up = async params => {
  const { context: sequelize} = params;
  await sequelize.getQueryInterface().createTable('users', {
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
    token_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    scope: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};

/** @type {import('umzug').MigrationFn<any>} */
exports.down = async params => {
  const { context: sequelize} = params;

  await sequelize.getQueryInterface().dropTable('users');
};
