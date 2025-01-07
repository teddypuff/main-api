import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/generic-response.interceptor';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';
import * as SentryTracing from '@sentry/tracing';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS,
    methods: 'GET,HEAD,PUT,POST,PATCH',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalInterceptors(new TransformInterceptor());

  const sentryOptions: Sentry.NodeOptions = {
    dsn: process.env.SENTRY_DSN,
    debug: process.env.ENV === 'local',
    environment: process.env.NODE_ENV,
    release: '2024-08-01',
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Console(),
      new Sentry.Integrations.Context({}),
      new Sentry.Integrations.Express({ app: app.getHttpServer() }),
      new Sentry.Integrations.FunctionToString(),
      new Sentry.Integrations.InboundFilters(),
      new Sentry.Integrations.LocalVariables(),
      new Sentry.Integrations.Modules(),
      new Sentry.Integrations.LinkedErrors(),
      new SentryTracing.Integrations.Express({ app: app.getHttpServer() }),
    ],
  };

  Sentry.init(sentryOptions);

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  app.use(Sentry.Handlers.errorHandler());

  await app.listen(3000);
}
bootstrap();
