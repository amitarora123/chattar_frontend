import User from '@/models/User';

export const generateUniqueUsername = async (base: string) => {
  let username = base;
  let counter = 0;

  while (true) {
    const existingUser = await User.findOne({ username });
    if (!existingUser) break;

    counter++;
    username = `${base}-${counter}`;
  }

  return username;
};
