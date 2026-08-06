import "dotenv/config";
import { runAggregation } from "../src/services/aggregator.js";

const result = await runAggregation();
console.log(JSON.stringify(result, null, 2));
