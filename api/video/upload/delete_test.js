const { endOfDay, sub, startOfDay } = require("date-fns");

console.log(
  sub(startOfDay(new Date()), {
    days: 1,
  }),
);

console.log("START", startOfDay(new Date()));

console.log("END", endOfDay(new Date()));
