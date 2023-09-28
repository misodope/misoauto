const { endOfDay, sub } = require("date-fns");

console.log(
  sub(endOfDay(new Date()), {
    days: 1,
  }),
);
