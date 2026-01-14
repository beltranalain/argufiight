# Stripe Test Card Numbers

For testing payments in Stripe's test mode, use these test card numbers:

## Successful Payments

### Visa (Most Common)
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

### Mastercard
- **Card Number:** `5555 5555 5555 4444`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

### American Express
- **Card Number:** `3782 822463 10005`
- **Expiry:** Any future date
- **CVC:** Any 4 digits
- **ZIP:** Any 5 digits

## Declined Cards

### Card Declined
- **Card Number:** `4000 0000 0000 0002`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

### Insufficient Funds
- **Card Number:** `4000 0000 0000 9995`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

## 3D Secure Authentication

### Requires Authentication
- **Card Number:** `4000 0025 0000 3155`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

## Recommended Test Card

For most testing scenarios, use:
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** `12/25` (or any future date)
- **CVC:** `123`
- **ZIP:** `12345`
- **Cardholder Name:** Any name (e.g., "Test User")

This card will always succeed in test mode and is the easiest to use for testing.

## Notes

- These cards only work in Stripe's **test mode**
- Never use real card numbers in test mode
- All test cards will be declined in live mode
- Make sure your Stripe account is in test mode when testing
