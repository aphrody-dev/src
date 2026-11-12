import { vercel } from "../../../packages/runtime-adapter/src/index";
import app from "./app";

export default vercel(app);
