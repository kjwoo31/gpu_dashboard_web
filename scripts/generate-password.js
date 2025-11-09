const bcrypt = require('bcrypt');

async function generateHash(password) {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('');
}

async function main() {
  await generateHash('alice123');
  await generateHash('bob123');
  await generateHash('admin123');
}

main();
