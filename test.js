const bcrypt = require("bcrypt");

const url =
  "https://boards.eu.greenhouse.io/mariadbplc/jobs/4311993101?gh_src=910b21e2teu";

const saltrounds = 10;

const data = await bcrypt
  .genSalt(saltrounds)
  .then((salt) => {
    return bcrypt.hash(url, salt);
  })
  .then((hashString) => {
    return hashString.substring(7).substring(22).substring(1, 6);
  })
  .catch((err) => console.log(err.message));

console.log(data);
