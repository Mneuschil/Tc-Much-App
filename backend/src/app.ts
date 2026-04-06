import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { defaultLimiter } from './middleware/rateLimiter';
import routes from './routes';
import { success } from './utils/apiResponse';

const app = express();

app.use(requestId);

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: true,
  }),
);

app.use(compression());

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(defaultLimiter);
}

app.get('/api/v1/health', (_req, res) => {
  success(res, { status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', routes);

app.use(errorHandler);

export default app;
