import { sourcecred } from "sourcecred";
import { config } from "dotenv";

import User, { IUser } from "./models/User";
import LedgerUpdate from "./models/LedgerUpdate";

config();

export const log = (message) => console.log(`${Date.now()}: ${message}`);

const fetchLastLedgerUpdate = async (): Promise<number> => {
  const lastLedgerUpdateEntry = await LedgerUpdate.find({})
    .sort("-modifiedAt")
    .limit(1);

  return lastLedgerUpdateEntry.length ? lastLedgerUpdateEntry[0].modifiedAt : 0;
};

export const fetchModifiedUsers = async (): Promise<IUser[]> => {
  const lastLedgerUpdate = await fetchLastLedgerUpdate();
  const foundUsers = await User.find({
    modifiedAt: { $gte: lastLedgerUpdate },
  });

  return foundUsers;
};

const storage = new sourcecred.ledger.storage.WritableGithubStorage({
  apiToken: process.env.GH_API_TOKEN,
  repo: process.env.REPO,
  branch: process.env.BRANCH,
});

export const manager = new sourcecred.ledger.manager.LedgerManager({ storage });

export const loadLedger = async () => {
  const ledger = await manager.reloadLedger();
  return ledger;
};

export const createDiscourseIdentity = (discourse, ledger) => {
  const newDiscourseIdentityId = ledger.createIdentity(
    "USER",
    ledger.nameAvailable(discourse) ? discourse : `${discourse}-discourse`
  );

  ledger.addAlias(newDiscourseIdentityId, {
    description: `discourse/[@${discourse}](https://forum.1hive.org/u/${discourse}/)`,
    address: `N\u0000sourcecred\u0000discourse\u0000user\u0000https://forum.1hive.org\u0000${discourse}\u0000`,
  });

  return newDiscourseIdentityId;
};

export const createGithubIdentity = (github, ledger) => {
  const newGithubIdentityId = ledger.createIdentity(
    "USER",
    ledger.nameAvailable(github) ? github : `${github}-github`
  );

  ledger.addAlias(newGithubIdentityId, {
    description: `github/[@${github}](https://github.com/${github})`,
    address: `N\u0000sourcecred\u0000github\u0000USERLIKE\u0000USER\u0000${github}\u0000`,
  });

  return newGithubIdentityId;
};
