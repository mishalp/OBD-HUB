import { connectDatabase } from '../database/connection';
import { User } from '../modules/auth/models/user.model';
import { hashPassword } from '../modules/auth/utils/password';

const ADMIN_EMAIL = 'admin@billingcrm.com';
const ADMIN_PASSWORD = 'Admin@123456';

const seedAdmin = async (): Promise<void> => {
  await connectDatabase();

  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL }).exec();

  if (existingAdmin) {
    let changed = false;

    if (!existingAdmin.firstName) {
      existingAdmin.firstName = 'System';
      changed = true;
    }

    if (!existingAdmin.lastName) {
      existingAdmin.lastName = 'Admin';
      changed = true;
    }

    if (existingAdmin.businessId === undefined) {
      existingAdmin.businessId = null;
      changed = true;
    }

    if (existingAdmin.businessSetupCompleted === undefined) {
      existingAdmin.businessSetupCompleted = Boolean(existingAdmin.businessId);
      changed = true;
    }

    if (changed) {
      await existingAdmin.save();
      console.log(`Admin migrated to new schema: ${ADMIN_EMAIL}`);
    } else {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    }

    process.exit(0);
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await User.create({
    email: ADMIN_EMAIL,
    passwordHash,
    firstName: 'System',
    lastName: 'Admin',
    role: 'admin',
    isActive: true,
    businessId: null,
    businessSetupCompleted: false,
    refreshTokenHash: null,
  });

  console.log('Admin user seeded successfully');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  process.exit(0);
};

seedAdmin().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown seed error';
  console.error('Failed to seed admin:', message);
  process.exit(1);
});
