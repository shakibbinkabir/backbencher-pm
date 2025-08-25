import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../src/users/user.entity';
import { Role } from '../src/common/enums/role.enum';

async function run() {
  const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/pm';
  const ds = new DataSource({
    type: 'postgres',
    url,
    entities: [User],
    synchronize: true
  });
  await ds.initialize();
  const repo = ds.getRepository(User);

  const upsertUser = async (email: string, roles: Role[]) => {
    let u = await repo.findOne({ where: { email } });
    if (!u) {
      const password = await bcrypt.hash('Password123!', 10);
      u = repo.create({ email, password, roles });
      await repo.save(u);
      // eslint-disable-next-line no-console
      console.log(`Seeded user: ${email} with roles ${roles.join(', ')}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`User already exists: ${email}`);
    }
  };

  await upsertUser('admin@example.com', [Role.ADMIN]);
  await upsertUser('manager@example.com', [Role.MANAGER]);

  await ds.destroy();
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
