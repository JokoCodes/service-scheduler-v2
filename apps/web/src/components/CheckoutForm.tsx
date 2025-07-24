'use client'

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CheckoutFormProps {
  clientSecret: string;
  amount: number; // Amount in dollars
  onSuccess: () => void;
  onError: (error: string) => void;
  loading?: boolean;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  clientSecret, 
  amount, 
  onSuccess, 
  onError,
  loading: externalLoading = false 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState<string>('');

  const loading = processing || externalLoading;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!stripe || !elements) {
      setFormError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setFormError('Card element not found. Please refresh the page.');
      return;
    }

    setProcessing(true);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        const errorMessage = result.error.message || 'Payment failed. Please try again.';
        setFormError(errorMessage);
        onError(errorMessage);
        toast.error(errorMessage);
      } else if (result.paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = 'An unexpected error occurred during payment processing.';
      setFormError(errorMessage);
      onError(errorMessage);
      toast.error(errorMessage);
      console.error('Payment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div className="card">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Amount to charge: <strong>${amount.toFixed(2)}</strong>
          </p>
          <div className="flex items-center text-xs text-green-600">
            <ShieldCheckIcon className="h-4 w-4 mr-1" />
            Secured by Stripe - Your payment information is encrypted and secure
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="p-3 border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
              <CardElement options={cardElementOptions} />
            </div>
          </div>
          
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn-primary btn-md w-full flex items-center justify-center"
            disabled={!stripe || loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <CreditCardIcon className="h-4 w-4 mr-2" />
                Pay ${amount.toFixed(2)}
              </>
            )}
          </button>
        </form>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          By completing this payment, you agree to our terms and conditions.
        </div>
      </div>
    </div>
  );
};

