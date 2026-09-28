const sequelize = require('../config/sequelize');
const initModels = require('./init-models');

const models = initModels(sequelize);

module.exports = {
  sequelize,
  ...models
};
