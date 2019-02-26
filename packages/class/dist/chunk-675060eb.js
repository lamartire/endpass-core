var SETTINGS = 'INPAGE_PROVIDER_SETTINGS_EVENT';
var RESPONSE = 'INPAGE_PROVIDER_RESPONSE_EVENT';
var REQUEST = 'INPAGE_PROVIDER_REQUEST_EVENT';
var INPAGE_EVENT = Object.freeze({
  SETTINGS: SETTINGS,
  RESPONSE: RESPONSE,
  REQUEST: REQUEST
});
var INPAGE_ID_PREFIX = 'ep_';
var AVAILABLE_USER_META_PROPS = ['activeAccount'];
var PROXY_REQUEST_PREFIX = 'endpass-identity';
var HD_KEY_MNEMONIC_PATH = "m/44'/60'/0'/0";
var HARDWARE_DERIVIATION_PATH = "m/44'/60'/0'/0/"; // Polling interval for web3

var BLOCK_UPDATE_INTERVAL_MSEC = 15 * 1000;

export { PROXY_REQUEST_PREFIX as a, BLOCK_UPDATE_INTERVAL_MSEC as b, INPAGE_EVENT as c, INPAGE_ID_PREFIX as d, AVAILABLE_USER_META_PROPS as e, HD_KEY_MNEMONIC_PATH as f, HARDWARE_DERIVIATION_PATH as g };