import { useState, useCallback } from 'react';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Custom hook for Razorpay payment flow
 * Handles: simulation mode auto-complete, Razorpay checkout modal, verification
 */
export default function useRazorpay() {
  const [loading, setLoading] = useState(false);

  const initiatePayment = useCallback(async ({ planId, planName, userEmail, userName, onSuccess, onFailure }) => {
    setLoading(true);
    try {
      // Step 1: Create order on backend
      const { data } = await paymentAPI.createOrder({ planId });

      // If simulation mode, payment is auto-completed on backend
      if (data.simulated) {
        toast.success('Plan activated! (Test mode)');
        onSuccess?.({
          simulated: true,
          payment: data.payment,
          profile: data.profile,
        });
        setLoading(false);
        return;
      }

      // Step 2: Open Razorpay checkout modal
      if (!window.Razorpay) {
        toast.error('Razorpay SDK not loaded. Please refresh the page.');
        setLoading(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'ServiceHub',
        description: `${data.plan.name} Plan Purchase`,
        order_id: data.order.id,
        prefill: {
          name: userName || '',
          email: userEmail || '',
        },
        theme: {
          color: '#4F46E5',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast('Payment cancelled', { icon: '??' });
          },
        },
        handler: async function (response) {
          // Step 3: Verify payment on backend
          try {
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: data.payment,
            };
            const { data: verifyResult } = await paymentAPI.verifyPayment(verifyData);

            if (verifyResult.success) {
              toast.success('Payment successful! Plan activated.');
              onSuccess?.({
                simulated: false,
                payment: verifyResult.payment,
                profile: verifyResult.profile,
              });
            } else {
              toast.error('Payment verification failed');
              onFailure?.('Verification failed');
            }
          } catch (err) {
            console.error('Verification error:', err);
            toast.error('Payment verification failed. Contact support if amount was deducted.');
            onFailure?.(err.response?.data?.message || 'Verification error');
          } finally {
            setLoading(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', async function (response) {
        try {
          await paymentAPI.paymentFailed({
            razorpay_order_id: data.order.id,
            error_description: response.error?.description || 'Payment failed',
          });
        } catch (e) {
          // silent
        }
        toast.error(response.error?.description || 'Payment failed');
        onFailure?.(response.error?.description || 'Payment failed');
        setLoading(false);
      });

      razorpay.open();
    } catch (err) {
      console.error('Payment initiation error:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      onFailure?.(err.response?.data?.message || 'Payment initiation failed');
      setLoading(false);
    }
  }, []);

  return { initiatePayment, loading };
}
