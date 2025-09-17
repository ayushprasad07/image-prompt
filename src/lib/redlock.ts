import Redlock from "redlock";
import redis from "./redis";
// import redis from "./redis";

// Create redlock instance
const redlock = new Redlock(
  [redis as any], // cast to any to satisfy Redlock's expected interface
  {
    driftFactor: 0.01,   // accounts for clock drift
    retryCount: 0,       // don't retry if lock is taken
    retryDelay: 200,     // (optional) wait before retrying
  }
);

export default redlock;
