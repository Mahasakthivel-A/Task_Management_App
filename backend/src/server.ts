import './config/env'; // load env first
import app from './app';
import connectDB from './config/db';
import { ENV } from './config/env';

const start = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(`Server running on http://localhost:${ENV.PORT} [${ENV.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
