import express from 'express';
import cors from "cors"
import AptosPaymentHandler from './controller/aptosHandler.js';


const app = express();
app.use(express.json());
app.use(cors());

const aptosHandler = new AptosPaymentHandler();

// Transaction endpoint
app.post('/aptos/transfer', async (req, res) => {
  try {
    const { senderPrivateKey, amount } = req.body;
    
    // Validate inputs
    if (!senderPrivateKey || !amount) {
      return res.status(400).json({ 
        error: 'Missing sender private key or amount' 
      });
    }

    const txnHash = await aptosHandler.handlePayment(
      senderPrivateKey, 
      Number(amount)
    );

    res.json({ 
      success: true, 
      transactionHash: txnHash 
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Balance check endpoint
app.get('/aptos/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await aptosHandler.checkBalance(address);
    
    res.json({ 
      address, 
      balance 
    });
  } catch (error) {
    res.status(500).json({ 
      message:"Not able to fetch ",
      error: error.message ,
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
