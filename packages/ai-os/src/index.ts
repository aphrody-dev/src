// @aphrody/ai-os: the single AI unit of src. Sub-modules are also exported separately
// (./core, ./llm, ./gateway, ./research, ./tui, ./relay).
export * from "./core/index";
export * as llm from "./llm/index";
export {
  createGateway,
  type Channel,
  type GatewayOptions,
  type Inbound,
  webhookChannel,
} from "./gateway/index";
export { handle as tuiHandle, startTui, type TuiOptions } from "./tui/index";
