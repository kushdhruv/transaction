import { AptosClient, AptosAccount, CoinClient, HexString } from "aptos";
import dotenv from "dotenv";

dotenv.config();

export default class AptosPaymentHandler {
  constructor() {
    this.nodeUrl = process.env.APTOS_NODE_URL || "https://fullnode.testnet.aptoslabs.com";
    this.faucetUrl = "https://faucet.testnet.aptoslabs.com";
    this.client = new AptosClient(this.nodeUrl);
    this.coinClient = new CoinClient(this.client);

    // Validate sender's private key
    const senderPrivateKey = process.env.SENDER_PRIVATE_KEY;
    if (!senderPrivateKey || !this.isValidHexPrivateKey(senderPrivateKey)) {
      throw new Error("Invalid or missing SENDER_PRIVATE_KEY. Ensure it's a 64-character hex string.");
    }

    // Initialize sender account
    this.senderAccount = new AptosAccount(
      HexString.ensure(senderPrivateKey).toUint8Array()
    );
  }

  async fundAccount(address, amount) {
    try {
      console.log(`Funding account: ${address} with ${amount} coins`);
      const response = await fetch(`${this.faucetUrl}/mint?address=${address}&amount=${amount}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to fund account");
      }
      return await response.json();
    } catch (error) {
      console.error("Error funding account:", error.message);
      throw error;
    }
  }

  async handlePayment(receiverAddress, amount) {
    try {
      amount = amount*100000000;

      // Validate sender's private key
      const senderPrivateKey = process.env.SENDER_PRIVATE_KEY;
      if (!senderPrivateKey || !this.isValidHexPrivateKey(senderPrivateKey)) {
        throw new Error("Invalid sender private key. Ensure it's a 64-character hex string.");
      }

      // Validate receiver's wallet address
      if (!receiverAddress || !/^0x[0-9a-fA-F]{64}$/.test(receiverAddress)) {
        throw new Error("Invalid receiver address. Ensure it's a valid Aptos wallet address.");
      }

      // Initialize sender account
      const senderAccount = new AptosAccount(
        HexString.ensure(senderPrivateKey).toUint8Array()
      );

      // Perform transfer
      console.log(`Transferring ${amount} coins to ${receiverAddress}`);
      const txnHash = await this.coinClient.transfer(
        senderAccount, 
        receiverAddress, // Receiver's wallet address
        amount
      );

      // Wait for transaction completion
      await this.client.waitForTransaction(txnHash);

      return txnHash;
    } catch (error) {
      console.error("Payment failed:", error.message);
      throw error;
    }
  }

  async checkBalance(address) {
    try {
      const resources = await this.client.getAccountResources(address);
      const coinStore = resources.find(
        (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );
      if (!coinStore) {
        throw new Error("CoinStore resource not found for the given address.");
      }
  
      const microAptBalance = coinStore.data.coin.value; // Raw balance in microAPT
      const aptBalance = microAptBalance / Math.pow(10, 8); // Convert to APT
      return aptBalance;
    } catch (error) {
      console.error("Failed to check balance:", error.message);
      throw error;
    }
  }
  
  

  isValidHexPrivateKey(privateKey) {
    return /^[0-9a-fA-F]{64}$/.test(privateKey);
  }
}
