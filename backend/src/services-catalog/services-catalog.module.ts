import { Module } from '@nestjs/common';
import { ServicesCatalogService } from './services-catalog.service';
import { ServicesCatalogController } from './services-catalog.controller';

@Module({
  providers: [ServicesCatalogService],
  controllers: [ServicesCatalogController],
})
export class ServicesCatalogModule {}
