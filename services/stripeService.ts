
import { API_CONFIG } from '../config';
import { PaymentMethod } from '../types';

// This service simulates payment processing. 
// In a real production build, you would use @stripe/stripe-js here 
// and communicate with a secure backend endpoint.

export const processWithdrawal = async (amount: number, method: PaymentMethod): Promise<{ success: boolean; message: string; transactionId?: string }> => {
  const secretKey = API_CONFIG.STRIPE_SECRET_KEY;

  // Production safeguard: Log warning if using placeholder keys
  if (!secretKey || secretKey.includes('YOUR_SECRET_KEY')) {
    console.warn("Stripe Secret Key is not configured. Proceeding with mock simulation.");
  }

  // Simulate API network latency (1.5s) to give the user a realistic "processing" feel
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock success response
  return {
    success: true,
    message: `Successfully processed withdrawal of $${amount} to ${method.type === 'card' ? `Card ending in ${method.last4}` : 'Digital Wallet'}.`,
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`
  };
};

export const linkPaymentMethod = async (token: string): Promise<{ success: boolean; method?: PaymentMethod }> => {
    // Simulate linking a new card
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
        success: true,
        method: {
            id: `pm_${Date.now()}`,
            type: 'card',
            brand: 'visa',
            last4: '4242',
            expiry: '12/28',
            isDefault: false
        }
    };
};
