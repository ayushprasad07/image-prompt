import Redlock from "redlock";
import redis from "./redis";
// import redis from "./redis";

// Create redlock instance
const redlock = new Redlock([redis as any], {
  driftFactor: 0.01,
  retryCount: 5,       // retry a few times
  retryDelay: 200,     // wait 200ms between retries
  retryJitter: 100,    // add jitter to avoid collisions
});


export default redlock;
