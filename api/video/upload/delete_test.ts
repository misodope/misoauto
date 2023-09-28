import { endOfDay, sub } from "date-fns";

console.log(
  sub(endOfDay(new Date()), {
    days: 1,
  }),
);
