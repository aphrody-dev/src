import { cloudflare } from "../../../packages/runtime-adapter/src/index";
import app from "./app";

export default cloudflare(app);
