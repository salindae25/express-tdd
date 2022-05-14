const app = require('./src/app');
const User = require('./src/user/User');
const bcrypt = require('bcrypt');
const sequelize = require('./src/config/database');
// const addUsers = async (activeUserCount = 10, inactiveUserCount = 0) => {
//   const hash = bcrypt.hash('P4ssword', 10);
//   for (let i = 0; i < activeUserCount + inactiveUserCount; i++) {
//     await User.create({
//       username: `user${i}`,
//       email: `user${i}@gmail.com`,
//       password: hash,
//       inactive: inactiveUserCount > i,
//     });
//   }
// };

// sequelize.sync({ force: true }).then(async () => {
//   await addUsers(25);
// });

app.listen(8000, () =>
  console.log('server is listening on http://localhost:8000')
);
