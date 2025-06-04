const bcrypt = require('bcryptjs');
bcrypt.hash('test1234', 10, (err, hash) => {
  console.log(hash);
});