import { PrismaClient, TerminalType, ConfigScope, AppModule } from '@prisma/client';

// Ensure we have a DB URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('Error: DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

async function main() {
  console.log('🌱 Iniciando Seed do Banco de Dados...');

  const unidade = await prisma.unit.upsert({
    where: { id: 'unit-matriz' },
    update: {},
    create: {
      id: 'unit-matriz',
      name: 'Unidade Matriz - Central',
    },
  });

  await prisma.terminal.upsert({
    where: { ipAddress: '127.0.0.1' },
    update: {},
    create: {
      name: 'Terminal DEV Local',
      ipAddress: '127.0.0.1',
      type: TerminalType.DESK,
      unitId: unidade.id,
      isActive: true,
      modules: {
        create: [
          { module: AppModule.ADMIN },
          { module: AppModule.RECEPTION },
          { module: AppModule.MEDICAL }
        ]
      }
    },
  });

  await prisma.terminal.upsert({
    where: { ipAddress: '::1' },
    update: {},
    create: {
      name: 'Terminal DEV Local IPv6',
      ipAddress: '::1',
      type: TerminalType.DESK,
      unitId: unidade.id,
      isActive: true,
      modules: {
        create: [{ module: AppModule.ADMIN }]
      }
    },
  });

  const configKeyTheme = await prisma.configKey.upsert({
    where: { key: 'system.theme' },
    update: {},
    create: {
      key: 'system.theme',
      description: 'Tema visual do sistema',
      type: 'string',
      defaultValue: JSON.stringify('light'),
    }
  });

  await prisma.configKey.upsert({
    where: { key: 'payment.require_before_consult' },
    update: {},
    create: {
      key: 'payment.require_before_consult',
      description: 'Exigir pagamento antes de liberar consulta',
      type: 'boolean',
      defaultValue: JSON.stringify(true),
    }
  });

  await prisma.configValue.upsert({
    where: {
      configKeyId_scope_unitId_terminalId_module: {
        configKeyId: configKeyTheme.id,
        scope: ConfigScope.UNIT,
        unitId: unidade.id,
        terminalId: null,
        module: null
      }
    },
    update: {},
    create: {
      configKeyId: configKeyTheme.id,
      scope: ConfigScope.UNIT,
      unitId: unidade.id,
      value: JSON.stringify('blue-dark'),
    }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' }
  });

  await prisma.permission.upsert({
    where: { slug: 'system.read' },
    update: {},
    create: { slug: 'system.read', resource: 'system', action: 'read' }
  });

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'Administrador do Sistema',
      passwordHash: 'hash_placeholder',
      roles: {
        create: { roleId: adminRole.id }
      }
    }
  });

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
