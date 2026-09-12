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
const rpc = process.env.CREDITCOIN_RPC_URL ?? "https://rpc.cc3-testnet.creditcoin.network";
const chain = {
  id: 102031,
  name: "Creditcoin Testnet",
  nativeCurrency: { name: "Creditcoin", symbol: "CTC", decimals: 18 },
  rpcUrls: { default: { http: [rpc] } },
};

const key = process.env.ZIP_OPERATOR_PRIVATE_KEY;
if (!key || !/^0x[a-fA-F0-9]{64}$/.test(key)) {
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
const publicClient = createPublicClient({ chain, transport: http(rpc) });
const walletClient = createWalletClient({ account, chain, transport: http(rpc) });
const balance = await publicClient.getBalance({ address: account.address });
console.log("Operator", account.address, formatEther(balance), "CTC");
if (balance === 0n) {
  console.error("Operator has 0 tCTC. Fund it from https://docs.creditcoin.org/wallets/using-testnet-faucet");
  process.exit(1);
}

const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode,
  account,
  chain,
  value: 0n,
});
console.log("Deploy tx", hash);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (!receipt.contractAddress) {
  console.error("No contract address in receipt", receipt);
  process.exit(1);
}
console.log("ZipHub", receipt.contractAddress);
console.log(`NEXT_PUBLIC_ZIP_HUB=${receipt.contractAddress}`);
