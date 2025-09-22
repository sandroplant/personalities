// Re-export API client for components that import from './services/api'
// to avoid breaking relative paths.
import apiDefault, * as apiAll from "../../services/api";

export default (apiDefault as any) || apiAll;
export * from "../../services/api";
