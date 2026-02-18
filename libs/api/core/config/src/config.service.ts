import { Injectable } from '@nestjs/common';
import { PrismaService, AppModule, ConfigScope } from '@med-core/api-database';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolves configuration with cascade priority:
   * MODULE > TERMINAL > UNIT > GLOBAL
   */
  async getEffectiveConfig(
    key: string, 
    context: { unitId: string; terminalId: string; module?: AppModule }
  ): Promise<any> {
    
    // Fetch all potential values for this key
    const configs = await this.prisma.configValue.findMany({
      where: {
        configKey: { key: key },
        OR: [
          { scope: 'GLOBAL' },
          { scope: 'UNIT', unitId: context.unitId },
          { scope: 'TERMINAL', terminalId: context.terminalId },
          ...(context.module ? [{ scope: 'MODULE' as ConfigScope, module: context.module }] : [])
        ]
      }
    });

    // Determine value by priority
    let finalValue = configs.find(c => c.scope === 'GLOBAL')?.value;

    const unitVal = configs.find(c => c.scope === 'UNIT');
    if (unitVal) finalValue = unitVal.value;

    const termVal = configs.find(c => c.scope === 'TERMINAL');
    if (termVal) finalValue = termVal.value;

    // Module specific config overrides everything (e.g., 'printer.auto_print' might be true for Pharmacy but false for Reception)
    if (context.module) {
        const modVal = configs.find(c => c.scope === 'MODULE' && c.module === context.module);
        if (modVal) finalValue = modVal.value;
    }

    // Fallback to default if nothing found
    if (!finalValue) {
      const keyDef = await this.prisma.configKey.findUnique({ where: { key } });
      if (!keyDef) throw new Error(`Config key ${key} not defined.`);
      return JSON.parse(keyDef.defaultValue);
    }

    return JSON.parse(finalValue);
  }
}
