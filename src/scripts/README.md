Seed postal codes

This script upserts a small list of common French postal codes into the `postal_codes` collection.

Usage:

1. Ensure your MongoDB is running and `MONGO_URL` (or `DATABASE_URL`) is set in your environment or `.env`.
2. From the `server` folder run:

```
npm run seed:postal
```

The script uses the same mongoose model as the app and will set `expiresAt` to 90 days from now.
