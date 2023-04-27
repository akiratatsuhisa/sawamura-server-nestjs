import { PrismaClient } from '@prisma/client';

import { ROLES, SUPER_USER } from './data';
const prisma = new PrismaClient();

async function main() {
  const { _max } = await prisma.role.aggregate({ _max: { sort: true } });
  let maxSort = _max.sort !== null ? _max.sort + 1 : 1;

  for (const name in ROLES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: {
        name,
        sort: maxSort++,
        default: true,
      },
    });
  }

  await prisma.user.upsert({
    where: { username: SUPER_USER.username },
    update: {},
    create: {
      ...SUPER_USER,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
