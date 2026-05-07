const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('123456789', 12);
  console.log(hash);
}
main();