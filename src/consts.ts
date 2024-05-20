export const Y_PARITY_EIP_2098 = 27;
export const EIP155_NUMBER = 35;
// NOTE: Black magic number, unsure where it comes from
export const EIGHT = 8;

// NOTE: Logic stolen from https://github.com/celo-org/celo-monorepo/blob/e7ebc92cb0715dc56c9d7f613dca81e076541cf3/packages/sdk/connect/src/connection.ts#L382-L396
export const GAS_INFLATION_FACTOR = 130n;


/*
 * If a contract is deployed to this address then Celo has transitioned to a Layer 2 
 * https://github.com/celo-org/celo-monorepo/blob/da9b4955c1fdc8631980dc4adf9b05e0524fc228/packages/protocol/contracts-0.8/common/IsL2Check.sol#L17
 */
export const L2_PROXY_ADMIN_ADDRESS = '0x4200000000000000000000000000000000000018'


export const CELO_REGISTRY_ADDRESS = '0x000000000000000000000000000000000000ce10'