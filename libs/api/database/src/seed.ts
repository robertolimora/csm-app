import { PrismaClient, TerminalType, ConfigScope, AppModule } from './lib/prisma.service';
import * as crypto from 'crypto';

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

  // 1. Criar Unidade Matriz
  const unidade = await prisma.unit.upsert({
    where: { id: 'unit-matriz' },
    update: {},
    create: {
      id: 'unit-matriz',
      name: 'Unidade Matriz - Central',
    },
  });

  // 2. Criar Terminal de Desenvolvimento (Localhost)
  // IMPORTANTE: Isso permite que você rode localmente sem ser bloqueado pelo Middleware
  const terminal = await prisma.terminal.upsert({
    where: { ipAddress: '127.0.0.1' }, // IP Loopback IPv4
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

  // Adicionar também ::1 para IPv6 localhost
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
        create: [
          { module: AppModule.ADMIN }
        ]
      }
    },
  });

  // 3. Config Keys Globais
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

  const configKeyPayment = await prisma.configKey.upsert({
    where: { key: 'payment.require_before_consult' },
    update: {},
    create: {
      key: 'payment.require_before_consult',
      description: 'Exigir pagamento antes de liberar consulta',
      type: 'boolean',
      defaultValue: JSON.stringify(true),
    }
  });

  // 4. Config Value Específico (Override) para a Unidade Matriz
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

  // 5. Usuário Admin
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' }
  });

  // Permission example
  const permRead = await prisma.permission.upsert({
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
      passwordHash: 'hash_placeholder', // Em prod usar bcrypt
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
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });