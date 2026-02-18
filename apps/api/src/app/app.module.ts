import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { PrismaService } from '@med-core/api-database';
import { ConfigService } from '@med-core/api-config'; // Assuming alias or relative
import { TerminalContextMiddleware } from '@med-core/api-terminal'; // Assuming alias or relative
import { RealtimeGateway } from '@med-core/api-realtime'; // Assuming alias
import { RedisService } from '@med-core/api-realtime';

// Local Mock Controller for Setup
import { Controller, Get } from '@nestjs/common';

@Controller('runtime')
class RuntimeController {
  @Get('setup')
  getSetup() {
    return {
      terminal: {
        id: 'term-dev',
        name: 'Terminal Dev',
        unitId: 'unit-matriz',
        modules: ['ADMIN', 'RECEPTION']
      },
      permissions: ['system.read'],
      features: {}
    };
  }
}

// Stub modules to fix imports if paths are not set up in tsconfig yet
// In a real app these would be imported from libs
@Module({
  providers: [PrismaService, ConfigService],
  exports: [PrismaService, ConfigService]
})
export class SharedModule {}

@Module({
  imports: [SharedModule],
  controllers: [RuntimeController],
  providers: [
    // Providers needed for the app
    RedisService,
    RealtimeGateway,
    // Fix: Provide dependencies for Gateway
    { provide: 'AuthService', useValue: { validateToken: () => ({ username: 'guest' }) } } 
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TerminalContextMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
