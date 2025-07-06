import { User } from '../db/models/user';

async function updateCommandTime(userId: string): Promise<void> {
  const currentTime = Math.floor(Date.now() / 1000);
  await User.updateOne(
    { tgId: parseInt(userId) },
    { $set: { lastRenderedTime: currentTime } }
  );
}

async function getLastCommandTime(userId: string): Promise<number | null> {
  const user = await User.findOne({ tgId: parseInt(userId) });
  return user ? user.lastRenderedTime : null;
}

export {
  updateCommandTime,
  getLastCommandTime
}