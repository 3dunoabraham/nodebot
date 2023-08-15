function cronLikeInterval(cronExpression, callback) {
  const cronParts = cronExpression.split(' ');

  if (cronParts.length !== 5) {
    throw new Error('Invalid cron expression format. Expected 5 parts.');
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;

  function checkAndExecute() {
    const now = new Date();
    if (
      (minute === '*' || now.getMinutes() === parseInt(minute)) &&
      (hour === '*' || now.getHours() === parseInt(hour)) &&
      (dayOfMonth === '*' || now.getDate() === parseInt(dayOfMonth)) &&
      (month === '*' || now.getMonth() === parseInt(month) - 1) &&
      (dayOfWeek === '*' || now.getDay() === parseInt(dayOfWeek))
    ) {
      callback();
    }
  }

  checkAndExecute(); // Execute immediately

  setInterval(checkAndExecute, 60 * 1000); // Check every minute
}

// Example usage
cronLikeInterval('*/15 * * * *', () => {
  console.log('This function will be executed every 15 minutes.');
});















// require('dotenv').config();
// const cron = require("node-cron");
// const { fetchPlayer } = require('./jsjs/state/repository/player/index'); // Adjust the path accordingly
// // const create_cron_datetime = require('./create_cron_datetime'); // You can keep this function in a separate file as well

// function create_cron_datetime(seconds, minute, hour, day_of_the_month, month, day_of_the_week) {
//   return `${seconds} ${minute} ${hour} ${day_of_the_month} ${month} ${day_of_the_week}`
// }
// console.log(`we have begun; ${create_cron_datetime(0, 0, 0, 2, 0, 0)}`);

// cron.schedule(
//   create_cron_datetime("*/33", '*', '*', '*', '*', '*'),
//   // create_cron_datetime("*/3", '*', '*', '*', '*', '*'),
//   async function() {
//     const playerHash = "71e0306864eb7e22c2fc5b77104b1f3196769ac72f22a4cd0dd87d10ed28d2b0";
//     // const existingPlayer = await fetchPlayer(playerHash);
//     console.log("in the loop");
//     // console.log("in the loop", existingPlayer.subscription);
//   }
// );