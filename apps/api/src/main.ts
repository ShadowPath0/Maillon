import "reflect-metadata";
import { join } from "path";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  // rawBody: true expose req.rawBody sur toutes les routes, nécessaire pour
  // vérifier la signature des webhooks Stripe sans casser le parsing JSON standard.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.enableCors({ origin: process.env.WEB_URL ?? "http://localhost:3000", credentials: true });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(process.cwd(), process.env.STORAGE_LOCAL_PATH ?? "storage/uploads"), {
    prefix: "/uploads",
  });
  // Render (et la plupart des PaaS) imposent leur propre port via $PORT ;
  // API_PORT reste utilisé en local où $PORT n'est pas défini.
  const port = process.env.PORT ?? process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`API démarrée sur http://localhost:${port}/api`);
}
bootstrap();
