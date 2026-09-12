import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";
import { createPublicClient, createWalletClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const name = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[name]) process.env[name] = value;
  }
}
const rpcs = [
  process.env.CREDITCOIN_RPC_URL,
  "https://rpc.cc3-testnet.creditcoin.network",
  "https://102031.rpc.thirdweb.com",
].filter((item, index, list) => item && list.indexOf(item) === index);
const rpc = rpcs[0];
const chain = {
  id: 102031,
  name: "Creditcoin Testnet",
  nativeCurrency: { name: "Creditcoin", symbol: "CTC", decimals: 18 },
  rpcUrls: { default: { http: rpcs } },
};

const rawKey = process.env.ZIP_OPERATOR_PRIVATE_KEY?.trim() ?? "";
const key = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
if (!/^0x[a-fA-F0-9]{64}$/.test(key)) {
  console.error("Set ZIP_OPERATOR_PRIVATE_KEY to a funded Creditcoin Testnet key.");
  process.exit(1);
}

const source = readFileSync(join(root, "contracts/ZipHub.sol"), "utf8");
const input = {
  language: "Solidity",
  sources: { "ZipHub.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
if (output.errors?.some((item) => item.severity === "error")) {
  console.error(output.errors);
  process.exit(1);
}
const artifact = output.contracts["ZipHub.sol"].ZipHub;
const bytecode = `0x${artifact.evm.bytecode.object}`;
mkdirSync(join(root, "contracts/out"), { recursive: true });
writeFileSync(join(root, "contracts/out/ZipHub.json"), JSON.stringify({ abi: artifact.abi, bytecode }, null, 2));

const account = privateKeyToAccount(key);
const expected = process.env.ZIP_OPERATOR_PUBLIC_ADDRESS?.trim();
if (expected && expected.toLowerCase() !== account.address.toLowerCase()) {
  console.error("ZIP_OPERATOR_PRIVATE_KEY does not match ZIP_OPERATOR_PUBLIC_ADDRESS");
  console.error("key derives", account.address);
  console.error("expected  ", expected);
  process.exit(1);
}
const transport = http(rpc, { timeout: 120_000, retryCount: 5, retryDelay: 2_000 });
const publicClient = createPublicClient({ chain, transport });
const walletClient = createWalletClient({ account, chain, transport });
const balance = await publicClient.getBalance({ address: account.address });
console.log("Operator", account.address, formatEther(balance), "CTC");
if (balance === 0n) {
  console.error("Operator has 0 tCTC. Fund it from https://docs.creditcoin.org/wallets/using-testnet-faucet");
  process.exit(1);
}

const nonce = await publicClient.getTransactionCount({ address: account.address });
const gasPrice = await publicClient.getGasPrice();
console.log("nonce", nonce, "gasPrice", gasPrice.toString());
const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode,
  account,
  chain,
  value: 0n,
  nonce,
  gas: 3_000_000n,
  gasPrice,
});
console.log("Deploy tx", hash);
const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 180_000, pollingInterval: 3_000 });
if (!receipt.contractAddress) {
  console.error("No contract address in receipt", receipt);
  process.exit(1);
}
console.log("ZipHub", receipt.contractAddress);
console.log(`NEXT_PUBLIC_ZIP_HUB=${receipt.contractAddress}`);
